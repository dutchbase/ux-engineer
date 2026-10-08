---
type: regex
pattern: "\"kind\"\\s*:\\s*\"ai_tell_override\""
target: { source: file, path: docs/ux/project.json }
match: contains
---
