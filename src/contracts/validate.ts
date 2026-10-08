import { readFileSync } from "node:fs";
import { join } from "node:path";
import Ajv from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import type { ValidateFunction } from "ajv";

export type Kind = "project" | "checks";
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

const schema = (kind: Kind): object =>
  JSON.parse(readFileSync(join(import.meta.dirname, "../../schemas", `${kind}.schema.json`), "utf8")) as object;

const validators: Record<Kind, ValidateFunction> = {
  project: ajv.compile(schema("project")),
  checks: ajv.compile(schema("checks"))
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
    : checksSemanticErrors(input as Checks);
  return errors.length > 0 ? {ok: false, errors} : {ok: true, data: input};
}
