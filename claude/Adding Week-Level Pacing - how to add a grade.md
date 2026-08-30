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

**Every grade is wired: TK, K, and Grades 1 through 8** - each for Math/Zearn
and ELA/Beyond the Page, the only two curricula the feature covers. TK closed
it out 8/29/26. Every grade is verified end to end in a real browser: the
panel appears, the fields drive it, and the shifted content renders. It stays
hidden for every other curriculum a grade offers - Open Up Resources, Lincoln
Learning, Open Up EL Education, Beast Academy, Dimensions Math, LL, Studies
Weekly, TCI - none of which has week-level data.

There is no next grade. A change here now means a new curriculum, a
correction to an existing grade's transcription, or a change to the panel
itself.

### Changelog

- **Grade TK** - `data/zearn_gTK_weeks.json` (36 weeks),
  `data/btp_gTK_ela_weeks.json` (5 gap weeks, no cursive). The last grade.
  Its Zearn file is **byte-identical to Grade K's**, week for week - the same
  course, and TK's Appendix A row matches K's line for line - so it carries
  the same guide typo at week 19 (a Mission 4 Topic A lesson labelled
  "Mission 5", transcribed as Mission 4 on lesson continuity) and the same
  9-of-10 Zearn result, LP3 being Appendix A's own internal overlap rather
  than a transcription fault. See the Grade K entry for both.

  Its ELA is the sparsest in the project: only 5 of 36 weeks name a gap
  activity, so LP5-LP10 render as a bare week-range line. That is correct -
  see "The ELA panel never shows book/unit content, even for unit-shaped
  guides", the question TK was expected to raise and which was already
  settled before it was built. All 5 activities point at Grade K's own
  supplemental document with identical bookmark anchors, tagged with TK's
  PTKLF codes instead of K's CCSS codes: the same worksheets, shared between
  the two grades.

  Like Grade K, TK had no `btp_gTK_ela_pacing.json` to check against - see
  "No stored pacing file to verify against".
- **Grade K** - `data/zearn_gK_weeks.json` (36 weeks),
  `data/btp_gK_ela_weeks.json` (15 gap weeks, no cursive). Wired 8/29/26,
  commit `f95912f`. Two things made this grade's build different from
  Grades 1-8, both worth knowing before touching TK:

    1. **The ELA guide is unit-shaped, not Mission-shaped** - one book per
       week, not lesson-numbered units. A same-day schema/engine change
       (`unit_by_week`) was built and shipped to render those book names,
       then **deliberately reverted** after Loren decided the ELA panel
       should never show book/unit content at all - see "The ELA panel
       never shows book/unit content, even for unit-shaped guides" below.
       Read that section before starting TK, which has the same guide shape
       and will raise the same question again.
    2. **No `btp_gK_ela_pacing.json` existed to check gap activities
       against.** Every other grade's gap-activity text/url/code was reused
       verbatim from an already-built, already-corrected per-LP pacing file.
       Grade K had none, so the activities were pulled from the guide for
       the first time in this pass, with Loren confirming the raw list
       before anything was locked in (see "No stored pacing file to verify
       against" below).

  Zearn is 9 of 10 against Appendix A - not a defect in the transcription.
  Appendix A's own LP3/LP4 split double-counts lessons 6-10 (LP3 claims
  Mission 3 lessons 1-10, LP4 claims lessons 6-17); the week path's 1-5 /
  6-17 split is the coherent reading, confirmed against both the guide's own
  week calendar and the LP Meeting Plan document directly, so it stands per
  the calendar-wins rule even though it means Appendix A itself, not just
  the transcription, has the inconsistency. One guide typo caught by
  lesson-content continuity: week 19's body labels a Mission 4 Topic A
  lesson "Mission 5"; the lesson-1/lesson-2 pair is clearly one continuous
  sequence, so it's transcribed as Mission 4. Same pattern as Grade 5 wk28 /
  Grade 7 wks33-34 / Grade 8 wk29. Two other guide slips found but not
  schema-relevant: weeks 11 and 36 attach 2nd-grade standards codes to
  Kindergarten lessons, and weeks 15/17 link "Mission 4" materials while
  still inside Mission 3.

- **Grade 8** - `data/zearn_g8_weeks.json` (36 weeks),
  `data/btp_g8_ela_weeks.json` (13 gap weeks, no cursive). Both subjects
  reproduce their stored data exactly on all 10 LPs - Zearn 10/10 against
  Appendix A, ELA 10/10 against the stored per-LP cells. First grade since
  Grade 4 with no window-vs-prose divergence anywhere in the year; the
  guide's calendar and Appendix A agree on every mission boundary and lesson
  range. One guide typo corrected via lesson-content continuity: week 29's
  header reads "Mission 8", but the body is entirely Mission 7 (Mid-Mission
  Assessment, Topic C Lessons 9-10), and correcting it is what lets weeks
  28-30 merge into Appendix A's LP8 line verbatim ("Mission 7: Lessons
  4-15") instead of splitting into three unmatched chunks. Same mislabel
  pattern as Grade 5's week 28 and Grade 7's weeks 33/34. Cursive-optional
  path from Grade 7 carried Grade 8 with no further code change.

