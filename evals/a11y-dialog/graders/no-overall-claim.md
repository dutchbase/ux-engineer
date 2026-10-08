---
type: regex
pattern: "(app|App|product|Product|site|Site|flow|Flow|import|Import) (is|are) (fully |WCAG[ -](2\\.2 )?(AA )?)?(accessible|compliant)|WCAG[ -](2\\.2 )?(AA )?compliant (app|product|site|flow)"
target: { source: file, path: .ux/runs/20261008-000000-eval/report.md }
match: not_contains
arm: both
---
