import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { mkdtempSync, readFileSync, cpSync, existsSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { runCli } from "../../src/cli.ts";

const fixture = (name: string) => fileURLToPath(new URL(`../fixtures/project/${name}`, import.meta.url));
const runFixture = fileURLToPath(new URL("../fixtures/run/valid", import.meta.url));

test("CLI validates a valid fixture", () => {
  const result = runCli(["validate", "project", fixture("valid-full.json")]);
  assert.equal(result.status, 0);
  assert.deepEqual(result.output, ["valid"]);
});

test("CLI prints validation errors for an invalid fixture", () => {
  const result = runCli(["validate", "project", fixture("invalid-goal-source.json")]);
  assert.equal(result.status, 1);
  assert.match(result.output.join("\n"), /^\/personas\/0\/sources: .*goals/m);
});

test("CLI returns usage error for incomplete arguments", () => {
  const result = runCli(["validate", "project"]);
  assert.equal(result.status, 2);
});

test("CLI validates a run directory and derives status", () => {
  const valid = runCli(["validate-run", runFixture]);
  assert.equal(valid.status, 0);
  const status = runCli(["status", join(runFixture, "checks.json")]);
  assert.equal(status.status, 0);
  assert.deepEqual(status.output, ["passed"]);
  assert.deepEqual(runCli(["status", join(runFixture, "checks.json"), "--blocker", "browser unavailable"]).output, ["blocked"]);
});

test("CLI render writes both reports only after validation", () => {
  const copy = mkdtempSync(join(tmpdir(), "ux-engineer-render-"));
  const dir = join(copy, "valid");
  cpSync(runFixture, dir, {recursive: true});
  const result = runCli(["render", dir, "--format", "both"]);
  assert.equal(result.status, 0);
  assert.ok(existsSync(join(dir, "report.md")));
  assert.ok(existsSync(join(dir, "report.html")));
  assert.ok(readFileSync(join(dir, "report.md"), "utf8").includes("UX run report"));

  const invalidDir = join(copy, "invalid");
  cpSync(runFixture, invalidDir, {recursive: true});
  const run = JSON.parse(readFileSync(join(invalidDir, "run.json"), "utf8")) as Record<string, unknown>;
  run.status = "blocked";
  writeFileSync(join(invalidDir, "run.json"), JSON.stringify(run));
  const invalid = runCli(["render", invalidDir, "--format", "md"]);
  assert.equal(invalid.status, 1);
});
