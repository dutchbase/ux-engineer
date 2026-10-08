import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

export function tempDir(name: string): string {
  return mkdtempSync(join(tmpdir(), `ux-engineer-${name}-`));
}

export function write(path: string, content: string): void {
  mkdirSync(dirname(path), {recursive: true});
  writeFileSync(path, content);
}

export function createFakePackage(version = "9.9.9"): string {
  const root = tempDir("package");
  write(join(root, ".claude-plugin/plugin.json"), JSON.stringify({name: "ux-engineer", version}));
  write(join(root, "skills/ux-a/SKILL.md"), "ux-a skill\n");
  write(join(root, "skills/ux-a/references/x.md"), "ux-a reference\n");
  write(join(root, "skills/ux-b/SKILL.md"), "ux-b skill\n");
  return root;
}
