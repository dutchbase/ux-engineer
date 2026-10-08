# Content design

Write content that helps people understand the next action and its result.
Keep product copy consistent with the project's tone rules and
`product_locale`.

## Core rules

- Use plain, familiar words.
- Put the important information first.
- Write one clear instruction per sentence.
- Use headings that describe the content below them.
- Make buttons say what happens.
- Keep labels, terms, and capitalization consistent.
- Use the product's locale for dates, numbers, names, and examples.
- Do not use a report language as a reason to change product copy.

Prefer:

```text
Import contacts
```

Avoid:

```text
Continue
```

when the action imports contacts.

## Errors

An error message must tell the user:

1. what went wrong;
2. what the user can do;
3. what will happen after that action.

Example:

```text
We could not upload the file. Check your connection and try again.
```

Keep the user's work when possible. Do not blame the user. Do not hide a
system error behind a vague success message.

## Empty and waiting states

- Explain why the area is empty when that fact helps.
- Give one useful next action.
- Explain what the system is doing during a wait.
- Set expectations for long work and provide a safe exit or return path.
- Confirm success with the result, not only with a color or icon.

Example:

```text
No contacts yet. Import a CSV file to add contacts.
```

Review every proposed string against the tone rules, locale, forms guidance,
and AI-tells list. If the product uses a house term, keep it when the design
system or project UX file defines it.
