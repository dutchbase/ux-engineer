import { readFileSync, realpathSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { renderReport } from "./reports/render.ts";
import { validateRunDir } from "./contracts/run.ts";
import { deriveRunStatus, type Check } from "./contracts/verdict.ts";
import { validateArtifact, type Kind, type Result } from "./contracts/validate.ts";

const usage = "usage: node ux.mjs validate <project|checks|run|evidence|findings> <file> | validate-run <dir> | render <dir> [--format md|html|both] | status <checks.json> [--blocker <text>]...";

export type CliResult = { status: 0 | 1 | 2; output: string[]; errors: string[] };

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

export function runCli(args: string[]): CliResult {
  const [command, ...rest] = args;
  if (command === "validate" && rest.length === 2 && ["project", "checks", "run", "evidence", "findings"].includes(rest[0])) {
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
