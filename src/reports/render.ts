import type { EvidenceItem, Finding, RunBundle } from "../contracts/run.ts";

const severityOrder = {critical: 0, major: 1, minor: 2, advisory: 3};
const statusOrder = {confirmed: 0, needs_validation: 1, hypothesis: 2};
const statusMeaning = {
  passed: "All required checks passed.",
  needs_work: "At least one required check failed.",
  incomplete: "Some required checks are not complete.",
  blocked: "The run has blockers."
};

const text = (value: unknown): string => String(value ?? "—");
const markdown = (value: unknown): string => text(value).replaceAll("|", "\\|");
const html = (value: unknown): string => text(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#39;");

function sortedFindings(findings: Finding[]): Finding[] {
  return findings
    .map((finding, index) => ({finding, index}))
    .sort((a, b) => severityOrder[a.finding.severity] - severityOrder[b.finding.severity] || statusOrder[a.finding.status] - statusOrder[b.finding.status] || a.finding.finding_id.localeCompare(b.finding.finding_id) || a.index - b.index)
    .map(({finding}) => finding);
}

function evidenceText(ids: string[], evidence: Map<string, EvidenceItem>): string {
  return ids.length === 0 ? "—" : ids.map((id) => {
    const item = evidence.get(id);
    return item?.file ? `${id} ([${markdown(item.file)}](${markdown(item.file)}))` : markdown(id);
  }).join(", ");
}

function evidenceHtml(ids: string[], evidence: Map<string, EvidenceItem>): string {
  return ids.length === 0 ? "—" : ids.map((id) => {
    const item = evidence.get(id);
    return item?.file ? `<a href="${html(item.file)}">${html(id)}</a>` : html(id);
  }).join(", ");
}

function markdownList(values: string[]): string {
  return values.length === 0 ? "- None" : values.map((value) => `- ${markdown(value)}`).join("\n");
}

function summary(bundle: RunBundle) {
  const sorted = sortedFindings(bundle.findings.findings);
  const counts = (values: string[], order: string[]) => order.filter((value) => values.includes(value)).map((value) => `${values.filter((item) => item === value).length} ${value.replaceAll("_", " ")}`).join(", ");
  return {
    findings: sorted,
    severityCounts: counts(sorted.map((finding) => finding.severity), ["critical", "major", "minor", "advisory"]),
    statusCounts: counts(sorted.map((finding) => finding.status), ["confirmed", "needs_validation", "hypothesis"]),
    untested: bundle.run.coverage.filter((row) => !row.tested).length,
    totalCoverage: bundle.run.coverage.length
  };
}

function renderMarkdown(bundle: RunBundle): string {
  const {run, evidence, checks, findings} = bundle;
  const reportSummary = summary(bundle);
  const evidenceById = new Map(evidence.items.map((item) => [item.evidence_id, item]));
  const coverage = run.coverage.map((row) => `| ${markdown(row.task)} | ${markdown(row.persona_id)} | ${markdown(row.viewport)} | ${markdown(row.state)} | ${markdown(row.input_method)} | ${row.tested ? "Tested" : "Not tested"} | ${markdown(row.reason)} |`).join("\n");
  const findingRows = sortedFindings(findings.findings).map((finding) => `| ${markdown(finding.finding_id)} | ${markdown(finding.severity)} | ${markdown(finding.status)} | ${markdown(finding.title)} | ${markdown(finding.user_impact)} | ${evidenceText(finding.evidence_ids, evidenceById)} |`).join("\n");
  const checkRows = checks.checks.map((check) => `| ${markdown(check.check_id)} | ${markdown(check.required ? "required" : "optional")} | ${markdown(check.result)} | ${evidenceText(check.evidence_ids, evidenceById)} |`).join("\n");
  const nextSteps = findings.findings.filter((finding) => finding.status === "confirmed").map((finding) => `- ${markdown(finding.finding_id)}: ${markdown(finding.recommendation)}`).join("\n") || "- None";

  return `# UX run report: ${markdown(run.run_id)}

## Target and scope

- URL: ${markdown(run.target.url)}
- Environment: ${markdown(run.target.environment)}
- Description: ${markdown(run.target.description)}
- Scope: ${markdown(run.scope)}

## Run status

**${markdown(run.status)}** — ${statusMeaning[run.status]}

## Summary

${reportSummary.findings.length === 0 ? "No findings." : `- Findings: ${reportSummary.findings.length} (${reportSummary.severityCounts}; ${reportSummary.statusCounts})\n\nTop findings:\n${reportSummary.findings.slice(0, 5).map((finding, index) => `${index + 1}. **${markdown(finding.severity)}, ${markdown(finding.status)}** — ${markdown(finding.title)}`).join("\n")}`}
- Coverage: ${reportSummary.untested} of ${reportSummary.totalCoverage} coverage rows not tested

## Blockers and limitations

### Blockers

${markdownList(run.blockers)}

### Limitations

${markdownList(run.limitations)}

## Coverage

| Task | Persona | Viewport | State | Input method | Result | Reason |
| --- | --- | --- | --- | --- | --- | --- |
${coverage}

## Findings

| ID | Severity | Status | Title | User impact | Evidence |
| --- | --- | --- | --- | --- | --- |
${findingRows || "| — | — | — | None | — | — |"}

## Checks

| Check | Requirement | Result | Evidence |
| --- | --- | --- | --- |
${checkRows || "| — | — | — | — |"}

## Next steps

${nextSteps}
`;
}

function renderHtml(bundle: RunBundle): string {
  const {run, evidence, checks, findings} = bundle;
  const reportSummary = summary(bundle);
  const evidenceById = new Map(evidence.items.map((item) => [item.evidence_id, item]));
  const coverage = run.coverage.map((row) => `<tr><td>${html(row.task)}</td><td>${html(row.persona_id)}</td><td>${html(row.viewport)}</td><td>${html(row.state)}</td><td>${html(row.input_method)}</td><td>${row.tested ? "Tested" : "Not tested"}</td><td>${html(row.reason)}</td></tr>`).join("");
  const findingRows = sortedFindings(findings.findings).map((finding) => `<tr><td>${html(finding.finding_id)}</td><td>${html(finding.severity)}</td><td>${html(finding.status)}</td><td>${html(finding.title)}</td><td>${html(finding.user_impact)}</td><td>${evidenceHtml(finding.evidence_ids, evidenceById)}</td></tr>`).join("");
  const checkRows = checks.checks.map((check) => `<tr><td>${html(check.check_id)}</td><td>${html(check.required ? "required" : "optional")}</td><td>${html(check.result)}</td><td>${evidenceHtml(check.evidence_ids, evidenceById)}</td></tr>`).join("");
  const list = (values: string[]) => values.length === 0 ? "<li>None</li>" : values.map((value) => `<li>${html(value)}</li>`).join("");
  const nextSteps = findings.findings.filter((finding) => finding.status === "confirmed").map((finding) => `<li><strong>${html(finding.finding_id)}</strong>: ${html(finding.recommendation)}</li>`).join("") || "<li>None</li>";

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${html(run.run_id)} UX run report</title>
<style>
:root { color-scheme: light; --bg: #f7f7f5; --fg: #202124; --muted: #5f6368; --card: #fff; --line: #d9d9d2; --accent: #2457a6; }
@media (prefers-color-scheme: dark) { :root { color-scheme: dark; --bg: #171817; --fg: #f1f3f4; --muted: #bdc1c6; --card: #242624; --line: #4b4e4b; --accent: #9bbcff; } }
* { box-sizing: border-box; }
body { margin: 0; background: var(--bg); color: var(--fg); font: 16px/1.5 system-ui, sans-serif; }
main { max-width: 1100px; margin: 0 auto; padding: 24px 16px 48px; }
section { margin: 28px 0; }
.card { background: var(--card); border: 1px solid var(--line); border-radius: 8px; padding: 16px; overflow-x: auto; }
table { width: 100%; border-collapse: collapse; min-width: 620px; }
th, td { border-bottom: 1px solid var(--line); padding: 8px; text-align: left; vertical-align: top; }
th { color: var(--muted); font-size: .9rem; }
a { color: var(--accent); }
ul { padding-left: 22px; }
.status { font-size: 1.2rem; }
</style>
</head>
<body>
<main>
<h1>UX run report: ${html(run.run_id)}</h1>
<section><h2>Target and scope</h2><div class="card"><p><strong>URL:</strong> ${html(run.target.url)}</p><p><strong>Environment:</strong> ${html(run.target.environment)}</p><p><strong>Description:</strong> ${html(run.target.description)}</p><p><strong>Scope:</strong> ${html(run.scope)}</p></div></section>
<section><h2>Run status</h2><div class="card status"><strong>${html(run.status)}</strong> — ${html(statusMeaning[run.status])}</div></section>
<section><h2>Summary</h2><div class="card">${reportSummary.findings.length === 0 ? "<p>No findings.</p>" : `<p><strong>Findings:</strong> ${reportSummary.findings.length} (${html(reportSummary.severityCounts)}; ${html(reportSummary.statusCounts)})</p><p><strong>Top findings:</strong></p><ol>${reportSummary.findings.slice(0, 5).map((finding) => `<li><strong>${html(finding.severity)}, ${html(finding.status)}</strong> — ${html(finding.title)}</li>`).join("")}</ol>`}<p><strong>Coverage:</strong> ${reportSummary.untested} of ${reportSummary.totalCoverage} coverage rows not tested</p></div></section>
<section><h2>Blockers and limitations</h2><div class="card"><h3>Blockers</h3><ul>${list(run.blockers)}</ul><h3>Limitations</h3><ul>${list(run.limitations)}</ul></div></section>
<section><h2>Coverage</h2><div class="card"><table><thead><tr><th>Task</th><th>Persona</th><th>Viewport</th><th>State</th><th>Input method</th><th>Result</th><th>Reason</th></tr></thead><tbody>${coverage}</tbody></table></div></section>
<section><h2>Findings</h2><div class="card"><table><thead><tr><th>ID</th><th>Severity</th><th>Status</th><th>Title</th><th>User impact</th><th>Evidence</th></tr></thead><tbody>${findingRows || "<tr><td colspan=\"6\">None</td></tr>"}</tbody></table></div></section>
<section><h2>Checks</h2><div class="card"><table><thead><tr><th>Check</th><th>Requirement</th><th>Result</th><th>Evidence</th></tr></thead><tbody>${checkRows || "<tr><td colspan=\"4\">None</td></tr>"}</tbody></table></div></section>
<section><h2>Next steps</h2><div class="card"><ul>${nextSteps}</ul></div></section>
</main>
</body>
</html>
`;
}

export function renderReport(bundle: RunBundle, format: "md" | "html"): string {
  return format === "md" ? renderMarkdown(bundle) : renderHtml(bundle);
}
