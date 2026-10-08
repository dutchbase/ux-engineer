---
type: llm
focus: { source: file, path: docs/ux/flows/csv-import.json }
---
Judge a UX flow contract for importing contacts from a CSV file (upload, map columns, preview, import).

PASS only if all of these hold:
- There is a state for a network or server error during import that keeps the user's file and mapping and offers a retry.
- There are states for invalid rows or input, for a long-running import, and for a double click or repeated submit.
- At least one terminal state has outcome "success" with an observable result (for example how many contacts were imported and how many skipped).
- There are at least four acceptance criteria written as Given/When/Then that a tester could check, and at least one references a WCAG 2.2 success criterion.
- UX copy uses British English and avoids the words "Unlock", "Seamless" and exclamation marks.
FAIL otherwise.
