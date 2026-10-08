#!/usr/bin/env bash
set -euo pipefail
here="$(dirname "${BASH_SOURCE[0]}")"
bash "$here/../_shared/plan-project.sh"
# Fictional support tickets, copied after the initial commit so they stay untracked input.
cp -r "$here/../_shared/research-data" ./research-data
