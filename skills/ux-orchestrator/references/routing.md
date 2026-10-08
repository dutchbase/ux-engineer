# Routing table

Use this table to choose the route. Match the request shape, not single words.
Read only `docs/ux/project.json` and the request.

## Routes

| Request shape | Skill | Default scope | Required capabilities |
|---|---|---|---|
| Explicit request: "set up UX", "who are the users", "create personas", or a new-project request | `ux-setup` | Standard: one interview | A question tool. Without it, ask in chat, one question at a time. |
| "Plan this", "design the flow", "how should X work" | `ux-plan` | By size: targeted, standard or deep | None. Node for flow validation. |
| Small styling or layout change | `ux-plan`, light profile | Light: short chat answer, no files. The edit itself goes to the implementing agent. | None |
| "What do users say", "research", "competitors", "best practices" | `ux-research` | Targeted: one question or one research plan | Web access for sources. Without it, write a research plan only. |
| "Audit", "check the UX of", "test it in the browser" | `ux-audit` | Targeted: one flow or one page | A browser tool and Node. Without a browser: code-only, and the run status is `blocked` or `incomplete`. |
| "Accessibility", "WCAG", "keyboard", "screen reader" | `ux-accessibility` | Targeted: one page or one flow | A browser tool and Node. Without a browser: code-only, and the run status is `blocked` or `incomplete`. |
| "Verify the acceptance criteria", "re-check after the fix" | `ux-verify` | The criteria of one flow file | A browser tool, Node and a flow file in `docs/ux/flows/`. |
| "Fix it", "implement it" | None. Hand off to the implementing agent. | The acceptance criteria or findings that exist | None |
| Database, refactor, tests, build, deploy, rename | None | None | None |

`ux-framing` and `ux-flow-design` are internal helpers. `ux-setup` and
`ux-plan` invoke them. Do not route to them directly.

## Missing `docs/ux/project.json`

A missing `docs/ux/project.json` alone is not a reason for `ux-setup`. Route to
`ux-setup` only when the work needs personas or jobs that do not exist. This
applies to `ux-plan` at standard or deep scope. These routes run without the
file and note the gap: `ux-audit`, `ux-accessibility`, `ux-research` and the
light profile of `ux-plan`.

## Distinctions

- **Audit or fix.** An audit finds and reports problems. A fix changes code.
  The plugin never changes application code. After an audit, hand the findings
  to the implementing agent.
- **Plan or implementation.** A plan gives the flow and the acceptance
  criteria. Implementation builds them. Route "build it" to the implementing
  agent. Pass on the flow file if one exists.
- **UX problem or visual preference.** A UX problem hurts a user task: the user
  cannot find, read, finish or recover. A taste request ("make it pop", "use
  another blue") is not a UX problem. Give at most one light note. Defer to the
  design system or a design tool.

## Order for requests that span two skills

Name the order in the route message. Run the second skill after the first one
finishes.

- A standard or deep plan request that needs personas, and no
  `docs/ux/project.json`: `ux-setup`, then `ux-plan`.
- Plan, then check the result: `ux-plan`, then `ux-verify`.
- Audit, then deep accessibility check: `ux-audit`, then `ux-accessibility`.

## Missing capability

Narrow the scope. Do not lower the evidence standard.

- No browser tool: do not claim browser evidence. Run the code-only part and
  report `blocked` or `incomplete`.
- No Node: do not claim machine validation. Say which checks did not run.
- No question tool: ask in chat, one question at a time.
