---
name: ux-flow-design
description: Design the states, errors, recovery paths, forms, IA labels, and copy of a user flow. Use when ux-plan invokes it or when the user asks to design a flow's states, errors, or copy. Do not use for application implementation, a pure styling tweak, or an audit of an existing interface.
license: MIT
---

# UX flow design

Design a flow from task completion to an observable result. Write user-facing
messages in ASD-STE100. Read `references/writing.md` before writing them.

## Prepare

1. Read the target project's `docs/ux/project.json`.
2. Read supplied research and the design-system source named there.
3. Read the references that apply: `references/forms.md`,
   `references/information-architecture.md`, `references/content-design.md`,
   and `references/ai-tells.md`.
4. Name the persona, task, context, and observable outcome.
5. Separate facts from hypotheses. Give every assumption a validation method.

If `docs/ux/project.json` is missing, offer `ux-setup` first. If the user
chooses to continue, record the missing facts in `assumptions` and state the
limitation. Do not invent user evidence.

Read the project's tone, `product_locale`, accessibility target, viewports,
and design system. Follow the product locale for product copy. Do not rewrite
the design system.

## Design

1. Identify entry points, prerequisites, information needed, decision points,
   the chosen route, alternatives, and end states.
2. Use one direction when the task is small or clear. Offer 2 or 3 options
   only for a real functional choice. Give each option trade-offs and mark
   exactly one chosen option.
3. Define each step's user intent, screen, information needed, actions, and
   copy. Make action labels describe the result.
4. Add only state kinds that apply. Use `step_id` to link a state to its
   owning step when applicable. Define its trigger, visible feedback, available
   actions, next state, and copy.

Conditional state coverage list:

- `first_use` when the user has no prior setup.
- `empty` when the expected collection or result has no items.
- `loading` when a request takes time but has no meaningful progress.
- `long_running` when processing continues long enough to need progress or exit.
- `invalid_input` when input fails a rule.
- `partial_result` when only part of the requested result is available.
- `unauthorized` when the user lacks permission.
- `session_expired` when the session no longer permits the action.
- `network_error` when a network request fails.
- `conflict` when another change makes the action stale.
- `double_action` when a repeated action can duplicate or repeat work.
- `back` when going back needs a defined result.
- `cancel` when the user can stop the task.
- `resume` when interrupted work can continue.
- `recovery` when the user needs a repair or retry route.
- `success` when the flow reaches its successful outcome.
- `other` only when the state does not fit another kind.

Use `forms.md` for labels, validation, input retention, duplicate submits, and
risky actions. Use `information-architecture.md` for labels, grouping, and
findability. Use `content-design.md` for copy. Express accessibility as
observable acceptance criteria with WCAG 2.2 references at the project target.

Check every proposed screen and copy choice against `references/ai-tells.md`.
Never propose a blocked AI tell. If the user asks for one, warn once in one
short sentence. If the user insists, allow it and log a project decision with
`kind: "ai_tell_override"` and `decided_by: "user"`. A pattern in the user's
design system is not an AI tell.

## Write the flow

Write the canonical file at
`docs/ux/flows/<flow-id>.json`. Use only the fields of `references/flow.schema.json`:

- Top level: `schema_version`, `flow_id`, `name`, `product_id`, `persona_ids`,
  `goal`, `scope`, `design_system_ref`, `entry_points`, `prerequisites`,
  `steps`, `states`, `terminal_states`, `risks`, `acceptance_criteria`,
  `options_considered`, `decisions`, `assumptions`, `open_questions`.
- Step fields: `step_id`, `title`, `user_intent`, `screen`,
  `information_needed`, `actions`, `copy`.
- Action fields: `action_id`, `label`, `kind`, `leads_to`.
- State fields: `state_id`, `step_id`, `kind`, `trigger`, `visible_feedback`,
  `available_actions`, `next`, `copy`.
- Copy fields: `key`, `text`.
- Terminal fields: `state_id`, `outcome`, `observable_result`.
- Risk fields: `risk_id`, `description`, `mitigation`.
- Acceptance fields: `ac_id`, `given`, `when`, `then`, `verify_with`,
  `wcag_refs`.
- Option fields: `option`, `tradeoffs`, `chosen`.
- Decision fields: `decision_id`, `date`, `decision`, `reason`, `source`.
- Assumption fields: `text`, `validation`.

Use these exact enums and shapes from `references/flow.schema.json`. Keep all identifiers unique. Write every id in kebab-case (for example `map-columns`), except acceptance criteria ids, which use `AC-` plus capitals (for example `AC-RETRY-01`).
Keep every object closed; do not add fields.
Make transitions point to existing steps or states. Include a success terminal
state. Give error states a way out. If options exist, choose exactly one.

Set `schema_version` to `"1.0"`. Use a kebab-case `flow_id`. Include at least
one item in each of `persona_ids`, `steps`, and `acceptance_criteria`.

Use these exact values: `scope` is `light|targeted|standard|deep`;
`design_system_ref` is a string or `null`; action `kind` is
`primary|secondary|destructive|navigation`; terminal `outcome` is
`success|failure|abandoned`; `ac_id` matches `^AC-[A-Z0-9-]+$`; and
`verify_with` is `browser|unit|manual|analytics`. State `step_id` and `next`
may be `null` where the schema permits it.

Update `docs/ux/project.json` in the target project:

- Add or update `flows[]` with `{flow_id, name, persona_ids, file}` and set
  `file` to `"flows/<flow-id>.json"`.
- Add each decision to `decisions[]` with
  `{decision_id, date, decision, reason, source, decided_by, kind}`.
- Use `decided_by: user|agent` and `kind: general|ai_tell_override`.
- Preserve existing entries. Do not write a second editable truth.

## Validate and hand off

Run these commands from the target project. Replace `<skill>` with the
absolute path to this skill folder:

```text
node <skill>/scripts/ux.mjs validate flow docs/ux/flows/<flow-id>.json
node <skill>/scripts/ux.mjs render-flow docs/ux/flows/<flow-id>.json
node <skill>/scripts/ux.mjs validate project docs/ux/project.json
```

If Node is unavailable, check the files against `references/*.schema.json` and
the rules below. Tell the user that machine validation did not run.

Self-check the flow:

1. `step_id` and `state_id` values are unique together. `action_id`, `ac_id`,
   and `risk_id` are unique.
2. Every `leads_to` and non-null `next` names an existing step or state. Every
   non-null `step_id` names a step.
3. Every terminal `state_id` names a state. At least one terminal state has
   `outcome: "success"`.
4. Every `network_error`, `invalid_input`, `session_expired`, or `conflict`
   state has an available action or a non-null `next`.
5. A non-empty `options_considered` has exactly one `chosen: true`.

Hand the implementing agent the acceptance criteria and the files written.
Never edit application code, styles, product content, or product config.
