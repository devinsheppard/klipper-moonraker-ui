#!/usr/bin/env bash
set -euo pipefail

# Spoolman standalone install helper for CB1 hosts.
# Run this script ON the printer host as the target user (e.g. biqu), not from Windows.

if ! command -v curl >/dev/null 2>&1; then
  echo "curl is required. Install it first (e.g. apt-get install -y curl)." >&2
  exit 1
fi

if ! command -v unzip >/dev/null 2>&1; then
  echo "unzip is required. Install it first (e.g. apt-get install -y unzip)." >&2
  exit 1
fi

mkdir -p ./Spoolman
curl -s https://api.github.com/repos/Donkie/Spoolman/releases/latest \
  | grep -o 'https://[^\"]*spoolman.zip' \
  | xargs curl -sSL -o temp.zip
unzip -o temp.zip -d ./Spoolman
rm temp.zip
cd ./Spoolman
bash ./scripts/install.sh

echo "Spoolman install complete."
echo "Open http://<host>:7912 and confirm the web UI loads."