import assert from "node:assert/strict";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { planInstall } from "../../src/install/plan.ts";
import { applyInstall, uninstall, type InstallRecord } from "../../src/install/apply.ts";
import { createFakePackage, tempDir, write } from "./helpers.ts";

const now = () => new Date("2026-10-08T12:00:00.000Z");
const readRecord = (root: string): InstallRecord => JSON.parse(readFileSync(join(root, ".ux-engineer/install.json"), "utf8"));

test("apply writes files and a record relative to root", () => {
  const sourceRoot = createFakePackage();
  const root = tempDir("project");
  const record = applyInstall(planInstall({sourceRoot, root, targets: [join(root, ".claude/skills")]}), {force: false, now});
  assert.equal(readFileSync(join(root, ".claude/skills/ux-a/references/x.md"), "utf8"), "ux-a reference\n");
  assert.equal(record.version, "9.9.9");
  assert.equal(record.installed_at, "2026-10-08T12:00:00.000Z");
  assert.deepEqual(record.files.map((file) => file.path), [
    ".claude/skills/ux-a/SKILL.md",
    ".claude/skills/ux-a/references/x.md",
    ".claude/skills/ux-b/SKILL.md"
  ]);
  assert.match(record.files[0].sha256, /^[0-9a-f]{64}$/);
  assert.deepEqual(readRecord(root), record);
});

test("second apply with only skip-identical writes no backups and keeps files", () => {
  const sourceRoot = createFakePackage();
  const root = tempDir("project");
  const targets = [join(root, ".claude/skills")];
  const first = applyInstall(planInstall({sourceRoot, root, targets}), {force: false, now});
  const second = applyInstall(planInstall({sourceRoot, root, targets}), {force: true, now: () => new Date("2027-01-01T00:00:00.000Z")});
  assert.deepEqual(second.files, first.files);
  assert.deepEqual(second.backups, []);
  assert.equal(existsSync(join(root, ".ux-engineer/backup")), false);
  assert.deepEqual(readRecord(root), first);
});

test("conflict without force throws and writes nothing", () => {
  const sourceRoot = createFakePackage();
  const root = tempDir("project");
  write(join(root, ".claude/skills/ux-a/SKILL.md"), "someone else\n");
  const plan = planInstall({sourceRoot, root, targets: [join(root, ".claude/skills")]});
  assert.throws(() => applyInstall(plan, {force: false, now}), {message: "conflicts: 1 files; use --force to overwrite"});
  assert.equal(readFileSync(join(root, ".claude/skills/ux-a/SKILL.md"), "utf8"), "someone else\n");
  assert.equal(existsSync(join(root, ".claude/skills/ux-b")), false);
  assert.equal(existsSync(join(root, ".ux-engineer")), false);
});

test("conflict with force backs up the old bytes first", () => {
  const sourceRoot = createFakePackage();
  const root = tempDir("project");
  write(join(root, ".claude/skills/ux-a/SKILL.md"), "someone else\n");
  const record = applyInstall(planInstall({sourceRoot, root, targets: [join(root, ".claude/skills")]}), {force: true, now});
  const backup = ".ux-engineer/backup/2026-10-08T12-00-00.000Z/.claude/skills/ux-a/SKILL.md";
  assert.deepEqual(record.backups, [{path: ".claude/skills/ux-a/SKILL.md", backup}]);
  assert.equal(readFileSync(join(root, backup), "utf8"), "someone else\n");
  assert.equal(readFileSync(join(root, ".claude/skills/ux-a/SKILL.md"), "utf8"), "ux-a skill\n");
});

test("uninstall keeps user edits, removes the rest and restores backups", () => {
  const sourceRoot = createFakePackage();
  const root = tempDir("project");
  write(join(root, ".claude/skills/ux-a/SKILL.md"), "someone else\n");
  applyInstall(planInstall({sourceRoot, root, targets: [join(root, ".claude/skills")]}), {force: true, now});
  write(join(root, ".claude/skills/ux-b/SKILL.md"), "my edit\n");

  const result = uninstall(root);
  assert.deepEqual(result.keptModified, [".claude/skills/ux-b/SKILL.md"]);
  assert.deepEqual(result.removed.sort(), [".claude/skills/ux-a/SKILL.md", ".claude/skills/ux-a/references/x.md"]);
  assert.deepEqual(result.restored, [".claude/skills/ux-a/SKILL.md"]);
  assert.equal(readFileSync(join(root, ".claude/skills/ux-a/SKILL.md"), "utf8"), "someone else\n");
  assert.equal(existsSync(join(root, ".claude/skills/ux-a/references")), false);
  assert.equal(readFileSync(join(root, ".claude/skills/ux-b/SKILL.md"), "utf8"), "my edit\n");
  assert.deepEqual(readRecord(root).files.map((file) => file.path), [".claude/skills/ux-b/SKILL.md"]);
});

test("uninstall of an untouched install removes folders and the record", () => {
  const sourceRoot = createFakePackage();
  const root = tempDir("project");
  applyInstall(planInstall({sourceRoot, root, targets: [join(root, ".claude/skills")]}), {force: false, now});
  const result = uninstall(root);
  assert.equal(result.removed.length, 3);
  assert.equal(existsSync(join(root, ".claude/skills/ux-a")), false);
  assert.equal(existsSync(join(root, ".claude/skills")), true);
  assert.equal(existsSync(join(root, ".ux-engineer/install.json")), false);
});

test("uninstall refuses recorded paths outside root", () => {
  const root = tempDir("project");
  const outside = tempDir("outside");
  writeFileSync(join(outside, "keep.md"), "keep\n");
  write(join(root, ".ux-engineer/install.json"), JSON.stringify({
    version: "9.9.9", installed_at: "x", backups: [],
    files: [{path: `../${outside.split("/").pop()}/keep.md`, sha256: "0".repeat(64)}]
  }));
  assert.throws(() => uninstall(root), /outside/);
  assert.equal(existsSync(join(outside, "keep.md")), true);
});
