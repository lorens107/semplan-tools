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

## Status as of commit 5945b8e + Grade 2

**Grades 1, 2 and 3 all have working week-shift data**, each for
Math/Zearn and ELA/Beyond the Page. Both are verified end to end in a real
browser - the panel appears, the fields drive it, and the shifted content
renders. No other grade has week data, and the panel correctly stays hidden
for them.

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

    node web/verify_week_shift.js <built.html> <grade> <weeksCompletedInLP1>

Needs `NODE_PATH=$(npm root -g)` where playwright is installed globally.
Prints panel visibility, field labels, note text, and the rendered preview.

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
exactly, on all 10 LPs, for both Grade 1 and Grade 3.

**Zearn does not, and should not.** Lesson ranges and mission boundaries agree
on every LP, but the week path names the guide's specific assessments inline
("+ Mid-Mission Assessment (Topics A-F), Day 1") where the baked cells use
Appendix A's generic phrasing ("End-of-Mission Assessment") or omit them.
Shipped Grade 3 Zearn differs from its stored cells on all 10 LPs for exactly
this reason, and did so before Grade 1 was added.

So: a Zearn mismatch confined to assessment wording is expected. A mismatch in
a lesson range or a mission boundary is a real defect - check the source file.
