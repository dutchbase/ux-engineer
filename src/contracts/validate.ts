import Ajv from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import type { ValidateFunction } from "ajv";
import projectSchema from "../../schemas/project.schema.json" with { type: "json" };
import checksSchema from "../../schemas/checks.schema.json" with { type: "json" };
import runSchema from "../../schemas/run.schema.json" with { type: "json" };
import evidenceSchema from "../../schemas/evidence.schema.json" with { type: "json" };
import findingsSchema from "../../schemas/findings.schema.json" with { type: "json" };
import type { Evidence, Findings, Run } from "./run.ts";

export type Kind = "project" | "checks" | "run" | "evidence" | "findings";
export type ValidationError = { path: string; message: string };
export type Result<T> = { ok: true; data: T } | { ok: false; errors: ValidationError[] };

type Source = {
  attribute: "summary" | "goals" | "context" | "knowledge" | "devices" | "frustrations";
  kind: "interview" | "web_research" | "user_data" | "assumed";
  ref: string | null;
  validation: string | null;
};

type Persona = {
  persona_id: string;
  proto: boolean;
  summary: string;
  goals: string[];
  context: string;
  knowledge: string;
  devices: string[];
  frustrations: string[];
  sources: Source[];
};

type Project = {
  personas: Persona[];
  jobs: { persona_ids: string[] }[];
  flows: { persona_ids: string[] }[];
  design_system: { kind: string; path: string | null };
};

type Checks = {
  checks: { result: string; not_applicable_reason?: string }[];
};

type AjvInstance = { compile(schema: object): ValidateFunction };
type AjvConstructor = new (options: { allErrors: boolean }) => AjvInstance;

const ajv = new (Ajv as unknown as AjvConstructor)({ allErrors: true });
(addFormats as unknown as (instance: AjvInstance) => void)(ajv);

const validators: Record<Kind, ValidateFunction> = {
  project: ajv.compile(projectSchema),
  checks: ajv.compile(checksSchema),
  run: ajv.compile(runSchema),
  evidence: ajv.compile(evidenceSchema),
  findings: ajv.compile(findingsSchema)
};

const jsonPath = (path: string): string => path || "/";

const schemaErrors = (validator: ValidateFunction): ValidationError[] =>
  (validator.errors ?? []).map((error) => ({
    path: jsonPath(error.instancePath),
    message: error.message ?? "schema validation failed"
  }));

const isNonEmpty = (value: string | string[]): boolean =>
  Array.isArray(value) ? value.length > 0 : value.trim().length > 0;

function projectSemanticErrors(project: Project): ValidationError[] {
  const errors: ValidationError[] = [];
  const attributes = ["summary", "goals", "context", "knowledge", "devices", "frustrations"] as const;
  const personaIds = new Set(project.personas.map((persona) => persona.persona_id));

  project.personas.forEach((persona, personaIndex) => {
    for (const attribute of attributes) {
      if (isNonEmpty(persona[attribute]) && !persona.sources.some((source) => source.attribute === attribute)) {
        errors.push({
          path: `/personas/${personaIndex}/sources`,
          message: `non-empty persona attribute "${attribute}" requires a source`
        });
      }
    }

    persona.sources.forEach((source, sourceIndex) => {
      if (source.kind === "assumed" && (!source.validation || source.validation.trim() === "")) {
        errors.push({
          path: `/personas/${personaIndex}/sources/${sourceIndex}/validation`,
          message: "assumed source requires a non-empty validation"
        });
      }
    });

    if (!persona.proto && !persona.sources.some((source) => source.kind === "user_data")) {
      errors.push({
        path: `/personas/${personaIndex}/sources`,
        message: "non-proto persona requires a user_data source"
      });
    }
  });

  const checkPersonaReferences = (items: { persona_ids: string[] }[], kind: "jobs" | "flows") => {
    items.forEach((item, itemIndex) => {
      item.persona_ids.forEach((personaId, personaIdIndex) => {
        if (!personaIds.has(personaId)) {
          errors.push({
            path: `/${kind}/${itemIndex}/persona_ids/${personaIdIndex}`,
            message: `unknown persona_id "${personaId}"`
          });
        }
      });
    });
  };

  checkPersonaReferences(project.jobs, "jobs");
  checkPersonaReferences(project.flows, "flows");

  if (project.design_system.kind === "none" && project.design_system.path !== null) {
    errors.push({path: "/design_system/path", message: "design_system kind none requires path to be null"});
  }
  if (project.design_system.kind !== "none" && project.design_system.path === null) {
    errors.push({path: "/design_system/path", message: "design_system kind requires a non-null path"});
  }

  return errors;
}

