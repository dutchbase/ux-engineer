# Accessibility reference (WCAG 2.2 A and AA)

Default target: WCAG 2.2 level AA. Use the level in `docs/ux/project.json` when
it sets another one. Sources:

- [WCAG 2.2](https://www.w3.org/TR/WCAG22/) for the exact text of each criterion.
- [Selecting web accessibility evaluation tools](https://www.w3.org/WAI/test-evaluate/tools/selecting/)
  for what automated tools can and cannot do.

This table lists the criteria that matter most for web apps. It is not the full
standard. Cite a criterion as `WCAG 2.2 SC <number>`. List only the criteria
that apply to the flow or scope.

## Check methods

- **automated**: an axe-core scan can detect part of the problem. A clean scan
  proves nothing about the rest.
- **keyboard**: execute real key presses in the browser and record the result.
- **measurement**: measure element boxes, colors, or text size in the browser.
- **manual**: a person reads the screen, the labels, or the copy and judges.

## Criteria

| SC | Level | Name | How to check | Evidence |
|---|---|---|---|---|
| 1.1.1 | A | Text alternatives | automated + manual | `axe_result`; a note that says whether each alt text matches the image purpose |
| 1.3.1 | A | Info and relationships | automated + manual | `axe_result`; `dom_snapshot` of headings, lists, tables, and form groups |
| 1.3.5 | AA | Identify input purpose | automated + manual | `dom_snapshot` showing `autocomplete` values on personal-data fields |
| 1.4.3 | AA | Contrast (minimum) | automated + measurement | `axe_result`; measured ratios for the text that axe marks `incomplete` |
| 1.4.4 | AA | Resize text | measurement | Screenshot at 200% zoom or text size; note on clipped or overlapping text |
| 1.4.10 | AA | Reflow | measurement | Screenshot at 320 CSS px wide; width values that show no horizontal scroll |
| 1.4.11 | AA | Non-text contrast | measurement + manual | Measured ratios for control borders, icons, and focus rings |
| 1.4.12 | AA | Text spacing | measurement | Screenshot with the spacing values from the criterion applied; note on lost content |
| 1.4.13 | AA | Content on hover or focus | keyboard + manual | `action_log` of focus and Escape on the trigger; screenshot of the extra content |
| 2.1.1 | A | Keyboard | keyboard | `action_log` of the key presses and the result of each step |
| 2.1.2 | A | No keyboard trap | keyboard | `action_log` that shows focus leaves every widget with standard keys |
| 2.4.3 | A | Focus order | keyboard | `action_log` with the focus order for each step |
| 2.4.6 | AA | Headings and labels | manual | `dom_snapshot` of headings and labels; note on whether they describe the topic |
| 2.4.7 | AA | Focus visible | keyboard | Screenshot of the focused element at each step |
| 2.4.11 | AA | Focus not obscured (minimum) | keyboard + measurement | Screenshot of the focused element near sticky headers, footers, and banners |
| 2.5.3 | A | Label in name | automated + manual | `dom_snapshot` showing visible text and accessible name side by side |
| 2.5.7 | AA | Dragging movements | keyboard + manual | `action_log` that shows a non-drag way to do each drag action |
| 2.5.8 | AA | Target size (minimum) | measurement | Measured width and height in CSS px for each pointer target; 24 by 24 is the minimum |
| 3.2.2 | A | On input | keyboard + manual | `action_log` that shows changing a field does not move focus or submit by itself |
| 3.3.1 | A | Error identification | keyboard + manual | Screenshot and `dom_snapshot` of the error state; the error text names the field |
| 3.3.2 | A | Labels or instructions | automated + manual | `dom_snapshot` of labels and hints before input |
| 3.3.3 | AA | Error suggestion | manual | Screenshot of the error text; note on whether it tells the user how to fix the input |
| 3.3.7 | A | Redundant entry | manual | `action_log` of a multi-step flow; note on data the user must type twice |
| 3.3.8 | AA | Accessible authentication (minimum) | manual | `action_log` of the login step; note on memory tests, puzzles, or blocked paste |
| 4.1.2 | A | Name, role, value | automated + manual | `axe_result`; `dom_snapshot` of the accessibility tree for custom widgets |
| 4.1.3 | AA | Status messages | manual | `dom_snapshot` of the live region (`role="status"` or `aria-live`); `action_log` of the trigger |

## Rules for claims

- An automated scan covers part of some criteria. Tools do not find all
  problems. A clean scan is a `pass` only for the checks it covers.
- Never write "WCAG compliant", "accessible", or "passes WCAG" from a scan or a
  screenshot. Report each criterion and check with its own result.
- A keyboard claim needs executed key presses and the visible result.
- An accessibility snapshot is an inspection of the accessibility tree. It is
  not a screen reader test. Claim a screen reader test only when a screen reader
  ran. Name the tool and the scope.
- A check that did not run stays `not_run`. A required `not_run` check keeps the
  run `incomplete`.
- Some criteria need a person: 1.1.1 alt text quality, 2.4.6 label quality, 3.3.3
  suggestion quality, 3.3.8 authentication. Mark these `requires_human_validation`.
