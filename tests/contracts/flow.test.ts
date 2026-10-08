import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { validateArtifact } from "../../src/contracts/validate.ts";

const flowFixture = async (name: string): Promise<unknown> =>
  JSON.parse(await readFile(new URL(`../fixtures/flow/${name}`, import.meta.url), "utf8"));

test("valid CSV import flow is accepted", async () => {
  const result = validateArtifact("flow", await flowFixture("valid-csv-import.json"));
  assert.deepEqual(result.ok ? [] : result.errors, []);
  assert.equal(result.ok, true);
});

const invalid: [string, string, string, RegExp][] = [
  ["rule 1: ids are unique across steps and states", "invalid-duplicate-id.json", "/states/0/state_id", /duplicate id "upload"/],
  ["rule 2: action leads_to names an existing step or state", "invalid-missing-target.json", "/steps/0/actions/0/leads_to", /unknown step or state "map-column"/],
  ["rule 2: state next names an existing step or state", "invalid-missing-next.json", "/states/0/next", /unknown step or state "nowhere"/],
  ["rule 2: state step_id names a step", "invalid-missing-state-step.json", "/states/0/step_id", /unknown step "nowhere"/],
  ["rule 3: terminal state names a state", "invalid-unknown-terminal.json", "/terminal_states/0/state_id", /unknown state "nowhere"/],
  ["rule 3: at least one success terminal state", "invalid-no-success-terminal.json", "/terminal_states", /success/],
  ["rule 4: error state needs a way out", "invalid-error-state-no-exit.json", "/states/3", /network_error.*available_actions or a non-null next/],
  ["rule 5: exactly one chosen option", "invalid-two-chosen-options.json", "/options_considered", /exactly one/],
  ["schema: ac_id pattern", "invalid-schema.json", "/acceptance_criteria/0/ac_id", /pattern/]
];

for (const [name, file, path, message] of invalid) {
  test(`invalid flow, ${name}`, async () => {
    const result = validateArtifact("flow", await flowFixture(file));
    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.ok(result.errors.some((error) => error.path === path && message.test(error.message)), JSON.stringify(result.errors));
  });
}

test("flow with an unsupported schema major is rejected", async () => {
  const flow = await flowFixture("valid-csv-import.json") as Record<string, unknown>;
  const result = validateArtifact("flow", {...flow, schema_version: "2.0"});
  assert.equal(result.ok, false);
});
