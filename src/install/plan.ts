import { createHash } from "node:crypto";
import { existsSync, lstatSync, readdirSync, readFileSync, realpathSync } from "node:fs";
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from "node:path";

export type Action = { kind: "create" | "update" | "skip-identical"; target: string; source: string };
// `source` on Conflict is an addition to the brief's type: applyInstall needs it to write the file with --force.
export type Conflict = { target: string; source: string; reason: "modified-by-user" | "foreign-skill" };
export type InstallPlan = { root: string; recordPath: string; version: string; actions: Action[]; conflicts: Conflict[] };
export type RecordedFile = { path: string; sha256: string };

export function sha256(bytes: Buffer): string {
  return createHash("sha256").update(bytes).digest("hex");
}

export function recordPathOf(root: string): string {
  return join(resolve(root), ".ux-engineer/install.json");
}

/** Path relative to root with forward slashes, as stored in the record. */
export function relativeToRoot(root: string, path: string): string {
  return relative(resolve(root), resolve(path)).split(sep).join("/");
}

/**
 * Throws when `path` resolves outside `root`. Follows symlinks on the nearest existing ancestor
 * (and on `path` itself when it exists), so a symlinked folder cannot redirect writes or deletes.
 */
export function assertInsideRoot(root: string, path: string): void {
  const realRoot = realpathSync(root);
  let existing = resolve(path);
  const missing: string[] = [];
  while (!exists(existing)) {
    missing.unshift(basename(existing));
    const parent = dirname(existing);
    if (parent === existing) break;
    existing = parent;
  }
  let real: string;
  try {
    real = join(realpathSync(existing), ...missing);
  } catch {
    throw new Error(`refusing ${path}: cannot resolve it (dangling symlink?), may be outside ${root}`);
  }
  const rel = relative(realRoot, real);
  if (rel === "" || rel.startsWith("..") || isAbsolute(rel)) {
    throw new Error(`refusing ${path}: resolves outside ${root}`);
  }
}

function exists(path: string): boolean {
  try {
    lstatSync(path);
    return true;
  } catch {
    return false;
  }
}

function listFiles(dir: string): string[] {
  return readdirSync(dir, {recursive: true, withFileTypes: true})
    .filter((entry) => entry.isFile())
    .map((entry) => relative(dir, join(entry.parentPath, entry.name)))
    .sort();
}

export function readRecordFiles(recordPath: string): RecordedFile[] {
  if (!existsSync(recordPath)) return [];
  return (JSON.parse(readFileSync(recordPath, "utf8")) as { files: RecordedFile[] }).files;
}

export function planInstall(opts: { sourceRoot: string; root: string; targets: string[]; skills?: string[] }): InstallPlan {
  const root = resolve(opts.root);
  const recordPath = recordPathOf(root);
  const {version} = JSON.parse(readFileSync(join(opts.sourceRoot, ".claude-plugin/plugin.json"), "utf8")) as { version: string };
  const skillsDir = join(opts.sourceRoot, "skills");
  const available = readdirSync(skillsDir, {withFileTypes: true}).filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();
  const skills = opts.skills ?? available;
  for (const skill of skills) {
    if (!available.includes(skill)) throw new Error(`unknown skill: ${skill}`);
  }

  const recorded = new Map(readRecordFiles(recordPath).map((file) => [file.path, file.sha256]));
  const actions: Action[] = [];
  const conflicts: Conflict[] = [];

  for (const targetDir of opts.targets) {
    assertInsideRoot(root, targetDir);
    for (const skill of skills) {
      assertInsideRoot(root, join(targetDir, skill));
      for (const file of listFiles(join(skillsDir, skill))) {
        const source = join(skillsDir, skill, file);
        const target = join(resolve(targetDir), skill, file);
        assertInsideRoot(root, target);
        if (!exists(target)) {
          actions.push({kind: "create", target, source});
          continue;
        }
        const current = readFileSync(target);
        if (current.equals(readFileSync(source))) {
          actions.push({kind: "skip-identical", target, source});
          continue;
        }
        const recordedSha = recorded.get(relativeToRoot(root, target));
        if (recordedSha === sha256(current)) actions.push({kind: "update", target, source});
        else conflicts.push({target, source, reason: recordedSha === undefined ? "foreign-skill" : "modified-by-user"});
      }
    }
  }

  return {root, recordPath, version, actions, conflicts};
}
