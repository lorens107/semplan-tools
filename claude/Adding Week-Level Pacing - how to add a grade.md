# Adding Week-Level Pacing - how to add a grade

> Created 8/27/26, in the repo. No copy existed here; see the note at the top
> of "README - what's in this project.md". Written from doing it for Grade 1
> at commit 4c46ace, against the schema `web/engine.js` actually reads.

## What the feature is

The "Behind on weeks?" panel. A student who covered fewer weeks of LP1 than
the calendar allots gets the rest of the year slid back to match: LP1 ends
early by the deficit, every later LP keeps its normal length and starts that
many weeks sooner, and anything running past week 36 is reported as not
fitting this year.

It is offered only where there is real, guide-sourced per-week data for that
grade/subject/curriculum. Everything else keeps using the ordinary per-LP
cells.

## Status

**Grades 1, 2, 3 and 4 all have working week-shift data**, each for
Math/Zearn and ELA/Beyond the Page. Every one is verified end to end in a
real browser - the panel appears, the fields drive it, and the shifted
content renders. No other grade has week data, and the panel correctly stays
hidden for them.

### Changelog

- **Grade 4** - wired in from `data/zearn_g4_weeks.json` (36 weeks) and
  `data/btp_g4_ela_weeks.json` (14 gap weeks + cursive). At deficit 0 both
  subjects reproduce the stored per-LP cells on all 10 LPs; Grades 1-3
  unchanged. Its Zearn file uses the previous-mission assessment convention
  (week 7 is Mission 3 but carries "Mission 2 End-of-Mission Assessment"),
  same as Grade 2.
- **Grade 3** - arrived with the original uploaded build. It is the one grade
  with **no source files in `data/`**; its week data exists only inside
  `web/web_data.json` and cannot be re-derived.
- **Grade 2** - `data/zearn_g2_weeks.json` (36 weeks),
  `data/btp_g2_ela_weeks.json` (11 gap weeks + cursive).
- **Grade 1** - `data/zearn_g1_weeks.json` (36 weeks),
  `data/btp_g1_ela_weeks.json` (9 gap weeks + cursive). Commit 4c46ace, which
  also split the page's source out of the build and into `web/`.

## Adding a grade is data, not code

`optionsFor()` derives `weekShiftable` straight from whether
`week_pacing[grade][subject][curriculum]` exists, and `updateWeekShiftFields()`
reveals the panel if any picked curriculum is shiftable. There is no per-grade
list anywhere in the JS. Adding a grade means adding data - plus one copy edit.

## The schema

    week_pacing[grade][subject][curriculum] = { kind, weeks }

`kind: "zearn"`

    weeks = {"1".."36": {mission: int,
                         lessons: "lo-hi" or "n",
                         assessment: str   (optional),
                         topic: str        (carried, never read)}}

`zearnShiftedContent()` merges consecutive weeks in the window that share a
mission into one "Mission N: Lessons lo-hi" line, appending each week's
`assessment` with " + ".

`kind: "btp_ela"`

    weeks = {"cursive": {text, url},
             "gap_by_week": {"<week>": {text, url, code?}}}

`btpElaShiftedContent()` emits a week-range line, then each gap activity whose
week falls in the window, then always `cursive`. `code` is never read.

`week_windows` is **global, not per grade**: `{lp: [startWeek, endWeek]}` over
weeks 1-36. LP1 is `[1, 4]`, which is why `app.js` uses `normalWeeks = 4` and
caps the input at 4.

## Steps

1. Put the per-week source files in `data/`.

2. Merge them:

       python3 add_week_pacing.py --grade 1 \
           --zearn data/zearn_g1_weeks.json \
           --btp-ela data/btp_g1_ela_weeks.json

   It validates against the schema above rather than trusting the file's
   shape, and refuses a grade/curriculum pairing the panel could never show.
   It tolerates top-level `_source` / `note` provenance keys and does not
   carry them into the page payload.

3. Update the `.week-shift-note` copy in `web/shell.html`. It names the grades
   the panel covers, and nothing updates it automatically. `add_week_pacing.py`
   prints a reminder.

4. Rebuild: `python3 build_artifact.py`, then publish as `index.html`.

5. Verify (below). Do not skip this.

## Verifying

**The three scripts below are the entire build and verification toolchain in
this repo.** There is nothing else.

    python3 add_week_pacing.py --grade N \
        --zearn data/zearn_gN_weeks.json \
        --btp-ela data/btp_gN_ela_weeks.json
    # then hand-edit the .week-shift-note copy in web/shell.html
    python3 build_artifact.py                     # -> "Semester Plan Pacing.html"
    export NODE_PATH=$(npm root -g)               # playwright is installed globally
    node web/verify_week_shift.js "Semester Plan Pacing.html" N 1
    cp "Semester Plan Pacing.html" index.html     # publish, once verified

`verify_week_shift.js` prints panel visibility, field labels, the note text,
and the rendered preview, as JSON. A console error reading
`net::ERR_CONNECTION_RESET` is expected offline - that is the Google Fonts
stylesheet, not a script failure.

### If your copy of this doc lists a different suite, it is stale

Some copies of this doc name **`build_web_data.py`, `dump_python.py`,
`web/verify_web.js` and `web/verify_artifact.js`** as the verification suite.
**None of those four files exist in this repo, and none ever have.** Do not go
looking for them and do not try to run them.

In particular, **you cannot confirm "The browser engine matches the Python tool
exactly" here.** No script in this repo emits that line, because the Python
workbook tool it compares against is not in this repo. Any report claiming that
check passed did not run it.

Related: `web/web_data.json` cannot be regenerated. Its own `_source` line
credits `build_web_data.py` reading `pacing_data.json`; neither is here. It is
committed as data and edited in place by `add_week_pacing.py`.

Two checks worth running every time:

- **No regression on grades that already worked.** Snapshot each existing
  week-pacing grade at weeks-completed 0 through 4, before and after, and
  diff. Everything should match except copy you changed on purpose.
- **The new grade against its own sources.** At deficit 0 the week path should
  reproduce that grade's stored per-LP cells. Call
  `PlanEngine.weekShiftedContentFor(DATA, grade, subject, curriculum, lp, 0)`
  for LP1-LP10 and compare to `grades[grade].content[subject][curriculum][lp]`.

## One expected mismatch, so it isn't mistaken for a bug

At deficit 0 the **ELA/BTP** week path reproduces the stored per-LP cells
exactly, on all 10 LPs, for all four wired grades.

**Zearn does not, and should not.** Lesson ranges and mission boundaries agree
on every LP, but the week path names the guide's specific assessments inline
("+ Mid-Mission Assessment (Topics A-F), Day 1") where the baked cells use
Appendix A's generic phrasing ("End-of-Mission Assessment") or omit them.
Shipped Grade 3 Zearn differed from its stored cells on all 10 LPs for
exactly this reason before Grade 1 was ever added, so this is the original
behaviour, not something a later grade introduced.

So: a Zearn mismatch confined to assessment wording is expected. A mismatch in
a lesson range or a mission boundary is a real defect - check the source file.
