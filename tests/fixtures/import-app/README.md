# CSV import fixture

This is a zero-dependency Node.js test app for browser-based UX audits. It contains deliberate defects in four switchable variants; `correct` is the reference behavior. All records are fictional.

Run one variant with Node 18 or newer:

```sh
node tests/fixtures/import-app/server.mjs --variant correct --port 4301
```

Variants are `correct`, `lost-input`, `double-action`, `confusing-status`, and `tablet-layout`. The app binds to `127.0.0.1` only. The sample CSV has 12 contacts and one invalid email, so a valid import contains 11 contacts.

Endpoints:

- `GET /__health` returns `ok`.
- `POST /__reset` clears uploads and jobs and rearms the first-import 503.
- `GET /api/config` returns an opaque code for the selected variant, so the browser does not receive the defect name and an auditor cannot read it from the response.
- `POST /api/upload` accepts raw CSV text.
- `POST /api/import` accepts JSON with `upload_id` and column-name mappings.
- `GET /api/jobs/:id` reports processing or done status, imported and skipped counts, and imported contact rows.

The first import request after startup or reset intentionally returns `503 {"error":"temporarily unavailable"}` in every variant. Jobs finish after about three seconds.

## Known issues in all variants

The `correct` variant has none of the four planted defects, but it is not defect-free. UX audits found these real problems, which are kept on purpose as known issues (see `evals/ground-truth/import-app.json`):

- The preview ignores the chosen column mapping, so a wrong mapping imports wrong data without warning.
- At phone size, the import error appears above the visible area.
- Keyboard focus returns to the top of the page after Continue and Import.
- The result step has no way to start over.
