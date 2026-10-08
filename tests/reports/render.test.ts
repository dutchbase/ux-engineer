import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { validateRunDir } from "../../src/contracts/run.ts";
import { renderReport } from "../../src/reports/render.ts";

const validRun = fileURLToPath(new URL("../fixtures/run/valid", import.meta.url));

test("renderer is deterministic and follows the report sections", () => {
  const result = validateRunDir(validRun);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  const markdown = renderReport(result.data, "md");
  assert.match(markdown, /# UX run report: run-001/);
  assert.match(markdown, /## Coverage/);
  assert.match(markdown, /Not tested/);
  assert.ok(markdown.indexOf("## Summary") < markdown.indexOf("## Blockers"));
  assert.match(markdown, /Findings: 1 \(1 minor; 1 confirmed\)/);
  assert.match(markdown, /Coverage: 1 of 2 coverage rows not tested/);
  assert.equal(markdown, renderReport(result.data, "md"));
});

test("summary is ordered, capped, and handles empty findings", () => {
  const result = validateRunDir(validRun);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  const bundle = structuredClone(result.data);
  bundle.findings.findings = Array.from({length: 6}, (_, index) => ({...bundle.findings.findings[0], finding_id: `F-${index}`, title: `Finding ${index}`, severity: index % 2 ? "major" : "critical", status: index % 3 === 0 ? "hypothesis" : "confirmed"}));
  const markdown = renderReport(bundle, "md");
  assert.equal((markdown.match(/^\d+\. /gm) ?? []).length, 5);
  assert.ok(markdown.indexOf("Finding 0") < markdown.indexOf("Finding 1"));
  bundle.findings.findings = [];
  assert.match(renderReport(bundle, "md"), /No findings\./);
  assert.match(renderReport(bundle, "html"), /No findings\./);
});

test("HTML renderer escapes JSON strings and stays self-contained", async () => {
  const result = validateRunDir(validRun);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  const bundle = structuredClone(result.data);
  bundle.run.target.description = "<script>alert(\"x\")</script>";
  bundle.findings.findings[0].title = "<script>alert('x')</script>";
  const html = renderReport(bundle, "html");
  assert.ok(!html.includes("<script>alert"));
  assert.match(html, /&lt;script&gt;alert\(&quot;x&quot;\)&lt;\/script&gt;/);
  assert.match(html, /&lt;script&gt;alert\(&#39;x&#39;\)&lt;\/script&gt;/);
  assert.ok(html.indexOf("<h2>Summary</h2>") < html.indexOf("<h2>Blockers"));
  assert.match(html, /prefers-color-scheme: dark/);
  assert.match(html, /artifacts\/screen\.txt/);
  assert.equal(html, renderReport(bundle, "html"));
  assert.equal((await readFile(`${validRun}/artifacts/screen.txt`, "utf8")).trim(), "UX evidence");
});
