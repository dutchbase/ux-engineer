---
name: ux-setup
description: Create or update a project's UX knowledge in `docs/ux/`. Use for "set up UX for this project", "create personas", "interview me about the users", or "who are the users". Do not use for small styling changes, isolated copy edits, or application implementation.
license: MIT
---

# UX setup

Create or update the canonical UX files for the target project. User-facing
messages must follow `references/writing.md`.

Do not edit application code, styles, product content, or configuration. Write
only `docs/ux/project.json` and the generated `docs/ux/README.md`. Propose one
pointer line in `AGENTS.md`; apply it only after the user says yes.

## Run the setup

1. Read `docs/ux/project.json` when it exists. Read the target README and
   `AGENTS.md` for product context. Do not re-ask facts that these files answer.
2. If `project.json` exists, update it in place. Keep existing decisions and
   sources unless the user changes them. Do not ask the same answered question.
3. Look for `DESIGN.md`, token files, and component libraries. Ask the user to
   confirm the source before recording it. Read the source when safe. Never
   create or rewrite the design system.
4. Interview for missing information. Start from `references/interview.json`
   in this skill's folder. Remove the questions that are already answered, and
   save the shortened copy in the system temp directory, never in the project.

   Use Brainstormform when available. It is recommended, not required. Use its
   MCP tools `ask_questions` and `wait_for_answers`, or its CLI:

   ```text
   brainstormform ask <temp-dir>/interview.json --open
   brainstormform wait <session-id>
   ```

   If Brainstormform is unavailable, use the host's question tool in batches of
   at most four. If no question tool exists, ask in plain chat with at most four
   questions per message. If the user cannot answer now, record the gaps in
   `open_questions` and continue.
5. Offer web research once when it can help. Ask before using it. Cite every
   URL, store each source as `web_research`, and never call it user evidence.
6. Build personas with `ux-framing`. Mark every persona without user data as
   `proto: true` and label it to the user as a `proto-persona`.
7. Write the canonical JSON and generate the Markdown view.
8. Validate with `node <absolute path to this skill folder>/scripts/ux.mjs validate project docs/ux/project.json` from the target project; fix and repeat until it prints `valid`. If Node is not available, do the reading self-check against `references/project.schema.json` and the semantic rules and tell the user the file was not machine-validated.
9. Show this proposed diff for `AGENTS.md`:

   ```diff
   +Read `docs/ux/` before any UI or UX work.
   ```

   Apply that line only after the user says yes. Preserve all existing lines.
10. Summarize what was written, which personas are proto-personas, and the open
    questions. Keep the summary short.

## Build `project.json`

Use the field list from `references/project.schema.json`.

- Set `schema_version` to `"1.0"`.
- Set `product_id` in kebab-case, and include `product_name`, `product_locale`, and `updated_at`.
- Add personas with role labels, goals, context, knowledge, devices, frustrations, `proto`, and sources.
- Add jobs and flows. Every `persona_ids` value must name an existing persona.
- Add tone with voice, words to use, words to avoid, and notes.
- Set accessibility to the requested target, or `WCAG 2.2 AA` by default.
- Set these default viewports unless the project requires more: phone `390x844`, tablet `820x1180`, laptop `1440x900`, and wide `1920x1080`.
- Set `design_system.kind` to `none` and `path` to `null` when no source exists.
- Add decisions with source and `decided_by`. Put unknowns in `open_questions`.

Never invent user evidence. Do not add human names, ages, photos, or quotes
without a source. A proto-persona is a working hypothesis, not a user finding.

## Generate `README.md`

Start the file with this exact first line:

```text
Generated from project.json. Do not edit.
```

Then show the product, personas, jobs, flows, tone, accessibility target,
viewports, design system, decisions, and open questions. Derive all values
from validated `project.json`. Do not maintain a second editable truth.

## Final self-check

Run every check before finishing:

- Confirm all required schema fields exist and all enums are valid.
- Confirm every non-empty persona attribute has a matching source.
- Confirm every `assumed` source has non-empty `validation`.
- Confirm `proto: false` personas have a `user_data` source.
- Confirm every job and flow persona ID exists.
- Confirm `design_system.kind` `none` has `path: null`; other kinds have a path.
- Confirm `README.md` starts with `Generated from project.json. Do not edit.`.
- Confirm nothing was written outside `docs/ux/`, unless the user approved the
  exact `AGENTS.md` pointer line.

If a check fails, fix the UX files and check again. Do not report success with
missing evidence or an invalid artifact.
