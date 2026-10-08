import { createHash } from "node:crypto";
import { existsSync, lstatSync, readdirSync, readFileSync, realpathSync } from "node:fs";
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from "node:path";

export type Action = { kind: "create" | "update" | "skip-identical"; target: string; source: string };
// `source` on Conflict is an addition to the brief's type: applyInstall needs it to write the file with --force.
export type Conflict = { target: string; source: string; reason: "modified-by-user" | "foreign-skill" };
export type InstallPlan = { root: string; recordPath: string; version: string; actions: Action[]; conflicts: Conflict[] };
export type RecordedFile = { path: string; sha256: string };
export type InstallRecord = { version: string; installed_at: string; files: RecordedFile[]; backups: { path: string; backup: string }[] };

const skillFilePath = /^(\.claude|\.agents)\/skills\/[^/]+\/.+/;
const hostSkillsDirs = [".claude/skills", ".agents/skills"];

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
  if (rel === "" || rel === ".." || rel.startsWith(`..${sep}`) || isAbsolute(rel)) {
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

function hasDotSegment(path: string): boolean {
  return path.split("/").some((segment) => segment === "" || segment === "." || segment === "..");
}

/** A recorded path may only name a file inside `.claude/skills/<skill>/` or `.agents/skills/<skill>/`. */
export function isSkillFilePath(path: string): boolean {
  return typeof path === "string" && skillFilePath.test(path) && !hasDotSegment(path) && !path.includes("\\");
}

/** Reads the record and throws before anything changes if any path in it is outside the allowed folders. */
export function readRecord(recordPath: string): InstallRecord | null {
  if (!existsSync(recordPath)) return null;
  const record = JSON.parse(readFileSync(recordPath, "utf8")) as InstallRecord;
  const bad = [
    ...record.files.filter((file) => !isSkillFilePath(file.path)).map((file) => file.path),
    ...record.backups.filter((entry) => !isSkillFilePath(entry.path)).map((entry) => entry.path),
    ...record.backups.filter((entry) => typeof entry.backup !== "string" || !entry.backup.startsWith(".ux-engineer/backup/") || hasDotSegment(entry.backup))
      .map((entry) => entry.backup)
  ];
  if (bad.length > 0) throw new Error(`invalid record path in ${recordPath}: ${bad.join(", ")}`);
  return record;
}

/**
 * Full safety check for one installed file: allowed shape relative to root, resolves inside root,
 * and no symlink from the skill folder down to the file (a symlink there could redirect a write or delete).
 */
export function assertSafeSkillFile(root: string, target: string): void {
  const rel = relativeToRoot(root, target);
  if (!isSkillFilePath(rel)) throw new Error(`invalid record path: ${rel}`);
  assertInsideRoot(root, target);
  const segments = rel.split("/");
  for (let depth = 3; depth <= segments.length; depth++) {
    const path = join(root, ...segments.slice(0, depth));
    if (exists(path) && lstatSync(path).isSymbolicLink()) throw new Error(`refusing ${path}: is a symlink`);
  }
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

  const recorded = new Map((readRecord(recordPath)?.files ?? []).map((file) => [file.path, file.sha256]));
  const actions: Action[] = [];
  const conflicts: Conflict[] = [];

  for (const targetDir of opts.targets) {
    assertInsideRoot(root, targetDir);
    if (!hostSkillsDirs.includes(relativeToRoot(root, targetDir))) {
      throw new Error(`refusing ${targetDir}: not a host skills folder (.claude/skills or .agents/skills under ${root})`);
    }
    for (const skill of skills) {
      for (const file of listFiles(join(skillsDir, skill))) {
        const source = join(skillsDir, skill, file);
        const target = join(resolve(targetDir), skill, file);
        assertSafeSkillFile(root, target);
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
