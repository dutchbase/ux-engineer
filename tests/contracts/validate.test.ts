import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { validateArtifact } from "../../src/contracts/validate.ts";

const projectFixture = async (name: string): Promise<unknown> =>
  JSON.parse(await readFile(new URL(`../fixtures/project/${name}`, import.meta.url), "utf8"));

const checksFixture = async (name: string): Promise<unknown> =>
  JSON.parse(await readFile(new URL(`../fixtures/checks/${name}`, import.meta.url), "utf8"));

test("valid full project fixture is accepted", async () => {
  assert.equal(validateArtifact("project", await projectFixture("valid-full.json")).ok, true);
});

test("minimal project fixture is accepted", async () => {
  assert.equal(validateArtifact("project", await projectFixture("valid-minimal.json")).ok, true);
});

test("unknown top-level field is rejected", async () => {
  const result = validateArtifact("project", await projectFixture("invalid-unknown-top-level.json"));
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((error) => error.path === "/" && error.message.includes("must NOT have additional properties")));
});

test("unknown nested field is rejected", async () => {
  const result = validateArtifact("project", await projectFixture("invalid-unknown-nested.json"));
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((error) => error.path === "/viewports/0"));
});

test("wrong enum is rejected", async () => {
  const result = validateArtifact("project", await projectFixture("invalid-wrong-enum.json"));
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((error) => error.path === "/design_system/kind"));
});

test("unsupported schema major is reported before schema validation", async () => {
  const result = validateArtifact("project", await projectFixture("invalid-schema-major.json"));
  assert.equal(result.ok, false);
  assert.equal(result.errors.length, 1);
  assert.match(result.errors[0].message, /unsupported schema major/);
});

test("every non-empty persona goal needs a goals source", async () => {
  const result = validateArtifact("project", await projectFixture("invalid-goal-source.json"));
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((error) => error.path === "/personas/0/sources" && error.message.includes("goals")));
});

test("assumed source needs validation", async () => {
  const result = validateArtifact("project", await projectFixture("invalid-assumed-validation.json"));
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((error) => error.path === "/personas/0/sources/0/validation"));
});

test("non-proto persona needs user data", async () => {
  const result = validateArtifact("project", await projectFixture("invalid-proto-user-data.json"));
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((error) => error.path === "/personas/0/sources" && error.message.includes("user_data")));
});

test("job persona references must exist", async () => {
  const result = validateArtifact("project", await projectFixture("invalid-missing-persona.json"));
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((error) => error.path === "/jobs/0/persona_ids/0"));
});

test("design systems other than none need a path", async () => {
  const result = validateArtifact("project", await projectFixture("invalid-design-path.json"));
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((error) => error.path === "/design_system/path"));
});

test("not_applicable checks need a reason", async () => {
  const result = validateArtifact("checks", await checksFixture("invalid-not-applicable.json"));
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((error) => error.path === "/checks/0/not_applicable_reason"));
});
