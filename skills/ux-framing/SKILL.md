---
name: ux-framing
description: Internal helper that frames a product or UX task around real users, jobs, context, evidence, and observable success. Invoked by ux-setup or ux-plan, not directly. Do not use for direct requests such as "create personas" or "who are the users" (use ux-setup), small styling changes, isolated copy edits, or routine application coding.
license: MIT
---

# UX framing

Use this skill to turn a product question into a small, testable UX frame.
User-facing messages must follow `references/writing.md`.

## Scope

Start with the actor, situation, job, desired outcome, constraints, product
rules, and open questions. Keep the answer proportional to the task. A small
task gets a small frame. Do not produce a page of generic UI ideas.

Read `docs/ux/project.json` when it exists. Read the repository README and
`AGENTS.md` when they provide product context. Keep existing decisions unless
the user changes them.

For a new project, establish personas before UI work. Use the host's question
tool if available. Recommend Brainstormform for a structured interview, but do
not require it. Ask in batches of at most four questions. If no question tool
exists, ask at most four questions per chat message.

## Evidence rules

Use sources in this order of weight:

1. Human interview or supplied user data.
2. Cited web research about the market or comparable products.
3. A clearly marked proto-persona assumption.

Record a source for every non-empty persona attribute: `summary`, `goals`,
`context`, `knowledge`, `devices`, and `frustrations`. Use only these source
kinds: `interview`, `user_data`, `web_research`, or `assumed`.

For an `assumed` source, record a reason in `validation`. Use a source `ref`
for an interview ID, data ID, or cited URL. Use `null` only when a reference is
not available.

Without user data, set `proto` to `true`. Tell the user that the persona is a
`proto-persona`. Do not invent human names, ages, photos, or quotes. A role is
valid persona labelling; demographic detail requires a source.

Offer web research once when it can reduce uncertainty. Cite each URL. Store it
as `web_research`, and never present it as evidence about this product's users.

Separate three things:

- Stored data: what the system records.
- Business meaning: what the product or business needs.
- User understanding: what the person must know to act.

A database field is not automatically a navigation label. A received upload is
not automatically a completed import.

## Compact `project.json` field guide

Write entries that follow `references/project.schema.json`.

- Set `schema_version` to `"1.0"`.
- Set `product_id` in kebab-case. Include `product_name`, `product_locale`, and `updated_at`.
- Add `personas` with role labels, source-per-attribute entries, and `proto`.
- Add `jobs` with `job_id`, `persona_ids`, `statement`, and `success_outcome`.
- Add `flows` with `flow_id`, `name`, `persona_ids`, and a file link or `null`.
- Add `tone` with `voice`, `use`, `avoid`, and `notes`.
- Add `accessibility` with a WCAG 2.2 target and optional notes.
- Add at least one `viewports` entry with positive width and height.
- Add `design_system` with `kind`, `path`, and `notes`.
- Add `decisions` with date, reason, source, and `decided_by`.
- Put unresolved facts in `open_questions`.

Before handing off, check these semantic rules:

1. Every non-empty persona attribute has a matching source.
2. Every `assumed` source has non-empty `validation`.
3. `proto: false` has at least one `user_data` source.
4. Every job and flow persona ID exists.
5. `design_system.kind` `none` has `path: null`; every other kind has a path.

## Example persona

Present this as a `proto-persona`, not as a real finding:

```json
{
  "persona_id": "first-time-shop-owner",
  "label": "First-time shop owner",
  "proto": true,
  "summary": "Runs a small shop and needs to publish a first product listing.",
  "goals": ["Publish a correct listing without expert help."],
  "context": "Works between customer requests on a laptop.",
  "knowledge": "Knows the products, but not the catalog system.",
  "devices": ["laptop"],
  "frustrations": ["Unclear fields may delay publishing."],
  "sources": [
    { "attribute": "summary", "kind": "assumed", "ref": null, "validation": "Interview one shop owner." },
    { "attribute": "goals", "kind": "assumed", "ref": null, "validation": "Observe one listing task." },
    { "attribute": "context", "kind": "assumed", "ref": null, "validation": "Ask about interruptions." },
    { "attribute": "knowledge", "kind": "assumed", "ref": null, "validation": "Check catalog vocabulary." },
    { "attribute": "devices", "kind": "assumed", "ref": null, "validation": "Review device analytics." },
    { "attribute": "frustrations", "kind": "assumed", "ref": null, "validation": "Test the listing flow." }
  ]
}
```

Use the smallest useful output. Do not edit application code, styles, content,
or configuration. Hand the frame to the implementing agent.
