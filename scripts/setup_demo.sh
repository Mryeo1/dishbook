#!/usr/bin/env bash
#
# One command to get a runnable demo instance.
#
#   bash scripts/setup_demo.sh            # migrate + build + start (keeps data)
#   bash scripts/setup_demo.sh --fresh    # also wipe content and reseed 30 recipes
#
# Everything it does is idempotent except --fresh, which deletes recipe content
# but keeps users and spaces (see scripts/reset_demo_data.py).
set -euo pipefail

cd "$(dirname "$0")/.."

PY=".venv/Scripts/python.exe"
[ -x "$PY" ] || PY="python"

FRESH=0
for arg in "$@"; do
    case "$arg" in
        --fresh) FRESH=1 ;;
        *) echo "unknown option: $arg" >&2; exit 2 ;;
    esac
done

if [ ! -f .env ]; then
    echo "==> .env missing, copying .env.template"
    cp .env.template .env
    echo "    edit .env and set SECRET_KEY before exposing this instance"
fi

echo "==> applying migrations"
"$PY" manage.py migrate --noinput

echo "==> building frontend"
bash scripts/build_frontend.sh

if [ "$FRESH" = "1" ]; then
    echo "==> resetting demo content"
    "$PY" scripts/reset_demo_data.py
    echo "==> seeding recipes, meal plans and shopping lists"
    "$PY" scripts/seed_demo_data.py
    echo "==> attaching recipe photos (needs internet, ~1 min)"
    "$PY" scripts/seed_demo_images.py
fi

echo "==> starting on http://127.0.0.1:8000  (demo: chenxiao@example.com / Tandoor@2026)"
exec "$PY" manage.py runserver 127.0.0.1:8000
