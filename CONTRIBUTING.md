# Contributing

Thanks for your interest in UX Engineer.

## Project status

The project is in the **design phase**. There is no installable plugin yet. The best ways to help right now:

- Read [`docs/design.md`](docs/design.md) and open an issue when something is unclear, wrong or missing.
- Share real examples of poor UX that coding agents produced (screenshots or short descriptions, with private data removed).
- Suggest prior art we should learn from.

Use [GitHub Discussions](https://github.com/dutchbase/ux-engineer/discussions) for open questions and ideas, and [Issues](https://github.com/dutchbase/ux-engineer/issues) for concrete problems or proposals.

## Rules every contribution must follow

These come from the design and are not up for debate in a single pull request:

1. **No invented user data.** Skills, examples and tests never present made-up personas, quotes, participants or analytics as real. Assumptions are labeled as assumptions.
2. **Evidence before claims.** Nothing may report that an interaction, accessibility check or flow was verified without evidence that fits the claim.
3. **The plugin never writes application code.** It produces input for the agents that do: briefs, flows, findings, acceptance criteria.
4. **Simple stays simple.** A small task must not trigger a large process.
5. **Licenses are tracked per file.** If you adapt material from another project, add an entry to `THIRD_PARTY_NOTICES.md` with the source URL, exact commit, license and what you changed. Material with an unclear license is not accepted.

## Pull requests

- Keep pull requests small and focused on one change.
- Explain the user problem the change solves.
- If you change a skill, describe how you checked its behavior (for example, before/after output on the same task).

By contributing, you agree that your contributions are licensed under the [MIT License](LICENSE).
