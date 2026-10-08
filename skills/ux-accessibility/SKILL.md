---
name: ux-accessibility
description: Turn accessibility needs into acceptance criteria or check them in a browser against WCAG 2.2. Use when the user or another skill asks for accessibility criteria, an accessibility check, a keyboard test, a focus check, a contrast or reflow check, or an axe scan. Do not use for fixing code, visual taste, or a general UX audit.
license: MIT
---

# UX accessibility

Work in one of two modes. Design mode writes acceptance criteria. Audit mode
checks a running interface and records the results. Never edit application
code, styles, content, or configuration. Hand fixes to the implementing agent.

Read `references/writing.md` before writing user-facing text. Read these
references before the matching work:

- `references/accessibility.md` for the criteria, check methods, and claim rules.
- `references/evidence.md` for claim strength, vocabularies, and run status.
- `references/safety.md` for targets, permissions, secrets, and retries.

Target level: the `accessibility` target in `docs/ux/project.json`, else WCAG
2.2 AA. Cite criteria as `WCAG 2.2 SC 2.4.7`.

## Claim limits

- Never write "WCAG compliant", "accessible", or "passes WCAG". An axe scan, a
  screenshot, or an accessibility snapshot cannot support these claims.
- A clean axe run is a `pass` only for the checks axe covers.
- Make a keyboard claim only after you executed the key presses.
- Claim a screen reader test only when you used a screen reader. An
  accessibility snapshot is an inspection of the tree, not a screen reader test.
- Record a check that did not run as `not_run`. Do not use `not_applicable`
  to hide missing tools.

## Design mode

Use this mode when the user or another skill asks for accessibility criteria,
or when the user asks for criteria before build.

1. Read `docs/ux/project.json` and the flow file, if they exist.
2. Take the flow's steps, states, forms, dialogs, and error states.
3. Select from `references/accessibility.md` only the criteria that apply to
   them. Do not list a criterion that has no matching element.
4. Write each as an observable acceptance criterion: `given`, `when`, `then`,
   `verify_with` (`browser` or `manual`), and `wcag_refs` with exact SC numbers.
5. Return the criteria to the caller. When you write a flow file, follow
   `ux-flow-design`. Do not write a second copy of the truth.

## Audit mode

Follow the `ux-audit` skill for the run folder, evidence, checks, findings,
validation, and rendering. Create `.ux/runs/<run-id>/` and write the four JSON
files with the schemas in `references/{run,evidence,findings,checks}.schema.json`.
Agree target, environment, test account, scope, and allowed actions with the
user first. Production is observe-only.

Use the host's browser tool. If none exists, ask the user before the first
download, then use the pinned Playwright CLI:

```text
npx --yes @playwright/cli@0.1.22
```

In the commands below, `playwright-cli` stands for that `npx` command. Run it
from inside the run folder, with one session per run, for example
`PLAYWRIGHT_CLI_SESSION=<run-id>`. Save screenshots and scan results in
`artifacts/` and hash them. Run `close` when you finish.

Select the checks that fit the scope. Give each a `check_id`, `required`, a
`result`, and `evidence_ids`. Mark a check `required` when the user's scope
needs it. Record these checks:

1. **Keyboard operation (SC 2.1.1, 2.1.2, 2.4.3, 2.4.7).** Walk the task with
   Tab, Shift+Tab, Enter, Space, and Escape. After each key press, record the
   focused element and take a screenshot of the focused state. Keep the key
   presses and results in an `action_log`.

   ```text
   playwright-cli press Tab
   playwright-cli eval "() => ({tag: document.activeElement.tagName, id: document.activeElement.id, name: document.activeElement.getAttribute('aria-label') || document.activeElement.textContent.trim().slice(0, 40)})" --raw
   playwright-cli screenshot --filename=artifacts/focus-<step>.png
   ```

   `--raw` prints only the value. Look for lost focus (the focused element is
   `BODY` after a step change), a focus order that does not follow the visual
   order, and a trap.

2. **Focus not obscured (SC 2.4.11) and dialogs.** Check that sticky headers,
   banners, and footers do not cover the focused element. For each dialog,
   record that focus moves into it, stays in it, and returns to the trigger
   after Escape or close.

3. **Names and labels (SC 1.3.1, 2.5.3, 3.3.2, 4.1.2).** Run `snapshot` and
   check that each control has a name, a role, and a state. Check that the
   visible text is part of the accessible name. Save the snapshot as a
   `dom_snapshot`.

