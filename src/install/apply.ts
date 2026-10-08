import { copyFileSync, existsSync, linkSync, mkdirSync, readdirSync, readFileSync, renameSync, rmdirSync, rmSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { assertInsideRoot, assertSafeSkillFile, readRecord, recordPathOf, relativeToRoot, sha256, type InstallPlan, type InstallRecord,
  type RecordedFile } from "./plan.ts";

export type { InstallRecord } from "./plan.ts";

function changedSincePlan(target: string): Error {
  return new Error(`target changed since plan: ${target}; re-run install`);
}

function writeRecord(recordPath: string, record: InstallRecord): void {
  mkdirSync(dirname(recordPath), {recursive: true});
  writeFileSync(recordPath, `${JSON.stringify(record, null, 2)}\n`);
}

export function applyInstall(plan: InstallPlan, opts: { force: boolean; now: () => Date }): InstallRecord {
  if (plan.conflicts.length > 0 && !opts.force) {
    throw new Error(`conflicts: ${plan.conflicts.length} files; use --force to overwrite`);
  }
  const root = resolve(plan.root);
  const previous = readRecord(plan.recordPath);
  const files = new Map((previous?.files ?? []).map((file) => [file.path, file.sha256]));
  const backups = [...(previous?.backups ?? [])];
  const stamp = opts.now().toISOString().replaceAll(":", "-");
  const writes = [...plan.actions.filter((action) => action.kind !== "skip-identical"), ...plan.conflicts];
  const backupsToMake = plan.conflicts.map(({target}) => {
    const path = relativeToRoot(root, target);
    return {target, path, backup: `.ux-engineer/backup/${stamp}/${path}`};
  });

  // Re-check every path and its content before the first write: the tree may have changed since planInstall.
  assertInsideRoot(root, plan.recordPath);
  for (const {target} of writes) assertSafeSkillFile(root, target);
  for (const {backup} of backupsToMake) assertInsideRoot(root, join(root, backup));
  for (const action of plan.actions) {
    if (action.kind === "create" && existsSync(action.target)) throw changedSincePlan(action.target);
    if (action.kind === "update") {
      const recordedSha = files.get(relativeToRoot(root, action.target));
      if (!existsSync(action.target) || sha256(readFileSync(action.target)) !== recordedSha) throw changedSincePlan(action.target);
    }
  }
  for (const {target} of plan.conflicts) if (!existsSync(target)) throw changedSincePlan(target);

  // Save the record even if a write fails halfway, so every file written so far stays owned (and removable).
  let record: InstallRecord;
  try {
    for (const {target, path, backup} of backupsToMake) {
      mkdirSync(dirname(join(root, backup)), {recursive: true});
      copyFileSync(target, join(root, backup));
      backups.push({path, backup});
    }
    for (const write of writes) {
      const {source, target} = write;
      const bytes = readFileSync(source);
      mkdirSync(dirname(target), {recursive: true});
      writeAtomic(target, bytes, "kind" in write && write.kind === "create");
      files.set(relativeToRoot(root, target), sha256(bytes));
    }
    // skip-identical files not in the record stay unrecorded: we did not create them, so uninstall must not delete them.
  } finally {
    record = saveRecord(plan, previous, files, backups, opts.now);
  }
  return record;
}

/**
 * Writes a temp file next to the target, then swaps it in. A hard-linked target is replaced,
 * so the linked file elsewhere keeps its bytes. For a create, linkSync fails if the target
 * appeared after the plan check, so a new user file is never overwritten.
 */
function writeAtomic(target: string, bytes: Buffer, create: boolean): void {
  const temp = `${target}.ux-engineer-tmp-${process.pid}`;
  rmSync(temp, {force: true});
  writeFileSync(temp, bytes, {flag: "wx"});
  try {
    if (create) {
      linkSync(temp, target);
      unlinkSync(temp);
    } else {
      renameSync(temp, target);
    }
  } finally {
    rmSync(temp, {force: true});
  }
}

function saveRecord(plan: InstallPlan, previous: InstallRecord | null, files: Map<string, string>,
  backups: InstallRecord["backups"], now: () => Date): InstallRecord {
  const next = {
    version: plan.version,
    files: [...files].map(([path, hash]) => ({path, sha256: hash})).sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0)),
    backups
  };
  if (previous && JSON.stringify({version: previous.version, files: previous.files, backups: previous.backups}) === JSON.stringify(next)) {
    return previous;
  }
  const record: InstallRecord = {version: next.version, installed_at: now().toISOString(), files: next.files, backups: next.backups};
  writeRecord(plan.recordPath, record);
  return record;
}

export function uninstall(root: string): { removed: string[]; keptModified: string[]; restored: string[]; missingBackups: string[] } {
  root = resolve(root);
  const recordPath = recordPathOf(root);
  const record = readRecord(recordPath);
  const removed: string[] = [];
  const keptModified: string[] = [];
  const restored: string[] = [];
  const missingBackups: string[] = [];
  if (!record) return {removed, keptModified, restored, missingBackups};

  // Refuse the whole uninstall before touching anything if any recorded path escapes the skill folders.
  // readRecord already checked the path shapes; this adds the realpath and symlink checks.
  for (const {path} of record.files) assertSafeSkillFile(root, join(root, path));
  for (const {path, backup} of record.backups) {
    assertSafeSkillFile(root, join(root, path));
    assertInsideRoot(root, join(root, backup));
  }

  const keptFiles: RecordedFile[] = [];
  for (const file of record.files) {
    const target = join(root, file.path);
    if (!existsSync(target)) continue;
    if (sha256(readFileSync(target)) === file.sha256) {
      unlinkSync(target);
      removed.push(file.path);
    } else {
      keptModified.push(file.path);
      keptFiles.push(file);
    }
  }

  // Restore the oldest backup per path (the state before our first install); never overwrite a file still present.
  const keptBackups: InstallRecord["backups"] = [];
  for (const entry of record.backups) {
    const target = join(root, entry.path);
    if (restored.includes(entry.path)) continue;
    if (existsSync(target)) {
      keptBackups.push(entry);
      continue;
    }
    // A lost backup must not block uninstall forever: report it and drop it from the record.
    if (!existsSync(join(root, entry.backup))) {
      missingBackups.push(entry.path);
      continue;
    }
    mkdirSync(dirname(target), {recursive: true});
    copyFileSync(join(root, entry.backup), target);
    restored.push(entry.path);
  }

  for (const path of removed) removeEmptyFolders(root, path);

  if (keptFiles.length === 0 && keptBackups.length === 0) unlinkSync(recordPath);
  else writeRecord(recordPath, {...record, files: keptFiles, backups: keptBackups});
  return {removed, keptModified, restored, missingBackups};
}

/**
 * Removes the empty folders a removed file lived in, from its parent up to and including its
 * `<host>/skills/<skill>/` folder. Never touches the `skills/` folder or anything above it.
 */
function removeEmptyFolders(root: string, recordedPath: string): void {
  const segments = recordedPath.split("/");
  for (let depth = segments.length - 1; depth >= 3; depth--) {
    const dir = join(root, ...segments.slice(0, depth));
    if (!existsSync(dir) || readdirSync(dir).length > 0) return;
    rmdirSync(dir);
  }
}
