import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import { runCli } from "../../src/cli.ts";

const fixture = (name: string) => fileURLToPath(new URL(`../fixtures/project/${name}`, import.meta.url));

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
