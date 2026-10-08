export type CheckResult = "pass" | "fail" | "not_run" | "not_applicable";

export type Check = {
  check_id: string;
  required: boolean;
  result: CheckResult;
  not_applicable_reason?: string;
  actual_result?: string;
  evidence_ids: string[];
};

export type RunStatus = "passed" | "needs_work" | "incomplete" | "blocked";

export function deriveRunStatus(checks: Check[], ctx: { blockers: string[] }): RunStatus {
  if (ctx.blockers.length > 0) return "blocked";

  const required = checks.filter((check) => check.required && check.result !== "not_applicable");
  if (required.length === 0) return "incomplete";
  if (required.some((check) => check.result === "not_run" || check.evidence_ids.length === 0)) return "incomplete";
  if (required.some((check) => check.result === "fail")) return "needs_work";
  return "passed";
}
