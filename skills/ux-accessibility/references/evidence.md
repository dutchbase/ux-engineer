# Evidence policy

Match each claim to evidence that can support it. Record the claim, context,
source, and limits. Do not turn an agent impression into a user fact.

## Claim-to-evidence fit

| Claim | Fitting evidence | Do not claim |
|---|---|---|
| Layout, overlap, visibility, or text | Screenshot or DOM snapshot from the stated viewport and state | Keyboard behavior from a screenshot |
| Keyboard operation or focus order | Executed keyboard actions and the resulting visible state | Keyboard support from labels or DOM alone |
| Screen reader output | An executed screen reader check, with tool and scope | A tested screen reader experience from an axe result |
| Console or request behavior | Captured console or request evidence | A user-visible defect from a request alone |
| Saved data or backend persistence | A recorded data check plus the UI result | That the user saw the result from a backend response alone |
| Rate, count, or drop-off | Measured data with definition, sample, time range, and denominator | A rate from one task run or an invented percentage |
| User perception or understanding | Human research or a planned human test question | A confirmed user reaction from agent opinion or screenshots |
| Code cause | A code reference and a reproducible or clearly bounded link | A runtime observation without runtime evidence |

## Claim vocabularies

Use only these values in the JSON contracts.

- **Basis:** `observed` happened in the browser; `code_supported` is supported
  by code; `user_reported` came from a user; `measured` came from defined
  data; `web_sourced` came from cited research; `inferred` is analysis; and
  `assumed` is an explicit assumption.
- **Finding status:** `confirmed` meets the evidence rules; `hypothesis` is a
  reasoned claim that needs a test; `needs_validation` names an open check.
- **Severity:** `critical` blocks a crucial task or causes unrecoverable loss;
  `major` creates a serious obstacle with at most a hard workaround; `minor`
  creates limited friction; `advisory` is an unproven improvement.
- **Confidence:** `high`, `medium`, or `low`. Always give a reason.
- **Check result:** `pass`, `fail`, `not_run`, or `not_applicable`.
  `not_applicable` needs a real reason and cannot hide missing tooling.
- **Evidence type:** `screenshot`, `action_log`, `console_log`, `network_log`,
  `dom_snapshot`, `axe_result`, or `note`.

`severity` is not `priority`. Severity describes effect on the task. Priority
also considers reach, product context, risk, and effort. Keep unknown reach as
`null`; do not estimate it without a basis.

## Confirmation rules

- Confirm only with basis `observed`, `measured`, `code_supported`, or
  `user_reported`, plus at least one fitting evidence ID.
- Require evidence for `observed` findings.
- Never confirm an `advisory` finding.
- Keep perception claims as `hypothesis` or `needs_validation`. Add one human
  test question, such as: “Can the intended user explain what to do next?”
- A file path must be relative, start with `artifacts/`, and have its SHA-256.
  Never use an absolute path or a `..` segment.

## Run status

- `blocked`: a required precondition, such as browser access, stopped the core
  checks from starting.
- `incomplete`: an applicable required check is `not_run` or lacks usable
  evidence, or no checks exist.
- `needs_work`: required checks ran, but at least one required check failed.
- `passed`: all explicitly requested, applicable required checks passed with
  fitting evidence. It does not certify the full product or human usability.

Derive the status from checks and blockers. Do not use a status that differs
from the validator's result. A run can contain confirmed findings and still be
`incomplete`.
