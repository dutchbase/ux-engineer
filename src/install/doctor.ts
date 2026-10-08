import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { readRecord, recordPathOf } from "./plan.ts";

export type DoctorReport = { locations: { dir: string; skills: { name: string; matchesPackage: boolean }[] }[]; duplicates: string[]; record: { path: string; version: string; error?: string } | null };

function listFiles(dir: string): string[] {
  return readdirSync(dir, {recursive: true, withFileTypes: true})
    .filter((entry) => entry.isFile())
    .map((entry) => join(entry.parentPath, entry.name).slice(dir.length))
    .sort();
}

function sameFiles(installed: string, packaged: string): boolean {
  if (!existsSync(packaged)) return false;
  const files = listFiles(packaged);
  return JSON.stringify(files) === JSON.stringify(listFiles(installed))
    && files.every((file) => readFileSync(join(installed, file)).equals(readFileSync(join(packaged, file))));
}

/** Read-only: reports ux-* skills in every folder a supported host reads, and whether each matches the package. */
export function doctor(opts: { sourceRoot: string; home: string; cwd: string }): DoctorReport {
  const {sourceRoot, home, cwd} = opts;
  const dirs = {
    projectClaude: join(cwd, ".claude/skills"), projectAgents: join(cwd, ".agents/skills"), projectOpencode: join(cwd, ".opencode/skills"),
    globalClaude: join(home, ".claude/skills"), globalAgents: join(home, ".agents/skills"), globalOpencode: join(home, ".config/opencode/skills")
  };
  // Folders that one host reads together; the same skill in two of them loads twice.
  const hostGroups = [
    [dirs.projectClaude, dirs.globalClaude],
    [dirs.projectAgents, dirs.globalAgents],
    [dirs.projectOpencode, dirs.globalOpencode, dirs.projectAgents, dirs.globalAgents, dirs.projectClaude, dirs.globalClaude]
  ];

  const names = new Map<string, string[]>();
  const locations: DoctorReport["locations"] = [];
  for (const dir of new Set(Object.values(dirs).map((path) => resolve(path)))) {
    if (!existsSync(dir)) continue;
    const skills = readdirSync(dir, {withFileTypes: true}).filter((entry) => entry.isDirectory() && entry.name.startsWith("ux-"))
      .map((entry) => entry.name).sort();
    if (skills.length === 0) continue;
    names.set(dir, skills);
    locations.push({dir, skills: skills.map((name) => ({name, matchesPackage: sameFiles(join(dir, name), join(sourceRoot, "skills", name))}))});
  }

  const duplicates = new Set<string>();
  for (const group of hostGroups) {
    const seen = new Set<string>();
    for (const dir of new Set(group.map((path) => resolve(path)))) {
      for (const name of names.get(dir) ?? []) {
        if (seen.has(name)) duplicates.add(name);
        seen.add(name);
      }
    }
  }

  const recordPath = [cwd, home].map(recordPathOf).find((path) => existsSync(path));
  let record: DoctorReport["record"] = null;
  if (recordPath) {
    try {
      record = {path: recordPath, version: readRecord(recordPath)!.version};
    } catch (error) {
      record = {path: recordPath, version: "", error: error instanceof Error ? error.message : String(error)};
    }
  }
  return {locations, duplicates: [...duplicates].sort(), record};
}
