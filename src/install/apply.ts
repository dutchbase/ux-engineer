import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmdirSync, unlinkSync, writeFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { assertInsideRoot, recordPathOf, relativeToRoot, sha256, type InstallPlan, type RecordedFile } from "./plan.ts";

export type InstallRecord = { version: string; installed_at: string; files: RecordedFile[]; backups: { path: string; backup: string }[] };

function readRecord(recordPath: string): InstallRecord | null {
  return existsSync(recordPath) ? JSON.parse(readFileSync(recordPath, "utf8")) as InstallRecord : null;
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

  // Re-check every path before the first write: the tree may have changed since planInstall.
  assertInsideRoot(root, plan.recordPath);
  for (const {target} of writes) assertInsideRoot(root, target);
  for (const {backup} of backupsToMake) assertInsideRoot(root, join(root, backup));

  // Save the record even if a write fails halfway, so every file written so far stays owned (and removable).
  let record: InstallRecord;
  try {
    for (const {target, path, backup} of backupsToMake) {
      mkdirSync(dirname(join(root, backup)), {recursive: true});
      copyFileSync(target, join(root, backup));
      backups.push({path, backup});
    }
    for (const {source, target} of writes) {
      const bytes = readFileSync(source);
      mkdirSync(dirname(target), {recursive: true});
      writeFileSync(target, bytes);
      files.set(relativeToRoot(root, target), sha256(bytes));
    }
    // skip-identical files not in the record stay unrecorded: we did not create them, so uninstall must not delete them.
  } finally {
    record = saveRecord(plan, previous, files, backups, opts.now);
  }
  return record;
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

export function uninstall(root: string): { removed: string[]; keptModified: string[]; restored: string[] } {
  root = resolve(root);
  const recordPath = recordPathOf(root);
  const record = readRecord(recordPath);
  const removed: string[] = [];
  const keptModified: string[] = [];
  const restored: string[] = [];
  if (!record) return {removed, keptModified, restored};

  // Refuse the whole uninstall before touching anything if any recorded path escapes root.
  for (const {path} of record.files) assertInsideRoot(root, join(root, path));
  for (const {path, backup} of record.backups) {
    assertInsideRoot(root, join(root, path));
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
    mkdirSync(dirname(target), {recursive: true});
    copyFileSync(join(root, entry.backup), target);
    restored.push(entry.path);
  }

  for (const path of removed) removeEmptyFolders(root, dirname(join(root, path)));

  if (keptFiles.length === 0 && keptBackups.length === 0) unlinkSync(recordPath);
  else writeRecord(recordPath, {...record, files: keptFiles, backups: keptBackups});
  return {removed, keptModified, restored};
}

/** Removes empty folders up to (not including) the host `skills` folder or root. Backup files are never deleted. */
function removeEmptyFolders(root: string, dir: string): void {
  while (dir !== root && dir.startsWith(root) && basename(dir) !== "skills" && existsSync(dir) && readdirSync(dir).length === 0) {
    rmdirSync(dir);
    dir = dirname(dir);
  }
}
