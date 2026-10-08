import assert from "node:assert/strict";
import { chmodSync, mkdtempSync, mkdirSync, readFileSync, statSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { extraCopies, sharedFiles, syncShared } from "../scripts/sync-shared.ts";

const entries = Object.entries(sharedFiles).flatMap(([skill, sources]) =>
  sources.map(({source, folder}) => ({source, destination: `skills/${skill}/${folder}/${basename(source)}`}))).concat(
  extraCopies.map(({source, destination}) => ({source, destination})));
const destinations = entries.map(({destination}) => destination);

function createFakeRepo(): string {
  const root = mkdtempSync(join(tmpdir(), "ux-engineer-sync-"));
  for (const [index, source] of [...new Set(entries.map(({source}) => source))].entries()) {
    mkdirSync(join(root, dirname(source)), {recursive: true});
    writeFileSync(join(root, source), Buffer.from([index, 1, 2]));
  }
  for (const skill of Object.keys(sharedFiles)) mkdirSync(join(root, "skills", skill), {recursive: true});
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
  assert.deepEqual(syncShared(root, {check: true}), destinations.filter((path) => path.endsWith("/writing.md")));
});

test("real repository shared copies are in sync", () => {
  const repoRoot = fileURLToPath(new URL("../", import.meta.url));
  assert.deepEqual(syncShared(repoRoot, {check: true}), []);
});

test("the npx entry point is a copy of the built helper", () => {
  const root = createFakeRepo();
  syncShared(root, {check: false});
  assert.deepEqual(readFileSync(join(root, "cli/ux-engineer.mjs")), readFileSync(join(root, "dist/ux.mjs")));
});

test("the npx entry point is executable after sync", () => {
  const root = createFakeRepo();
  syncShared(root, {check: false});
  assert.ok(statSync(join(root, "cli/ux-engineer.mjs")).mode & 0o100);
  writeFileSync(join(root, "cli/ux-engineer.mjs"), "x", {mode: 0o644});
  syncShared(root, {check: false});
  assert.ok(statSync(join(root, "cli/ux-engineer.mjs")).mode & 0o100);
});

test("check reports a non-executable npx entry point", () => {
  const root = createFakeRepo();
  syncShared(root, {check: false});
  chmodSync(join(root, "cli/ux-engineer.mjs"), 0o644);
  assert.deepEqual(syncShared(root, {check: true}), ["cli/ux-engineer.mjs"]);
  syncShared(root, {check: false});
  assert.deepEqual(syncShared(root, {check: true}), []);
});

test("written copies preserve source bytes", () => {
  const root = createFakeRepo();
  syncShared(root, {check: false});
  for (const {source, destination} of entries) {
    assert.deepEqual(readFileSync(join(root, destination)), readFileSync(join(root, source)));
  }
});

test("missing built helper reports the build command", () => {
  const root = createFakeRepo();
  unlinkSync(join(root, "dist/ux.mjs"));
  assert.throws(() => syncShared(root, {check: true}), {
    message: "dist/ux.mjs missing: run pnpm build first"
  });
});
