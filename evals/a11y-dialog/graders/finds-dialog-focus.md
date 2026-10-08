---
type: llm
focus: { source: file, path: .ux/runs/20261008-000000-eval/findings.json }
---
The audited app has a known defect: the "Cancel import" button opens a "Discard this import?" dialog that does not manage focus or keyboard. Focus stays on the page behind it, Tab reaches controls behind it, Escape does not close it, and focus is not returned when it closes.

PASS only if findings.json contains a finding with status "confirmed" that describes at least one of these dialog problems (focus not moved into the dialog, focus not trapped, Escape does not close it, or focus not returned), that cites a WCAG 2.2 criterion, and that lists at least one evidence id.
FAIL otherwise.
