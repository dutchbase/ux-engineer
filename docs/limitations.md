# Known limitations

This file lists what UX Engineer does not do or cannot guarantee. It is updated with every release.

## Current status

- Early development. Only the `ux-setup` flow is being built; other skills from the design do not exist yet.
- `ux-setup` checks `docs/ux/project.json` against the schema by reading it, not with the real validator, because an installed plugin has no Node dependencies. Run `node src/cli.ts validate project <file>` from this repository for a strict check.
- Tested so far: Claude Code (end to end, one eval case) and Codex (skill discovery only). See `compatibility.json`.
- Nothing has been benchmarked yet. There is no evidence yet that the plugin improves on using no plugin or an existing alternative.

## By design

- The plugin is not a replacement for testing with real users. Personas built without real user data are proto-personas.
- It gives no legal accessibility certification. Automated checks cover only part of WCAG.
- Local evidence files are written with the same permissions as the agent, so they are not tamper-proof.
- Host details (install paths, manifests, question tools) change often. Only versions listed in `compatibility.json` were tested.

## Prior-art review

The review of other projects in `docs/design.md` §2 is not a full license or security audit. Licenses in `sources.lock.json` come from GitHub's license detection at the pinned commit.
