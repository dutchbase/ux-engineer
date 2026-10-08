import assert from "node:assert/strict";
import { mkdirSync, readFileSync, symlinkSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { detectHosts, targetDirs } from "../../src/install/hosts.ts";
import { assertInsideRoot, planInstall } from "../../src/install/plan.ts";
import { applyInstall } from "../../src/install/apply.ts";
import { createFakePackage, tempDir, write } from "./helpers.ts";

const now = () => new Date("2026-10-08T12:00:00.000Z");

test("detectHosts finds hosts from home and project folders", () => {
  const home = tempDir("home");
  const cwd = tempDir("cwd");
  mkdirSync(join(home, ".claude"));
  assert.deepEqual(detectHosts({home, cwd}), ["claude-code"]);

  const home2 = tempDir("home");
  const cwd2 = tempDir("cwd");
  mkdirSync(join(cwd2, ".agents"));
  mkdirSync(join(cwd2, ".opencode"));
  assert.deepEqual(detectHosts({home: home2, cwd: cwd2}), ["codex", "opencode"]);
});

test("targetDirs shares one .agents folder for codex and opencode", () => {
  const env = {home: "/home/u", cwd: "/work/app"};
  const dirs = targetDirs(["codex", "opencode"], "project", env);
  assert.equal(dirs.length, 1);
  assert.ok(dirs[0].endsWith("/.agents/skills"));
  assert.deepEqual(targetDirs(["claude-code"], "global", env), ["/home/u/.claude/skills"]);
});

test("fresh project plans only creates", () => {
  const sourceRoot = createFakePackage();
  const root = tempDir("project");
  const plan = planInstall({sourceRoot, root, targets: [join(root, ".claude/skills")]});
  assert.equal(plan.version, "9.9.9");
  assert.equal(plan.recordPath, join(root, ".ux-engineer/install.json"));
  assert.equal(plan.actions.length, 3);
  assert.ok(plan.actions.every((action) => action.kind === "create"));
  assert.deepEqual(plan.conflicts, []);
});

test("second plan after install is all skip-identical", () => {
  const sourceRoot = createFakePackage();
  const root = tempDir("project");
  const targets = [join(root, ".claude/skills"), join(root, ".agents/skills")];
  applyInstall(planInstall({sourceRoot, root, targets}), {force: false, now});
  const plan = planInstall({sourceRoot, root, targets});
  assert.equal(plan.actions.length, 6);
  assert.ok(plan.actions.every((action) => action.kind === "skip-identical"));
  assert.deepEqual(plan.conflicts, []);
});

test("foreign skill file is a conflict", () => {
  const sourceRoot = createFakePackage();
  const root = tempDir("project");
  write(join(root, ".claude/skills/ux-a/SKILL.md"), "someone else\n");
  const plan = planInstall({sourceRoot, root, targets: [join(root, ".claude/skills")]});
  assert.deepEqual(plan.conflicts.map(({target, reason}) => ({target, reason})),
    [{target: join(root, ".claude/skills/ux-a/SKILL.md"), reason: "foreign-skill"}]);
  assert.equal(plan.actions.length, 2);
});

test("newer package over untouched install is an update", () => {
  const sourceRoot = createFakePackage();
  const root = tempDir("project");
  const targets = [join(root, ".claude/skills")];
  applyInstall(planInstall({sourceRoot, root, targets}), {force: false, now});
  write(join(sourceRoot, "skills/ux-a/SKILL.md"), "ux-a skill v2\n");
  const plan = planInstall({sourceRoot, root, targets});
  assert.deepEqual(plan.conflicts, []);
  assert.deepEqual(plan.actions.filter((action) => action.kind === "update").map((action) => action.target),
    [join(root, ".claude/skills/ux-a/SKILL.md")]);
});

test("user-modified installed file is a modified-by-user conflict", () => {
  const sourceRoot = createFakePackage();
  const root = tempDir("project");
  const targets = [join(root, ".claude/skills")];
  applyInstall(planInstall({sourceRoot, root, targets}), {force: false, now});
  write(join(root, ".claude/skills/ux-b/SKILL.md"), "my edit\n");
  write(join(sourceRoot, "skills/ux-b/SKILL.md"), "ux-b skill v2\n");
  const plan = planInstall({sourceRoot, root, targets});
  assert.deepEqual(plan.conflicts.map(({reason}) => reason), ["modified-by-user"]);
});

test("target folder symlinked outside root is refused", () => {
  const sourceRoot = createFakePackage();
  const root = tempDir("project");
  const outside = tempDir("outside");
  mkdirSync(join(root, ".claude"));
  symlinkSync(outside, join(root, ".claude/skills"), "dir");
  assert.throws(() => planInstall({sourceRoot, root, targets: [join(root, ".claude/skills")]}), /outside/);
});

test("skill folder symlinked outside root is refused", () => {
  const sourceRoot = createFakePackage();
  const root = tempDir("project");
  const outside = tempDir("outside");
  mkdirSync(join(root, ".claude/skills"), {recursive: true});
  symlinkSync(outside, join(root, ".claude/skills/ux-a"), "dir");
  assert.throws(() => planInstall({sourceRoot, root, targets: [join(root, ".claude/skills")]}), /outside/);
});

test("target folder outside root is refused", () => {
  const sourceRoot = createFakePackage();
  const root = tempDir("project");
  assert.throws(() => planInstall({sourceRoot, root, targets: [join(tempDir("other"), "skills")]}), /outside/);
});

test("single skill installs complete with its references", () => {
  const sourceRoot = createFakePackage();
  const root = tempDir("project");
  const plan = planInstall({sourceRoot, root, targets: [join(root, ".claude/skills")], skills: ["ux-a"]});
  assert.deepEqual(plan.actions.map((action) => action.target).sort(), [
    join(root, ".claude/skills/ux-a/SKILL.md"),
    join(root, ".claude/skills/ux-a/references/x.md")
  ]);
  assert.throws(() => planInstall({sourceRoot, root, targets: [join(root, ".claude/skills")], skills: ["nope"]}),
    /unknown skill/);
});

test("symlinked target file inside root is refused", () => {
  const sourceRoot = createFakePackage();
  const root = tempDir("project");
  write(join(root, "README.md"), "readme\n");
  mkdirSync(join(root, ".claude/skills/ux-a"), {recursive: true});
  symlinkSync("../../../README.md", join(root, ".claude/skills/ux-a/SKILL.md"));
  assert.throws(() => planInstall({sourceRoot, root, targets: [join(root, ".claude/skills")]}), /symlink/);
  assert.equal(readFileSync(join(root, "README.md"), "utf8"), "readme\n");
});

test("symlinked skill folder inside root is refused", () => {
  const sourceRoot = createFakePackage();
  const root = tempDir("project");
  mkdirSync(join(root, "docs"));
  mkdirSync(join(root, ".claude/skills"), {recursive: true});
  symlinkSync("../../docs", join(root, ".claude/skills/ux-a"), "dir");
  assert.throws(() => planInstall({sourceRoot, root, targets: [join(root, ".claude/skills")]}), /symlink/);
});

test("target folder that is not a host skills folder is refused", () => {
  const sourceRoot = createFakePackage();
  const root = tempDir("project");
  assert.throws(() => planInstall({sourceRoot, root, targets: [join(root, "src")]}), /not a host skills folder/);
});

test("crafted record path is refused when planning", () => {
  const sourceRoot = createFakePackage();
  const root = tempDir("project");
  write(join(root, ".ux-engineer/install.json"), JSON.stringify({
    version: "1", installed_at: "x", backups: [], files: [{path: "src/main.ts", sha256: "0".repeat(64)}]
  }));
  assert.throws(() => planInstall({sourceRoot, root, targets: [join(root, ".claude/skills")]}), /invalid record path/);
});

test("record without files or backups arrays is refused", () => {
  const sourceRoot = createFakePackage();
  for (const record of [{version: "1", backups: []}, {version: "1", files: [], backups: "x"}]) {
    const root = tempDir("project");
    const recordPath = join(root, ".ux-engineer/install.json");
    write(recordPath, JSON.stringify(record));
    assert.throws(() => planInstall({sourceRoot, root, targets: [join(root, ".claude/skills")]}), {message: `invalid install record: ${recordPath}`});
  }
});

test("in-root name starting with two dots is inside root", () => {
  const root = tempDir("project");
  assert.doesNotThrow(() => assertInsideRoot(root, join(root, "..foo")));
});
