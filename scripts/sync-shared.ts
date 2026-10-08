import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, resolve } from "node:path";

const sharedFiles = {
  "ux-framing": ["shared/policies/writing.md", "schemas/project.schema.json"],
  "ux-setup": [
    "shared/policies/writing.md",
    "schemas/project.schema.json",
    "shared/references/interview.json"
  ]
} as const;

export function syncShared(root: string, opts: {check: boolean}): string[] {
  const outOfDate: string[] = [];

  for (const [skill, sources] of Object.entries(sharedFiles)) {
    for (const source of sources) {
      const destination = `skills/${skill}/references/${basename(source)}`;
      const sourceBytes = readFileSync(resolve(root, source));
      const destinationPath = resolve(root, destination);
      const currentBytes = existsSync(destinationPath) ? readFileSync(destinationPath) : null;

      if (currentBytes?.equals(sourceBytes)) continue;
      outOfDate.push(destination);
      if (!opts.check) {
        mkdirSync(dirname(destinationPath), {recursive: true});
        writeFileSync(destinationPath, sourceBytes);
      }
    }
  }

  return outOfDate;
}

if (process.argv[1] && import.meta.filename === resolve(process.argv[1])) {
  const check = process.argv[2] === "--check";
  const root = resolve(import.meta.dirname, "..");
  const updated = syncShared(root, {check});
  updated.forEach((path) => console.log(path));
  if (check && updated.length > 0) process.exitCode = 1;
}
