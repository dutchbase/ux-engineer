---
type: llm
focus: last_message
---
The user gave all interview answers up front and said they cannot answer questions.

PASS only if the final reply:
- Says what was written (docs/ux/project.json and docs/ux/README.md).
- Tells the user the personas are proto-personas (not based on research).
- Does not ask the user again for facts they already gave (customer types, devices, tone, accessibility, screen sizes, design system, key flows).
- Proposes, but does not claim to have made, the AGENTS.md change.
- Uses short, plain sentences.
FAIL otherwise.
