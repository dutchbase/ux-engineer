# Security policy

## Reporting a vulnerability

Please report security issues privately through GitHub's [private vulnerability reporting](https://github.com/dutchbase/ux-engineer/security/advisories/new). Do not open a public issue for a security problem.

We aim to acknowledge reports within a week.

## What counts as a security issue

UX Engineer drives real browsers against targets that users provide and stores evidence from those runs. Examples of issues we want to hear about:

- Evidence files, reports or logs that can contain secrets: cookies, tokens, Playwright storage state, request headers or personal data.
- Ways that page content (prompt injection in a website, support ticket or file) can make the agent run commands, read secrets or take actions it was not allowed to take.
- Browser actions that can cause real side effects (payments, emails, deletions, production writes) without explicit permission.
- Installer behavior that overwrites or deletes configuration it should not touch.

## Handling your own data

Never commit browser storage state, `.env` files or raw research data. The default `.gitignore` excludes `.ux/`, `.env*` and `*storageState*.json`.
