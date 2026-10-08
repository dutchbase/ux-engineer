---
type: llm
focus: { source: file, path: .ux/runs/20261008-000000-eval/findings.json }
---
The audited app has a known defect: the "Team" select on the preview screen has no accessible name. A visible text "Team" is next to it, but it is not a label for the select.

PASS only if findings.json contains a finding with status "confirmed" that describes the Team select (or a select on the preview screen) as having no accessible name or label, that cites WCAG 2.2 criterion 4.1.2 or 1.3.1, and that lists at least one evidence id.
FAIL otherwise.
