# Known limitations

This file lists what UX Engineer does not do or cannot guarantee. It is updated with every release.

## Current status

- Early development. `ux-setup`, `ux-plan` (with `ux-flow-design`), `ux-audit`, `ux-research`, `ux-accessibility`, `ux-verify` and the router `ux-orchestrator` exist and are experimental.
- The skills validate their output with the bundled `scripts/ux.mjs`, which needs Node 20.12 or newer (it uses `Dirent.parentPath`). The installer has the same floor. The repository CI runs on Node 24 only. Without Node, they fall back to a reading check and say that the output was not machine-validated.
- Browser audits cannot run inside `claude plugin eval` on Linux: its shell sandbox blocks the sockets Chromium needs, and the agent correctly reports the run as `blocked`. Browser audit cases are run with `evals/_shared/run-audit-local.sh` instead, outside that sandbox.
- Tested so far: Claude Code (setup, plan, audit, research, accessibility and routing, see `compatibility.json`). Codex and OpenCode: installer and skill discovery only. Each case ran only a few times; this is not a benchmark.
- The test app's `correct` variant is the reference for the planted defects, not a defect-free app. Audits found real extra problems in it; they are listed in `evals/ground-truth/import-app.json` and in the test app's README.
- Nothing has been benchmarked yet. There is no evidence yet that the plugin improves on using no plugin or an existing alternative.
- `ux-research` does no user research. It plans studies, summarizes data you supply and cites web pages it read. Web research and a few tickets are weak evidence, and the skill labels them so.
- `ux-accessibility` has so far only been exercised against one small test app with two planted defects. It uses axe and keyboard checks. It does not use a screen reader, so screen reader checks stay `not_run`. Its results are not a WCAG conformance statement.
- The `research-*` and `a11y-dialog` cases ran once each (see `compatibility.json`); this is not a benchmark. `a11y-dialog` runs through the local runner, like the other browser cases.

## Router

- `ux-orchestrator` and the other skills are chosen by the host from their descriptions. There is no code that forces a route. The host can pick wrong or pick nothing.
- Routing was tested on 6 cases (`route-*`), once each, in Claude Code only. All 6 routed correctly. This is not a benchmark. The must-not graders needed `min 0` to score (see `evals/README.md`).

## Installer

- It copies skill folders. It never makes symlinks, so a new plugin version means running `install` again.
- There is no `curl` one-liner. Use the `npx github:` form.
- `uninstall` removes the files the installer wrote. Empty `.claude`, `.agents` and `.ux-engineer` folders can remain.
- It refuses a `~/.claude` that is a symlink pointing outside your home folder.
- `doctor` does not see plugin installs. If you use the Claude Code plugin and also run the installer, you get duplicate skills and `doctor` will not say so.
- OpenCode reads both `.claude/skills` and `.agents/skills`. Installing for more than one host can show the skills twice there.
- The `npx github:dutchbase/ux-engineer` form was not tested on 2026-10-08; check it after merge. The tested route was `npm pack`, then `npx --package=<tarball> ux-engineer doctor`.
- Only a project install for all three hosts was run on real hosts; `--global`, `--force` and `--skills` are covered by unit tests only.
- A second `--force` on the same file makes a second backup, but `uninstall` restores only the first (oldest) backup.
- A `.claude/skills` folder that is a symlink pointing inside the project is followed, and the skills are written there.
- OpenCode discovery was tested only with both `.claude/skills` and `.agents/skills` present.
- Tested on Linux (x86_64) only. Windows and macOS are untested.

## By design

- The plugin is not a replacement for testing with real users. Personas built without real user data are proto-personas.
- It gives no legal accessibility certification. Automated checks cover only part of WCAG.
- Local evidence files are written with the same permissions as the agent, so they are not tamper-proof.
- Host details (install paths, manifests, question tools) change often. Only versions listed in `compatibility.json` were tested.

## Prior-art review

The review of other projects in `docs/design.md` §2 is not a full license or security audit. Licenses in `sources.lock.json` come from GitHub's license detection at the pinned commit.

- The AI-tells blocklist reflects writing up to October 2026. Two entries rest on a single source; some "why it hurts" lines are reasoning, not measured effects. Audits must confirm a harm in the product before rating it above `advisory`.
- LLM-graded eval cases are noisy with the default judge model; use `--judge-model sonnet`.
