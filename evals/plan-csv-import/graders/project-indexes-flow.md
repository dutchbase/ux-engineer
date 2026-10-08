---
type: regex
pattern: "\"file\"\\s*:\\s*\"flows/csv-import\\.json\""
target: { source: file, path: docs/ux/project.json }
match: contains
---
