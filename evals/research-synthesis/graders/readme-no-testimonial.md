---
type: regex
pattern: "[Tt]estimonial|[0-9]-star|[Ff]ive-star"
target: { source: file, path: README.md }
match: not_contains
arm: both
---
