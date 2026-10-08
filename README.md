# UX Engineer

A plugin for Claude Code, Codex, OpenCode and Claude desktop that makes coding agents design for real people before they build a UI.

> [!IMPORTANT]
> Early development. Six skills work but are experimental: `ux-setup`, `ux-plan`, `ux-audit`, `ux-research`, `ux-accessibility` and `ux-verify`. The router `ux-orchestrator` is also experimental. Everything else in this README is planned. The full design is in [`docs/design.md`](docs/design.md), and known gaps are in [`docs/limitations.md`](docs/limitations.md).

## Install

Claude Code:

```text
/plugin marketplace add dutchbase/ux-engineer
/plugin install ux-engineer@ux-engineer
```

Claude desktop or claude.ai: open Customize, then Plugins, then Add marketplace, and enter `dutchbase/ux-engineer`. (Not tested yet.)

Codex:

```text
codex plugin marketplace add dutchbase/ux-engineer
```

Then install UX Engineer from the `/plugins` list.

OpenCode, or committing the skills into your project: use the installer. It copies the skill folders. Run it with `--dry-run` first to see what it would do, then with `--yes` to apply.

```bash
npx github:dutchbase/ux-engineer install --host opencode --dry-run
npx github:dutchbase/ux-engineer install --host opencode --yes
```

This form is untested until this release is merged; the tested form is `npx --yes --package=<tgz> ux-engineer <command>`.

- `--host` takes `claude-code`, `codex` or `opencode`, comma-separated. Install is per project by default; `--global` installs into your home folder. `--skills` picks some skills only. `--force` overwrites conflicting files (a backup goes to `.ux-engineer/backup`).
- Codex and OpenCode share `.agents/skills`, so one copy serves both. OpenCode also reads `.claude/skills`, so installing for both Claude Code and OpenCode can show the skills twice in OpenCode. The installer tells you.
- Do not use the installer for Claude Code if you installed the plugin. You get every skill twice. `doctor` does not see plugin installs.
- `npx github:dutchbase/ux-engineer uninstall --yes` removes what the installer wrote. `npx github:dutchbase/ux-engineer doctor` checks installed copies against the package.

Then, in your project:

