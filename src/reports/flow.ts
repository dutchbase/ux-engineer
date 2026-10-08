export type Copy = {key: string; text: string};
export type Flow = {
  schema_version: string;
  flow_id: string;
  name: string;
  product_id: string;
  persona_ids: string[];
  goal: string;
  scope: "light" | "targeted" | "standard" | "deep";
  design_system_ref: string | null;
  entry_points: {from: string; context: string}[];
  prerequisites: string[];
  steps: {
    step_id: string; title: string; user_intent: string; screen: string; information_needed: string[];
    actions: {action_id: string; label: string; kind: "primary" | "secondary" | "destructive" | "navigation"; leads_to: string}[];
    copy: Copy[];
  }[];
  states: {
    state_id: string; step_id: string | null; kind: string; trigger: string; visible_feedback: string;
    available_actions: string[]; next: string | null; copy: Copy[];
  }[];
  terminal_states: {state_id: string; outcome: "success" | "failure" | "abandoned"; observable_result: string}[];
  risks: {risk_id: string; description: string; mitigation: string}[];
  acceptance_criteria: {ac_id: string; given: string; when: string; then: string; verify_with: string; wcag_refs: string[]}[];
  options_considered: {option: string; tradeoffs: string; chosen: boolean}[];
  decisions: {decision_id: string; date: string; decision: string; reason: string; source: string}[];
  assumptions: {text: string; validation: string}[];
  open_questions: string[];
};

// Table cells: escape pipes and flatten newlines. Other text goes in as written.
const cell = (value: string | null): string => (value === null || value === "" ? "—" : value).replaceAll("|", "\\|").replaceAll("\n", " ");
const list = (values: string[]): string => values.length === 0 ? "- None" : values.map((value) => `- ${value}`).join("\n");
const row = (...values: (string | null)[]): string => `| ${values.map(cell).join(" | ")} |`;
const table = (header: string[], rows: string[]): string =>
  rows.length === 0 ? "None" : [row(...header), row(...header.map(() => "---")), ...rows].join("\n");
const copyList = (copy: Copy[]): string => copy.length === 0 ? "" : `\n  - Copy:\n${copy.map((item) => `    - \`${item.key}\`: ${item.text}`).join("\n")}`;

export function renderFlow(flow: Flow): string {
  const steps = flow.steps.map((step) => [
    `### ${step.title} (\`${step.step_id}\`)`,
    `- Screen: ${step.screen}`,
    `- User intent: ${step.user_intent}`,
    `- Information needed: ${step.information_needed.length === 0 ? "None" : step.information_needed.join("; ")}`,
    `- Actions:${step.actions.length === 0 ? " None" : "\n" + step.actions.map((action) => `  - ${action.label} (${action.kind}) → \`${action.leads_to}\``).join("\n")}`
      + copyList(step.copy)
  ].join("\n"));

  const stateCopy = flow.states.filter((state) => state.copy.length > 0)
    .map((state) => `- \`${state.state_id}\`\n${state.copy.map((item) => `  - \`${item.key}\`: ${item.text}`).join("\n")}`);

  const sections = [
    `Generated from ${flow.flow_id}.json. Do not edit.`,
    `# ${flow.name}`,
    `Flow: \`${flow.flow_id}\` · Product: \`${flow.product_id}\` · Scope: ${flow.scope} · Design system: ${flow.design_system_ref ?? "none"}`,
    `## Goal\n\n${flow.goal}`,
    `## Personas\n\n${list(flow.persona_ids.map((id) => `\`${id}\``))}\n\nPrerequisites:\n\n${list(flow.prerequisites)}`,
    `## Entry points\n\n${table(["From", "Context"], flow.entry_points.map((entry) => row(entry.from, entry.context)))}`,
    `## Steps\n\n${steps.length === 0 ? "None" : steps.join("\n\n")}`,
    `## States\n\n${table(["State", "Step", "Kind", "Trigger", "Visible feedback", "Available actions", "Next"],
      flow.states.map((state) => row(state.state_id, state.step_id, state.kind, state.trigger, state.visible_feedback, state.available_actions.join("; "), state.next)))}`
      + (stateCopy.length > 0 ? `\n\nState copy:\n\n${stateCopy.join("\n")}` : ""),
    `## Terminal states\n\n${table(["State", "Outcome", "Observable result"], flow.terminal_states.map((t) => row(t.state_id, t.outcome, t.observable_result)))}`,
    `## Risks\n\n${table(["Risk", "Description", "Mitigation"], flow.risks.map((r) => row(r.risk_id, r.description, r.mitigation)))}`,
    `## Acceptance criteria\n\n${flow.acceptance_criteria.length === 0 ? "None" : flow.acceptance_criteria.map((ac) => [
      `### ${ac.ac_id}`, `- Given: ${ac.given}`, `- When: ${ac.when}`, `- Then: ${ac.then}`,
      `- Verify with: ${ac.verify_with}`, `- WCAG: ${ac.wcag_refs.length === 0 ? "—" : ac.wcag_refs.join("; ")}`
    ].join("\n")).join("\n\n")}`,
    `## Options considered\n\n${table(["Option", "Trade-offs", "Chosen"], flow.options_considered.map((o) => row(o.option, o.tradeoffs, o.chosen ? "yes" : "no")))}`,
    `## Decisions\n\n${table(["Decision", "Date", "What", "Reason", "Source"], flow.decisions.map((d) => row(d.decision_id, d.date, d.decision, d.reason, d.source)))}`,
    `## Assumptions\n\n${table(["Assumption", "How to validate"], flow.assumptions.map((a) => row(a.text, a.validation)))}`,
    `## Open questions\n\n${list(flow.open_questions)}`
  ];
  return sections.join("\n\n") + "\n";
}
