---
name: ux-orchestrator
description: Route a UX request to the right UX Engineer skill. Use when the user asks for help with the UX of a product, asks "is this good UX", wants to improve the user experience, or asks what UX work a feature needs. Chooses between setup, plan, research, audit, accessibility and verify. Do not use for implementation, non-UI work (database, refactor, tests, build, deploy), or when the user already named a UX skill.
license: MIT
---

# UX orchestrator

Choose the route for a UX request. Do not do the work of the chosen skill.
Read `references/writing.md` before writing a message to the user. Read
`references/routing.md` for the routing table.

## Decide

1. If the user named a skill, use that skill. An explicit choice wins.
2. Read `docs/ux/project.json` when it exists, and the request. Read nothing
   else. If the file is missing and the work needs a project profile, the
   route starts with `ux-setup`.
3. Match the request to a row in `references/routing.md`.
4. Tell these pairs apart:
   - audit or fix: the plugin audits and plans, and never edits application
     code;
   - plan or implementation: hand implementation to the implementing agent
     with the acceptance criteria or findings that exist;
   - UX problem or visual preference: give at most one light note for a taste
     request, and defer to the design system or a design tool.
5. If the work is not UX work, use no UX skill. Say so in one sentence and
   stop.

## Check capabilities

Check before you route. Check the browser tool, Node for `scripts/ux.mjs`, and
the question tool. Name the host's tool by its job, not by a product name.

If a capability is missing, narrow the scope. Do not lower the evidence
standard. An audit without a browser is code-only, and its run status is
`blocked` or `incomplete`. If Node is missing, do not claim machine validation.

## Route

Use one skill at a time. If the request clearly spans two skills, name the
order, for example `ux-setup` then `ux-plan`. Run the first one. Run the next
one after the first one finishes.

Send one short message. It names:

- the route (the skill, or the hand-off to the implementing agent);
- the scope (light, targeted, standard or deep);
- anything missing (a file, a capability, or a fact the user must give).

Then invoke the chosen skill. The router writes no files.

## Stop

Stop at the agreed budget or at a real blocker. Report the blocker in plain
words and say what the user can do next. Do not guess a route for an unclear
request. Ask one question instead.

## Never

- Never repeat the work of the chosen skill.
- Never edit application code, styles, product content or product config.
- Never start a full audit for a small styling change. Use the light profile
  of `ux-plan`.
- Never start a UX skill for a database, refactor, test, build, deploy or
  rename task.
