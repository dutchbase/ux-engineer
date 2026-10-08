import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { syncShared } from "../scripts/sync-shared.ts";

const destinations = [
  "skills/ux-framing/references/writing.md",
  "skills/ux-framing/references/project.schema.json",
  "skills/ux-setup/references/writing.md",
  "skills/ux-setup/references/project.schema.json",
  "skills/ux-setup/references/interview.json"
];

function createFakeRepo(): string {
  const root = mkdtempSync(join(tmpdir(), "ux-engineer-sync-"));
  for (const path of [
    "shared/policies",
    "schemas",
    "shared/references",
    "skills/ux-framing",
    "skills/ux-setup"
  ]) mkdirSync(join(root, path), {recursive: true});
  writeFileSync(join(root, "shared/policies/writing.md"), Buffer.from([0, 1, 2]));
  writeFileSync(join(root, "schemas/project.schema.json"), Buffer.from([3, 4, 5]));
  writeFileSync(join(root, "shared/references/interview.json"), Buffer.from([6, 7, 8]));
  return root;
}

test("syncs shared files and reports only affected copies", () => {
  const root = createFakeRepo();

  assert.deepEqual(syncShared(root, {check: true}), destinations);
  assert.deepEqual(syncShared(root, {check: false}), destinations);
  assert.deepEqual(syncShared(root, {check: true}), []);

  writeFileSync(join(root, "shared/references/interview.json"), Buffer.from([9, 7, 8]));
  assert.deepEqual(syncShared(root, {check: true}), ["skills/ux-setup/references/interview.json"]);
  syncShared(root, {check: false});

  writeFileSync(join(root, "shared/policies/writing.md"), Buffer.from([0, 1, 9]));
  assert.deepEqual(syncShared(root, {check: true}), [
    "skills/ux-framing/references/writing.md",
    "skills/ux-setup/references/writing.md"
  ]);
});

test("real repository shared copies are in sync", () => {
  const repoRoot = fileURLToPath(new URL("../", import.meta.url));
  assert.deepEqual(syncShared(repoRoot, {check: true}), []);
});

test("written copies preserve source bytes", () => {
  const root = createFakeRepo();
  syncShared(root, {check: false});
  assert.deepEqual(
    readFileSync(join(root, "skills/ux-setup/references/interview.json")),
    Buffer.from([6, 7, 8])
  );
});
