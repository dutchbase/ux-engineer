import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, resolve } from "node:path";

export const sharedFiles = {
  "ux-framing": [
    {source: "shared/policies/writing.md", folder: "references"},
    {source: "schemas/project.schema.json", folder: "references"}
  ],
  "ux-setup": [
    {source: "shared/policies/writing.md", folder: "references"},
    {source: "schemas/project.schema.json", folder: "references"},
    {source: "shared/references/interview.json", folder: "references"},
    {source: "dist/ux.mjs", folder: "scripts"}
  ],
  "ux-audit": [
    {source: "shared/policies/writing.md", folder: "references"},
    {source: "shared/policies/evidence.md", folder: "references"},
    {source: "shared/policies/safety.md", folder: "references"},
    {source: "shared/references/audit-method.md", folder: "references"},
    {source: "shared/references/accessibility.md", folder: "references"},
    {source: "schemas/run.schema.json", folder: "references"},
    {source: "schemas/evidence.schema.json", folder: "references"},
    {source: "schemas/findings.schema.json", folder: "references"},
    {source: "schemas/checks.schema.json", folder: "references"},
    {source: "shared/references/ai-tells.md", folder: "references"},
    {source: "dist/ux.mjs", folder: "scripts"}
  ],
  "ux-flow-design": [
    {source: "shared/policies/writing.md", folder: "references"},
    {source: "shared/references/forms.md", folder: "references"},
    {source: "shared/references/information-architecture.md", folder: "references"},
    {source: "shared/references/content-design.md", folder: "references"},
    {source: "shared/references/accessibility.md", folder: "references"},
    {source: "shared/references/ai-tells.md", folder: "references"},
    {source: "schemas/flow.schema.json", folder: "references"},
    {source: "schemas/project.schema.json", folder: "references"},
    {source: "dist/ux.mjs", folder: "scripts"}
  ],
  "ux-research": [
    {source: "shared/policies/writing.md", folder: "references"},
    {source: "shared/policies/research-integrity.md", folder: "references"},
    {source: "shared/templates/research-plan.md", folder: "references"},
    {source: "schemas/research.schema.json", folder: "references"},
    {source: "schemas/project.schema.json", folder: "references"},
    {source: "dist/ux.mjs", folder: "scripts"}
  ],
  "ux-accessibility": [
    {source: "shared/policies/writing.md", folder: "references"},
    {source: "shared/policies/evidence.md", folder: "references"},
    {source: "shared/policies/safety.md", folder: "references"},
    {source: "shared/references/accessibility.md", folder: "references"},
    {source: "schemas/run.schema.json", folder: "references"},
    {source: "schemas/evidence.schema.json", folder: "references"},
    {source: "schemas/findings.schema.json", folder: "references"},
    {source: "schemas/checks.schema.json", folder: "references"},
    {source: "dist/ux.mjs", folder: "scripts"}
  ],
  "ux-plan": [
    {source: "shared/policies/writing.md", folder: "references"},
    {source: "shared/references/ai-tells.md", folder: "references"}
  ],
  "ux-orchestrator": [
    {source: "shared/policies/writing.md", folder: "references"},
    {source: "shared/references/routing.md", folder: "references"}
  ]
} as const;

export function syncShared(root: string, opts: {check: boolean}): string[] {
  const outOfDate: string[] = [];

  for (const [skill, sources] of Object.entries(sharedFiles)) {
    for (const {source, folder} of sources) {
      if (source === "dist/ux.mjs" && !existsSync(resolve(root, source))) {
        throw new Error("dist/ux.mjs missing: run pnpm build first");
      }
      const destination = `skills/${skill}/${folder}/${basename(source)}`;
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
  try {
    const updated = syncShared(root, {check});
    updated.forEach((path) => console.log(path));
    if (check && updated.length > 0) process.exitCode = 1;
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
