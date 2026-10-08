---
type: regex
pattern: "\"type\"\\s*:\\s*\"action_log\""
target: { source: file, path: .ux/runs/20261008-000000-eval/evidence.json }
match: contains
---
