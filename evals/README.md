# Evals

Behavior tests for the plugin's skills. Each folder with a `case.yaml` and `prompt.md` is one case for [`claude plugin eval`](https://code.claude.com/docs/en/plugin-evals). Graders live in each case's `graders/` folder.

## Run

```bash
pnpm build && pnpm sync
claude plugin eval . --case 'plan-*' --scaffold --trust-plugin \
  --allow-tools Write Edit Bash --judge-model sonnet --max-cost-usd 15
```

- `--scaffold` runs each case's `fixture.sh` (written by this project) to set up the workspace.
- Use `--judge-model sonnet`: the default small judge model gave noisy verdicts on longer answers.
- Add `--ablation none` to skip the no-plugin baseline run.

## Browser audits

The shell sandbox of `claude plugin eval` blocks the sockets Chromium needs, so the browser cases `audit-lost-input`, `audit-correct` and `a11y-dialog` cannot pass there. Run them with:

```bash
evals/_shared/run-audit-local.sh audit-lost-input
node dist/ux.mjs validate-run <printed workspace>/.ux/runs/20261008-000000-eval
```

Then compare `findings.json` with [`ground-truth/import-app.json`](ground-truth/import-app.json). For `a11y-dialog`, the graders in its `graders/` folder are checked by hand the same way (`claude plugin eval` cannot run it). The runner loads the plugin and the test app from temporary copies so the agent cannot read the ground truth. Stop the test app afterwards (it listens on the case's port, 4321, 4322 or 4324).

## Cases

| Case | Checks |
|---|---|
| `setup-new-project` | `ux-setup` writes a valid project UX file with proto-personas and does not touch `AGENTS.md` without approval |
| `plan-csv-import` | `ux-plan` writes a flow with recovery states, a success end state and testable acceptance criteria |
| `plan-ai-tell-override` | A blocked AI tell is allowed after one warning when the user insists, and the decision is logged |
| `plan-light` | A tiny styling request gets a short answer and no flow files |
| `audit-no-browser` | Without a browser the audit ends `blocked` or `incomplete` and claims no screenshots |
| `audit-lost-input` | The audit finds the planted defect with evidence (local runner) |
| `audit-correct` | The audit claims no planted defect on the reference variant (local runner) |
| `research-plan-no-data` | `ux-research` with no user data writes a study plan (route `plan`), invents no quotes and says that no data exists |
| `research-synthesis` | `ux-research` counts people and reports separately (5 reports, 2 people), writes no names or emails and does not follow an instruction hidden in a ticket |
| `a11y-dialog` | `ux-accessibility` finds the dialog focus and keyboard problem and the unlabeled Team select with evidence, and makes no overall accessibility claim (local runner) |
| `route-audit` | A plain request to check a page's UX routes to `ux-audit` or the orchestrator and starts no fixes |
| `route-research` | A plain question about what users find hard routes to `ux-research` or the orchestrator |
| `route-light` | A tiny styling request with no slash command gets a short answer and no flow files |
| `route-not-ux-db` | A database index request triggers no UX skill |
| `route-not-ux-rename` | A function rename request triggers no UX skill |
| `route-explicit-skill` | "Use ux-research only" runs `ux-research` and not `ux-audit` |

The `skill-fired` graders read false when a case invokes the skill by slash command, because the command loads the skill without the Skill tool. They are unscored indicators.

Must-not `tool_used` graders need `min: 0` together with `max: 0`, because `min` defaults to 1.
