#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")/.."

command -v npm >/dev/null 2>&1 || {
  echo "Node.js and npm are required: https://nodejs.org/"
  read -r
  exit 1
}

if [[ -f package-lock.json ]]; then
  npm ci
else
  npm install
fi

npm run check
npm run dist:mac
open release
