import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";

const variants = new Set(["correct", "lost-input", "double-action", "confusing-status", "tablet-layout"]);
const variantCodes = {correct: "k7", "lost-input": "q2", "double-action": "m5", "confusing-status": "t9", "tablet-layout": "r4"};
const contentTypes = { ".css": "text/css", ".html": "text/html; charset=utf-8", ".js": "text/javascript" };

function parseArgs(args) {
  const values = {};
  for (let index = 0; index < args.length; index += 2) values[args[index]] = args[index + 1];
  // Accept a variant name or its opaque code, so eval scaffolds can start the
  // app without the defect name appearing in the process list.
  const byCode = Object.fromEntries(Object.entries(variantCodes).map(([name, code]) => [code, name]));
  const variant = byCode[values["--variant"]] ?? values["--variant"];
  const port = Number(values["--port"]);
  if (!variants.has(variant) || !Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error("Usage: node server.mjs --variant <correct|lost-input|double-action|confusing-status|tablet-layout> --port <n>");
  }
  return { variant, port };
}

function readBody(request) {
  return new Promise((resolveBody, reject) => {
    let body = "";
    request.setEncoding("utf8");
    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 5_000_000) reject(new Error("request body is too large"));
    });
    request.on("end", () => resolveBody(body));
    request.on("error", reject);
  });
}

function send(response, status, body, type = "application/json; charset=utf-8") {
  response.writeHead(status, { "content-type": type });
  response.end(typeof body === "string" || Buffer.isBuffer(body) ? body : JSON.stringify(body));
}

function parseCsv(text) {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter((line) => line.trim() !== "");
  const columns = lines.shift()?.split(",").map((column) => column.trim()) ?? [];
  return { columns, rows: lines.map((line) => line.split(",").map((cell) => cell.trim())) };
}

function columnIndex(value, columns) {
  const index = columns.indexOf(value);
  if (index < 0) throw new Error(`unknown column: ${value}`);
  return index;
}

function importedRows(upload, mapping) {
  const nameIndex = columnIndex(mapping.name, upload.columns);
  const emailIndex = columnIndex(mapping.email, upload.columns);
  const teamIndex = columnIndex(mapping.team, upload.columns);
  return upload.rows
    .filter((row) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row[emailIndex] ?? ""))
    .map((row) => ({ name: row[nameIndex] ?? "", email: row[emailIndex] ?? "", team: row[teamIndex] ?? "" }));
}

async function serveStatic(request, response, publicDir) {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(request.url, "http://127.0.0.1").pathname);
  } catch {
    send(response, 400, { error: "invalid URL" });
    return;
  }
  const relative = pathname === "/" ? "index.html" : pathname.slice(1);
  const file = resolve(publicDir, relative);
  if (file !== publicDir && !file.startsWith(`${publicDir}${sep}`)) {
    send(response, 403, { error: "forbidden" });
    return;
  }
  try {
    if (!(await stat(file)).isFile()) throw new Error("not a file");
    send(response, 200, await readFile(file), contentTypes[extname(file)] ?? "application/octet-stream");
  } catch {
    send(response, 404, { error: "not found" });
  }
}

async function start() {
  const { variant, port } = parseArgs(process.argv.slice(2));
  const publicDir = resolve(new URL("./public", import.meta.url).pathname);
  const uploads = new Map();
  const jobs = new Map();
  let nextUpload = 1;
  let nextJob = 1;
  let faultArmed = true;

  const server = createServer(async (request, response) => {
    try {
      const url = new URL(request.url, "http://127.0.0.1");
      if (request.method === "GET" && url.pathname === "/__health") return send(response, 200, "ok", "text/plain; charset=utf-8");
      if (request.method === "POST" && url.pathname === "/__reset") {
        uploads.clear();
        jobs.clear();
        faultArmed = true;
        return send(response, 200, { ok: true });
      }
      if (request.method === "GET" && url.pathname === "/api/config") return send(response, 200, { variant: variantCodes[variant] });
      if (request.method === "POST" && url.pathname === "/api/upload") {
        const upload = parseCsv(await readBody(request));
        if (!upload.columns.length) return send(response, 400, { error: "CSV needs a header row" });
        const uploadId = `upload-${nextUpload++}`;
        uploads.set(uploadId, upload);
        return send(response, 200, { upload_id: uploadId, ...upload });
      }
      if (request.method === "POST" && url.pathname === "/api/import") {
        if (faultArmed) {
          faultArmed = false;
          return send(response, 503, { error: "temporarily unavailable" });
        }
        const body = JSON.parse(await readBody(request));
        const upload = uploads.get(body.upload_id);
        if (!upload || !body.mapping || !body.mapping.name || !body.mapping.email || !body.mapping.team) {
          return send(response, 400, { error: "upload_id and all mappings are required" });
        }
        const jobId = `job-${nextJob++}`;
        const rows = importedRows(upload, body.mapping);
        jobs.set(jobId, { id: jobId, uploadId: body.upload_id, imported: rows.length, skipped: upload.rows.length - rows.length, rows, doneAt: Date.now() + 3_000 });
        return send(response, 200, { job_id: jobId });
      }
      const jobMatch = url.pathname.match(/^\/api\/jobs\/([^/]+)$/);
      if (request.method === "GET" && jobMatch) {
        const job = jobs.get(jobMatch[1]);
        if (!job) return send(response, 404, { error: "job not found" });
        const uploadJobs = [...jobs.values()].filter((item) => item.uploadId === job.uploadId);
        const allDone = uploadJobs.every((item) => Date.now() >= item.doneAt);
        const done = variant === "double-action" ? allDone : Date.now() >= job.doneAt;
        const imported = variant === "double-action" ? uploadJobs.filter((item) => Date.now() >= item.doneAt).reduce((total, item) => total + item.imported, 0) : job.imported;
        const completedJobs = uploadJobs.filter((item) => Date.now() >= item.doneAt);
        const skipped = variant === "double-action" ? completedJobs.reduce((total, item) => total + item.skipped, 0) : job.skipped;
        const rows = variant === "double-action" ? completedJobs.flatMap((item) => item.rows) : job.rows;
        return send(response, 200, { status: done ? "done" : "processing", imported: done ? imported : 0, skipped: done ? skipped : 0, rows: done ? rows : [] });
      }
      if (request.method === "GET") return serveStatic(request, response, publicDir);
      send(response, 404, { error: "not found" });
    } catch (error) {
      send(response, 400, { error: error instanceof Error ? error.message : "bad request" });
    }
  });
  server.listen(port, "127.0.0.1", () => console.log(`import-app ${variantCodes[variant]} listening on http://127.0.0.1:${port}`));
}

start().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
