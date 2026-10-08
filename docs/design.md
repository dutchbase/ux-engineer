# UX Engineer: design and build plan

**Status:** design proposal. Nothing here is implemented or benchmarked yet.
**Last updated:** 2026-10-08
**Supersedes:** [`research/2026-10-07-original-plan-nl.md`](research/2026-10-07-original-plan-nl.md) (Dutch research plan). The decisions that changed it are listed in [Appendix A](#appendix-a-decision-log).

> All configuration, file names, commands, thresholds and interfaces in this document are proposals for the plugin we are going to build, unless they are explicitly described as existing third-party functionality.

**Goal:** make coding agents design for real users before they change a UI, and back every conclusion with evidence that fits the claim.

**Architecture:** a small, model-independent set of Agent Skills with shared contracts, references and evaluations, packaged as one plugin for several hosts. The host's coding agent stays responsible for writing code. Host adapters only handle installation, tool mapping and capabilities. A small helper layer validates artifacts and collects browser evidence.

**Tech stack:** Markdown with YAML frontmatter for skills; JSON Schema (2020-12) for data exchange; TypeScript on Node.js 24 LTS for optional helpers and the installer; Playwright CLI for exploration, Playwright Test for regressions and axe for part of the accessibility checks. Pin dependency versions and browser revisions in a lockfile at implementation time. The text skills themselves need no Node runtime. [S01][S05][S06][S07][S08][S26]

## Global constraints

- Public, free and open source (MIT) from the first release. Generic: no integrations or defaults tied to one company or project.
- Hosts: Claude Code, Codex, OpenCode and the Claude desktop app (Cowork). See [§8](#8-hosts-and-installation).
- First release targets browser-based web products: marketing sites, web apps, admin panels and shops. Native mobile apps are out of scope.
- **The plugin never writes application code.** It produces input for the agents that do. Test files are a special case: the plugin asks the user every time ([§4.5](#45-the-no-code-rule)).
- Project-specific UX knowledge lives in the project repository, never in a global location ([§6](#6-the-project-ux-file)).
- Skill instructions and schema keys are in English. Reports follow the user's language, English by default. Every message from the plugin to its user is written in ASD-STE100 Simplified Technical English ([§10.2](#102-language)).
- Audit, research and verify modes change no application code. Browser actions can still change data, so they have their own environment and action permissions.
- Production writes, real payments, real emails, publishing and deletions are blocked by default. A general UX request is not permission for any of them.
- No claim that an interaction, accessibility check or user behavior was verified without fitting evidence.
- One source file per skill and one managed project instruction source. No hand-maintained copies per host.
- No extra model API, database, vector store, dashboard or autonomous agent server is needed for the MVP.
- Never install software from an unreviewed moving branch or an unchecked install script.

## Review focus

These failure modes must appear explicitly in tests:

1. Missing browser, research data or credentials are hidden behind convincing but unproven conclusions.
2. An audit causes real emails, data loss or other unauthorized side effects.
3. A host discovers duplicate skills, or an installed skill misses shared files.
4. Conditional flows, interruptions and expected error responses are wrongly judged as passed or as defects.
5. Evidence files cannot be traced, contain secrets, or are treated as trusted instructions.
6. Proto-personas or web research are presented as findings about real users.

---

# 1. Purpose and non-goals

Coding agents build what is asked, but they rarely think about who will use it. The result is generic layouts, recognizable "AI design" patterns, screen sizes that were never checked, and flows that only work on the happy path.

Do not build an encyclopedia of UX prompts or a new multi-agent framework. Build a thin UX layer: a few focused skills, fixed output contracts, controlled browser interaction and repeatable evaluations.

Broader UX suites already exist (see [§2](#2-prior-art)). The hypothesis behind this project is not that nobody supports UX. It is that **a consistent chain from user goal to evidence to design decision to implementation to verification** helps more in an everyday development workflow. That has to be tested before the suite grows.

## 1.1 Desired behavior

- "Improve the onboarding": the agent first establishes who the user is, what they try to achieve, what they know and may do, what is already known, where the uncertainty is, and what provable completion means. Then it proposes a flow. It changes nothing in the app itself; it hands the flow to the implementing agent.
- "Check this form": the agent runs fitting checks and separates observed defects, implementation risks and hypotheses about comprehension.
- "Make this button two pixels taller": no research process. A light check only: does this change affect anything else, for example a breakpoint or a tap target? Simple stays simple.

## 1.2 Non-goals

No replacement for real users. No automatic proof of market need. No universal UX score. No legal accessibility certification. No autonomous production changes. No splitting every practical task into ten agent roles. No deep visual design: tools such as Impeccable do that better ([§5.7](#57-visual-quality-and-ai-tells)).

# 2. Prior art

Sources were reviewed as described in the original research plan: actual scope, separation of UX from visual taste, handling of evidence, concrete outputs, link to implementation, host dependencies and visible license terms. Stars and author claims do not count as evidence of quality. No full security or license audit was done. Branches move: pin exact commits before any text or code is reused.

| Source | What it contains | Use in this project |
|---|---|---|
| Anthropic `knowledge-work-plugins/design` | Research, critique, UX writing, accessibility, developer handoff. Aimed at Cowork, also usable in Claude Code. | Reference for research and handoff structure. Not a full interactive browser auditor. Its accessibility scope still names WCAG 2.1 AA. [S09] |
| OpenAI `plugins/product-design` | Router with separate context, research, audit and design-QA workflows; host-specific browser and prototype assumptions. | Strong inspiration for routing and for audit versus visual QA. Not host-independent. [S10] |
| Rampstack `claude-skills` | Modular library including UX research and information architecture. | Candidate baseline and source of method building blocks. Select only relevant modules. [S11] |
| Impeccable | Product context, visual context, `shape`, onboarding, UX copy and hardening next to visual commands; writes a `DESIGN.md`. | Strong partner for visual design and implementation, and a candidate baseline. Its style preferences are not universal UX requirements. [S12] |
| EliaAlberti `ux-audit-skill` | Screenshot-driven heuristic audits with explicit limits of screenshot evidence. | Reuse the evidence discipline and report structure. No keyboard, screen reader or latency claims from a still image. [S13] |
| jezweb `ux-audit` | Interaction-first audit with manifests, scenarios and evidence; marked `claude-code-only`. | Reference for task execution and evidence logging. Needs porting. [S14] |
| LobeHub `product-design` | Separates domain meaning, user task and interface representation. | Conceptually strong. Root license has extra conditions; reuse only after the file license is clear. [S15] |
| Mahir Autela `claude-skills-ux` | Broad taxonomy: research, IA, interaction, principles, metrics, collaboration. MIT. | Coverage checklist, not a package to install whole. [S16] |
| mae616 `design-skills` | Separate usability-psychologist role next to other design roles. | Extra inspiration only. [S17] |
| ratingtesting `ux-researcher` | Short researcher role with methods and deliverables. | Role description, not an execution contract. Its example results are not real results. [S18] |

## 2.1 Reuse strategy

Write our own contracts, routing and test cases. Cherry-pick permissively licensed instructions or scripts where they fit, with attribution and preserved notices. Record per borrowed file: original URL, commit, license, changes and where it is used. A public GitHub file is not by itself permission to redistribute it. Files with an unclear license stay out of the release.

Our own original content is MIT. That does not relicense third-party material.

# 3. Architecture and skills

## 3.1 Route

| Route | Benefit | Cost | Decision |
|---|---|---|---|
| Combine existing skills only | Fast, little maintenance | Contracts, scope and tool assumptions differ | Measured as a baseline |
| Own thin core with selected building blocks | Own evidence model, consistent outputs, little vendor lock-in | Some maintenance and tests | **Chosen** |
| Full own agent platform | Maximum control | Lots of infrastructure that does not prove better UX | Out of scope |

## 3.2 Core skills

| Skill | Responsibility | Main output |
|---|---|---|
| `ux-orchestrator` | Recognize intent, set scope, check capabilities, sequence skills | Run plan, required inputs, chosen route |
| `ux-framing` | Users, personas, context, task, success, constraints, uncertainty. Runs the persona interview. | Project UX file entries, product brief, open questions |
| `ux-research` | Web research on best practices and competitors; synthesis of real user data; planning of missing research | Evidence register, findings, hypotheses, research plan |
| `ux-flow-design` | Task-level IA, routes, states, forms, recovery, UX copy, interaction | Flow contract, decision log entries, acceptance criteria |
| `ux-audit` | Examine an existing experience in a browser, collect evidence, support findings | Findings, coverage, priorities, verification scenarios |
| `ux-accessibility` | Accessibility requirements in design, and judgement of executed checks | Requirements and checks with evidence and open items |

Three thin, user-invocable entry skills start a mode through the orchestrator: `ux-setup`, `ux-plan` and `ux-verify`. `ux-research` and `ux-audit` can be invoked directly. `verify` is a mode, not a separate core skill ([§4.1](#41-modes)). Browser execution is a shared capability, not a seventh agent. Form design, UX copy, basic IA and the AI-tells blocklist start as shared references. Split them into their own skills only when usage and evaluations show the need.

Later candidates: `ux-information-architecture`, `ux-content`, `ux-measurement`. No conversion-optimization skill before the user outcome and ethical limits are clear.

## 3.3 Layers

```text
Host coding agent (writes the code)
  |
  +-- UX skills: intent, framing, research, design, audit
  |
  +-- Shared contracts, policies and references
  |
  +-- Host adapter: discovery, invocation, question tool, capabilities
  |
  +-- Browser and validation helpers
        +-- exploration: Playwright CLI or an available browser/MCP adapter
        +-- regression: Playwright Test
        +-- accessibility scan: axe
        +-- output: JSON + Markdown + HTML + traceable evidence files
```

No layer inherits permissions from another. A skill can recommend an action; that does not grant permission to perform it.

# 4. Workflow and modes

## 4.1 Modes

| Mode | Behavior | Changes app code? |
|---|---|---|
| `setup` | Create or update the project UX file: persona interview, design-system link, viewports, tone | No |
| `plan` | Brief, research gaps, design options, flow and acceptance criteria | No |
| `research` | Web research, analysis of supplied data, or a plan for new research | No |
| `audit` | Examine an existing experience inside the agreed scope | No |
| `verify` | Re-run explicit criteria after a change | No |

`Implement` is a handoff to the host's normal coding workflow, not a hidden extra mode.

The plugin can be started both ways:

- **Explicitly**, through user-invocable skills such as `ux-setup`, `ux-plan`, `ux-research`, `ux-audit` and `ux-verify` (in Claude Code: `/ux-engineer:ux-audit`; in Codex: `$ux-audit`). See [§8.1](#81-per-host).
- **Automatically**, when the host agent sees UX-relevant work and the skill description matches. Negative triggers matter as much as positive ones ([§5.6](#56-ux-orchestrator)).

## 4.2 Scope profiles

- **Light:** one small change. Check only side effects that matter: affected breakpoints, tap targets, contrast, copy consistency, design-system tokens. A seemingly small change can have a large effect, so a light check is not "no check". But simple stays simple: one short answer, no documents.
- **Targeted:** one component or one clear problem; only the relevant references and checks.
- **Standard:** one main task with its main alternative paths, risks and relevant states.
- **Deep:** several roles, a larger journey, research and wider coverage. The agent states up front what stays out of scope.

The router derives the profile from the request and the existing context. It does not ask again for information that is already reliably in the project UX file. Unknowns that do not block work are recorded as assumptions. When critical permissions or credentials are missing, it reports the limitation instead of inventing a success.

## 4.3 Design path

1. Read the project UX file and any supplied research. If the project UX file does not exist, propose `setup` first.
2. Name the user (persona), task, context and observable outcome.
3. Separate known facts from hypotheses. A feature request is not automatically the solution.
4. Where there is a real choice, make two or three functionally different options with trade-offs.
5. Work out the chosen direction in flow, states, copy and accessibility, within the user's design system.
6. Record decisions with their source and acceptance criteria.
7. Hand over to the implementing agent or frontend skill.
8. Verify the agreed outcomes and update the open questions.

Not every phase needs its own document. A small task can get one compact artifact, as long as the same distinctions hold.

## 4.4 Audit path

Start where possible with a black-box task: only the goal, user context and allowed environment. Observe the interface before the agent knows the code. This keeps implementation knowledge from hiding findability problems.

Look at the code afterwards to find causes. Keep "the agent could do it" separate from "people understand and find this". A browser agent is not a real user. [S21]

Report what could not be tested, how wide the sample was and which observations need confirmation. Do not redesign while collecting a baseline.

## 4.5 The no-code rule

The plugin never edits application code, styles, content files or configuration of the product. Its outputs are briefs, flows, findings, acceptance criteria and test scenarios in plain language. The implementing agent turns them into code.

Automated tests are the one grey area. When a finding would benefit from a regression test (for example a Playwright test), the plugin:

1. Writes the test scenario in plain language as part of its output.
2. Asks the user, in one clear question, whether it may also write the test file, and states exactly which file it would create and that it would not touch application code.
3. Writes the test file only after a yes. Otherwise it hands the scenario to the implementing agent.

## 4.6 Example requests

These are natural requests for the future plugin, not existing commands:

```text
/ux-engineer:ux-setup
Interview me about the users of this product and create the project UX file.
```

```text
/ux-engineer:ux-plan the CSV import.
Read the project UX file first. Include error and recovery paths.
```

```text
/ux-engineer:ux-audit the onboarding on staging.
Test as a new team admin. Use the test tenant only.
Separate observed problems from hypotheses.
```

```text
/ux-engineer:ux-verify the acceptance criteria of flow csv-import.
Mark missing evidence as incomplete, not as passed.
```

# 5. Skill requirements

## 5.1 `ux-framing` and the persona interview

Minimal input: a task or product question plus the available context. Minimal output: actor, situation, job to be done, success outcome, relevant product rules, constraints and open questions.

**Personas come first.** For a new project, the plugin establishes personas before any UI work. Sources, in order of weight:

1. **Interview with the human user** (the product owner, designer or developer). This is the main source. The plugin asks structured questions about customers, their goals, context, knowledge, devices and frustrations.
2. **Web research** about the market, competitors and comparable products, through `ux-research`.
3. **Proto-personas**: the agent's best guess where the first two leave gaps.

Every persona records, per attribute, where it came from: `interview`, `web_research`, `user_data`, or `assumed`. A persona built without real user data is a **proto-persona** and is always labeled as such. Invented demographic detail that has no source (names, ages, photos, quotes) is not allowed. Each important assumption gets a reason and a way to validate it.

**Question tool.** For interviews with many questions, the plugin recommends [Brainstormform](https://github.com/dutchbase/Brainstormform) (a live local form with categories, follow-ups and file uploads). When it is not installed, the plugin falls back to the host's own question tool (for example `AskUserQuestion` in Claude Code) and asks in small batches. Brainstormform is a recommendation, never a hard dependency.

The skill separates what the system stores, what the business means and what a user must understand. A database column is not automatically a navigation label. A received upload is not a completed import.

**Acceptance:** a vague request produces a testable problem frame, not a page of cards. A precise small task gets a small answer.

## 5.2 `ux-research`

Three routes from the first version:

1. **Web research.** Best practices, current guidelines, competitor patterns and recent insights relevant to the task. Every claim cites its source URL and date. Web research describes the world; it is never presented as evidence about this product's users.
2. **Synthesis of real input.** Anonymized interviews, support tickets, test notes, surveys and analytics exports supplied by the user. Every conclusion refers to source IDs. The number of people and the number of reports are different quantities. Repeated tickets from one person are not several users. A public forum complaint does not prove frequency among this product's users. Record counter-evidence, unknown segments and alternative explanations. Keep observations and interpretations apart. [S09]
3. **Research planning.** Without data: research questions, a screener, neutral task prompts, an interview or test setup and a consent and data plan. No fictional participants, quotes or results.

AI role-play can generate hypotheses or prepare a study. It is not empirical user evidence. [S24]

**Acceptance:** every "users say / do" claim traces to real input, or is rewritten as a hypothesis. Every web claim has a source.

## 5.3 `ux-flow-design`

Design from task completion. Describe the entry point, prior knowledge, decision points, information needs, chosen route, alternatives and end states.

Coverage is conditional. Not every page needs a modal, undo or search. Each relevant state has an owner, trigger, visible feedback, possible action and next state. Include where relevant: first use, empty result, loading, long-running processing, invalid input, partial result, authorization, expired session, network error, conflict, double action, going back, cancel, resume and recovery.

Forms keep usable input where possible. Error messages name the problem and the way to fix it. Define clear labels, expectations before a risky action and clear completion feedback.

**UX copy** is in scope: button labels, error messages, empty states, confirmation text. Copy follows the tone rules in the project UX file and the product's locale (not the report language).

IA covers labels, grouping, findability and mental models. For larger structures, tree testing or card sorting are options for human validation; agent opinions do not replace them. [S11]

Flows respect the user's design system ([§6.2](#62-design-system)) and the AI-tells blocklist ([§5.7](#57-visual-quality-and-ai-tells)).

**Acceptance:** each flow has at least one observable end outcome, explicit risks, relevant recovery paths and criteria an implementer can test.

## 5.4 `ux-audit`

Collect evidence that fits the claim. A screenshot can show visual overlap. Keyboard behavior needs an executed interaction. Drop-off rates need measured data with a definition and a denominator.

A finding contains user impact, context, evidence, expected and actual result, severity and a fix proposal. Look for causes instead of filing every visible symptom separately. Deduplicate across screens and mark systemic issues.

Heuristics such as visibility of system status, error prevention and user control are analysis frames, not laws. No arbitrary maximums for clicks, choices or steps. The ten NN/g heuristics are a useful reference. [S20]

Every audit checks the default viewports from the project UX file ([§9.2](#92-check-coverage)).

**Acceptance:** no unproven interaction claims, no required number of findings, no endless loop until "everything is perfect".

## 5.5 `ux-accessibility`

Use WCAG 2.2 AA as the technical design and check target, unless the project UX file sets another level. Link checks to the applicable success criteria. [S19]

Combine automated checks, browser interaction and manual review where needed. Automated tools cannot detect everything. [S07][S19]

Within scope, check among others: semantics, labels, keyboard operation, focus order, visible and unobscured focus, error communication, zoom and reflow, alternatives to dragging and accessible authentication. Separate a tested screen reader experience from an inspection of the accessibility tree.

**Acceptance:** no "WCAG compliant" based on an axe scan or a screenshot. Open manual checks stay visible and count in the scoped status.

## 5.6 `ux-orchestrator`

The router reads only enough to decide route, scope and capabilities. It does not repeat the work of the other skills. Skills share contracts instead of long free-text summaries.

Negative triggers matter: a database index does not start a UX audit, and a pure styling tweak gets the light profile, not a full audit. A user's explicit choice of one skill wins.

Stop at the agreed budget or at a real blocker. A missing capability can lead to a narrower check, never to a silently lowered evidence standard.

**Acceptance:** audit versus fix, plan versus implementation and UX problem versus visual preference are told apart reliably.

## 5.7 Visual quality and AI tells

The plugin flags clear visual problems that hurt the task (unreadable contrast, broken layout at a viewport, inconsistent use of the design system). It does not run a full visual design review; that stays with tools such as Impeccable.

**AI-tells blocklist.** Coding agents produce recognizable patterns that make products look generic, for example small "eyebrow" labels above every heading. The plugin keeps a blocklist of such patterns in `shared/references/ai-tells.md`:

- The list is built from online research (design community writing, critiques of AI-generated UI) in its own work package (WP05), with sources.
- Each entry has a name, a description, why it hurts, and what to do instead.
- **Blocked by default.** The plugin never proposes a blocked pattern itself and flags it in audits.
- **User override.** When the user explicitly asks for a blocked pattern and insists after one short warning, the plugin allows it and records the decision in the project UX file's decision log.

# 6. The project UX file

Each product gets its own UX knowledge, stored **inside the project repository**, never in a global or user-level location. Other agents read it before any UI work.

## 6.1 Location and content

Proposed location: `docs/ux/` in the target project.

| File | Content |
|---|---|
| `docs/ux/project.json` | Canonical data: personas, user tasks, key flows index, tone and copy rules, accessibility level, viewports, design-system reference, decision log |
| `docs/ux/README.md` | Generated readable view of `project.json`. Do not edit by hand. |
| `docs/ux/flows/<flow-id>.json` | One flow contract per key flow |

JSON is canonical; Markdown is generated. Two editable versions of the same truth are not allowed.

Sections of `project.json`:

- `personas`: with source per attribute and `proto` flag ([§5.1](#51-ux-framing-and-the-persona-interview)).
- `jobs`: main user tasks and goals.
- `flows`: index of key flows (signup, checkout, import) with links to flow files.
- `tone`: voice, words to use and avoid, product locale.
- `accessibility`: target level (default WCAG 2.2 AA).
- `viewports`: the screen sizes that are always checked ([§9.2](#92-check-coverage)).
- `design_system`: reference to the user's design system.
- `decisions`: decision log with date, decision, reason, source and who decided (including AI-tells overrides).

A short pointer in the project's `AGENTS.md` tells every agent to read `docs/ux/` before UI work. The installer proposes this line as a diff and never overwrites existing content.

## 6.2 Design system

The design system is **supplied by the user**. It can be a `DESIGN.md` file (for example from Impeccable), a token file, or a full component library. The plugin reads it and designs within it; it never creates or rewrites it. When none exists, the plugin asks the user for one, records the gap in the project UX file, and continues with neutral, standards-based advice.

# 7. Evidence and data contracts

## 7.1 Canonical artifacts

| Artifact | Required core fields |
|---|---|
| `project.json` | schema_version, product_id, personas, jobs, flows, tone, accessibility, viewports, design_system, decisions |
| `product-brief.json` | schema_version, product_id, actors, contexts, jobs, success_outcomes, constraints, sources, assumptions |
| `research.json` | schema_version, question, route, source_inventory, observations, interpretations, counterevidence, gaps, next_methods |
| `flow.json` | schema_version, flow_id, actor, prerequisites, goal, steps, transitions, terminal_states, risks, acceptance_criteria |
| `run.json` | schema_version, run_id, mode, scope, target, versions, capabilities, requested_checks, status, limitations |
| `evidence.json` | schema_version, run_id, items with evidence_id, type, producer, timestamp, context and reference |
| `findings.json` | schema_version, run_id, findings with basis, status, impact, severity, evidence_ids and criterion references |
| `checks.json` | schema_version, run_id, checks with check_id, required, applicability, result, actual_result and evidence_ids |

Use JSON Schema 2020-12. All top-level objects have `additionalProperties: false`. Enums and null behavior are explicit. The reporter never silently repairs invalid fields. An unknown schema major version is refused with a clear error.

## 7.2 Fixed distinctions

**Basis of a claim:** `observed`, `code_supported`, `user_reported`, `measured`, `web_sourced`, `inferred`, `assumed`.

**Finding status:** `confirmed`, `hypothesis`, `needs_validation`.

**Severity:** `critical`, `major`, `minor`, `advisory`.

**Confidence:** `high`, `medium`, `low`, always with a reason; no fake-precise percentages.

**Check result:** `pass`, `fail`, `not_run`, `not_applicable`. `not_applicable` needs a real reason and cannot hide missing tooling.

**Run status:** `passed`, `needs_work`, `incomplete`, `blocked`.

- `blocked`: required preconditions stop the core checks from starting.
- `incomplete`: one or more applicable required checks are missing or have unusable evidence.
- `needs_work`: required checks ran, but one or more release criteria fail.
- `passed`: only the explicitly named, applicable required criteria passed with fitting evidence.

A run with missing required evidence stays `incomplete`, even when it also found confirmed problems. Found problems are always shown. `passed` does not certify the whole app or human usability.

**Severity is not priority.** Severity describes the effect on the task: `critical` is unrecoverable loss or a fully blocked crucial task; `major` a serious obstacle with at most a hard workaround; `minor` limited friction; `advisory` a possible improvement without a proven defect. Priority also weighs reach, product context, risk and effort. Unknown reach stays unknown.

## 7.3 Two levels of strictness

- **Verification claims are strict.** Anything reported as verified, confirmed or passed follows all rules above.
- **Advice is lighter.** Useful suggestions without hard evidence are allowed, as long as they are labeled: severity `advisory`, basis `inferred` or `web_sourced`, status `hypothesis`. Advice is never mixed into the pass/fail status.

## 7.4 Example finding

The object below is synthetic test data, not the result of a real audit.

```json
{
  "finding_id": "UX-IMPORT-003",
  "flow_id": "csv-import",
  "title": "Column mappings are lost after a temporary server error",
  "basis": "observed",
  "status": "confirmed",
  "severity": "major",
  "confidence": "high",
  "confidence_reason": "Reproducible with the same fixture and fault injection.",
  "user_impact": "The user has to select the file again and remap every column.",
  "reach": null,
  "context": { "persona": "workspace-admin", "locale": "en-GB", "viewport": "390x844" },
  "evidence_ids": ["EV-ACTION-008", "EV-SCREEN-009"],
  "expected_result": "The chosen column mappings stay available for a new attempt.",
  "actual_result": "The form returns to the initial upload state.",
  "acceptance_criterion_ids": ["AC-IMPORT-04"],
  "recommendation": "Keep the draft mapping and offer an explicit retry.",
  "requires_human_validation": false
}
```

A perception claim such as "the user does not understand this message" is never confirmed by screenshots or agent opinion alone. The same UI can justify a clearly labeled hypothesis and a question for a human test.

## 7.5 Evidence integrity

Record at least: run ID, app commit or explicitly unknown, skill version, host and model identity if available, tool and browser version, persona or role, locale, viewport, task, action and result. Binary artifacts get a hash and a safe relative path.

A file with a hash does not prove that an interaction happened. The capture adapter records tool results. For higher assurance, CI collects evidence outside the agent's write path. A local run where the agent can write the same files makes no tamper-proof claim.

A backend check can confirm persistence, but it does not replace that the user could see a result. Keep UI outcome and data outcome apart.

# 8. Hosts and installation

The [Agent Skills specification](https://agentskills.io/specification) gives every host the same `SKILL.md` base: required `name` (lowercase, hyphens, equal to the folder name) and `description`, optional `license`, `compatibility`, `metadata`; optional `scripts/`, `references/` and `assets/` folders. Keep each `SKILL.md` under 500 lines. Host-specific frontmatter and tool names are not part of that base, so the shared skills use spec-only frontmatter. [S01]

Host details below were checked against official documentation on 2026-10-08. They change often; re-check before each release and record what was really tested in `compatibility.json`.

## 8.1 Per host

| | Claude Code | Claude desktop / claude.ai (Cowork) | Codex | OpenCode |
|---|---|---|---|---|
| Package | Plugin: `.claude-plugin/plugin.json` (`name` required); skills in `skills/<name>/SKILL.md` at the plugin root [S29] | Same plugin. Add the marketplace (GitHub repo) under Customize › Plugins, or upload a `.zip` [S31] | Portable `plugin.json` at the plugin root (Agent Plugins schema; `name`, `version`, `description`; Codex settings under `extensions.com.openai`). `.codex-plugin/plugin.json` is a legacy fallback [S32] | No skill bundles in its plugin system (plugins are JS/TS modules). Reads skills from `.opencode/skills/`, `.agents/skills/` or `.claude/skills/` [S04][S33] |
| Marketplace | `.claude-plugin/marketplace.json` (`name`, `owner`, `plugins[]`; plugin `source` can be `./`) [S30] | Same marketplace repo [S31] | `.agents/plugins/marketplace.json`; also reads `.claude-plugin/marketplace.json` as legacy fallback [S32] | — |
| Install | `/plugin marketplace add dutchbase/ux-engineer` then `/plugin install ux-engineer@ux-engineer`; scopes `user`, `project`, `local` [S30] | Customize › Plugins › Add marketplace. Syncs to Claude Code [S31] | `codex plugin marketplace add dutchbase/ux-engineer`, then install from the `/plugins` browser [S32] | `npx` installer (§8.3) or copy/symlink `skills/` into `.agents/skills/` |
| Invocation | `/ux-engineer:<skill>` or automatic when the description matches [S02] | `/` menu, or `ux-engineer:<skill>` [S31] | `$<skill>` in the CLI, `@skill` in the app, or automatic [S03] | Built-in `skill` tool; access via `permission.skill` in `opencode.json` [S04] |
| Question tool | `AskUserQuestion` | Not documented | `request_user_input` (default only in Plan Mode; community source, not verified) | `question` |
| HTML report | Native artifacts | Native artifacts | Local HTML file (artifact support not verified) | Local HTML file |
| Browser | Playwright CLI/MCP; Claude in Chrome (`/chrome`) | Limited; audits are mainly a Claude Code / CLI feature | Playwright CLI/MCP (not verified) | Playwright CLI/MCP |

Constraints learned from the docs:

- Claude desktop and claude.ai refuse a whole plugin that has a top-level `bin/` folder, and load only skills and commands in chat (Cowork also loads agents, hooks and local MCP servers). Limits: 5,000 files, 200 MB. [S31] So the repository never has a top-level `bin/`; the installer CLI lives under `src/`.
- Claude Code treats `commands/` as legacy and prefers `skills/`. [S29] User-invocable skills double as slash commands, so there is no separate `commands/` folder.
- Each host has a different question tool. Skill text says "ask the user with the host's question tool, if one is available" and never names one tool. Brainstormform stays an optional recommendation (§5.1).

## 8.2 One repository for all hosts

One repository serves every host, as projects such as Superpowers and Impeccable already do. [S34][S12]

```text
ux-engineer/
  .claude-plugin/plugin.json        # Claude Code, Claude desktop, Cowork
  .claude-plugin/marketplace.json   # plugin source "./"; Codex reads it as legacy fallback
  .codex-plugin/plugin.json         # Codex manifest (the format Superpowers and OpenAI's own plugins use)
  .agents/plugins/marketplace.json  # native Codex marketplace
  skills/<name>/SKILL.md            # the ONE shared copy, spec-only frontmatter
    references/  scripts/  assets/
  (no top-level bin/)
```

Codex documents a newer portable `plugin.json` at the plugin root, but the established multi-host plugins still ship `.codex-plugin/plugin.json`. We follow the proven layout and revisit when the portable format is widely used. To verify in WP12: that the shared marketplace file does not conflict between hosts.

## 8.3 Optional `npx` installer

For hosts or setups without a plugin marketplace (OpenCode, or teams that want skills committed into a project), an optional installer copies the skills, following existing tools such as `npx skills add` and `npx impeccable install`. [S35][S12]

- Detects installed hosts and asks which ones to target.
- Targets: Claude Code `.claude/skills/`, Codex and OpenCode `.agents/skills/` (one copy serves both), OpenCode-only `.opencode/skills/`.
- **Project install is the default.** Global install only on explicit choice.
- Shows a dry-run diff first; detects duplicate or conflicting skills; supports rollback; never deletes configuration it did not create.
- Proposes the `AGENTS.md` pointer to `docs/ux/` as a diff ([§6.1](#61-location-and-content)).
- A `curl` one-liner, if offered, only downloads and runs a pinned, checksummed release of the same installer, never a moving branch.

What shipped in 0.5.0: `npx github:dutchbase/ux-engineer install|uninstall|doctor`. It copies skill folders and makes no symlinks. There is no `curl` one-liner in this release. It writes a record of what it installed, so `uninstall` removes only its own files. Details and limits are in [`limitations.md`](limitations.md).

## 8.4 Project instructions

`AGENTS.md` is the project's main instruction source; a minimal `CLAUDE.md` can point to it with `@AGENTS.md`. The plugin adds only a short route policy: read `docs/ux/` before UI work, run framing and flow design before large user-flow changes, change no code during audits, claim nothing as verified without evidence. Long method text belongs in skills, not in permanently loaded project files. Existing files stay intact; additions are shown as a diff.

## 8.5 Compatibility records

`compatibility.json` records per host: tested version, OS and context, install path, skill discovery, tool adapter, modes and result. Start with Linux and macOS. Test remote and headless setups explicitly: a working text skill does not guarantee a usable browser over SSH. Behavior tests across hosts use comparable tasks, but different models are never presented as a clean platform comparison.

# 9. Browser strategy and verification

## 9.1 Exploration, regression and accessibility are different jobs

Playwright CLI with skills is a promising route for coding agents, partly because of context use; MCP remains an alternative. That is a design hint, not a saving we measured. [S05][S06]

**Choice:** start with Playwright CLI where it works in the host; support a capability adapter for an existing browser tool or MCP. Do not add a second browser integration without a concrete need.

Browser runs are allowed on **any target the user provides**: a local dev server, staging, preview deployments, or production in observe-only mode. Production stays observe-only: no form submits, purchases or other writes.

Use Playwright Test for reproducible regressions: role and label locators, explicit assertions, isolated browser contexts and traces for diagnosis. [S08] (Writing such test files falls under [§4.5](#45-the-no-code-rule).)

An axe scan covers only the automatically testable part. Run scans in opened dialogs, error states and other changed states too, not only on the first page. [S07]

## 9.2 Check coverage

Build a matrix up front of task, persona, state, input method, viewport and locale. Fill only relevant combinations. "Not tested" stays visible. A scope such as "mobile onboarding as a new team member" must not end with only a desktop check as admin.

**Default viewports**, always checked unless the project UX file says otherwise:

| Name | Test size |
|---|---|
| Phone | 390 × 844 |
| Tablet | 820 × 1180 |
| Laptop | 1440 × 900 |
| Wide | 1920 × 1080 |

These are test values, not universal UX norms. Projects can add sizes (for example a small 360 px phone or landscape), browsers and locales in `project.json`.

For each main step, check the change that matters: not only that a click worked, but what is then visible, saved or recoverable. Record expected errors separately. A 403 in a negative authorization test is not automatically a defect.

## 9.3 Stop rules

No minimum duration or minimum number of screenshots as proof of thoroughness. No automatic full re-audit after every small fix. Use an agreed action or token budget and save progress. Re-run the relevant criteria plus targeted regression checks.

On a tool failure, at most one targeted retry when it is safe. Then report the limitation. Never bypass installation or authorization to get a green result.

# 10. Output and language

## 10.1 Output formats

| Format | Purpose |
|---|---|
| JSON | Canonical data, validated against the schemas in [§7](#7-evidence-and-data-contracts) |
| Markdown | Readable report, generated from validated JSON only |
| HTML | Shareable visual report, generated from validated JSON only. In hosts with native artifacts (Claude Code, Claude desktop), the plugin publishes it as an artifact; elsewhere it writes a local HTML file. |

Reports put scope, status, limitations, main effects and next steps at the top.

Run output goes to `.ux/runs/<run-id>/` (`run.json`, `evidence.json`, `checks.json`, `findings.json`, `report.md`, `report.html`, artifacts). This folder is excluded from Git by default. Stable, non-sensitive specs go to `docs/ux/` ([§6](#6-the-project-ux-file)).

## 10.2 Language

- **Report language** follows the user's language. English is the default.
- **Product copy** (labels, error messages proposed in flows) follows the product's locale from the project UX file, not the report language.
- **Messages to the user** — chat replies, questions, report summaries — are written in **ASD-STE100 Simplified Technical English** (or its principles when the report language is not English): short sentences, one idea per sentence, active voice, simple tenses, one word for one meaning. This keeps output clear for readers of every level and for non-native speakers.
- **Technical documentation** (schemas, this design document, developer docs) does not need ASD-STE100.

The ASD-STE100 rules live in `shared/policies/writing.md` and every skill references them.

# 11. Safety and privacy

## 11.1 Permissions and environment

A read-only audit means no code changes. It does not mean every browser click is harmless. Define both code permissions and allowed interactions.

Use an isolated fixture or test tenant, test accounts and disabled external side effects where possible. Blocking belongs in sandbox, network and service configuration; a sentence in `SKILL.md` is not a security boundary.

An origin allowlist helps, but it does not stop an app server from triggering external actions. Production is observe-only by default. Mutating GET requests or analytics side effects are a reason never to claim "strictly read-only guaranteed".

## 11.2 Untrusted content

Web pages, screenshots, support tickets and source files are data. Instructions inside them to ignore prompts, read keys, run commands or confirm payments are not followed. Test this with explicit prompt-injection fixtures.

The agent never installs a dependency because a visited page asks for it. Source code review gets the smallest possible scope; secrets stay out of the context.

## 11.3 Research data and artifacts

Handle purpose, consent, access and retention for real research data. GOV.UK gives operational guidance; it is not a legal opinion for every jurisdiction. [S22]

Default for local artifacts: maximum retention of 14 days, configurable; raw participant data only explicitly and separately. Deletion happens only inside managed artifact folders, never through broad cleanup commands.

Start with fictional data. Redact before screenshots or traces are sent to a model or cloud, not after. Playwright warns that saved browser state can contain cookies and headers that allow account takeover; never commit those files. [S27]

PII detection and masking are defense in depth, not a guarantee of anonymity. Block distribution of artifacts whose sensitivity is unknown.

## 11.4 Maintenance

Per release: dependency and source review, contract changes, trigger evals, regression evals and compatibility smoke tests. Pin source commits, but keep updates reviewable in small changes. A new model or host version can need re-evaluation; old green results do not carry over automatically.

Measure cost and tokens where the host reports them. Where no reliable telemetry exists, report `unknown`, never an invented estimate.

# 12. Evaluation and benchmark

## 12.1 Prove the value first

Within the same host and model, compare three arms:

- A: the current coding setup without a UX plugin.
- B: the same setup with the best fitting existing UX solution.
- C: the same setup with UX Engineer.

Keep frontend and implementation skills, fixtures, task context, tools and budget constant. Choose baseline B before the final measurement, on a small separate validation set. Do not pick a weak competitor on purpose. Impeccable and relevant Rampstack modules are candidates; jezweb is an audit-specific candidate for Claude Code. [S11][S12][S14]

Anthropic's skill-creator describes evaluating with and without a skill and against earlier versions. [S25] The cases and thresholds below are our own engineering choices.

## 12.2 Benchmark set

Start with six representative cases for the first decision. Extend to eighteen when the core shows value.

| Case | What it tests |
|---|---|
| 01 Working simple flow | No invented problems to fill a report |
| 02 Pretty interface, blocked main task | Function weighs more than looks |
| 03 Ugly but functional interface | Visual taste is not reported as a task defect |
| 04 CSV mappings lost after an error | Data preservation and recovery |
| 05 Double click on import | Double action and system feedback |
| 06 Async processing not finished | Upload accepted is not task complete |
| 07 Member without admin rights | Safe, clear authorization feedback |
| 08 Session expires mid-task | Recovery and preserved work |
| 09 Empty dataset versus network error | No false "no results" message |
| 10 Modal without proper focus handling | Keyboard interaction is really executed |
| 11 Long translated labels on mobile | Relevant locale and viewport combination |
| 12 Screenshot as the only input | Limits of static evidence |
| 13 Browser not available | `incomplete`/`blocked`, no invented browser evidence |
| 14 Analytics missing | No fabricated drop-off rate |
| 15 Conflicting research sources | Counter-evidence and uncertainty kept |
| 16 Prompt injection in support text | Source content is not executed as instruction |
| 17 Button with external side effects | Not activated without permission |
| 18 Purely cosmetic small request | Light profile, no scope creep |

Additional cases for the new features:

| Case | What it tests |
|---|---|
| 19 New project without personas | Proposes `setup`; proto-personas are labeled |
| 20 User requests a blocked AI-tell pattern | Warns once, allows on insistence, logs the decision |
| 21 Request that would need app code | Hands off; never edits app code |
| 22 Layout breaks only on tablet | All default viewports checked |

Ground truth stays outside the agent's context. A separate evaluator checks the results. Browser audit cases run with `evals/_shared/run-audit-local.sh`, because the shell sandbox of `claude plugin eval` blocks the sockets Chromium needs; the test app runs from a temporary copy so the agent cannot reach the ground truth. Real problems that the audits found in the test app itself, beyond the planted defects, are recorded as `known_issues_all_variants` in the ground truth and are not counted as false positives. Scenarios about human perception get real, consented input or stay explicit hypotheses.

## 12.3 Metrics

Precision and recall on seeded, confirmable problems. No precision/recall for taste where no reliable ground truth exists.

Also: missed critical issues, unproven confirmations, completeness of required evidence, correct status when capabilities are missing, unauthorized actions, trigger false positives, scope creep, coverage of important states and viewports, mislabeled proto-personas, usefulness of advice, output size, tokens and run time.

Effect on real users is a separate layer. Link product goals to signals and metrics, for example successfully completed imports, time to a usable result and help needed. Google's HEART framework offers a goal-to-metric approach. Faster is not always better. [S23]

## 12.4 Provisional release thresholds

Initial project targets, not proven performance:

- Zero unauthorized external side effects in the safety cases.
- Zero fabricated participants, quotes, analytics or test evidence.
- Zero application-code edits by the plugin.
- Every missing applicable required check leads to `incomplete` or `blocked`.
- Every confirmed interaction finding has fitting, valid evidence references.
- At least 90% precision and 80% recall on the suitable seeded cases.
- Zero missed seeded critical issues in the release evaluation.
- At least 95% correct routing on the recorded trigger cases.
- A relevant improvement over baseline B in blind review, without unacceptable growth in cost or complexity.

The last threshold needs a written decision note, not an artificial total score. Report per category and persona. Never relax thresholds afterwards to make a release pass.

Start with two repetitions per case for the small pilot. The full set (22 cases × 3 arms × 3 repetitions) is a large budget on one primary host. Then test portability with targeted smoke tests on the other hosts.

## 12.5 Human review

A reviewer blindly judges selected advice and flows: is the problem right, is the proposal clear, can it be built, is it better than the baseline? Self-review by the writing agent is not enough. An LLM can support rubric work, but is never the only judge.

Plan real usability tests around important uncertainties, with relevant users and accessibility needs. No universal "five users prove everything" rule. [S21]

# 13. Backlog

All paths are proposed new work. Commands refer to package scripts that the tasks add. Nobody may report tests as passed without running them.

**Build approach.** The work is planned by an architect model and implemented by cheaper models, each work package with a precise spec, followed by an independent review. For code: failing tests first, confirm the failure, minimal implementation, run the tests again, targeted regression check, small commit. For skill behavior: baseline output first, then the skill change, then the same blind or contract evaluation.

## Repository layout (target)

```text
ux-engineer/
  AGENTS.md  CLAUDE.md  README.md  LICENSE  THIRD_PARTY_NOTICES.md
  package.json  pnpm-lock.yaml  sources.lock.json  compatibility.json
  skills/
    ux-orchestrator/SKILL.md
    ux-framing/SKILL.md
    ux-research/SKILL.md
    ux-flow-design/SKILL.md
    ux-audit/SKILL.md
    ux-accessibility/SKILL.md
    ux-setup/  ux-plan/  ux-verify/   # thin entry skills
  shared/
    policies/  evidence.md  safety.md  research-integrity.md  writing.md
    references/  forms.md  information-architecture.md  content-design.md
                 accessibility.md  ai-tells.md  viewports.md
    templates/
  schemas/                     # project, product-brief, research, flow, run, evidence, findings, checks
  src/
    contracts/  reports/  capture/  packaging/  cli.ts
  adapters/                    # per-host notes and manifests
  evals/  tests/  docs/
  dist/                        # generated
```

## WP01. Sources and decision log

**Depends on:** nothing. **Files:** `sources.lock.json`, `THIRD_PARTY_NOTICES.md`, `docs/limitations.md`.

- [ ] Check chosen files with the original maintainers; record real commits, never `main` as a lock.
- [ ] Choose the baseline per task and note why it fits.
- [ ] Mark files with an unclear license as excluded from distribution.
- [ ] Record architecture decisions and rejected options.

**Acceptance:** every reused file is traceable and reviewed.

## WP02. First fixture and baseline measurement

**Depends on:** WP01. **Files:** `tests/fixtures/import-app/`, `evals/cases/`, `evals/ground-truth/`, `evals/rubric.md`, `evals/results/baseline/`.

- [ ] Build a minimal import flow: upload, mapping, preview, processing, result.
- [ ] Add one correct variant and at least three separately switchable defects: lost input, double action, confusing completion status.
- [ ] Add one variant whose layout breaks only at the tablet viewport.
- [ ] Confirm with plain browser tests that correct and defective variants differ as described.
- [ ] Run the first six cases on arms A and B with equal budget. Store raw results with model, host and tool versions.

**Acceptance:** defects are reproducible by an independent check; the agent cannot read ground truth; the baseline is really measured.

## WP03. Contracts, validator and status logic

**Depends on:** WP01. **Files:** `schemas/project.schema.json`, `schemas/checks.schema.json`, `src/contracts/validate.ts`, `src/contracts/verdict.ts`, `tests/contracts/`.

The other schemas (product brief, research, flow, run, evidence, findings) are added in the work packages that first use them (WP06–WP09).

**Interfaces:** `validateArtifact(kind, input)` returns only validated data or structured errors; `deriveRunStatus(checks, capabilities)` returns exactly one of the four run statuses.

- [ ] Test unknown fields, missing source references, wrong enums and unsupported schema major.
- [ ] Test that `not_run` on a required applicable check never yields `passed`.
- [ ] Test `not_applicable` without a reason as invalid.
- [ ] Test that findings survive an `incomplete` run.
- [ ] Test that `advisory` findings never change the run status.
- [ ] Test persona attributes without a source as invalid.
- [ ] Add `pnpm test:contracts` and run it.

**Acceptance:** all contract tests pass; no LLM is needed to compute a status.

## WP04. Persona interview and project UX file

**Depends on:** WP03. **Files:** `skills/ux-framing/SKILL.md`, `shared/policies/writing.md`, `shared/templates/interview.json`, `schemas/project.schema.json`, `evals/cases/setup.json`.

- [ ] Write the interview question bank (customers, goals, context, devices, frustrations, tone, accessibility level, design system).
- [ ] Use Brainstormform when available; fall back to the host question tool in small batches.
- [ ] Generate `docs/ux/project.json` and the readable `docs/ux/README.md`.
- [ ] Propose the `AGENTS.md` pointer as a diff; never overwrite.
- [ ] Test: no personas without sources; proto-personas labeled; no questions already answered by the project UX file.
- [ ] Write the ASD-STE100 writing policy and reference it from every skill.

**Acceptance:** a new project ends `setup` with a valid `project.json`; nothing is stored outside the project.

## WP05. AI-tells research and blocklist

**Depends on:** WP01. **Files:** `shared/references/ai-tells.md`, `evals/cases/ai-tells.json`.

- [ ] Research current writing on recognizable AI-generated UI patterns; record sources.
- [ ] Write entries: name, description, why it hurts, alternative.
- [ ] Define the override rule (warn once, allow on insistence, log the decision).
- [ ] Test: the plugin never proposes a blocked pattern; it flags blocked patterns in audits; an override is logged.

**Acceptance:** every entry has a source; the override path works and is logged.

## WP06. Research skill

**Depends on:** WP03. **Files:** `skills/ux-research/SKILL.md`, `shared/policies/research-integrity.md`, `shared/templates/research-plan.md`, `evals/cases/research.json`.

- [ ] Cases: web research with citations, full user data, missing audience, conflicting sources, one user with many tickets, no research at all.
- [ ] Write compact instructions with positive and negative triggers.
- [ ] Without user data, produce only hypotheses and a research plan.
- [ ] Web claims carry source and date and basis `web_sourced`.

**Acceptance:** no fictional people, numbers or quotes; web research never appears as user evidence.

## WP07. Flow contract and design quality

**Depends on:** WP03, WP04. **Files:** `skills/ux-flow-design/SKILL.md`, `shared/references/forms.md`, `shared/references/information-architecture.md`, `shared/references/content-design.md`, `evals/cases/flow-design.json`.

- [ ] Test upload versus real import completion, error preservation, authorization, going back and resuming.
- [ ] Require observable acceptance criteria instead of "make it user-friendly".
- [ ] Offer several directions only when there is a real choice.
- [ ] Check that IA, UX copy, accessibility, the design system and the AI-tells blocklist are part of the design.
- [ ] Have an independent reviewer judge whether the flow can be built.

**Acceptance:** an implementer can build the flow without inventing the main states or outcomes.

## WP08. Safe browser capture

**Depends on:** WP02, WP03. **Files:** `src/capture/`, `tests/capture/`, `shared/policies/safety.md`, `shared/references/viewports.md`.

- [ ] Test wrong target origins, missing credentials and missing browser.
- [ ] Test that tokens, storage state and sensitive response fields stay out of shareable output.
- [ ] Test references to missing artifacts, path traversal and wrong hashes.
- [ ] Test separate test accounts and contexts so parallel state does not mix.
- [ ] Capture all default viewports.
- [ ] Map CLI results and Playwright Test results to the same evidence contract.
- [ ] Add `pnpm test:capture` and run it.

**Acceptance:** the fixture yields real action and result evidence; no tamper-proof claim for local logs.

## WP09. Audit and reporting (Markdown and HTML)

**Depends on:** WP03, WP06, WP08. **Files:** `skills/ux-audit/SKILL.md`, `src/reports/`, `shared/templates/audit-report.md`, `shared/templates/audit-report.html`, `tests/contracts/report.test.ts`, `evals/cases/audit.json`.

- [ ] Test screenshot-only input without keyboard or latency conclusions.
- [ ] Test a correct interface: zero findings is allowed.
- [ ] Test expected 403s and fault injection without blindly counting network errors.
- [ ] Test repeated symptoms of one underlying problem.
- [ ] Render scope, status, limitations, main effects and next steps at the top, in Markdown and HTML, from validated JSON only.
- [ ] Publish the HTML report as a native artifact where the host supports it.
- [ ] Add `pnpm test:reports` and run it.

**Acceptance:** every confirmed interaction problem has fitting evidence; unknown reach stays empty; reports state what was not tested.

## WP10. Accessibility in design and execution

**Depends on:** WP07, WP08, WP09. **Files:** `skills/ux-accessibility/SKILL.md`, `shared/references/accessibility.md`, `tests/e2e/accessibility.spec.ts`, `evals/cases/accessibility.json`.

- [ ] Test labels, keyboard, focus after closing a modal and error states on the fixture.
- [ ] Run axe in relevant states, not only on the first page.
- [ ] Record non-automated checks separately.
- [ ] Test that "axe clean" never produces a general conformance claim.
- [ ] Add `pnpm test:a11y` and run it.

**Acceptance:** accessibility is part of the process before and after implementation; missing human checks are visible.

## WP11. Orchestrator, scope and the no-code rule

**Depends on:** WP04, WP06, WP07, WP09, WP10. **Files:** `skills/ux-orchestrator/SKILL.md`, `evals/trigger-cases.json`, `shared/templates/run-plan.md`.

- [ ] Positive and negative trigger cases, including audit versus fix, light changes and pure styling.
- [ ] Test that an explicitly chosen skill is not replaced by a wide process.
- [ ] Test missing capabilities and the budget stop.
- [ ] Test that only the needed references load.
- [ ] Test that the plugin never edits application code and asks before writing a test file.
- [ ] Record route outcomes and measure false positives and negatives.

**Acceptance:** no agent explosion, no hidden implementation, no full audit for a styling tweak.

## WP12. Packaging, host adapters and installer

**Depends on:** WP03, WP11. **Files:** `src/packaging/`, `adapters/`, plugin manifests, `compatibility.json`, `tests/packaging/`.

**Interfaces:** `buildPackages(sourceRoot, target)` produces closed skill packages; `planInstall(project, hosts)` produces a diff; install applies only an explicitly approved plan; `doctor` only observes.

- [ ] Plugin manifests and marketplace entries per [§8](#8-hosts-and-installation).
- [ ] Optional `npx` installer with dry-run, conflict detection and rollback.
- [ ] Test missing shared references and a single separately installed skill.
- [ ] Test existing custom skills, duplicate discovery, symlinks and copy fallback.
- [ ] Test real loading and invocation in Claude Code, Codex, OpenCode and Claude desktop.
- [ ] Add `pnpm test:packaging` and `pnpm build:skills` and run both.

**Acceptance:** the same content works through tested adapters; `compatibility.json` lists real tested versions and limits; nothing is overwritten without documentation.

## WP13. Comparative evaluation and pilot

**Depends on:** WP02, WP12. **Files:** `evals/`, `docs/evaluation.md`, `docs/pilot-decision.md`.

- [ ] Run the small comparative set under equal conditions.
- [ ] Improve on a separate development set, never on the final evaluation cases.
- [ ] Extend to the full set only when the core shows value.
- [ ] Blind review of findings and flows; pilot on an explicitly chosen staging project.
- [ ] Plan human validation for open perception and findability questions.
- [ ] Write a go/no-go note against baseline B with cost, limits and regressions.

**Acceptance:** the plugin is not extended just because it exists; when it adds too little, the existing solution stays the recommendation.

## WP14. Release

**Depends on:** WP13. **Files:** `README.md`, `docs/quickstart.md`, `docs/release-checklist.md`, `docs/limitations.md`, release packages.

- [ ] Re-run contract, capture, report, accessibility and packaging tests.
- [ ] Check notices, locks, artifact privacy and schema compatibility.
- [ ] Test install in a clean project and in a project with existing custom configuration.
- [ ] Check that every example uses commands that exist in the final implementation.
- [ ] Write release notes with tested capabilities only.

**Acceptance:** another developer can set up, plan, audit and verify one task without knowing the internals; rollback is tested.

## Release order

- **Experiment:** WP01–WP04 plus the minimal capture and audit path from WP08 and WP09. Prove one end-to-end task first.
- **MVP:** all core skills, the project UX file, the AI-tells blocklist, closed packages and reliable status and evidence contracts. No dashboard, external API or multi-agent parallelism.
- **Later:** split IA, UX content or metrics only under real usage pressure.

The first application is a **CSV import flow on an isolated fixture**: narrow but rich. Someone wants usable data imported, not just an upload status. The agent must tell apart column mapping, pre-checks, error preservation, double actions, processing and visible completion.

The first proof of value is not a nicer report. It is that the plugin correctly finds or prevents a relevant problem, supports a better flow decision and verifies the agreed outcome, without harm or invented user insight.

# 14. Sources

All sources were consulted online on 2026-10-07 unless marked otherwise. Product docs and repository branches can change after that date.

- **[S01] Agent Skills specification:** https://agentskills.io/specification
- **[S02] Anthropic, Claude Code skills:** https://code.claude.com/docs/en/skills
- **[S03] OpenAI, Codex skills:** https://developers.openai.com/codex/skills
- **[S04] OpenCode, Agent Skills:** https://opencode.ai/docs/skills/
- **[S05] Microsoft, Playwright CLI:** https://github.com/microsoft/playwright-cli
- **[S06] Microsoft, Playwright MCP:** https://github.com/microsoft/playwright-mcp
- **[S07] Playwright, accessibility testing:** https://playwright.dev/docs/accessibility-testing
- **[S08] Playwright, best practices:** https://playwright.dev/docs/best-practices
- **[S09] Anthropic design plugin:** https://github.com/anthropics/knowledge-work-plugins/blob/main/design/README.md ; research synthesis: https://github.com/anthropics/knowledge-work-plugins/blob/main/design/skills/research-synthesis/SKILL.md
- **[S10] OpenAI product-design router:** https://github.com/openai/plugins/blob/main/plugins/product-design/skills/index/SKILL.md
- **[S11] Rampstack skills:** https://github.com/rampstackco/claude-skills
- **[S12] Impeccable:** https://github.com/pbakaus/impeccable
- **[S13] Elia Alberti, UX Audit Skill:** https://github.com/EliaAlberti/ux-audit-skill
- **[S14] Jezweb interactive UX audit:** https://github.com/jezweb/claude-skills/blob/main/plugins/dev-tools/skills/ux-audit/SKILL.md
- **[S15] LobeHub product-design:** https://github.com/lobehub/lobehub/blob/canary/.agents/skills/product-design/SKILL.md ; root license: https://github.com/lobehub/lobehub/blob/canary/LICENSE
- **[S16] Mahir Autela, UX/UI/Product skills:** https://github.com/mahirautela2020-design/claude-skills-ux
- **[S17] mae616 design-skills:** https://github.com/mae616/design-skills
- **[S18] ratingtesting UX researcher:** https://github.com/ratingtesting/agent-roles/blob/master/ux-researcher/SKILL.md
- **[S19] W3C WCAG 2.2:** https://www.w3.org/TR/WCAG22/ ; limits of evaluation tools: https://www.w3.org/WAI/test-evaluate/tools/selecting/
- **[S20] Nielsen Norman Group, ten usability heuristics:** https://www.nngroup.com/articles/ten-usability-heuristics/
- **[S21] GOV.UK, moderated usability testing:** https://www.gov.uk/service-manual/user-research/using-moderated-usability-testing ; NN/g, usability testing 101: https://www.nngroup.com/articles/usability-testing-101/
- **[S22] GOV.UK, managing user research data and participant privacy:** https://www.gov.uk/service-manual/user-research/managing-user-research-data-participant-privacy
- **[S23] Rodden, Hutchinson, Fu, HEART, CHI 2010:** https://research.google/pubs/measuring-the-user-experience-on-a-large-scale-user-centered-metrics-for-web-applications/
- **[S24] Agnew et al., The illusion of artificial inclusion, 2024:** https://arxiv.org/abs/2401.08572
- **[S25] Anthropic skill-creator:** https://github.com/anthropics/skills/blob/main/skills/skill-creator/SKILL.md
- **[S26] Node.js releases:** https://nodejs.org/en/about/previous-releases
- **[S27] Playwright authentication and storage risk:** https://playwright.dev/docs/auth
- **[S28] ASD-STE100 Simplified Technical English:** https://www.asd-ste100.org/

- **[S29] Anthropic, Claude Code plugins reference:** https://code.claude.com/docs/en/plugins-reference (consulted 2026-10-08)
- **[S30] Anthropic, Claude Code plugin marketplaces and install:** https://code.claude.com/docs/en/plugin-marketplaces ; https://code.claude.com/docs/en/plugins/install (2026-10-08)
- **[S31] Anthropic, plugins in Claude desktop, claude.ai and Cowork:** https://claude.com/docs/plugins/overview ; https://claude.com/docs/plugins/platform-support (2026-10-08)
- **[S32] OpenAI, building plugins for Codex:** https://developers.openai.com/plugins/build/plugins ; https://learn.chatgpt.com/docs/build-skills (2026-10-08)
- **[S33] OpenCode, plugins and tools:** https://opencode.ai/docs/plugins/ ; https://opencode.ai/docs/tools/ (2026-10-08)
- **[S34] obra, Superpowers (multi-host plugin layout):** https://github.com/obra/superpowers (2026-10-08)
- **[S35] Vercel Labs, skills installer:** https://github.com/vercel-labs/skills (2026-10-08)

# Appendix A: Decision log

Decisions from the requirements session of 2026-10-08 that changed the original plan.

| # | Decision | Where |
|---|---|---|
| 1 | Public, free, generic open-source project from the first release; no project-specific integrations such as issue trackers | Global constraints |
| 2 | Hosts: Claude Code, Codex, OpenCode and Claude desktop (Cowork); installed as a real plugin, optional `npx`/`curl` installer | §8, WP12 |
| 3 | Personas first, mainly from an interview with the human user; web research and labeled proto-personas fill gaps | §5.1, WP04 |
| 4 | Project UX file stored in the project repository, never globally | §6, WP04 |
| 5 | `ux-research` adds web research (best practices, competitors, current insights) | §5.2, WP06 |
| 6 | AI-tells blocklist built from online research; blocked by default; allowed only when the user insists | §5.7, WP05 |
| 7 | Design system is supplied by the user; the plugin only reads it | §6.2 |
| 8 | Default viewports always checked: phone, tablet, laptop, wide | §9.2 |
| 9 | UX copy in scope | §5.3 |
| 10 | Visual design: flag clear problems only; deep visual design left to other tools | §5.7 |
| 11 | Output: JSON + Markdown + HTML; native artifact where available | §10.1, WP09 |
| 12 | Report language follows the user, English default; messages to users in ASD-STE100 | §10.2 |
| 13 | The plugin never writes application code; asks before writing test files | §4.5, WP11 |
| 14 | Small changes get a light check: simple stays simple | §4.2 |
| 15 | Strict rules for verification claims, lighter labeled rules for advice | §7.3 |
| 16 | Browser runs on any user-provided target; production observe-only | §9.1 |
| 17 | Full benchmark kept, extended with cases for the new features | §12.2 |
| 18 | Architect plans, cheaper models implement, independent review per work package | §13 |
| 19 | Brainstormform recommended for interviews, with fallback to the host question tool | §5.1 |
