"""Copy freshly built vite output into the collected static root.

`collectstatic` cannot be used here: it tries to bulk-delete the previous hashed
files and this environment blocks bulk deletes. Since every asset name already
carries a content hash we can copy the changed files instead.

There is a second trap this script handles: Django's `ManifestStaticFilesStorage`
keeps a map in `staticfiles/staticfiles.json`, so asking for `vue3/manifest.json`
actually opens `vue3/manifest.<hash>.json` - a copy frozen at the last
collectstatic run. Copying only `manifest.json` therefore changes nothing,
because django-vite reads the frozen copy and keeps serving the previous bundle.
Every hashed sibling is refreshed here so the manifest content matches the build.

Run from the project root:
    .venv/Scripts/python.exe scripts/sync_static.py
"""

import os
import re
import shutil
import sys

SRC = os.path.join('cookbook', 'static', 'vue3')
DST = os.path.join('staticfiles', 'vue3')

HASHED = re.compile(r'^(?P<base>.+)\.[0-9a-f]{12}\.(?P<ext>[a-z0-9]+)$', re.IGNORECASE)


def copy_if_changed(src, dst):
    if (not os.path.exists(dst)
            or os.path.getsize(src) != os.path.getsize(dst)
            or os.path.getmtime(src) > os.path.getmtime(dst)):
        os.makedirs(os.path.dirname(dst) or '.', exist_ok=True)
        shutil.copy2(src, dst)
        return 1
    return 0


def sync_built_assets():
    copied = 0
    for root, _dirs, files in os.walk(SRC):
        rel = os.path.relpath(root, SRC)
        target = os.path.join(DST, rel) if rel != '.' else DST
        os.makedirs(target, exist_ok=True)
        for name in files:
            copied += copy_if_changed(os.path.join(root, name), os.path.join(target, name))
    return copied


def refresh_hashed_copies():
    """Re-point frozen `name.<hash>.ext` copies at the freshly built `name.ext`."""
    refreshed = 0
    for root, _dirs, files in os.walk(DST):
        for name in files:
            match = HASHED.match(name)
            if not match:
                continue
            original = f"{match.group('base')}.{match.group('ext')}"
            source = os.path.join(SRC, os.path.relpath(root, DST), original)
            if os.path.exists(source):
                refreshed += copy_if_changed(source, os.path.join(root, name))
    return refreshed


def main() -> int:
    if not os.path.isdir(SRC):
        print(f'no build output at {SRC}, run scripts/build_frontend.sh first', file=sys.stderr)
        return 2
    copied = sync_built_assets()
    refreshed = refresh_hashed_copies()
    print(f'synced {copied} files, refreshed {refreshed} hashed copies')
    return 0


if __name__ == '__main__':
    sys.exit(main())
