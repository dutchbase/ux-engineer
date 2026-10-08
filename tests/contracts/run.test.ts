import assert from "node:assert/strict";
import { cpSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { validateArtifact } from "../../src/contracts/validate.ts";
import { validateRunDir } from "../../src/contracts/run.ts";

const fixture = (name: string) => fileURLToPath(new URL(`../fixtures/run/${name}`, import.meta.url));
const valid = fixture("valid");

function variant(name: string): string {
  const root = mkdtempSync(join(tmpdir(), `ux-engineer-${name}-`));
  cpSync(valid, root, {recursive: true});
  const mutation = JSON.parse(readFileSync(join(fixture(name), "mutation.json"), "utf8")) as {file: string; path: string; value: unknown};
  const file = join(root, mutation.file);
  const input = JSON.parse(readFileSync(file, "utf8")) as Record<string, unknown>;
  const segments = mutation.path.split("/");
  let current: unknown = input;
  for (const segment of segments.slice(0, -1)) current = (current as Record<string, unknown>)[segment];
  (current as Record<string, unknown>)[segments.at(-1)!] = mutation.value;
  writeFileSync(file, JSON.stringify(input));
  return root;
}

test("valid run, evidence, and findings fixtures satisfy their schemas", async () => {
  const root = fixture("valid");
  for (const kind of ["run", "evidence", "findings"] as const) {
    const input = JSON.parse(await readFile(`${root}/${kind}.json`, "utf8"));
    assert.equal(validateArtifact(kind, input).ok, true);
  }
});

test("valid run directory is accepted", () => {
  const result = validateRunDir(fixture("valid"));
  assert.equal(result.ok, true);
  if (result.ok) assert.equal(result.data.run.status, "passed");
});

test("invalid run schema is rejected", async () => {
  const input = JSON.parse(await readFile(`${fixture("invalid-run-schema")}/run.json`, "utf8"));
  const result = validateArtifact("run", input);
  assert.equal(result.ok, false);
});

test("evidence file paths must remain under artifacts", () => {
  const result = validateRunDir(variant("invalid-evidence-path"));
  assert.equal(result.ok, false);
  if (!result.ok) assert.match(result.errors[0].message, /artifacts/);
});

test("confirmed findings need supported basis and evidence", () => {
  for (const name of ["invalid-confirmed-no-evidence", "invalid-confirmed-inferred"]) {
    const result = validateRunDir(variant(name));
    assert.equal(result.ok, false);
  }
});

test("observed findings need evidence", () => {
  const result = validateRunDir(variant("invalid-confirmed-no-evidence"));
  assert.equal(result.ok, false);
});

test("advisory findings cannot be confirmed", () => {
  const result = validateRunDir(variant("invalid-advisory-confirmed"));
  assert.equal(result.ok, false);
});

test("cross-file run ids must agree", () => {
  const result = validateRunDir(variant("invalid-cross-file"));
  assert.equal(result.ok, false);
  if (!result.ok) assert.ok(result.errors.some((error) => error.path.startsWith("evidence.json/")));
});

test("unknown evidence ids are rejected in checks and findings", () => {
  const result = validateRunDir(variant("invalid-unknown-evidence"));
  assert.equal(result.ok, false);
  if (!result.ok) assert.ok(result.errors.some((error) => /unknown evidence id/.test(error.message)));
});

test("artifact hashes are checked", () => {
  const result = validateRunDir(variant("invalid-sha256"));
  assert.equal(result.ok, false);
  if (!result.ok) assert.ok(result.errors.some((error) => /sha256|hash/i.test(error.message)));
});

test("run status and requested checks are checked against checks.json", () => {
  assert.equal(validateRunDir(variant("invalid-status")).ok, false);
  assert.equal(validateRunDir(variant("invalid-requested-checks")).ok, false);
});
