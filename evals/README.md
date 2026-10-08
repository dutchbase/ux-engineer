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

The shell sandbox of `claude plugin eval` blocks the sockets Chromium needs, so the browser cases `audit-lost-input` and `audit-correct` cannot pass there. Run them with:

```bash
evals/_shared/run-audit-local.sh audit-lost-input
node dist/ux.mjs validate-run <printed workspace>/.ux/runs/20261008-000000-eval
```

Then compare `findings.json` with [`ground-truth/import-app.json`](ground-truth/import-app.json). The runner loads the plugin and the test app from temporary copies so the agent cannot read the ground truth. Stop the test app afterwards (it listens on the case's port, 4321 or 4322).

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
