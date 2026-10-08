---
type: llm
focus: { source: file, path: .ux/runs/20261008-000000-eval/findings.json }
---
The audited app is the variant WITHOUT the four planted defects. It is not defect-free: four real problems are known and may be reported:
(a) the preview ignores the chosen column mapping, so a wrong mapping imports wrong data without warning (major);
(b) at phone size the import error appears above the visible area (major);
(c) keyboard focus returns to the top after Continue or Import (minor);
(d) the result step offers no way to start over or see a next step (minor).

PASS only if all of these hold:
- No finding with status "confirmed" claims a planted defect: file or mapping lost after the server error; a second click creating a duplicate import; completion shown while processing; the Import button cut off or unreachable at tablet width.
- Every finding with status "confirmed" and severity "major" or "critical" describes known problem (a) or (b). Any other confirmed major or critical finding is a FAIL.
- Every confirmed finding lists at least one evidence id.
FAIL otherwise.
