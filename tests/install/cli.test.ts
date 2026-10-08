import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { runCli, type Io } from "../../src/cli.ts";
import { tempDir, write } from "./helpers.ts";

const cli = fileURLToPath(new URL("../../src/cli.ts", import.meta.url));

function run(args: string[], dirs: { home: string; cwd: string }) {
  const env: NodeJS.ProcessEnv = {...process.env, HOME: dirs.home};
  delete env.NODE_TEST_CONTEXT;
  const result = spawnSync(process.execPath, [cli, ...args], {cwd: dirs.cwd, env, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"]});
  return {status: result.status, out: result.stdout, err: result.stderr};
}

const dirs = () => ({home: tempDir("home"), cwd: tempDir("cwd")});

test("install --dry-run prints the plan and writes nothing", () => {
  const d = dirs();
  const result = run(["install", "--dry-run", "--host", "codex"], d);
  assert.equal(result.status, 0, result.err);
  assert.match(result.out, /^create {2}\.agents\/skills\/ux-[a-z-]+\/SKILL\.md$/m);
  assert.equal(existsSync(join(d.cwd, ".agents")), false);
  assert.equal(existsSync(join(d.cwd, ".ux-engineer")), false);
});

test("install without --yes on a non-TTY asks for --yes, exit 3, no writes", () => {
  const d = dirs();
  const result = run(["install", "--host", "claude-code"], d);
  assert.equal(result.status, 3);
  assert.match(result.out, /Re-run with --yes to apply\./);
  assert.equal(existsSync(join(d.cwd, ".claude")), false);
});

test("install with no host found exits 2", () => {
  const result = run(["install", "--dry-run"], dirs());
  assert.equal(result.status, 2);
  assert.match(result.err, /No supported host found\. Use --host\./);
});

test("unknown host and unknown flag exit 2", () => {
  assert.equal(run(["install", "--host", "vim"], dirs()).status, 2);
  assert.equal(run(["install", "--nope"], dirs()).status, 2);
});

test("install --yes, doctor, then uninstall --yes", () => {
  const d = dirs();
  const install = run(["install", "--host", "claude-code", "--yes", "--skills", "ux-orchestrator"], d);
  assert.equal(install.status, 0, install.err);
  assert.match(install.out, /Run \/ux-setup \(Claude Code\) or \$ux-setup \(Codex\) in this project\./);
  assert.doesNotMatch(install.out, /ux-engineer:ux-setup/);
  assert.match(install.out, /Read docs\/ux\/ before any UI or UX work\./);
  assert.ok(existsSync(join(d.cwd, ".claude/skills/ux-orchestrator/SKILL.md")));
  assert.ok(existsSync(join(d.cwd, ".ux-engineer/install.json")));
  assert.equal(existsSync(join(d.cwd, ".claude/skills/ux-audit")), false);

  const report = run(["doctor"], d);
  assert.equal(report.status, 0, report.err);
  assert.match(report.out, /ux-orchestrator {2}matches package/);

  const again = run(["install", "--host", "claude-code", "--yes", "--skills", "ux-orchestrator"], d);
  assert.equal(again.status, 0, again.err);
  assert.match(again.out, /0 created, 0 updated, \d+ unchanged/);

  const gone = run(["uninstall", "--yes"], d);
  assert.equal(gone.status, 0, gone.err);
  assert.match(gone.out, /removed {2}\.claude\/skills\/ux-orchestrator\/SKILL\.md/);
  assert.equal(existsSync(join(d.cwd, ".claude/skills/ux-orchestrator")), false);
  assert.equal(existsSync(join(d.cwd, ".ux-engineer/install.json")), false);
});

test("conflict without --force fails with one clean line, exit 1", () => {
  const d = dirs();
  mkdirSync(join(d.cwd, ".claude/skills/ux-orchestrator"), {recursive: true});
  run(["install", "--host", "claude-code", "--yes", "--skills", "ux-orchestrator"], d);
  const file = join(d.cwd, ".claude/skills/ux-orchestrator/SKILL.md");
  spawnSync("sh", ["-c", `echo mine > '${file}'`]);
  const dry = run(["install", "--host", "claude-code", "--dry-run", "--skills", "ux-orchestrator"], d);
  assert.equal(dry.status, 0, dry.err);
  assert.match(dry.out, /^conflict {2}\.claude\/skills\/ux-orchestrator\/SKILL\.md {2}\(/m);
  const result = run(["install", "--host", "claude-code", "--yes", "--skills", "ux-orchestrator"], d);
  assert.equal(result.status, 1);
  assert.match(result.err, /^conflicts: 1 files; use --force to overwrite\n$/);
});

test("global install uses HOME", () => {
  const d = dirs();
  const result = run(["install", "--global", "--host", "claude-code", "--yes", "--skills", "ux-orchestrator"], d);
  assert.equal(result.status, 0, result.err);
  assert.ok(existsSync(join(d.home, ".claude/skills/ux-orchestrator/SKILL.md")));
  assert.equal(existsSync(join(d.cwd, ".claude")), false);
});

test("doctor reports an invalid install record and exits 0", () => {
  const d = dirs();
  write(join(d.cwd, ".ux-engineer/install.json"), "{not json");
  const result = run(["doctor"], d);
  assert.equal(result.status, 0, result.err);
  assert.match(result.out, /^Install record: invalid \(.+\)$/m);
});

test("doctor prints both project and global install records", () => {
  const d = dirs();
  const record = (version: string) => JSON.stringify({version, installed_at: "x", files: [], backups: []});
  write(join(d.cwd, ".ux-engineer/install.json"), record("1.0.0"));
  write(join(d.home, ".ux-engineer/install.json"), record("2.0.0"));
  const result = run(["doctor"], d);
  assert.equal(result.status, 0, result.err);
  assert.match(result.out, /^Install record: .*\.ux-engineer\/install\.json \(version 1\.0\.0\)$/m);
  assert.match(result.out, /^Install record: .*\.ux-engineer\/install\.json \(version 2\.0\.0\)$/m);
});

test("an unrelated plugin.json above the entry point gives the clean exit 2", () => {
  const d = dirs();
  const outer = tempDir("outer");
  write(join(outer, ".claude-plugin/plugin.json"), JSON.stringify({name: "something-else"}));
  mkdirSync(join(outer, "pkg/cli"), {recursive: true});
  const copy = join(outer, "pkg/cli/ux-engineer.mjs");
  copyFileSync(fileURLToPath(new URL("../../cli/ux-engineer.mjs", import.meta.url)), copy);
  const env: NodeJS.ProcessEnv = {...process.env, HOME: d.home};
  delete env.NODE_TEST_CONTEXT;
  const result = spawnSync(process.execPath, [copy, "install", "--dry-run", "--host", "codex"], {cwd: d.cwd, env, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"]});
  assert.equal(result.status, 2);
  assert.match(result.stderr, /^Run this command from the ux-engineer package/);
});

test("the OpenCode note shows only when both skill folders are targets", () => {
  const both = run(["install", "--dry-run", "--host", "claude-code,codex", "--skills", "ux-orchestrator"], dirs());
  assert.match(both.out, /^Note: OpenCode reads both \.claude\/skills and \.agents\/skills, so it will see two copies\. Use --host to pick one if you use OpenCode\.$/m);
  const one = run(["install", "--dry-run", "--host", "claude-code", "--skills", "ux-orchestrator"], dirs());
  assert.doesNotMatch(one.out, /Note: OpenCode/);
});

function ttyRun(answer: string) {
  const d = dirs();
  const io: Io = {isTTY: true, ask: () => answer, show: () => {}, home: d.home, cwd: d.cwd};
  const result = runCli(["install", "--host", "claude-code", "--skills", "ux-orchestrator"], io);
  return {result, written: existsSync(join(d.cwd, ".claude/skills/ux-orchestrator/SKILL.md")) || existsSync(join(d.cwd, ".ux-engineer"))};
}

for (const answer of ["y", "yes", "Y"]) {
  test(`TTY answer ${JSON.stringify(answer)} applies`, () => {
    const {result, written} = ttyRun(answer);
    assert.equal(result.status, 0);
    assert.ok(written);
  });
}

for (const answer of ["n", "", "no", "yy"]) {
  test(`TTY answer ${JSON.stringify(answer)} cancels with no writes`, () => {
    const {result, written} = ttyRun(answer);
    assert.equal(result.status, 0);
    assert.match(result.output.join("\n"), /Cancelled/);
    assert.equal(written, false);
  });
}

test("TTY uninstall asks too, and cancel keeps files", () => {
  const d = dirs();
  const base: Io = {isTTY: true, ask: () => "", show: () => {}, home: d.home, cwd: d.cwd};
  runCli(["install", "--host", "claude-code", "--skills", "ux-orchestrator", "--yes"], base);
  runCli(["uninstall"], base);
  assert.ok(existsSync(join(d.cwd, ".claude/skills/ux-orchestrator/SKILL.md")));
  runCli(["uninstall"], {...base, ask: () => "y"});
  assert.equal(existsSync(join(d.cwd, ".claude/skills/ux-orchestrator/SKILL.md")), false);
});
