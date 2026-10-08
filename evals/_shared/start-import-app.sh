#!/usr/bin/env bash
# Shared scaffold helper for audit evals. Starts the import test app in the
# background (outside the workspace, so the agent cannot read its source),
# copies only the sample CSV into the workspace, and links the Playwright
# browser cache into the run's temporary HOME.
# Usage: start-import-app.sh <variant> <port>
set -euo pipefail
variant="$1"; port="$2"
# Start with the opaque code so `ps` does not show the defect name.
case "$variant" in
  correct) code=k7;; lost-input) code=q2;; double-action) code=m5;;
  confusing-status) code=t9;; tablet-layout) code=r4;; *) echo "unknown variant $variant" >&2; exit 1;;
esac
here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
src="$here/../../tests/fixtures/import-app"
# Run a copy from a temp folder, so the process path does not lead the agent
# to this repository (which holds the ground truth). The agent may still read
# this copy's source after black-box testing; that is allowed code reading.
app="$(mktemp -d)/app"
cp -r "$src" "$app"

# The agent's shell runs in a sandbox that cannot read the real home or reach
# the npm registry, so install the browser CLI into the workspace and hard-link
# the Playwright browser cache into the run's temporary HOME (same filesystem).
real_home="$(getent passwd "$(id -un)" | cut -d: -f6)"
if [ -d "$real_home/.cache/ms-playwright" ] && [ ! -e "$HOME/.cache/ms-playwright" ]; then
  mkdir -p "$HOME/.cache/ms-playwright"
  for b in "$real_home"/.cache/ms-playwright/chromium*; do
    cp -al "$b" "$HOME/.cache/ms-playwright/" 2>/dev/null || cp -a "$b" "$HOME/.cache/ms-playwright/"
  done
fi
npm install --no-save --no-audit --no-fund --silent @playwright/cli@0.1.22 >/dev/null

if curl -sf "http://127.0.0.1:$port/__health" >/dev/null; then
  curl -sf -X POST "http://127.0.0.1:$port/__reset" >/dev/null
else
  nohup setsid node "$app/server.mjs" --variant "$code" --port "$port" >/dev/null 2>&1 < /dev/null &
  for _ in $(seq 1 50); do curl -sf "http://127.0.0.1:$port/__health" >/dev/null && break; sleep 0.1; done
  curl -sf "http://127.0.0.1:$port/__health" >/dev/null
fi

cp "$src/sample-contacts.csv" ./contacts.csv
cat > README.md <<'MD'
# Contact importer

Admins upload a CSV of contacts, map its columns, check a preview, and import.
MD
printf 'node_modules/\n' > .git-info-exclude
git init -q && mv .git-info-exclude .git/info/exclude && git add -A && git -c user.email=eval@example.com -c user.name=eval commit -qm init
