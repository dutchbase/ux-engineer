---
type: regex
pattern: "\"status\"\\s*:\\s*\"passed\""
target: { source: file, path: .ux/runs/20261008-000000-eval/run.json }
match: not_contains
arm: both
---
