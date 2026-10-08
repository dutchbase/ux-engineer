#!/usr/bin/env bash
set -euo pipefail
bash "$(dirname "${BASH_SOURCE[0]}")/../_shared/plan-project.sh"
cat > src/app.js <<'JS'
function loadData() {
  return [{ name: "Ada Example", email: "ada@example.com" }];
}

console.log(loadData().length);
JS
git add -A && git -c user.email=eval@example.com -c user.name=eval commit -qm "add app"
