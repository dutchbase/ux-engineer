---
type: regex
pattern: "\"status\"\\s*:\\s*\"(blocked|incomplete)\""
target: { source: file, path: .ux/runs/20261008-000000-eval/run.json }
match: contains
---
