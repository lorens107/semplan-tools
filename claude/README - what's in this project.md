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
                        grades 1, 2 and 3 so far
    index.html              the built page - a build output, kept in git
                            because it is what gets published

Build outputs that are *not* committed are listed in `.gitignore`.

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
`dump_python.py`, `verify_web.js`, `verify_artifact.js`.

That is a real gap, not an oversight to paper over. If those scripts still
exist somewhere, committing them here is the fix.
