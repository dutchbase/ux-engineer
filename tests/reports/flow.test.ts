import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { renderFlow } from "../../src/reports/flow.ts";
import type { Flow } from "../../src/reports/flow.ts";

const flow = JSON.parse(readFileSync(fileURLToPath(new URL("../fixtures/flow/valid-csv-import.json", import.meta.url)), "utf8")) as Flow;

test("flow renderer starts with the generated header and follows the section order", () => {
  const markdown = renderFlow(flow);
  assert.ok(markdown.startsWith("Generated from csv-contact-import.json. Do not edit.\n"));
  const headings = ["## Goal", "## Personas", "## Entry points", "## Steps", "## States", "## Terminal states", "## Risks", "## Acceptance criteria", "## Options considered", "## Decisions", "## Assumptions", "## Open questions"];
  const positions = headings.map((heading) => markdown.indexOf(`\n${heading}\n`));
  assert.ok(positions.every((position) => position > 0), JSON.stringify(positions));
  assert.deepEqual([...positions].sort((a, b) => a - b), positions);
  assert.match(markdown, /- Given: .*\n- When: .*\n- Then: .*/);
  assert.match(markdown, /WCAG 2\.2 SC 3\.3\.1/);
});

test("flow renderer is deterministic and escapes pipes in tables", () => {
  const copy = structuredClone(flow);
  copy.states[0].trigger = "a | b";
  const markdown = renderFlow(copy);
  assert.match(markdown, /a \\\| b/);
  assert.equal(markdown, renderFlow(copy));
});
