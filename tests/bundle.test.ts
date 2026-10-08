import assert from "node:assert/strict";
import { closeSync, cpSync, existsSync, mkdtempSync, openSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const repoRoot = fileURLToPath(new URL("../", import.meta.url));
const projectFixture = fileURLToPath(new URL("fixtures/project/valid-full.json", import.meta.url));
const runFixture = fileURLToPath(new URL("fixtures/run/valid", import.meta.url));

test("bundled CLI runs without node_modules", () => {
  const build = spawnSync("node_modules/.bin/esbuild", [
    "src/cli.ts", "--bundle", "--platform=node", "--format=esm", "--target=node18", "--outfile=dist/ux.mjs"
  ], {cwd: repoRoot, encoding: "utf8"});
  assert.equal(build.status, 0, build.stderr);
  assert.ok(existsSync(join(repoRoot, "dist/ux.mjs")));

  const isolated = mkdtempSync(join(tmpdir(), "ux-engineer-bundle-"));
  cpSync(join(repoRoot, "dist/ux.mjs"), join(isolated, "ux.mjs"));
  const env = {...process.env};
  delete env.NODE_TEST_CONTEXT;
  const outputPath = join(isolated, "project-output.txt");
  const output = openSync(outputPath, "w");
  const project = spawnSync(process.execPath, [join(isolated, "ux.mjs"), "validate", "project", projectFixture], {env, stdio: ["ignore", output, output]});
  closeSync(output);
  assert.equal(project.status, 0, String(project.stderr));
  assert.match(readFileSync(outputPath, "utf8"), /valid/);
  const run = spawnSync(process.execPath, [join(isolated, "ux.mjs"), "validate-run", runFixture], {encoding: "utf8", env});
  assert.equal(run.status, 0, run.stderr);
});
