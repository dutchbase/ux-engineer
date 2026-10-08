#!/usr/bin/env bash
set -euo pipefail
bash "$(dirname "${BASH_SOURCE[0]}")/../_shared/plan-project.sh"
cat > schema.sql <<'SQL'
CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT
);
SQL
git add -A && git -c user.email=eval@example.com -c user.name=eval commit -qm "add schema"
