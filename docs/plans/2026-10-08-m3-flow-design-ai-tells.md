# Milestone 3: flow design (`ux-plan`) and the AI-tells blocklist — implementation plan

> **For agentic workers:** tasks are delegated to implementation lanes with self-contained specs. Steps use `- [ ]` checkboxes.

**Goal:** `ux-plan` turns a feature request into a validated flow contract (`docs/ux/flows/<flow-id>.json` plus a generated Markdown view) with states, recovery paths, UX copy and testable acceptance criteria, inside the user's design system and free of known AI-design tells. A researched AI-tells blocklist is shared by `ux-plan` and `ux-audit`.

**Architecture:** one new schema (`flow`) with semantic graph checks, a flow renderer and a `render-flow` CLI command in the bundled `ux.mjs`. Two new skills: `ux-flow-design` (the method) and `ux-plan` (thin entry with scope profiles). Shared references for forms, information architecture, content design and AI tells.

**Tech stack:** as before (Node ≥ 24 repo, bundled `ux.mjs` for Node ≥ 18, Ajv, esbuild, node:test).

**Spec:** [`docs/design.md`](../design.md) — §4.2, §4.3, §5.3, §5.7, §6, WP05, WP07.

## Global constraints

- The plugin never edits application code. `ux-plan` writes only under `docs/ux/` (flow files, the flows index and decision log in `project.json`).
- Flows respect the project UX file: personas, tone, product locale, accessibility target, viewports, design system. Product copy follows the product locale, not the report language.
- AI tells are blocked by default. The plugin never proposes one. If the user explicitly insists after one short warning, it is allowed and logged in `project.json` `decisions` with `kind: "ai_tell_override"`.
- Several design options only when there is a real choice; a small change gets a small answer (light profile: no flow file).
- No invented user evidence; assumptions are labeled with a way to validate them.
- Messages to the user follow `references/writing.md` (ASD-STE100).

## Review focus

1. A transition pointing to a missing step or state → validation error (Task B test).
2. A flow without a success terminal state → validation error (Task B test).
3. An error state (`network_error`, `invalid_input`, `session_expired`, `conflict`) with no way out → validation error (Task B test).
4. User insists on a blocked AI tell → allowed once warned, logged as `ai_tell_override` (Task C skill text, Task E eval).
5. A tiny styling request → light answer, no flow file (Task C skill text, Task E eval).

---

## Task A: AI-tells research and blocklist — research agent

**File:** `shared/references/ai-tells.md`.

