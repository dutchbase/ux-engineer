import { createHash } from "node:crypto";
import { readFileSync, realpathSync } from "node:fs";
import { isAbsolute, join, relative, win32 } from "node:path";
import { deriveRunStatus, type Check, type RunStatus } from "./verdict.ts";
import { validateArtifact, type Result, type ValidationError } from "./validate.ts";

export type Run = {
  schema_version: string;
  run_id: string;
  mode: "setup" | "plan" | "research" | "audit" | "verify";
  scope: "light" | "targeted" | "standard" | "deep";
  target: { url: string; environment: "local" | "staging" | "preview" | "production"; description: string };
  versions: Record<string, string | null>;
  capabilities: { browser: boolean; keyboard: boolean; screenshots: boolean; axe: boolean };
  coverage: { task: string; persona_id: string | null; viewport: string; state: string; input_method: "pointer" | "touch" | "keyboard"; locale: string | null; tested: boolean; reason: string | null }[];
  requested_checks: string[];
  status: RunStatus;
  blockers: string[];
  limitations: string[];
  started_at: string;
  finished_at: string | null;
};

export type EvidenceItem = {
  evidence_id: string;
  type: string;
  producer: string;
  timestamp: string;
  context: { persona_id: string | null; viewport: string | null; locale: string | null; url: string | null; step: string | null };
  action: string | null;
  result: string | null;
  file: string | null;
  sha256: string | null;
};

export type Evidence = { schema_version: string; run_id: string; items: EvidenceItem[] };
export type Findings = { schema_version: string; run_id: string; findings: Finding[] };
export type Finding = {
  finding_id: string; flow_id: string | null; title: string;
  basis: "observed" | "code_supported" | "user_reported" | "measured" | "web_sourced" | "inferred" | "assumed";
  status: "confirmed" | "hypothesis" | "needs_validation";
  severity: "critical" | "major" | "minor" | "advisory";
  confidence: "high" | "medium" | "low"; confidence_reason: string; user_impact: string; reach: string | null;
  context: { persona_id: string | null; locale: string | null; viewport: string | null };
  evidence_ids: string[]; expected_result: string; actual_result: string; criterion_refs: string[]; recommendation: string; requires_human_validation: boolean; systemic: boolean;
};
export type Checks = { schema_version: string; run_id: string; checks: Check[] };
export type RunBundle = { run: Run; evidence: Evidence; checks: Checks; findings: Findings };

const files = [
  ["run.json", "run"], ["evidence.json", "evidence"], ["checks.json", "checks"], ["findings.json", "findings"]
] as const;

function readJson(path: string): Result<unknown> {
  try {
    return {ok: true, data: JSON.parse(readFileSync(path, "utf8")) as unknown};
  } catch (error) {
    return {ok: false, errors: [{path, message: error instanceof Error ? error.message : String(error)}]};
  }
}

const prefixed = (file: string, errors: ValidationError[]): ValidationError[] =>
  errors.map((error) => ({path: `${file}${error.path}`, message: error.message}));

const sameSet = (left: string[], right: string[]): boolean => {
  const a = new Set(left);
  const b = new Set(right);
  return a.size === b.size && [...a].every((item) => b.has(item));
};

export function validateRunDir(dir: string): Result<RunBundle> {
  const values: Record<string, unknown> = {};
  const errors: ValidationError[] = [];
  for (const [file, kind] of files) {
    const result = readJson(join(dir, file));
    if (!result.ok) errors.push({path: file, message: result.errors[0].message});
    else values[kind] = result.data;
  }
  if (errors.length > 0) return {ok: false, errors};

  for (const [file, kind] of files) {
    const result = validateArtifact(kind, values[kind]);
    if (!result.ok) errors.push(...prefixed(file, result.errors));
  }
  if (errors.length > 0) return {ok: false, errors};

  const run = values.run as Run;
  const evidence = values.evidence as Evidence;
  const checks = values.checks as Checks;
  const findings = values.findings as Findings;
  const evidenceIds = new Set(evidence.items.map((item) => item.evidence_id));

  for (const [file, value] of [["evidence.json", evidence], ["checks.json", checks], ["findings.json", findings]] as const) {
    if (value.run_id !== run.run_id) errors.push({path: `${file}/run_id`, message: `run_id must match run.json/run_id "${run.run_id}"`});
  }

  checks.checks.forEach((check, checkIndex) => {
    check.evidence_ids.forEach((id, evidenceIndex) => {
      if (!evidenceIds.has(id)) errors.push({path: `checks.json/checks/${checkIndex}/evidence_ids/${evidenceIndex}`, message: `unknown evidence id "${id}"`});
    });
  });
  findings.findings.forEach((finding, findingIndex) => {
    finding.evidence_ids.forEach((id, evidenceIndex) => {
      if (!evidenceIds.has(id)) errors.push({path: `findings.json/findings/${findingIndex}/evidence_ids/${evidenceIndex}`, message: `unknown evidence id "${id}"`});
    });
  });

  let realDir: string;
  try {
    realDir = realpathSync(dir);
  } catch (error) {
    return {ok: false, errors: [{path: "run", message: error instanceof Error ? error.message : String(error)}]};
  }
  evidence.items.forEach((item, index) => {
    if (!item.file || !item.sha256) return;
    if (isAbsolute(item.file) || win32.isAbsolute(item.file) || item.file.includes("\\") || item.file.split("/").includes("..")) return;
    const candidate = join(dir, item.file);
    try {
      const realFile = realpathSync(candidate);
      const outside = relative(realDir, realFile).startsWith(`..${process.platform === "win32" ? "\\" : "/"}`) || isAbsolute(relative(realDir, realFile));
      if (outside) {
        errors.push({path: `evidence.json/items/${index}/file`, message: "artifact file resolves outside run directory"});
        return;
      }
      const actual = createHash("sha256").update(readFileSync(realFile)).digest("hex");
      if (actual.toLowerCase() !== item.sha256.toLowerCase()) errors.push({path: `evidence.json/items/${index}/sha256`, message: `sha256 mismatch: expected ${item.sha256}, got ${actual}`});
    } catch (error) {
      errors.push({path: `evidence.json/items/${index}/file`, message: `artifact file is missing or unreadable: ${error instanceof Error ? error.message : String(error)}`});
    }
  });

  const derived = deriveRunStatus(checks.checks, {blockers: run.blockers});
  if (run.status !== derived) errors.push({path: "run.json/status", message: `status must equal derived status "${derived}"`});
  const checkIds = checks.checks.map((check) => check.check_id);
  if (!sameSet(run.requested_checks, checkIds)) errors.push({path: "run.json/requested_checks", message: "requested_checks must match the set of check ids in checks.json"});

  return errors.length > 0 ? {ok: false, errors} : {ok: true, data: {run, evidence, checks, findings}};
}
