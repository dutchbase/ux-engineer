#!/usr/bin/env bash
set -euo pipefail
cat > README.md <<'MD'
# Shelfshare

A web app where neighbours lend each other tools (drills, ladders, garden tools).
Owners list a tool, borrowers request it, and they agree on a pickup time.
MD
cat > AGENTS.md <<'MD'
# Agent instructions

Use pnpm. Run `pnpm test` before you commit.
MD
mkdir -p src
echo '<!doctype html><title>Shelfshare</title><h1>Borrow a tool</h1>' > src/index.html
echo '{ "name": "shelfshare", "private": true }' > package.json
git init -q && git add -A && git -c user.email=eval@example.com -c user.name=eval commit -qm init
