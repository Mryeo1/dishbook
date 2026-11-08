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

PY=".venv/Scripts/python.exe"          # windows
[ -x "$PY" ] || PY=".venv/bin/python"  # macos / linux
[ -x "$PY" ] || PY="python"

# Do not limp along on an unrelated interpreter: the system python often has an
# old django but not this project's dependencies, and the failure then surfaces
# half way through a build as a confusing traceback.
"$PY" -c "import django, dotenv, rest_framework" 2>/dev/null || {
    echo "Python dependencies are missing for: $PY" >&2
    echo "Create the virtualenv first:" >&2
    echo "    python -m venv .venv" >&2
    echo "    .venv/bin/pip install -r requirements.txt   # windows: .venv\\Scripts\\pip" >&2
    exit 1
}

FRESH=0
for arg in "$@"; do
    case "$arg" in
        --fresh) FRESH=1 ;;
        *) echo "unknown option: $arg" >&2; exit 2 ;;
    esac
done

if [ ! -f .env ]; then
    # .env.example is the zero-dependency developer config (sqlite, DEBUG).
    # .env.template is aimed at deployments and defaults to postgres, so it would
    # send a first-time reader chasing a database that is not running.
    if [ -f .env.example ]; then
        echo "==> .env missing, creating it from .env.example"
        cp .env.example .env
    else
        echo "==> .env missing, copying .env.template (edit it before starting)"
        cp .env.template .env
    fi
    # a shared placeholder secret is worse than a random one, and generating it
    # costs nothing here
    "$PY" - <<'PY'
import pathlib, re, secrets
p = pathlib.Path('.env')
text = p.read_text(encoding='utf-8')
text = re.sub(r'(?m)^SECRET_KEY=.*$', f'SECRET_KEY={secrets.token_urlsafe(50)}', text)
p.write_text(text, encoding='utf-8')
print('    generated a random SECRET_KEY')
PY
fi

if [ ! -d vue3/node_modules ]; then
    echo "==> installing frontend dependencies (npm ci)"
    (cd vue3 && npm ci)
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