- **Grade 7** - `data/zearn_g7_weeks.json` (36 weeks),
  `data/btp_g7_ela_weeks.json` (14 gap weeks, **no cursive**). ELA reproduces
  the stored per-LP cells on all 10 LPs. Zearn matches on 7 of 10; LP8-LP10
  are a sustained window-vs-prose drift, reviewed and **accepted** 8/28/26 -
  the guide's calendar is trusted over Appendix A's grouping, and the file
  stays exactly as transcribed. First grade to require a code change - see
  "Grades without cursive".
- **Grade 6** - `data/zearn_g6_weeks.json` (36 weeks),
  `data/btp_g6_ela_weeks.json` (14 gap weeks + cursive). ELA reproduces the
  stored per-LP cells on all 10 LPs. Zearn matches on 7 of 10, and all three
  exceptions are known shapes, not defects: LP9 is an assessment-only mission
  tail (below), and LP3/LP4 are a window-vs-prose split (below). Lesson
  accounting checked independently - every mission's lessons are contiguous
  from 1 with no gaps or duplicates across all 36 weeks.
- **Grade 5** - `data/zearn_g5_weeks.json` (36 weeks),
  `data/btp_g5_ela_weeks.json` (14 gap weeks + cursive). ELA reproduces the
  stored per-LP cells on all 10 LPs, including LP3, where weeks 9 and 10 name
  the same activity under the same bookmark and the stored data carries it
  twice - both weeks are kept deliberately. Zearn matches on 9 of 10; see
  "Assessment-only mission tails" below for LP5, which is expected.
- **Grade 4** - wired in from `data/zearn_g4_weeks.json` (36 weeks) and
  `data/btp_g4_ela_weeks.json` (14 gap weeks + cursive). At deficit 0 both
  subjects reproduce the stored per-LP cells on all 10 LPs; Grades 1-3
  unchanged. Its Zearn file uses the previous-mission assessment convention
  (week 7 is Mission 3 but carries "Mission 2 End-of-Mission Assessment"),
  same as Grade 2.
- **Grade 3** - **correction, 8/29/26: the previous entry was wrong.** It
  said Grade 3 was the one grade with no source files and could not be
  re-derived. That was false - `zearn_g3_weeks.json` (36 weeks) and
  `btp_g3_ela_weeks.json` (13 gap weeks + cursive) both existed in the Claude
  Project, transcribed 8/27/26 the same way every other grade was, and were
  simply never wired into this repo's `data/` folder or committed. Verified
  against Appendix A: Zearn matches its lesson ranges exactly on all 10 LPs
  (Mission 1 1-18/19-21, Mission 2 1-13/14-21, Mission 3 11-21, Mission 4
  1-16, Mission 5 1-17/18-30, Mission 6 6-9, Mission 7 11-27/28-34).

  **Now wired**, commit `a59b854`. The open question that correction raised -
  whether the Project files held the same data as the original uploaded build
  or different data - was checked before the merge, since
  `add_week_pacing.py` would have overwritten the live content had they
  differed. **They are identical**: all 36 Zearn weeks, all 13 gap
  activities, the same cursive; the only extra keys are `_source` and `note`,
  which the loader strips. So the merge was a byte-for-byte no-op on both
  `web_data.json` and `index.html` - nothing to publish, no note copy to
  change, no regression check to run, because the page did not change. What
  it bought is reproducibility: **every wired grade now has its source in
  `data/`**, so Grade 3's block can be regenerated rather than only
  inherited. If a future doc copy still says "no source files, cannot be
  re-derived," it predates this correction and is wrong.
- **Grade 2** - `data/zearn_g2_weeks.json` (36 weeks),
  `data/btp_g2_ela_weeks.json` (11 gap weeks + cursive).
- **Grade 1** - `data/zearn_g1_weeks.json` (36 weeks),
  `data/btp_g1_ela_weeks.json` (9 gap weeks + cursive). Commit 4c46ace, which
  also split the page's source out of the build and into `web/`.

## Grades without cursive