function checksSemanticErrors(checks: Checks): ValidationError[] {
  return checks.checks.flatMap((check, index) =>
    check.result === "not_applicable" && (!check.not_applicable_reason || check.not_applicable_reason.trim() === "")
      ? [{path: `/checks/${index}/not_applicable_reason`, message: "not_applicable requires a non-empty reason"}]
      : []
  );
}

function evidenceSemanticErrors(evidence: Evidence): ValidationError[] {
  const errors: ValidationError[] = [];
  evidence.items.forEach((item, index) => {
    if ((item.file === null) !== (item.sha256 === null)) {
      errors.push({path: `/items/${index}/file`, message: "file and sha256 must both be null or both be set"});
    }
    if (item.file !== null && (
      item.file.startsWith("/") || /^[A-Za-z]:[\\/]/.test(item.file) ||
      item.file.includes("\\") || item.file.split("/").includes("..") ||
      !item.file.startsWith("artifacts/") || item.file === "artifacts/"
    )) {
      errors.push({path: `/items/${index}/file`, message: "file must be a relative path under artifacts/ without .. or backslashes"});
    }
  });
  return errors;
}

function findingsSemanticErrors(findings: Findings): ValidationError[] {
  const errors: ValidationError[] = [];
  findings.findings.forEach((finding, index) => {
    if (finding.status === "confirmed" && !["observed", "measured", "code_supported", "user_reported"].includes(finding.basis)) {
      errors.push({path: `/findings/${index}/basis`, message: "confirmed finding requires observed, measured, code_supported, or user_reported basis"});
    }
    if (finding.status === "confirmed" && finding.evidence_ids.length === 0) {
      errors.push({path: `/findings/${index}/evidence_ids`, message: "confirmed finding requires at least one evidence id"});
    }
    if (finding.basis === "observed" && finding.evidence_ids.length === 0) {
      errors.push({path: `/findings/${index}/evidence_ids`, message: "observed finding requires at least one evidence id"});
    }
    if (finding.severity === "advisory" && finding.status === "confirmed") {
      errors.push({path: `/findings/${index}/status`, message: "advisory finding cannot be confirmed"});
    }
  });
  return errors;
}

export function validateArtifact(kind: Kind, input: unknown): Result<unknown> {
  if (
    typeof input === "object" &&
    input !== null &&
    typeof (input as { schema_version?: unknown }).schema_version === "string" &&
    !(input as { schema_version: string }).schema_version.startsWith("1.")
  ) {
    return {ok: false, errors: [{path: "/schema_version", message: "unsupported schema major"}]};
  }

  const validator = validators[kind];
  if (!validator(input)) return {ok: false, errors: schemaErrors(validator)};

  const errors = kind === "project"
    ? projectSemanticErrors(input as Project)
    : kind === "checks"
      ? checksSemanticErrors(input as Checks)
      : kind === "evidence"
        ? evidenceSemanticErrors(input as Evidence)
        : kind === "findings"
          ? findingsSemanticErrors(input as Findings)
          : [];
  return errors.length > 0 ? {ok: false, errors} : {ok: true, data: input};
}
