---
type: llm
focus: { source: file, path: docs/ux/project.json }
---
Judge the UX project file of a tool-lending app. The user said: two customer types (tool owners, borrowers); borrowers mainly on phone; no user research exists, only informal talks with about ten neighbours; tone friendly and plain, avoid "solution" and "leverage"; WCAG 2.2 AA; default screen sizes; no design system; key flows list a tool, request a tool, agree on a pickup time.

PASS only if all of these hold:
- There are personas for both owners and borrowers, labelled by role, with no invented personal names, exact ages or quotes.
- Every persona is marked as a proto-persona (proto true), and persona facts point to the interview as their source; anything not said by the user is marked as assumed with a way to validate it.
- Tone, accessibility target WCAG 2.2 AA, four default viewports, design system "none" and the three key flows are recorded.
FAIL if any persona claims to be based on user research or analytics, or if facts the user gave are missing or contradicted.
