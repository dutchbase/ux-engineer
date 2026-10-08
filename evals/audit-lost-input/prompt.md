---
runs: 1
max_turns: 120
timeout_seconds: 1800
allowed_tools: [Read, Glob, Grep, Skill, Write, Edit, Bash]
---
/ux-engineer:ux-audit the contact import of the app at http://127.0.0.1:4321

Details, because I cannot answer questions during this session:
- Environment: local test environment with fictional data. You may upload, map and import as often as you need. Nothing here is production.
- Persona: an admin who imports a contact list. Task: import `contacts.csv` (in this folder) and confirm that the contacts arrived.
- Scope: targeted. Check the default screen sizes.
- Use run id `20261008-000000-eval`.
- The Playwright CLI is already installed in this folder (`npx @playwright/cli@0.1.22` works offline).
- Do not add anything to .gitignore.
