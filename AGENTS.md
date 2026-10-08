# Instructions for coding agents

This repository builds UX Engineer, a set of agent skills packaged as a plugin for several coding agents.

- Read [`docs/design.md`](docs/design.md) before you change anything. It is the single source of truth for scope, rules and the backlog.
- Write skills only under `skills/<name>/SKILL.md`. Put shared policies, references and templates under `shared/`. Packaged copies under `dist/` are build output; never edit them by hand.
- Everything in this repository is written in English.
- Do not add content copied from other projects unless its license allows it. Record every borrowed file in `THIRD_PARTY_NOTICES.md` with source URL, commit, license and changes.
- Never claim a test, check or benchmark passed unless you ran it and saw it pass.
- The files under `docs/research/` are historical source material. Do not update them.