4. **Reflow and zoom (SC 1.4.10, 1.4.4).** Resize to 320 CSS px wide and check
   for horizontal scroll. Zoom to 200% where the tool allows it. Save
   screenshots.

   ```text
   playwright-cli resize 320 800
   playwright-cli eval "() => ({scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth})" --raw
   ```

   `scrollWidth` larger than `clientWidth` means horizontal scroll.

5. **Target size (SC 2.5.8).** Measure pointer targets in CSS px. The
   command below lists only visible targets smaller than 24 by 24, including
   fixed and sticky elements. Do not report a listed target until you check the
   criterion's exceptions: an inline text link in a sentence, and a small
   target with enough free space around it (the spacing exception). An empty
   list means the scan found no small target of the types it covers. State in
   the check which element types the scan covered.

   ```text
   playwright-cli eval "() => [...document.querySelectorAll('a[href],button,input:not([type=hidden]),select,textarea,summary,[role=button],[role=link],[role=checkbox],[role=tab],[role=menuitem],[tabindex]:not([tabindex=\"-1\"])')].filter(e => e.getClientRects().length > 0 && getComputedStyle(e).visibility !== 'hidden').map(e => { const r = e.getBoundingClientRect(); return {el: e.tagName.toLowerCase() + (e.id ? '#' + e.id : ''), w: Math.round(r.width), h: Math.round(r.height)} }).filter(t => t.w < 24 || t.h < 24)" --raw
   ```

6. **Error identification and suggestion (SC 3.3.1, 3.3.3).** Enter invalid
   input only where the safety policy allows writes. Record whether the error
   names the field and tells the user how to fix it. Screenshot the error state.

7. **Automated scan with axe-core.** Ask the user before you load the script
   from the CDN. Pin the version. With Playwright CLI:

   ```text
   playwright-cli run-code 'async page => { await page.addScriptTag({ url: "https://cdn.jsdelivr.net/npm/axe-core@4.14.0/axe.min.js" }); return await page.evaluate(() => axe.version); }'
   playwright-cli eval "async () => await axe.run()" --raw > artifacts/axe-<state>.json
   ```

   If the script does not load (CSP, no network, blocked CDN), record the axe
   check as `not_run` with the reason. Do not change CSP, headers or page code
   to make it load.

   The first command should print `"4.14.0"`. The second saves the full JSON
   result. Hash the file and record it as an `axe_result` evidence item with the
   state in `context.step`.

   - Inject again after each page load or reload. A navigation removes the script.
     A change of state inside a single-page app keeps it.
   - Run the scan in each relevant state: first load, each step, each open
     dialog, and each error state. A scan of the first page load alone is not
     enough.
   - Count `violations`, `incomplete` (needs a person to review), and `passes`.
     Turn each violation into a finding with `criterion_refs`. Review each
     `incomplete` item by hand or list it as open.

8. **Screen reader.** If you used a screen reader, record its name, version,
   and scope in an `action_log`. If you did not, add a `not_run` check named
   `screen-reader` with `required` set from the scope, and state the limit in
   the run. Never replace it with an accessibility snapshot.

Add manual checks the table in `references/accessibility.md` lists for the
scope (for example SC 3.3.7 redundant entry, SC 3.3.8 authentication, SC 2.5.7
dragging). A manual check you cannot do stays `not_run`.

## Findings and status

- Link every finding to `criterion_refs`, for example `WCAG 2.2 SC 2.4.7`.
- Use basis `observed` or `measured` for confirmed findings, with evidence IDs.
  Use `requires_human_validation: true` for judgments such as label quality.
- A clean axe run does not close a criterion. Record the result only for the
  check that ran.
- A required check that is `not_run` or lacks evidence makes the run
  `incomplete`. Do not change that status.

## Validate and report

Run these commands from the target project. Replace `<skill>` with the
absolute path to this skill folder:

```text
node <skill>/scripts/ux.mjs validate-run <dir>
node <skill>/scripts/ux.mjs render <dir> --format both
```

Fix the JSON and repeat until validation succeeds. Summarize with
`references/writing.md`: status, top findings, checks that did not run, and
next steps. Do not use the words "compliant" or "accessible" for the product.
Keep secrets out of artifacts.
