---
type: regex
pattern: "\"proto\"\\s*:\\s*false"
target: { source: file, path: docs/ux/project.json }
match: not_contains
---
