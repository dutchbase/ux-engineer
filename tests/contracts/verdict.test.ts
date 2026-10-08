import assert from "node:assert/strict";
import { test } from "node:test";
import { deriveRunStatus, type Check } from "../../src/contracts/verdict.ts";

const check = (overrides: Partial<Check> = {}): Check => ({
  check_id: "check",
  required: true,
  result: "pass",
  evidence_ids: ["evidence-1"],
  ...overrides
});

test("blockers make a run blocked", () => {
  assert.equal(deriveRunStatus([check()], { blockers: ["missing browser"] }), "blocked");
});

test("required not_run makes a run incomplete", () => {
  assert.equal(deriveRunStatus([check({ result: "not_run" })], { blockers: [] }), "incomplete");
});

test("required pass without evidence makes a run incomplete", () => {
  assert.equal(deriveRunStatus([check({ evidence_ids: [] })], { blockers: [] }), "incomplete");
});

test("required failure with evidence needs work", () => {
  assert.equal(deriveRunStatus([check({ result: "fail" })], { blockers: [] }), "needs_work");
});

test("only optional checks makes a run incomplete", () => {
  assert.equal(deriveRunStatus([check({ required: false })], { blockers: [] }), "incomplete");
});

test("required passes and required not_applicable with reason pass", () => {
  assert.equal(
    deriveRunStatus([
      check(),
      check({ check_id: "mobile", result: "not_applicable", not_applicable_reason: "Desktop-only flow" })
    ], { blockers: [] }),
    "passed"
  );
});

test("optional failure does not change a passed run", () => {
  assert.equal(
    deriveRunStatus([check(), check({ required: false, result: "fail" })], { blockers: [] }),
    "passed"
  );
});