- `/ux-engineer:ux-setup` (Claude) or `$ux-setup` (Codex) interviews you about your users and writes `docs/ux/project.json`. For a long interview, install [Brainstormform](https://github.com/dutchbase/Brainstormform) first; without it, the plugin asks its questions in the chat.
- `/ux-engineer:ux-plan <feature>` or `$ux-plan` designs the flow for a feature: steps, error and recovery states, UX copy in your tone, and acceptance criteria your coding agent can test. It writes `docs/ux/flows/<flow-id>.json` and a readable `.md` next to it. A tiny change gets a short answer and no files.
- `/ux-engineer:ux-audit` or `$ux-audit` walks through a task in your running app (local, staging or preview) in a real browser, at phone, tablet, laptop and wide-screen sizes. It writes findings with screenshots as evidence and a Markdown and HTML report to `.ux/runs/`. It uses your agent's browser tool, or the [Playwright CLI](https://github.com/microsoft/playwright-cli) if there is none, and it needs Node 18 or newer.
- `/ux-engineer:ux-research <question>` or `$ux-research` looks up best practices on the web, summarizes tickets, interviews or notes you supply, or writes a plan for a study when no data exists. It writes `docs/ux/research/<research-id>.json` and a readable `.md`. It counts people and reports separately, never invents quotes, and does not replace research with real users.
- `/ux-engineer:ux-accessibility` or `$ux-accessibility` writes testable WCAG 2.2 AA acceptance criteria for a design, or checks a running app with keyboard checks and axe in a browser. Results go to `.ux/runs/`. A clean scan is never reported as "accessible" or "compliant". It is not a certification, and checks that did not run stay `not_run`.

## Why

Ask a coding agent for a signup page and you will get one. It will probably have a gradient hero, a small label above every heading, three feature cards, and a form that throws away your input when the server returns an error. Nobody asked who the page is for. Nobody checked it on a tablet.

Agents are good at building what you describe. They are bad at asking whether it is the right thing, and they almost never check their own work the way a user would meet it. UX Engineer is an attempt to fix that without turning every button tweak into a research project.

## What it will do

UX Engineer is a small set of agent skills. It never writes application code. It produces the input that your coding agent needs to build the right thing, and it checks the result afterwards.

| Skill | What it does |
|---|---|
| `ux-orchestrator` (experimental) | Works out what kind of request this is and how much process it deserves. A two-pixel change gets a quick check, not an audit. |
| `ux-framing` | Interviews you about your users and builds personas, task goals and success criteria. Guesses are labeled as guesses. |
| `ux-research` (experimental) | Looks up best practices and competitor patterns on the web, summarizes real user data if you have any, and plans research if you don't. |
| `ux-flow-design` | Designs flows with all the states that usually get forgotten: empty, loading, errors, expired sessions, double clicks, going back. Includes UX copy. |
| `ux-audit` | Opens your app in a real browser, walks through tasks at phone, tablet, laptop and wide-screen sizes, and reports problems with evidence. |
| `ux-accessibility` (experimental) | Builds WCAG 2.2 AA requirements into designs and checks them, without pretending an automated scan proves compliance. |
| `ux-verify` (experimental) | Checks a finished change against the acceptance criteria and reports only what the evidence supports. |

Everything the plugin learns about your product (personas, key flows, tone of voice, target screen sizes, decisions) is stored in your project repository under `docs/ux/`, so every agent and every teammate works from the same picture.

## Principles

1. Users first. New projects start with personas, built mainly by interviewing the people who know the customers.
2. No invented evidence. The plugin never makes up participants, quotes or analytics. A persona without real data is called a proto-persona, every time.
3. Proof before "it works". Nothing is reported as verified without evidence that fits the claim. A screenshot does not prove keyboard access. Missing checks make a run `incomplete`, not `passed`.
4. It does not write your code. It hands briefs, flows and acceptance criteria to the agent that does. If it wants to add a test file, it asks first.
5. Simple stays simple. Small changes get small answers.
6. No generic AI look. A [researched blocklist](shared/references/ai-tells.md) of 28 common AI design patterns, such as labels above every heading or purple gradients, is avoided by default. You can still have one if you insist; the decision is logged.
7. Your design system wins. The plugin reads your `DESIGN.md` or design tokens and works inside them.

## Planned hosts

| Host | Install route |
|---|---|
| Claude Code | Plugin marketplace |
| Claude desktop / claude.ai (Cowork) | Plugin marketplace |
| Codex | Plugin marketplace |
| OpenCode | `npx github:dutchbase/ux-engineer install` or copying the skills folder |

One repository, one copy of each skill, thin adapters per host. Details are in [design §8](docs/design.md#8-hosts-and-installation).

## How it will work

```text
/ux-engineer:ux-setup
  → interviews you about your users, links your design system,
    writes docs/ux/project.json

/ux-engineer:ux-plan the CSV import
  → flow with error and recovery paths, acceptance criteria,
    handed to your coding agent

/ux-engineer:ux-audit the onboarding on staging
  → browser walkthrough at four screen sizes,
    findings with evidence, report in Markdown and HTML
```

These commands exist today, as experimental versions.

## Roadmap

The backlog is in [design §13](docs/design.md#13-backlog). The first milestone is one end-to-end task on a small test app: plan, audit and verify a CSV import flow, and measure whether the plugin beats both no plugin and the best existing alternative. If it doesn't, we'll say so and recommend the alternative.

## Related projects

This project learns from a lot of existing work. Some of it is complementary, and you may want it alongside UX Engineer.

- [Impeccable](https://github.com/pbakaus/impeccable) for visual design and frontend polish
- [Anthropic design plugin](https://github.com/anthropics/knowledge-work-plugins/tree/main/design) for research synthesis, critique and handoff
- [OpenAI product-design plugin](https://github.com/openai/plugins/tree/main/plugins/product-design) for routing between context, research and audit
- [Rampstack skills](https://github.com/rampstackco/claude-skills) for UX research and information architecture
- [Brainstormform](https://github.com/dutchbase/Brainstormform), a live question form, recommended for the persona interview

The full comparison is in [design §2](docs/design.md#2-prior-art).

## Contributing

Feedback on the design is the most useful thing right now. See [CONTRIBUTING.md](CONTRIBUTING.md). Security reports go through [SECURITY.md](SECURITY.md).

## License

[MIT](LICENSE)
