#!/usr/bin/env bash
# Shared scaffold for ux-plan evals: a small product repo with a project UX
# file and a design system.
set -euo pipefail
here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cp -r "$here/plan-project/." .
git init -q && git add -A && git -c user.email=eval@example.com -c user.name=eval commit -qm init
