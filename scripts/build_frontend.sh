#!/usr/bin/env bash
#
# Build the Vue frontend and publish it into the collected static root.
#
# Why this exists instead of a plain `npm run build`:
#   1. `vite build` writes into cookbook/static/vue3, but Django serves files from
#      staticfiles/ (whitenoise). `collectstatic` refuses to overwrite the hashed
#      bundle in some sandboxes, so scripts/sync_static.py copies synchronously.
#   2. whitenoise caches its file index at startup, and django-vite caches its
#      manifest. Neither notices a new hashed bundle, so the dev server has to be
#      restarted after this script. That is the single most common "I rebuilt but
#      nothing changed" trap in this project.
#
# Usage:  bash scripts/build_frontend.sh && <restart the dev server>
set -euo pipefail

cd "$(dirname "$0")/.."

echo "==> building frontend"
(cd vue3 && npx vite build --emptyOutDir=false) || {
    echo "build failed" >&2
    exit 1
}

echo "==> syncing static files"
.venv/Scripts/python.exe scripts/sync_static.py 2>/dev/null \
    || python scripts/sync_static.py

echo "==> done. restart the Django process so whitenoise picks up the new hashes."
