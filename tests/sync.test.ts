import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
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
  "skills/ux-setup/references/interview.json",
  "skills/ux-setup/scripts/ux.mjs",
  "skills/ux-audit/references/writing.md",
  "skills/ux-audit/references/evidence.md",
  "skills/ux-audit/references/safety.md",
  "skills/ux-audit/references/audit-method.md",
  "skills/ux-audit/references/run.schema.json",
  "skills/ux-audit/references/evidence.schema.json",
  "skills/ux-audit/references/findings.schema.json",
  "skills/ux-audit/references/checks.schema.json",
  "skills/ux-audit/scripts/ux.mjs"
];

function createFakeRepo(): string {
  const root = mkdtempSync(join(tmpdir(), "ux-engineer-sync-"));
  for (const path of [
    "shared/policies",
    "schemas",
    "shared/references",
    "skills/ux-framing",
    "skills/ux-setup",
    "skills/ux-audit"
  ]) mkdirSync(join(root, path), {recursive: true});
  writeFileSync(join(root, "shared/policies/writing.md"), Buffer.from([0, 1, 2]));
  writeFileSync(join(root, "shared/policies/evidence.md"), Buffer.from([9, 1, 2]));
  writeFileSync(join(root, "shared/policies/safety.md"), Buffer.from([9, 1, 3]));
  writeFileSync(join(root, "schemas/project.schema.json"), Buffer.from([3, 4, 5]));
  for (const [index, path] of [
    "run.schema.json",
    "evidence.schema.json",
    "findings.schema.json",
    "checks.schema.json"
  ].entries()) writeFileSync(join(root, "schemas", path), Buffer.from([4, index, 5]));
  writeFileSync(join(root, "shared/references/interview.json"), Buffer.from([6, 7, 8]));
  writeFileSync(join(root, "shared/references/audit-method.md"), Buffer.from([9, 7, 8]));
  mkdirSync(join(root, "dist"), {recursive: true});
  writeFileSync(join(root, "dist/ux.mjs"), Buffer.from([10, 11, 12]));
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
    "skills/ux-setup/references/writing.md",
    "skills/ux-audit/references/writing.md"
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

test("missing built helper reports the build command", () => {
  const root = createFakeRepo();
  unlinkSync(join(root, "dist/ux.mjs"));
  assert.throws(() => syncShared(root, {check: true}), {
    message: "dist/ux.mjs missing: run pnpm build first"
  });
});
