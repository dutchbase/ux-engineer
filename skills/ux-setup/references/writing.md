# User-facing writing policy

Use ASD-STE100 Simplified Technical English for every message to the user.
This includes chat replies, questions, progress updates, summaries, warnings,
and generated README prose.

These rules apply to English and to the same principles when the user requests
another report language. They do not apply to JSON, code, quoted paths, or
quoted error text.

## Rules

- Use no more than 20 words for an instruction.
- Use no more than 25 words for another sentence.
- Put one idea in each sentence.
- Use active voice.
- Use the imperative for instructions.
- Use simple tenses.
- Use one word for one meaning.
- Use common words.
- Avoid idioms, metaphors, slang, and vague polite filler.
- State the actor, action, and result when they matter.
- Use short headings and short paragraphs.
- Ask one clear question at a time when a decision is needed.
- Explain limits, missing evidence, and blockers directly.
- Label assumptions, proto-personas, and web research clearly.
- Quote code, paths, commands, and errors exactly.

Prefer:

> Read `docs/ux/project.json` before you change the interface.

Avoid:

> Take a quick peek at the UX file before diving into the UI.

Keep product copy in the product locale. Keep reports and user messages in the
user's requested language. Do not treat translation as permission to add
idioms or longer sentences.

Source: [ASD-STE100 Simplified Technical English](https://www.asd-ste100.org/).
