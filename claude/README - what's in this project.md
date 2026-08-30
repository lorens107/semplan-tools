# README - what's in this project

> Created 8/27/26, in the repo. No copy of this doc existed here - the repo
> held a single uploaded `index (1).html` and nothing else. If a version of
> this file also lives in the Claude Project, reconcile the two and keep the
> repo copy as the one that counts, for the reason in "Source of truth" below.

## What this repo is

The Semester Plan Pacing page: a single self-contained HTML file a writer
opens, picks a grade and a curriculum per subject, and copies blocks out of
into a student's Semester Plan in Google Sheets.

## Layout

    web/shell.html          markup + all CSS
    web/engine.js           PlanEngine: block/row assignment, pacing, week shift
    web/app.js              pickers, preview tables, Copy buttons
    web/web_data.json       the PLAN_DATA payload the page ships with
    web/verify_week_shift.js  headless-browser check of the week-shift panel

    build_artifact.py       inlines the four above into index.html
    add_week_pacing.py      merges per-week source files into web_data.json
    data/                   guide-sourced per-week files (inputs to the above)
    index.html              the built page - a build output, kept in git
                            because it is what gets published

Build outputs that are *not* committed are listed in `.gitignore`.

## Week-level pacing

**Week-level pacing is live for every grade, TK through 8**, across five
curricula: Math/Zearn and ELA/Beyond the Page in every grade, Studies Weekly
for Science and History/Social Science in Grades K-8 (TK does not offer it),
Lincoln Learning in every subject it is offered for in Grades TK-8 - keyed
`LL` under Math and `Lincoln Learning` elsewhere, as the page already named
it - and, **at Grade K only**, Math/Open Up Resources (OUR Math) and
ELA/Open Up EL Education. The "Behind on weeks?" panel appears only for those
grade/subject/curriculum combinations and stays hidden for every other
curriculum a grade offers, including Open Up in every grade but K.

`data/` holds the guide-sourced per-week files for **every wired grade** -
TK, K and Grades 1 through 8 - and for every curriculum except Lincoln
Learning, whose weeks are derived rather than transcribed. Grade 3 was the
last grade to get its source files:
its week data arrived inside the original uploaded build and lived only in
`web/web_data.json` until 8/29/26, when the transcriptions were found and
wired in, byte-identical to what was already there.

See "Adding Week-Level Pacing - how to add a grade.md" for the schema, the
steps, and the real verification sequence - which is
`add_week_pacing.py`, `build_artifact.py` and `web/verify_week_shift.js`,
and nothing else.

## Source of truth

**`web/` in this repo is the source of truth for the page.**

The Claude Project also stores copies named `web_engine.js`, `web_app.js` and
`web_shell.html`. **Those are stale. Ignore or delete them.** They predate the
week-shift UI, and rebuilding from them would silently remove the "Behind on
weeks?" panel from the live page. This has already caused one wasted cycle:
work was planned on the premise that no week-shift UI existed, because the
Project copies did not have it while the shipped page did.

The rule that avoids a third occurrence: a copy of this source that lives
outside version control will drift, and there is no way to tell from the copy
itself that it has. Edit `web/`, commit, rebuild.

## Rebuilding

    python3 build_artifact.py        # writes "Semester Plan Pacing.html"

To publish, that output becomes `index.html`. The split is verifiable: at
commit 4c46ace, rebuilding reproduced the committed `index.html` byte for
byte. If a rebuild ever fails to, something in `web/` has drifted from what
shipped.

## What is NOT in this repo

The upstream Python workbook pipeline. `web/web_data.json` carries a `_source`
line saying it was built by `build_web_data.py` from `pacing_data.json`, and
`engine.js` describes itself as a port of `generate_plan.py` / `copy_out.py`.
**None of those files are here.** `web_data.json` is committed as data, and
can be edited or extended (see the week-pacing doc), but it cannot currently
be regenerated from its own upstream sources inside this repo. Also absent:
`dump_python.py`, `web/verify_web.js`, `web/verify_artifact.js`.

If a doc or a chat tells you to run `build_web_data.py`, `dump_python.py`,
`web/verify_web.js` or `web/verify_artifact.js`, it is working from a stale
copy. Those four have never been in this repo, and the parity line "The
browser engine matches the Python tool exactly" cannot be produced here.

That is a real gap, not an oversight to paper over. If those scripts still
exist somewhere, committing them here is the fix.
