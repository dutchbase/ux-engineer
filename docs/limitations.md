# Known limitations

This file lists what UX Engineer does not do or cannot guarantee. It is updated with every release.

## Current status

- Early development. `ux-setup`, `ux-plan` (with `ux-flow-design`), `ux-audit`, `ux-research` and `ux-accessibility` exist and are experimental. The orchestrator does not exist yet.
- The skills validate their output with the bundled `scripts/ux.mjs`, which needs Node 18 or newer. Without Node, they fall back to a reading check and say that the output was not machine-validated.
- Browser audits cannot run inside `claude plugin eval` on Linux: its shell sandbox blocks the sockets Chromium needs, and the agent correctly reports the run as `blocked`. Browser audit cases are run with `evals/_shared/run-audit-local.sh` instead, outside that sandbox.
- Tested so far: Claude Code (setup and audit, see `compatibility.json`) and Codex (skill discovery only). Each case ran only a few times; this is not a benchmark.
- The test app's `correct` variant is the reference for the four planted defects, not a defect-free app. Audits found real extra problems in it; they are listed in `evals/ground-truth/import-app.json` and in the test app's README.
- Nothing has been benchmarked yet. There is no evidence yet that the plugin improves on using no plugin or an existing alternative.
- `ux-research` does no user research. It plans studies, summarizes data you supply and cites web pages it read. Web research and a few tickets are weak evidence, and the skill labels them so.
- `ux-accessibility` has so far only been exercised against one small test app with two planted defects. It uses axe and keyboard checks. It does not use a screen reader, so screen reader checks stay `not_run`. Its results are not a WCAG conformance statement.
- The `research-*` and `a11y-dialog` cases ran once each (see `compatibility.json`); this is not a benchmark. `a11y-dialog` runs through the local runner, like the other browser cases.

## By design

- The plugin is not a replacement for testing with real users. Personas built without real user data are proto-personas.
- It gives no legal accessibility certification. Automated checks cover only part of WCAG.
- Local evidence files are written with the same permissions as the agent, so they are not tamper-proof.
- Host details (install paths, manifests, question tools) change often. Only versions listed in `compatibility.json` were tested.

## Prior-art review

The review of other projects in `docs/design.md` §2 is not a full license or security audit. Licenses in `sources.lock.json` come from GitHub's license detection at the pinned commit.

- The AI-tells blocklist reflects writing up to October 2026. Two entries rest on a single source; some "why it hurts" lines are reasoning, not measured effects. Audits must confirm a harm in the product before rating it above `advisory`.
- LLM-graded eval cases are noisy with the default judge model; use `--judge-model sonnet`.
