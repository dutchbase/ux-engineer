import { existsSync, readFileSync, readSync, realpathSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { doctor } from "./install/doctor.ts";
import { detectHosts, targetDirs, type Host } from "./install/hosts.ts";
import { applyInstall, uninstall } from "./install/apply.ts";
import { planInstall, readRecord, recordPathOf, relativeToRoot } from "./install/plan.ts";
import { renderReport } from "./reports/render.ts";
import { renderFlow, type Flow } from "./reports/flow.ts";
import { validateRunDir } from "./contracts/run.ts";
import { deriveRunStatus, type Check } from "./contracts/verdict.ts";
import { validateArtifact, type Kind, type Result } from "./contracts/validate.ts";

const usage = "usage: node ux.mjs validate <project|checks|run|evidence|findings|flow|research> <file> | validate-run <dir> | render <dir> [--format md|html|both] | render-flow <flow.json> | status <checks.json> [--blocker <text>]... | install [--host claude-code,codex,opencode] [--global] [--skills a,b] [--dry-run] [--yes] [--force] | uninstall [--global] [--yes] | doctor";

export type CliResult = { status: 0 | 1 | 2 | 3; output: string[]; errors: string[] };

const formattedErrors = (result: { errors: { path: string; message: string }[] }): string[] =>
  result.errors.map((error) => `${error.path}: ${error.message}`);

function readJson(path: string): unknown {
  return JSON.parse(readFileSync(path, "utf8")) as unknown;
}

function validateFile(kind: Kind, file: string): CliResult {
  try {
    const result = validateArtifact(kind, readJson(file));
    return result.ok ? {status: 0, output: ["valid"], errors: []} : {status: 1, output: formattedErrors(result), errors: []};
  } catch (error) {
    return {status: 2, output: [], errors: [`${file}: ${error instanceof Error ? error.message : String(error)}`]};
  }
}

function parseChecks(file: string): Result<{schema_version: string; run_id: string; checks: Check[]}> {
  try {
    return validateArtifact("checks", readJson(file)) as Result<{schema_version: string; run_id: string; checks: Check[]}>;
  } catch (error) {
    return {ok: false, errors: [{path: file, message: error instanceof Error ? error.message : String(error)}]};
  }
}

export type Io = { isTTY: boolean; ask: (question: string) => string; show: (line: string) => void; home: string; cwd: string };

function defaultIo(): Io {
  return {
    isTTY: Boolean(process.stdin.isTTY),
    ask: (question) => {
      process.stdout.write(question);
      const buffer = Buffer.alloc(256);
      try {
        return buffer.toString("utf8", 0, readSync(0, buffer, 0, buffer.length, null)).trim();
      } catch {
        return "";
      }
    },
    show: (line) => console.log(line),
    home: homedir(),
    cwd: process.cwd()
  };
}

/** The package root: the nearest folder above the running file whose .claude-plugin/plugin.json is named ux-engineer. */
function findSourceRoot(): string | null {
  let dir = dirname(fileURLToPath(import.meta.url));
  while (!isOurPlugin(join(dir, ".claude-plugin/plugin.json"))) {
    const parent = dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
  return dir;
}

function isOurPlugin(file: string): boolean {
  try {
    return (JSON.parse(readFileSync(file, "utf8")) as { name?: unknown }).name === "ux-engineer";
  } catch {
    return false;
  }
}

const hostNames: string[] = ["claude-code", "codex", "opencode"];
const failure = (status: 1 | 2, message: string): CliResult => ({status, output: [], errors: [message]});

function installerCommand(command: "install" | "uninstall" | "doctor", rest: string[], io: Io): CliResult {
  const options = {
    install: {host: {type: "string"}, global: {type: "boolean"}, skills: {type: "string"}, "dry-run": {type: "boolean"}, yes: {type: "boolean"}, force: {type: "boolean"}},
    uninstall: {global: {type: "boolean"}, yes: {type: "boolean"}},
    doctor: {}
  } as const;
  let values: Record<string, unknown>;
  try {
    const parsed = parseArgs({args: rest, options: options[command], allowPositionals: true});
    if (parsed.positionals.length > 0) return failure(2, usage);
    values = parsed.values;
  } catch {
    return failure(2, usage);
  }

  const sourceRoot = findSourceRoot();
  if (!sourceRoot) return failure(2, "Run this command from the ux-engineer package (npx github:dutchbase/ux-engineer).");
  const env = {home: io.home, cwd: io.cwd};
  const root = values.global ? io.home : io.cwd;
  const output: string[] = [];
  const rel = (path: string) => relativeToRoot(root, path);

  // Writes need approval: --yes, or "y" on a TTY. Returns a result when the command must stop here.
  const approve = (summary: string[]): CliResult | null => {
    if (values.yes) {
      output.push(...summary);
      return null;
    }
    if (!io.isTTY) return {status: 3, output: [...summary, "Re-run with --yes to apply."], errors: []};
    summary.forEach(io.show);
    if (/^y(es)?$/i.test(io.ask("Apply? [y/N] "))) return null;
    return {status: 0, output: ["Cancelled. Nothing changed."], errors: []};
  };

  try {
    if (command === "doctor") {
      const report = doctor({sourceRoot, ...env});
      if (report.locations.length === 0) output.push("No ux-* skills found.");
      for (const {dir, skills} of report.locations) {
        output.push(dir);
        skills.forEach(({name, matchesPackage}) => output.push(`  ${name}  ${matchesPackage ? "matches package" : "differs from package"}`));
      }
      if (report.duplicates.length > 0) output.push(`Duplicates (a host reads these skills from more than one folder): ${report.duplicates.join(", ")}`);
      const {record} = report;
      output.push(!record ? "Install record: none" : record.error ? `Install record: invalid (${record.error})` : `Install record: ${record.path} (version ${record.version})`);
      return {status: 0, output, errors: []};
    }

    if (command === "uninstall") {
      const record = readRecord(recordPathOf(root));
      if (!record) return {status: 0, output: [`Nothing to uninstall in ${root}.`], errors: []};
      const stop = approve([`Uninstall ux-engineer ${record.version} from ${root}: ${record.files.length} recorded files.`,
        "Files you changed stay. Saved backups come back."]);
      if (stop) return stop;
      const result = uninstall(root);
      result.removed.forEach((path) => output.push(`removed  ${path}`));
      result.keptModified.forEach((path) => output.push(`kept-modified  ${path}  (changed since install)`));
      result.restored.forEach((path) => output.push(`restored  ${path}`));
      result.missingBackups.forEach((path) => output.push(`missing-backup  ${path}`));
      output.push(`${result.removed.length} removed, ${result.keptModified.length} kept, ${result.restored.length} restored.`);
      return {status: 0, output, errors: []};
    }

    const hostList = typeof values.host === "string" ? values.host.split(",").filter(Boolean) : null;
    if (hostList && (hostList.length === 0 || hostList.some((host) => !hostNames.includes(host)))) {
      return failure(2, `--host takes a comma list of: ${hostNames.join(", ")}`);
    }
    const hosts = (hostList ?? detectHosts(env)) as Host[];
    if (hosts.length === 0) return failure(2, "No supported host found. Use --host.");
    const skills = typeof values.skills === "string" ? values.skills.split(",").filter(Boolean) : undefined;
    const targets = targetDirs(hosts, values.global ? "global" : "project", env);
    const plan = planInstall({sourceRoot, root, targets, skills});

    const lines = [`Install ux-engineer ${plan.version} into ${root} (${values.global ? "global" : "project"}, hosts: ${hosts.join(", ")})`,
      ...plan.actions.map((action) => `${action.kind === "skip-identical" ? "skip" : action.kind}  ${rel(action.target)}`),
      ...plan.conflicts.map((conflict) => `conflict  ${rel(conflict.target)}  (${conflict.reason})`)];
    if (targets.length > 1) {
      lines.push("Note: OpenCode reads both .claude/skills and .agents/skills, so it will see two copies. Use --host to pick one if you use OpenCode.");
    }
    if (values["dry-run"]) return {status: 0, output: [...lines, "Dry run: nothing written."], errors: []};
    if (plan.conflicts.length > 0 && !values.force) {
      return {status: 1, output: lines, errors: [`conflicts: ${plan.conflicts.length} files; use --force to overwrite`]};
    }
    const stop = approve(lines);
    if (stop) return stop;
    applyInstall(plan, {force: Boolean(values.force), now: () => new Date()});
    const count = (kind: string) => plan.actions.filter((action) => action.kind === kind).length;
    output.push(`${count("create")} created, ${count("update")} updated, ${count("skip-identical")} unchanged, ${plan.conflicts.length} overwritten (backups in .ux-engineer/backup/).`,
      "Run /ux-engineer:ux-setup (Claude Code) or $ux-setup (Codex) in this project.",
      "Suggested AGENTS.md line (not written): Read docs/ux/ before any UI or UX work.");
    return {status: 0, output, errors: []};
  } catch (error) {
    return failure(1, error instanceof Error ? error.message : String(error));
  }
}

export function runCli(args: string[], io: Io = defaultIo()): CliResult {
  const [command, ...rest] = args;
  if (command === "install" || command === "uninstall" || command === "doctor") return installerCommand(command, rest, io);
  if (command === "validate" && rest.length === 2 && ["project", "checks", "run", "evidence", "findings", "flow", "research"].includes(rest[0])) {
    return validateFile(rest[0] as Kind, rest[1]);
  }

  if (command === "validate-run" && rest.length === 1) {
    try {
      const result = validateRunDir(rest[0]);
      return result.ok ? {status: 0, output: ["valid"], errors: []} : {status: 1, output: formattedErrors(result), errors: []};
    } catch (error) {
      return {status: 2, output: [], errors: [rest[0], error instanceof Error ? error.message : String(error)]};
    }
  }

  if (command === "render" && (rest.length === 1 || rest.length === 3)) {
    const dir = rest[0];
    const format = rest.length === 1 ? "both" : rest[2] === "md" || rest[2] === "html" || rest[2] === "both" ? rest[2] : null;
    if (!format || (rest.length === 3 && rest[1] !== "--format")) return {status: 2, output: [], errors: [usage]};
    try {
      const result = validateRunDir(dir);
      if (!result.ok) return {status: 1, output: formattedErrors(result), errors: []};
      const formats = format === "both" ? ["md", "html"] as const : [format] as const;
      const output: string[] = [];
      for (const current of formats) {
        const path = join(dir, `report.${current}`);
        writeFileSync(path, renderReport(result.data, current));
        output.push(path);
      }
      return {status: 0, output, errors: []};
    } catch (error) {
      return {status: 2, output: [], errors: [dir, error instanceof Error ? error.message : String(error)]};
    }
  }

  if (command === "render-flow" && rest.length === 1) {
    const file = rest[0];
    try {
      const flow = readJson(file);
      const result = validateArtifact("flow", flow);
      if (!result.ok) return {status: 1, output: formattedErrors(result).map((line) => `${file}: ${line}`), errors: []};
      const path = join(dirname(file), `${(flow as Flow).flow_id}.md`);
      writeFileSync(path, renderFlow(flow as Flow));
      return {status: 0, output: [path], errors: []};
    } catch (error) {
      return {status: 2, output: [], errors: [`${file}: ${error instanceof Error ? error.message : String(error)}`]};
    }
  }

  if (command === "status" && rest.length >= 1) {
    const file = rest[0];
    const blockers: string[] = [];
    for (let index = 1; index < rest.length; index += 2) {
      if (rest[index] !== "--blocker" || !rest[index + 1]) return {status: 2, output: [], errors: [usage]};
      blockers.push(rest[index + 1]);
    }
    const result = parseChecks(file);
    if (!result.ok) {
      const unreadable = result.errors.some((error) => error.path === file);
      return unreadable ? {status: 2, output: [], errors: formattedErrors(result)} : {status: 1, output: formattedErrors(result), errors: []};
    }
    return {status: 0, output: [deriveRunStatus(result.data.checks, {blockers})], errors: []};
  }

  return {status: 2, output: [], errors: [usage]};
}

function isMainModule(): boolean {
  if (!process.argv[1]) return false;
  try {
    return realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url));
  } catch {
    return false;
  }
}

if (isMainModule()) {
  const result = runCli(process.argv.slice(2));
  result.output.forEach((line) => console.log(line));
  result.errors.forEach((line) => console.error(line));
  process.exitCode = result.status;
}
