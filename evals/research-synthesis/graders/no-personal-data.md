---
type: regex
pattern: "[A-Za-z0-9._-]+@[A-Za-z0-9.-]+\\.[A-Za-z]+|Mira|Voss|Tomas|Brandt|Lena|Okafor"
target: { source: file, path: docs/ux/research/import-tickets.json }
match: not_contains
arm: both
---
