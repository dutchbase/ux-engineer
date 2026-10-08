#!/usr/bin/env bash
# Runs one audit eval case with `claude -p` outside the eval sandbox.
# `claude plugin eval` runs shell commands in an OS sandbox that blocks the
# sockets Chromium needs, so browser audits are run this way instead.
# Usage: evals/_shared/run-audit-local.sh <case-name>   (e.g. audit-lost-input)
# The plugin is loaded from a temporary copy (manifest + skills only), so the
# agent cannot walk from the skill folder to the ground truth in this repo.
# Prints the workspace path. claude plugin eval has no command grader, so
# grade by hand:
#   node dist/ux.mjs validate-run <workspace>/.ux/runs/20261008-000000-eval
# and compare findings.json with evals/ground-truth/import-app.json.
set -euo pipefail
case_name="$1"
repo="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
case_dir="$repo/evals/$case_name"
plugin="$(mktemp -d)/ux-engineer"
mkdir -p "$plugin"
cp -r "$repo/.claude-plugin" "$repo/skills" "$repo/LICENSE" "$plugin/"
work="$(mktemp -d)"
cd "$work"
bash "$case_dir/fixture.sh"
prompt="$(awk 'BEGIN{n=0} /^---$/{n++; next} n>=2' "$case_dir/prompt.md")"
claude -p "$prompt" \
  --plugin-dir "$plugin" \
  --allowedTools "Read,Glob,Grep,Skill,Write,Edit,Bash" \
  --max-turns 120 \
  --output-format text > "$work/.final-reply.txt" 2>&1 || true
echo "$work"