- Research current writing (2024–2026) on recognizable patterns in AI-generated UI and web design: design critiques, designer community posts, articles about "AI slop" UI, and existing skills that list such patterns (e.g. Impeccable's anti-patterns). Cite every source with URL.
- 15–30 entries. Each: `id` (kebab), name, what it looks like, why it hurts users or trust, what to do instead, sources. Group by layout, typography, color and effects, components, copy.
- Include eyebrow labels above headings (named by the project owner), plus only patterns that more than one source names or that clearly harm usability.
- Top section: how to use the list (never propose; flag in audits as `advisory` or higher only when it hurts the task; override rule: warn once, allow on insistence, log `ai_tell_override`).
- License: write original text; do not copy text from sources.

## Task B: flow contract, validation, renderer — lane: Luna, `high`

**Files:** `schemas/flow.schema.json`, `src/contracts/validate.ts` (add kind `flow` + semantic rules), `src/reports/flow.ts`, `src/cli.ts` (add `render-flow`), tests in `tests/contracts/` and `tests/reports/`, fixtures in `tests/fixtures/flow/`.

**flow.json** (all objects `additionalProperties: false`):

- `schema_version` `"1.0"`, `flow_id` (kebab), `name`, `product_id`, `persona_ids[]` (min 1), `goal`, `scope` (`light|targeted|standard|deep`), `design_system_ref` (string|null).
- `entry_points[]` {`from`, `context`}; `prerequisites[]` (strings).
- `steps[]` (min 1) {`step_id`, `title`, `user_intent`, `screen`, `information_needed[]`, `actions[]` {`action_id`, `label`, `kind` (`primary|secondary|destructive|navigation`), `leads_to`}, `copy[]` {`key`, `text`}}.
- `states[]` {`state_id`, `step_id`|null, `kind` (`first_use|empty|loading|long_running|invalid_input|partial_result|unauthorized|session_expired|network_error|conflict|double_action|back|cancel|resume|recovery|success|other`), `trigger`, `visible_feedback`, `available_actions[]` (strings), `next`|null, `copy[]` {`key`, `text`}}.
- `terminal_states[]` {`state_id`, `outcome` (`success|failure|abandoned`), `observable_result`}.
- `risks[]` {`risk_id`, `description`, `mitigation`}.
- `acceptance_criteria[]` (min 1) {`ac_id` (`^AC-[A-Z0-9-]+$`), `given`, `when`, `then`, `verify_with` (`browser|unit|manual|analytics`), `wcag_refs[]`}.
- `options_considered[]` {`option`, `tradeoffs`, `chosen` (bool)}.
- `decisions[]` {`decision_id`, `date`, `decision`, `reason`, `source`}.
- `assumptions[]` {`text`, `validation`}; `open_questions[]`.

**Semantic rules:**
1. `step_id` and `state_id` values are unique together; `action_id`, `ac_id`, `risk_id` unique.
2. Every `actions[].leads_to` and every non-null `states[].next` names an existing step or state; every non-null `states[].step_id` names a step.
3. Every `terminal_states[].state_id` names a state; at least one terminal state has `outcome: "success"`.
4. Every state of kind `network_error`, `invalid_input`, `session_expired` or `conflict` has a non-empty `available_actions` or a non-null `next`.
5. If `options_considered` is non-empty, exactly one is `chosen: true`.

**Renderer:** `renderFlow(flow): string` → Markdown starting `Generated from <flow_id>.json. Do not edit.`, then goal, personas, entry points, steps (with actions and copy), states table, terminal states, risks, acceptance criteria (Given/When/Then), options, decisions, assumptions, open questions. Deterministic, escapes pipes in tables.

**CLI:** `validate flow <file>` (via existing command); `render-flow <flow.json>` validates and writes `<same dir>/<flow_id>.md`; exit 0/1/2 as other commands.

**Tests:** valid fixture (CSV import flow); one invalid fixture per rule; renderer header and section order; CLI render-flow writes nothing for an invalid flow.

## Task C: `ux-flow-design` and `ux-plan` skills, shared references — lane: Luna, `high`

**Files:** `skills/ux-flow-design/SKILL.md`, `skills/ux-plan/SKILL.md`, `shared/references/forms.md`, `shared/references/information-architecture.md`, `shared/references/content-design.md`.

- `ux-flow-design`: the design path of design §4.3 and the rules of §5.3: read `docs/ux/project.json`; name persona, task, context and observable outcome; separate facts and hypotheses; options only for a real choice; work out steps, states (conditional coverage list), forms, recovery, UX copy (tone + product locale), IA labels, accessibility as acceptance criteria with WCAG 2.2 refs; check the design system and `references/ai-tells.md`; write `docs/ux/flows/<flow-id>.json`; validate and render with `node <skill>/scripts/ux.mjs validate flow …` and `render-flow …`; add/update the flow in `project.json` `flows[]` (with `file: "flows/<flow-id>.json"`) and log decisions; validate `project.json`; hand off to the implementing agent with the acceptance criteria. Never edits app code.
- `ux-plan`: user-invocable entry. Pick the scope profile (light / targeted / standard / deep, design §4.2). Light: answer in chat with a quick side-effect check (breakpoints, tap targets, contrast, copy consistency, tokens), no files. Otherwise: if `docs/ux/project.json` is missing, offer `ux-setup` first or continue with labeled assumptions; then run `ux-flow-design`. AI-tell override flow: warn once in one sentence; if the user insists, allow and log `ai_tell_override` in `project.json` decisions.
- References (short, practical, original text): `forms.md` (labels, required fields, inline validation timing, error messages naming problem and fix, keep input on error, prevent double submit, confirm risky actions), `information-architecture.md` (labels from user vocabulary, grouping, findability, navigation depth by task, card sorting/tree testing for validation), `content-design.md` (plain language, front-load, buttons say what happens, error and empty-state patterns, consistency with tone rules, locale-aware formats).

## Task D: sync, docs — lane: Luna, `medium` (after A–C)

- Sync map: `ux-flow-design` ← writing, forms, information-architecture, content-design, ai-tells, flow schema, project schema → `references/`; `ux.mjs` → `scripts/`. `ux-plan` ← writing, ai-tells → `references/`. `ux-audit` ← add ai-tells.
- `shared/references/audit-method.md`: replace "AI tells are out of scope" with: flag AI tells from `references/ai-tells.md` when they hurt the task or trust; otherwise at most `advisory`.

## Task E: evals and release — architect

- [ ] `plan-csv-import` (plugin eval): scaffold a project with `docs/ux/project.json`; prompt `/ux-engineer:ux-plan` the CSV import; graders: flow file exists, has network-error recovery and a success terminal state, observable acceptance criteria, no app files changed.
- [ ] `plan-ai-tell-override` (plugin eval): the user insists on eyebrow labels; graders: allowed and a decision with `ai_tell_override` logged.
- [ ] `plan-light` (plugin eval): "make the save button 2px taller"; graders: no files under `docs/ux/flows/`.
- [ ] Update README, limitations, compatibility, version 0.3.0. Final review, merge, CI.
