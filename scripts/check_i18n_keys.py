"""Compare the Vue locale files and report keys that only exist on one side.

The UI reads every label from `vue3/src/locales/*.json`. A key that is added to
one file and forgotten in the other does not crash anything: vue-i18n silently
falls back to the English string, so a half translated screen ships without
anyone noticing. This script makes that visible.

Only `zh_Hans.json` is checked by default. The other locale files come from
upstream and are deliberately left mostly empty (existing translations are
filled in over time), so reporting on them is noise rather than signal.

Usage:
    python scripts/check_i18n_keys.py            # check zh_Hans against en
    python scripts/check_i18n_keys.py --all      # also list every upstream locale
    python scripts/check_i18n_keys.py --strict   # exit 1 when the target drifts
"""

import argparse
import json
import os
import sys

LOCALE_DIR = os.path.join('vue3', 'src', 'locales')
REFERENCE = 'en.json'
DEFAULT_TARGETS = ['zh_Hans.json']


def load(path):
    with open(path, encoding='utf-8') as handle:
        return json.load(handle)


def flatten(data, prefix=''):
    keys = {}
    for key, value in data.items():
        name = f'{prefix}.{key}' if prefix else key
        if isinstance(value, dict):
            keys.update(flatten(value, name))
        else:
            keys[name] = value
    return keys


def report(name, reference, strict_values):
    current = flatten(load(os.path.join(LOCALE_DIR, name)))
    missing = sorted(set(reference) - set(current))
    extra = sorted(set(current) - set(reference))
    # upstream locales keep untranslated strings as empty values on purpose
    empty = sorted(key for key, value in current.items() if strict_values and isinstance(value, str) and not value.strip())

    print(f'\n{name}: {len(current)} keys | missing {len(missing)} | extra {len(extra)} | empty {len(empty)}')
    for label, keys in (('missing', missing), ('extra', extra), ('empty', empty)):
        for key in keys[:20]:
            print(f'  {label:<8} {key}')
        if len(keys) > 20:
            print(f'  ... and {len(keys) - 20} more {label}')

    return len(missing) + len(extra) + len(empty)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument('--all', action='store_true', help='also scan upstream locales')
    parser.add_argument('--strict', action='store_true', help='exit 1 when the target locale drifts')
    args = parser.parse_args()

    if not os.path.isdir(LOCALE_DIR):
        print(f'locale directory not found: {LOCALE_DIR}', file=sys.stderr)
        return 2

    reference = flatten(load(os.path.join(LOCALE_DIR, REFERENCE)))
    print(f'reference: {REFERENCE} ({len(reference)} keys)')

    problems = sum(report(name, reference, strict_values=True) for name in DEFAULT_TARGETS)

    if args.all:
        others = sorted(name for name in os.listdir(LOCALE_DIR)
                        if name.endswith('.json') and name not in DEFAULT_TARGETS and name != REFERENCE)
        for name in others:
            report(name, reference, strict_values=False)

    if problems == 0:
        print(f'\n{DEFAULT_TARGETS[0]} agrees with {REFERENCE} on the key set')
        return 0
    print(f'\n{problems} key(s) need attention in {DEFAULT_TARGETS[0]}')
    return 1 if args.strict else 0


if __name__ == '__main__':
    sys.exit(main())
