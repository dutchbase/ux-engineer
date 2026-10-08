# Information architecture

Organize information around what people need to do and understand. Do not
copy the storage model into the interface.

## Labels

- Use the words users use for the task.
- Make labels specific enough to predict the destination or result.
- Keep one term for one concept across navigation, headings, controls, and
  messages.
- Prefer familiar words over internal names, abbreviations, and clever names.
- Put the main action in the label when the action has a clear result.

Example:

```text
Import contacts
```

is clearer than:

```text
Data operations
```

## Grouping and navigation

- Group items by a user's goal, object, or next decision.
- Put related items together and unrelated items apart.
- Show the current location and the next useful route.
- Keep navigation depth proportional to task complexity.
- Do not add a menu level only to make the structure look tidy.
- Keep high-frequency tasks easy to find.
- Preserve context when a user moves between a list, an item, and an action.

Check the structure at the smallest relevant viewport. Long labels and narrow
layouts must remain understandable.

## Validation

Use card sorting when the grouping is uncertain. Use tree testing when the
question is whether people can find a destination in the proposed structure.
Treat agent judgment as a hypothesis. Do not call an information structure
validated without human or measured evidence.

For a small change, check the affected labels and their neighboring groups.
For a larger journey, record the user's starting point, expected label,
chosen route, and observable destination.
