---
name: ux-plan
description: Turn a feature request into a scoped UX flow plan. Use for "plan <feature>", "design the flow for", or "how should <feature> work". Also use for a small styling or layout change, which gets a short chat answer with a side-effect check and no files. Do not use for application implementation or an audit.
license: MIT
---

# UX plan

Turn the request into the smallest useful UX decision. Write user-facing text
in ASD-STE100. Read `references/writing.md` before writing the result.

## Route the request

Read `docs/ux/project.json` when it exists. Use its personas, jobs, flows,
tone, `product_locale`, accessibility target, viewports, and design system.
Do not ask again for facts that the file answers. If the file is missing,
offer `ux-setup` first. If the user continues, record missing facts as
assumptions in the flow and state that the project UX file was missing.

Choose one profile:

- **Light:** one small change. Answer in chat only, in about 100 words or
  less. Consider the affected viewports from `project.json`, tap targets,
  contrast, copy consistency, and design-system tokens, but mention only the
  checks that change the advice. Skip the checks that do not apply. Write no
  files and do not invoke `ux-flow-design`. The one exception: if the user insists on an AI
  tell, log the `ai_tell_override` decision in `project.json`.
- **Targeted:** one component or one clear problem. Run `ux-flow-design` with
  only the relevant references and checks.
- **Standard:** one main task with its main alternatives, risks, and relevant
  states. Run `ux-flow-design`.
- **Deep:** several roles, a larger journey, research, and wider coverage.
  State what stays out of scope before the work starts, then run
  `ux-flow-design`.

Keep a small or clear task to one direction. Offer 2 or 3 functionally
different options only for a real choice. Record their trade-offs and exactly
one chosen option in `options_considered`.

## Apply shared rules

For targeted, standard, and deep work, invoke `ux-flow-design`. It must:

- name the persona, task, context, and observable outcome;
- separate facts from hypotheses and validate assumptions;
- respect the project's tone, `product_locale`, accessibility target, and
  design system;
- cover relevant steps, states, recovery, forms, IA labels, and product copy;
- express accessibility as acceptance criteria with WCAG 2.2 references;
- check every proposed screen and copy choice against `references/ai-tells.md`.

Never propose a blocked AI tell. If the user asks for one, warn once in one
short sentence. If the user insists, allow it and add a `decisions[]` entry
with `kind: "ai_tell_override"` and `decided_by: "user"`. Patterns from the
user's own design system are not tells.

The plugin never edits application code, styles, product content, or product
config. The implementing agent receives the acceptance criteria and the files
written. Product copy stays in the product locale. Reports and chat stay in
the requested language.

## Finish

For a light request, give the one recommendation and the side effects that
matter, as a few short bullets. Confirm in one line that no files were
written. Do not add headings.

For other profiles, report:

- the selected profile and the scope;
- the flow file and generated view written by `ux-flow-design`;
- the `project.json` flow index and decisions updated;
- the acceptance criteria for the implementing agent;
- assumptions, open questions, and checks that did not run.

Keep the final message short. Do not claim machine validation if Node was not
available. Do not claim browser or user evidence without running that check.
