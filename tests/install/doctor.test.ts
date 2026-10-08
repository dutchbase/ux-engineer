import assert from "node:assert/strict";
import { join } from "node:path";
import { test } from "node:test";
import { doctor } from "../../src/install/doctor.ts";
import { createFakePackage, tempDir, write } from "./helpers.ts";

function installCopy(dir: string, name: string, files: Record<string, string>): void {
  for (const [file, content] of Object.entries(files)) write(join(dir, name, file), content);
}

test("lists ux-* skills and compares bytes with the package", () => {
  const sourceRoot = createFakePackage();
  const home = tempDir("home");
  const cwd = tempDir("cwd");
  const dir = join(cwd, ".claude/skills");
  installCopy(dir, "ux-a", {"SKILL.md": "ux-a skill\n", "references/x.md": "ux-a reference\n"});
  installCopy(dir, "ux-b", {"SKILL.md": "changed\n"});
  installCopy(dir, "other", {"SKILL.md": "not ours\n"});
  const report = doctor({sourceRoot, home, cwd});
  assert.deepEqual(report.locations, [{dir, skills: [{name: "ux-a", matchesPackage: true}, {name: "ux-b", matchesPackage: false}]}]);
  assert.deepEqual(report.duplicates, []);
  assert.deepEqual(report.records, []);
});

test("an extra file in the installed skill is a mismatch", () => {
  const sourceRoot = createFakePackage();
  const cwd = tempDir("cwd");
  installCopy(join(cwd, ".agents/skills"), "ux-b", {"SKILL.md": "ux-b skill\n", "extra.md": "x\n"});
  const report = doctor({sourceRoot, home: tempDir("home"), cwd});
  assert.equal(report.locations[0].skills[0].matchesPackage, false);
});

test("same skill in project and global folder of one host is a duplicate", () => {
  const sourceRoot = createFakePackage();
  const home = tempDir("home");
  const cwd = tempDir("cwd");
  installCopy(join(cwd, ".agents/skills"), "ux-b", {"SKILL.md": "ux-b skill\n"});
  installCopy(join(home, ".agents/skills"), "ux-b", {"SKILL.md": "ux-b skill\n"});
  installCopy(join(home, ".claude/skills"), "ux-a", {"SKILL.md": "ux-a skill\n"});
  assert.deepEqual(doctor({sourceRoot, home, cwd}).duplicates, ["ux-b"]);
});

test("reads the install record and writes nothing", () => {
  const sourceRoot = createFakePackage();
  const cwd = tempDir("cwd");
  write(join(cwd, ".ux-engineer/install.json"), JSON.stringify({version: "1.2.3", installed_at: "x", files: [], backups: []}));
  assert.deepEqual(doctor({sourceRoot, home: tempDir("home"), cwd}).records, [{path: join(cwd, ".ux-engineer/install.json"), version: "1.2.3"}]);
});

test("claude and agents copies in one project are a duplicate for OpenCode", () => {
  const sourceRoot = createFakePackage();
  const cwd = tempDir("cwd");
  installCopy(join(cwd, ".claude/skills"), "ux-a", {"SKILL.md": "ux-a skill\n"});
  installCopy(join(cwd, ".agents/skills"), "ux-a", {"SKILL.md": "ux-a skill\n"});
  assert.deepEqual(doctor({sourceRoot, home: tempDir("home"), cwd}).duplicates, ["ux-a"]);
});

test("an invalid install record is reported, not thrown", () => {
  const sourceRoot = createFakePackage();
  const cwd = tempDir("cwd");
  write(join(cwd, ".ux-engineer/install.json"), JSON.stringify({version: "1", installed_at: "x", files: [{path: "../evil", sha256: "x"}], backups: []}));
  const report = doctor({sourceRoot, home: tempDir("home"), cwd});
  assert.equal(report.records[0]?.path, join(cwd, ".ux-engineer/install.json"));
  assert.match(report.records[0]?.error ?? "", /invalid record path/);
  write(join(cwd, ".ux-engineer/install.json"), "{not json");
  assert.ok(doctor({sourceRoot, home: tempDir("home"), cwd}).records[0]?.error);
});

test("reports both project and global records", () => {
  const sourceRoot = createFakePackage();
  const cwd = tempDir("cwd");
  const home = tempDir("home");
  write(join(cwd, ".ux-engineer/install.json"), JSON.stringify({version: "1.0.0", installed_at: "x", files: [], backups: []}));
  write(join(home, ".ux-engineer/install.json"), JSON.stringify({version: "2.0.0", installed_at: "x", files: [], backups: []}));
  assert.deepEqual(doctor({sourceRoot, home, cwd}).records, [
    {path: join(cwd, ".ux-engineer/install.json"), version: "1.0.0"},
    {path: join(home, ".ux-engineer/install.json"), version: "2.0.0"}
  ]);
});