`cursive` is **optional**. Grades 1, 4, 5 and 6 have a cursive component that
runs every week; **Grades 7, 8, and K have none at all** - their guides name
no weekly cursive assignment and their stored per-LP cells never mention one
(Grade 7 verified: zero mentions across all 10 LPs, against Grade 6's mention
in every LP; Grade K's guide has exactly one passing mention of "Printing/
Cursive" in the general course blurb and nothing per-week). **Loren has also
confirmed TK has no cursive** - expect `btp_gTK_ela_weeks.json` to need the
same no-`cursive`-key treatment when that grade is built.

Until Grade 7 both `add_week_pacing.py` and `btpElaShiftedContent()` read
`cursive` unconditionally - the loader exited with `btp_ela: missing
'cursive'`, and the engine would have thrown on `undefined.text`. Both now
treat it as optional. A grade with no cursive renders LPs that have no gap
activity as just the week-range line, e.g. Grade 7 LP1 is `Weeks 1-4`, which
is exactly what its stored cell says.

**Never invent a cursive entry to satisfy the schema.** A missing key is real
data about that grade.

## The ELA panel never shows book/unit content, even for unit-shaped guides

Grade K's CORE ELA guide names one book per week (`Unit 1: A - A is for Musk
Ox`, `Unit 2: H - Hondo and Fabian`, ...), not lesson-numbered units the way
Grades 1-8 do. This raised a real question: the `btp_ela` schema only ever
read `gap_by_week` and `cursive`, neither of which describes what book a
student is on, so wiring Grade K's ELA data as-is renders LP6-LP10 - the
five LPs with no gap activity at all - as a bare week-range line with no
other content.

**A `unit_by_week` schema/engine extension was built and briefly shipped**
(commit `f95912f`, 8/29/26) to fix that: one line per week's book, merged
across consecutive weeks sharing the same book. It worked - every book
rendered exactly once across all 36 weeks, Grades 1-8 unaffected - but it
was **reverted the same day**. Loren's direction: the ELA week-shift panel
should show the week range plus standards-gap and supplemental activities
by name, in the same shape as every other grade, and nothing else. Not book
or unit titles, even where that means a bare week-range line for weeks with
no gap activity.

**So the bare-week-range result for LP6-LP10 on Grade K's ELA panel is
correct, not a bug.** Do not read that as content going missing - it's the
intended shape once you know book/unit content is out of scope for this
panel by design. If a future session is tempted to re-add `unit_by_week`
rendering because a grade's later LPs look sparse, check here first: this
was tried, worked, and was turned down on purpose.

**TK has the same unit-shaped ELA guide** (per the README's "Beyond the Page
in TK and K" note) and will raise this exact question again. The answer is
already settled: no book/unit content in the panel, gap activities and
cursive only, same as every other grade.

## No stored pacing file to verify against

For Grades 1-2 and 4-8, a `btp_gN_ela_pacing.json` (or equivalent) already
existed before the week-shift file was built - some earlier pass had already
gone through that grade's guide, decided which "Visions Standards Gap
Activity" links were real ELA activities, resolved duplicates and stray
codes, and written the clean result down. Building the week-shift file for
those grades was just adding "this activity's week is N" to an already-
trusted list.

**Grade K had no such file.** Nobody had gone through the K guide and made
those calls yet, so the gap activities in `btp_gK_ela_weeks.json` were
pulled from the guide directly, for the first time, in this pass - which
means the same kind of judgment calls Grade 2 and Grade 4 needed were made
here too, with Loren reviewing the raw list before anything was locked in
rather than after. If another grade turns up with no stored pacing file
(TK is the obvious next candidate, per the README's "Beyond the Page in TK
and K" note), do the same: show the raw list first, don't derive titles/
codes/URLs and present them as settled.

Two things this pass surfaced that are worth checking for early on any
future from-scratch grade:

- **The district's own document-link sheet can mislabel a doc's subject.**
  Grade K's link sheet names two different documents "Visions Standards Gap
  Activities for Beyond the Page H-SS - Grade K" (cells J5 and C29 of
  `core_guide_links_raw.json`). Only one of them actually is H-SS (its codes
  are `K.2`, `K.3` - the same numbering the guide's own "History-Social
  Science" standard rows use). The other's codes (`K-ESS2-2`, `K-PS2-2`,
  `K-PS3-1`, `K-PS3-2`) are NGSS Science standards, and its lesson content is
  entirely science (Earth's Systems, Motion and Stability, Energy). Don't
  trust a doc's title in the link sheet over what its actual codes say.
- **A code can sit outside the markdown link's brackets.** Most gap-activity
  rows read `[Visions Standards Gap Activity - CODE](url)`, but a few read
  `[Visions Standards Gap Activity -](url) CODE` - the code trails after the
  closing bracket instead of living inside it. A regex written for the first
  shape silently drops weeks written the second way (this cost Grade K's
  first pass two weeks, 5 and 17, both caught only because the total gap-
  activity count didn't match the guide's own supplement-document lesson
  count). Capture the whole row, not just the link text, and count the result
  against the supplement document's own lesson count before trusting it.

## Adding a grade is mostly data, not code

`optionsFor()` derives `weekShiftable` straight from whether
`week_pacing[grade][subject][curriculum]` exists, and `updateWeekShiftFields()`
reveals the panel if any picked curriculum is shiftable. There is no per-grade
list anywhere in the JS. Adding a grade normally means adding data - plus one
copy edit.

Grade 7 was the first exception: a grade whose shape the engine did not yet
support (no cursive) needed a one-line engine change. Expect data-only, but
check the new grade's files against the schema before assuming it.

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
week falls in the window, then `cursive` **if the grade has one**. `code` is
never read. **This is the only content the ELA panel ever shows - see below
for why book/unit content was tried and then deliberately left out.**

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

### Assessment-only mission tails

One more shape that looks like a span mismatch but is not. `zearnShiftedContent()`
builds a line per run of weeks sharing a mission, so a mission whose only
presence in an LP window is an **assessment with no lessons** never gets its own
line - the assessment text is folded onto the next mission's line instead.

Grade 5 LP5 is the case in the repo. Stored reads
`Mission 3: Lessons 17 - End-of-Mission Assessment | Mission 4: Lessons 1-16`;
the week path emits one line,
`Mission 4: Lessons 1-16 + Mission 3 End-of-Mission Assessment (Topics A-D), Days 2-3 + ...`.
Confirmed 8/27/26 that Grade 5 Mission 3 has no lesson 17 - Appendix A's
"Lessons 17 -" is its own bookkeeping for the assessment days - so no lesson
content is lost, only the formatting differs.

Grades 2 and 4 carry the same previous-mission convention without tripping
this, because there the earlier mission still had real lessons inside the
window and so did get its own line. Before accepting one of these, confirm the
missing line really is assessment-only; if the earlier mission has lessons in
that window and no line appears, that IS a defect.

Grade 6 LP9 is the second instance: Mission 7 ends at lesson 18 in week 30
(LP8's window), only its End-of-Mission Assessment falls in week 31, and
stored's `Mission 7: Lessons 19 - End-of-Mission Assessment` is again
bookkeeping for an assessment rather than a real lesson 19. Expect this shape
to recur; run the test rather than assuming either way.

### Window-vs-prose mission splits

A different expected shape, first seen at Grade 6 LP3/LP4. Appendix A's prose
can group a mission differently from where `WEEK_WINDOWS` actually puts its
guide weeks. Grade 6 Mission 3 has 17 lessons; Appendix A puts all 17 under
LP3 and writes LP4 as "finished", but the guide week carrying lessons 13-17
(week 13) falls inside LP4's window (13-15), so the week path renders
`Mission 3: Lessons 1-12` in LP3 and `Mission 3: Lessons 13-17` in LP4.

Nothing is lost or duplicated - it is grouped by the calendar rather than by
Appendix A's sentence.

**Grade 7 LP8-LP10 is the second instance, and the sustained one.** Appendix A
runs about a guide-week ahead of the calendar through the whole back third: it
has Mission 7 finishing inside LP7 and Mission 8 as `Lessons 1-13` in LP8,
while the week path has Mission 7's last lessons and its End-of-Mission
Assessment landing in week 28 - LP8's window - so Mission 8 only reaches
lesson 10 there. Unlike Grade 6, the offset never re-syncs: LP9 and LP10
disagree too. Lesson accounting is clean (every mission contiguous from 1,
matching the source file's own counts), and the week-24, week-33 and week-34
transcriptions were confirmed against the guide directly.

What a reader notices is larger than the arithmetic suggests - LP8 opens with
a mission Appendix A says is already finished, and LP10 shows seven lessons
where Appendix A shows two. That is expected here, not a defect.

### When the guide's calendar and Appendix A disagree, the calendar wins

**This is the standing rule for this project, not a one-off call for Grade 7.**
Appendix A groups loosely, in prose, and its groupings do not always line up
with the week numbers the curriculum guide actually prints. The week-level
files are transcribed from those week numbers, so where the two disagree the
week path is the more accurate of the pair, and the shifted view is meant to
follow it.

So: do not "fix" a week file to make it reproduce Appendix A. Confirm the
transcription against the guide, confirm lesson accounting is clean, and then
let the divergence stand. The only thing that makes a divergence a defect is
a lesson going missing, appearing twice, or a mission boundary contradicting
the guide itself. The check that settles it is lesson accounting, not
line-by-line comparison: confirm every mission's lessons are contiguous from 1
with no gaps and no duplicates across all 36 weeks. If they are, the split is
presentational. If a lesson is missing or appears twice, that IS a defect.
