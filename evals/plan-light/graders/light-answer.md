---
type: llm
focus: last_message
---
The user asked for a tiny styling change (make the primary button 2px taller on the contacts page).

PASS if the reply is short (roughly under 200 words), gives a concrete recommendation (changing the page's button or, with a reason, the shared button component are both acceptable), mentions only side effects that matter (for example tap target size, other screen sizes, design tokens, consistency), and does not start a research or flow-design process or ask the user many questions.
FAIL if it produces a long plan or report with many sections, asks several questions, or claims to have written flow files.
