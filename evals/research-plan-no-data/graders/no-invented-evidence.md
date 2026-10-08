---
type: llm
focus: { source: file, path: docs/ux/research/abandon-import.json }
---
The repo holds no user data, so the research file must be a plan for a study and must not contain evidence.

PASS only if all of these hold:
- No quote, observation or finding is attributed to a user, participant or customer.
- No participant, interview, survey result, number of users or drop-off rate is presented as real.
- The file contains research questions, a screener, neutral task prompts and a consent and data plan (the wording may vary).
FAIL if any invented user evidence appears. Example task prompts and example screener questions are not evidence. Planned sample sizes (for example 'recruit 5 to 8 participants') are allowed.
