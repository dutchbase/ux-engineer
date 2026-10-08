const state = { variant: "k7", upload: null };
const fileInput = document.querySelector("#csv-file");
const pasteInput = document.querySelector("#csv-text");
const error = document.querySelector("#error");
const status = document.querySelector("#status");
const importButton = document.querySelector("#import");
const mapping = {
  name: document.querySelector("#mapping-name"),
  email: document.querySelector("#mapping-email"),
  team: document.querySelector("#mapping-team"),
};

const steps = {
  upload: document.querySelector("#step-upload"),
  map: document.querySelector("#step-map"),
  processing: document.querySelector("#step-processing"),
  result: document.querySelector("#step-result"),
};

function showStep(step) {
  for (const [name, element] of Object.entries(steps)) {
    element.hidden = name !== step && !(step === "processing" && name === "map");
  }
}

function clearError() {
  error.hidden = true;
  error.replaceChildren();
}

function showError(message, retry) {
  status.textContent = "";
  error.hidden = false;
  error.replaceChildren(document.createTextNode(message));
  if (retry) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = "Retry";
    button.addEventListener("click", retry);
    error.append(" ", button);
  }
}

function defaultColumn(columns, name) {
  return columns.find((column) => column.toLowerCase() === name) ?? columns[0] ?? "";
}

function renderPreview(upload) {
  document.querySelector("#preview-head").replaceChildren(...upload.columns.map((column) => {
    const cell = document.createElement("th");
    cell.scope = "col";
    cell.textContent = column;
    return cell;
  }));
  const emailIndex = upload.columns.indexOf(mapping.email.value);
  const rows = upload.rows.map((row) => {
    const tr = document.createElement("tr");
    upload.columns.forEach((_, index) => {
      const cell = document.createElement("td");
      cell.textContent = row[index] ?? "";
      if (index === emailIndex && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row[index] ?? "")) {
        const flag = document.createElement("span");
        flag.className = "invalid-flag";
        flag.textContent = "Invalid email — will be skipped";
        cell.append(" ", flag);
      }
      tr.append(cell);
    });
    return tr;
  });
  document.querySelector("#preview-body").replaceChildren(...rows);
}

function renderMapping(upload) {
  for (const select of Object.values(mapping)) {
    select.replaceChildren(...upload.columns.map((column) => {
      const option = document.createElement("option");
      option.value = column;
      option.textContent = column;
      return option;
    }));
  }
  mapping.name.value = defaultColumn(upload.columns, "name");
  mapping.email.value = defaultColumn(upload.columns, "email");
  mapping.team.value = defaultColumn(upload.columns, "team");
  renderPreview(upload);
}

async function uploadCsv() {
  clearError();
  const file = fileInput.files?.[0];
  const text = file ? await file.text() : pasteInput.value;
  if (!text.trim()) return showError("Choose a CSV file or paste CSV text.");
  const response = await fetch("/api/upload", { method: "POST", body: text });
  if (!response.ok) throw new Error("The CSV could not be uploaded.");
  state.upload = await response.json();
  renderMapping(state.upload);
  showStep("map");
}

function currentMapping() {
  return { name: mapping.name.value, email: mapping.email.value, team: mapping.team.value };
}

async function poll(jobId) {
  const response = await fetch(`/api/jobs/${jobId}`);
  const job = await response.json();
  if (job.status === "processing") return new Promise((resolve) => setTimeout(() => resolve(poll(jobId)), 150));
  document.querySelector("#result-heading").textContent = `${job.imported} contacts imported, ${job.skipped} skipped (invalid email)`;
  document.querySelector("#imported-contacts").replaceChildren(...job.rows.map(({ name, email, team }) => {
    const item = document.createElement("li");
    item.textContent = `${name} — ${email} — ${team}`;
    return item;
  }));
  showStep("result");
  status.textContent = `${job.imported} contacts imported, ${job.skipped} skipped (invalid email)`;
}

function resetLostInput() {
  status.textContent = "";
  fileInput.value = "";
  pasteInput.value = "";
  state.upload = null;
  for (const select of Object.values(mapping)) select.replaceChildren();
  showStep("upload");
}

async function startImport() {
  clearError();
  status.textContent = "Importing...";
  showStep("processing");
  if (state.variant !== "m5") importButton.disabled = true;
  try {
    const response = await fetch("/api/import", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ upload_id: state.upload.upload_id, mapping: currentMapping() }),
    });
    if (!response.ok) {
      if (response.status === 503 && state.variant === "q2") resetLostInput();
      else if (response.status === 503) {
        showStep("map");
        showError("Import failed: temporarily unavailable.", startImport);
      } else {
        showStep("map");
        showError("Import failed. Check the column mapping.");
      }
      return;
    }
    const { job_id: jobId } = await response.json();
    if (state.variant === "t9") status.textContent = "Import complete";
    await poll(jobId);
  } catch {
    showStep("map");
    showError("Import failed. Check your connection.", state.variant === "k7" ? startImport : undefined);
  } finally {
    if (state.variant !== "m5") importButton.disabled = false;
  }
}

document.querySelector("#continue").addEventListener("click", () => uploadCsv().catch((reason) => showError(reason.message)));
importButton.addEventListener("click", startImport);
for (const select of Object.values(mapping)) select.addEventListener("change", () => state.upload && renderPreview(state.upload));

fetch("/api/config")
  .then((response) => response.json())
  .then(({ variant }) => {
    state.variant = variant;
    document.body.dataset.variant = variant;
  });
