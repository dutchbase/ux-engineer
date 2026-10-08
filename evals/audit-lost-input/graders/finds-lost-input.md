---
type: llm
focus: { source: file, path: .ux/runs/20261008-000000-eval/findings.json }
---
The audited app has one known defect: after a temporary server error during import, the app returns to the upload step and the chosen file and column mapping are lost, so the user must start again.

PASS only if findings.json contains a finding with status "confirmed" and severity "major" or "critical" that describes this loss of the file or column mapping after the import error, and that finding lists at least one evidence id.
FAIL otherwise.
