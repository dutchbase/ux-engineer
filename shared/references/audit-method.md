# Audit method

## Order of work

Start black-box. Use only the task, user context, target, environment, and
allowed actions. Observe the interface before reading implementation code.
This prevents code knowledge from hiding findability problems.

Read code after browser observation to find causes. Keep these claims separate:

- The agent completed the task.
- The interface made the task understandable and findable.
- A real user can complete the task.

A browser agent is not a real user. Use a human test for perception or
understanding claims.

## Coverage

Build a matrix with these dimensions:

`task × persona × viewport × state × input method × locale`

Fill only relevant combinations. Record every untested row and its reason.
Use viewports from `docs/ux/project.json` when present. Otherwise use:

- `390x844`
- `820x1180`
- `1440x900`
- `1920x1080`

Include relevant error, loading, empty, permission, and recovery states. Check
the project's accessibility target when it is in scope.

## Observe each step

Before each step, state the expected result. After each step, check what is
visible, saved, and recoverable. A successful click is not a successful task.
Record the UI outcome and data outcome separately.

Record expected errors as expected behavior when they are appropriate to the
test. For example, a `403` in a negative authorization test is not a defect by
itself.

Use screenshots for visual state, action logs for executed interaction, DOM
snapshots for structure, and console or request logs for technical causes.
Match each claim to the evidence policy.

## Analysis

Deduplicate symptoms that share one cause. Mark a finding `systemic` when the
same cause affects multiple flows, states, personas, or viewports.

Use the ten NN/g heuristics as analysis frames, not as laws:
https://www.nngroup.com/articles/ten-usability-heuristics/

Do not run an AI-tells review until the project has a maintained blocklist.
Treat pure visual taste as out of scope unless it harms the task. Do not
redesign while collecting a baseline. Give the implementing agent findings,
evidence, and recommendations instead.

## Stop rules

Stop at the agreed action, time, or token budget. Save the current run before
stopping. Do not impose an arbitrary limit on clicks, choices, or steps when
the agreed task needs more.

Retry a failed tool once when safe. Then report the limitation. Do not loop
until the interface is perfect. Zero findings is a valid result when the
scoped checks have fitting evidence.

Report what was not tested, how broad the coverage was, and which observations
need human validation.
