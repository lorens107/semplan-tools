#!/usr/bin/env python3
"""Merge per-week source files into web/web_data.json's week_pacing block.

    python3 add_week_pacing.py --grade 1 \
        --zearn zearn_g1_weeks.json --btp-ela btp_g1_ela_weeks.json

Reconstructed 8/27/26 against the schema web/engine.js actually reads, not
against the older add_week_pacing.py (which is not in this repo and could not
be diffed). The contract, from engine.js:

  week_pacing[grade][subject][curriculum] = {kind, weeks}

  kind "zearn"    weeks = {"<week 1-36>": {mission: int,
                                           lessons: "lo-hi" or "n",
                                           assessment: str (optional),
                                           topic: str (carried, unread)}}
                  -> zearnShiftedContent() reads mission/lessons/assessment.

  kind "btp_ela"  weeks = {"cursive": {text, url},
                           "gap_by_week": {"<week>": {text, url, code?}}}
                  -> btpElaShiftedContent() reads gap_by_week[wk] and cursive.

Anything the engine would trip over is rejected here rather than shipped, so a
source file in a different shape fails loudly instead of rendering blank cells.
"""
import argparse, json, pathlib, sys

WEB = pathlib.Path(__file__).parent / 'web'
DATA = WEB / 'web_data.json'


def unwrap(payload, kind):
    """Accept either a bare weeks payload or a {kind, weeks} wrapper."""
    if isinstance(payload, dict) and 'weeks' in payload and 'kind' in payload:
        if payload['kind'] != kind:
            sys.exit('file declares kind %r, expected %r' % (payload['kind'], kind))
        return payload['weeks']
    return payload


def check_zearn(weeks):
    if not isinstance(weeks, dict):
        sys.exit('zearn: expected an object keyed by week number')
    # source files carry provenance keys next to the week numbers; the page
    # never reads them, and grade 3's stored block doesn't carry them either
    weeks = {k: v for k, v in weeks.items() if not k.startswith('_')}
    for wk, entry in weeks.items():
        where = 'zearn week %s' % wk
        if not str(wk).isdigit() or not 1 <= int(wk) <= 36:
            sys.exit('%s: week keys must be "1".."36"' % where)
        for field in ('mission', 'lessons'):
            if field not in entry:
                sys.exit('%s: missing %r' % (where, field))
        if not isinstance(entry['lessons'], str):
            sys.exit('%s: lessons must be a string like "1-5"' % where)
        for part in entry['lessons'].split('-')[:2]:
            if not part.strip().isdigit():
                sys.exit('%s: lessons %r is not "lo-hi" or "n"' % (where, entry['lessons']))
    missing = [w for w in range(1, 37) if str(w) not in weeks]
    if missing:
        print('  note: no entry for weeks %s - those weeks contribute nothing'
              % ','.join(map(str, missing)))
    return weeks


def check_btp(weeks):
    if not isinstance(weeks, dict):
        sys.exit('btp_ela: expected an object')
    if 'gap_by_week' not in weeks:
        sys.exit('btp_ela: missing %r' % 'gap_by_week')
    # cursive is OPTIONAL. Grades 7 and 8 genuinely have no cursive component -
    # their guides name none and their stored per-LP cells never mention one -
    # so a missing key is real data, not an omission to paper over. Never
    # invent one to satisfy the schema.
    if 'cursive' in weeks:
        for field in ('text', 'url'):
            if field not in weeks['cursive']:
                sys.exit('btp_ela: cursive is missing %r' % field)
    for wk, act in weeks['gap_by_week'].items():
        if not str(wk).isdigit():
            sys.exit('btp_ela: gap_by_week key %r is not a week number' % wk)
        for field in ('text', 'url'):
            if field not in act:
                sys.exit('btp_ela: gap_by_week[%s] is missing %r' % (wk, field))
    covered = sorted(int(w) for w in weeks['gap_by_week'])
    print('  note: gap activities named for weeks %s; %s'
          % (','.join(map(str, covered)),
             'cursive runs every week' if 'cursive' in weeks
             else 'no cursive component for this grade - none will be emitted'))
    # keep only what the engine reads, matching grade 3's stored block
    out = {'gap_by_week': weeks['gap_by_week']}
    if 'cursive' in weeks:
        out = {'cursive': weeks['cursive'], 'gap_by_week': weeks['gap_by_week']}
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--grade', required=True)
    ap.add_argument('--zearn')
    ap.add_argument('--btp-ela', dest='btp_ela')
    args = ap.parse_args()
    if not (args.zearn or args.btp_ela):
        sys.exit('nothing to add: pass --zearn and/or --btp-ela')

    data = json.loads(DATA.read_text(encoding='utf-8'))
    if args.grade not in data['grades']:
        sys.exit('grade %r is not in web_data.json' % args.grade)
    block = data.setdefault('week_pacing', {}).setdefault(args.grade, {})

    jobs = []
    if args.zearn:
        jobs.append(('Math', 'Zearn', 'zearn', check_zearn, args.zearn))
    if args.btp_ela:
        jobs.append(('ELA', 'Beyond the Page', 'btp_ela', check_btp, args.btp_ela))

    for subject, curriculum, kind, check, path in jobs:
        available = data['grades'][args.grade]['available'].get(subject, [])
        if curriculum not in available:
            sys.exit('grade %s has no %s under %s - the panel would never show'
                     % (args.grade, curriculum, subject))
        payload = json.loads(pathlib.Path(path).read_text(encoding='utf-8'))
        weeks = check(unwrap(payload, kind))
        block.setdefault(subject, {})[curriculum] = {'kind': kind, 'weeks': weeks}
        print('  %s / %s / %s: ok' % (args.grade, subject, curriculum))

    with DATA.open('w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        f.write('\n')
    print('wrote', DATA)
    print('reminder: shell.html\'s .week-shift-note still names only Grade 3 - '
          'update that copy when a grade is added.')


if __name__ == '__main__':
    main()
