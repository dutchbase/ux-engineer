# Forms

Use forms to help people complete a task. Ask only for information that the
task needs.

## Labels and structure

- Give every control a visible, persistent label.
- Use the user's words for field names.
- Put instructions before the user needs them.
- Group fields by the user's task, not by database structure.
- Mark required fields. Explain optional fields when their value is unclear.
- Use the right input type and keyboard for the expected value.
- Keep related fields close. Do not split one answer across unrelated screens.

Example:

```text
File to import (required)
Choose a CSV file with one row per contact.
```

## Validation

- Validate on submit for the whole form.
- Validate a field earlier when the rule is clear and the feedback will help.
- Do not show an error before the user has enough information to fix it.
- Keep the user's input when validation fails.
- Place the message next to the field and also give a clear summary when the
  form is long.
- Name the problem and the fix.

Example:

```text
Enter a date in the format 2026-10-08.
```

Do not write “Invalid value” when the user can use a more useful instruction.

## Submission and risk

- Say what the primary action will do.
- Disable repeated submission while the request is in progress, or make the
  action idempotent.
- Give progress feedback for long work.
- Confirm a risky action before it runs. State the consequence and the safer
  alternative when one exists.
- Give clear completion feedback and say what the user can do next.
- Let the user cancel when cancellation is safe and meaningful.
