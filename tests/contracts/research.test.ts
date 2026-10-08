import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { validateArtifact } from "../../src/contracts/validate.ts";

const researchFixture = async (name: string): Promise<unknown> =>
  JSON.parse(await readFile(new URL(`../fixtures/research/${name}`, import.meta.url), "utf8"));

for (const file of ["valid-synthesis.json", "valid-plan-only.json"]) {
  test(`valid research ${file} is accepted`, async () => {
    const result = validateArtifact("research", await researchFixture(file));
    assert.deepEqual(result.ok ? [] : result.errors, []);
    assert.equal(result.ok, true);
  });
}

const invalid: [string, string, string, RegExp][] = [
  ["rule 1: observation source_id names a source", "invalid-unknown-source.json", "/observations/0/source_ids/0", /unknown source "S-NOPE"/],
  ["rule 1: counterevidence source_id names a source", "invalid-unknown-counter-source.json", "/counterevidence/0/source_ids/0", /unknown source "S-NOPE"/],
  ["rule 2: interpretation observation_id names an observation", "invalid-unknown-observation.json", "/interpretations/0/observation_ids/1", /unknown observation "O-NOPE"/],
  ["rule 3: people_count above distinct participants", "invalid-people-count.json", "/interpretations/0/people_count", /3.*2 distinct/],
  ["rule 3: one participant with many tickets counts once", "invalid-one-participant-many-tickets.json", "/interpretations/0/people_count", /2.*1 distinct/],
  ["rule 4: web-only interpretation cannot be supported", "invalid-web-supported.json", "/interpretations/1/status", /web.*hypothesis/],
  ["rule 5: plan route forbids observations", "invalid-plan-with-observations.json", "/observations", /plan.*empty/],
  ["rule 5: plan route requires a plan", "invalid-plan-null.json", "/plan", /plan.*non-null/],
  ["rule 6: duplicate source id", "invalid-duplicate-source.json", "/source_inventory/1/source_id", /duplicate id "S-INT-1"/],
  ["rule 6: duplicate observation id", "invalid-duplicate-observation.json", "/observations/1/observation_id", /duplicate id "O-1"/],
  ["rule 6: duplicate interpretation id", "invalid-duplicate-interpretation.json", "/interpretations/1/interpretation_id", /duplicate id "I-1"/],
  ["schema: source_id pattern", "invalid-schema.json", "/source_inventory/0/source_id", /pattern/]
];

for (const [name, file, path, message] of invalid) {
  test(`invalid research, ${name}`, async () => {
    const result = validateArtifact("research", await researchFixture(file));
    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.ok(result.errors.some((error) => error.path === path && message.test(error.message)), JSON.stringify(result.errors));
  });
}

test("research with an unsupported schema major is rejected", async () => {
  const research = await researchFixture("valid-synthesis.json") as Record<string, unknown>;
  assert.equal(validateArtifact("research", {...research, schema_version: "2.0"}).ok, false);
});
