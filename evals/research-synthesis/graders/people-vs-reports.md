---
type: llm
focus: { source: file, path: docs/ux/research/import-tickets.json }
---
The research file synthesizes 8 support tickets from 3 people. One person filed 5 of the tickets. The most common problem is that after an import error the app loses the uploaded file and the column mapping. 5 tickets report it. Only 2 different people report it.

PASS only if all of these hold:
- An interpretation about this most common problem (lost file or mapping after an import error) exists.
- That interpretation has a numeric `people_count` of 3 or less, and a separate numeric `report_count` that is larger than `people_count`.
- Its confidence is not "high".
FAIL if `people_count` is 4 or more, if `people_count` equals the number of tickets, or if only one count is given.
