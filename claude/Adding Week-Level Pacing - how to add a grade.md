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

**Every grade is wired: TK, K, and Grades 1 through 8**, and the feature now
covers **five curricula**:

    Math/Zearn                  TK, K, 1-8
    ELA/Beyond the Page         TK, K, 1-8
    Science/Studies Weekly      K, 1-8   (no TK - TK does not offer it)
    HSS/Studies Weekly          K, 1-8   (no TK)
    Math/LL                     TK, K, 1-8
    ELA/Lincoln Learning        TK, K, 1-8
    Science/Lincoln Learning    TK, K, 1-8
    HSS/Lincoln Learning        TK, K, 1-8 except grade 3, which does not offer it
    Math/Open Up Resources      K, 1, 2
    ELA/Open Up EL Education    K, 1, 2

Studies Weekly was added 8/29/26 and was the first new *curriculum* rather
than a new grade - it needed a third `kind`. Lincoln Learning followed on
8/30/26 and needed no new kind at all, reusing `studies_weekly`. Open Up
Resources (OUR Math) and Open Up EL Education followed the same day and needed
a fourth kind, `module_unit_lesson`; Grades 1 and 2 followed the same day.
They are wired at **Grades K, 1 and 2 only**, and the other grades that offer
them still show no panel. Every combination is verified end to end in a real
browser. The panel stays hidden for every curriculum without week-level data:
Beast Academy, Dimensions Math, TCI, and Open Up Resources / Open Up EL
Education in every grade except K, 1 and 2.

A change here now means another new curriculum, a correction to an existing
transcription, or a change to the panel itself.

### Changelog

- **OUR Math and Open Up EL Education at Grade 2** - 8/30/26. Data-only, like
  Grade 1: both curricula were already offered with ten LPs of baseline
  content, so this filled two existing slots. Week-pacing slots: 81 to **83**.
  OUR Math Grade 2 also finishes at week 35 - week 36 is a generic "Review"
  page (dice games, math mosaics) with no M|U|L content - so the file has no
  `"36"` key, and no LP rendered empty at any deficit.

  Coverage as ordered prefix, exact in both: OUR Math 41, 40 and 39 of 41
  segments at deficits 1, 2 and 3 (**41 of 41 at deficit 1**, the early-finish
  signature Grade 1 showed too), EL Education 39, 38 and 37 of 40. Lesson
  accounting clean in both - OUR Math contiguous from 1 within each of Units
  1-9, EL Education within each of the twelve Module/Unit pairs.

  **The deficit-0 check is not a string comparison, and cannot be.** At
  deficit 0 the panel renders the *stored* Appendix A cells, not generated
  content, so "does deficit 0 reproduce stored" is true by construction and
  proves nothing. What is worth checking, and what was checked here, is the
  week path *called directly* at deficit 0 (`weekShiftedContentFor(..., 0)`)
  against the stored cells, comparing the outer-level and lesson endpoints per
  LP. Both EL Education files at K, 1 and 2 agree exactly. OUR Math shows one
  or two LP-boundary differences per grade, all of the documented
  window-vs-prose kind:

    - **Grade 2, LP7/LP8**: Appendix A puts Unit 7 "Lessons 1-13" in LP7 *and*
      "Lessons 13 - ..." in LP8, double-counting lesson 13. The week path puts
      1-12 in LP7 and 13-18 in LP8, so lesson 13 appears exactly once. This is
      the guide's own week-27 header typo, which the transcriber resolved in
      favour of the week's lesson-by-lesson body; the calendar wins, per the
      standing rule.
    - **Grade 1, LP2 and LP5**, and **Grade K, LP7**: the same shape - a
      unit's tail sits one LP earlier or later in the week calendar than in
      Appendix A's prose grouping.

  The guide typos are recorded in the file's own `_note`: the header rows for
  weeks 23, 24, 26 and 27 undercount the outgoing section's lesson range, and
  Appendix A reproduces the same header text next to a title list that matches
  the body rather than the header - which is what settles it.

  One thing that looks like a duplicate and is not: **"Unit 1 Assessment" in
  both weeks 11 and 12** (Module 2 Unit 1) and **"Unit 2 Assessment" in both
  weeks 32 and 33** (Module 4 Unit 2) are multi-week assessments spanning two
  weeks, the same shape confirmed at Grade K's LP9. The file's `_note` covers
  the narrower case - a tag repeated across lessons *within* one segment is
  written once - which is a different thing.

- **OUR Math and Open Up EL Education at Grade 1** - 8/30/26. The second grade
  on `module_unit_lesson`, and **data-only**: no engine change, no loader
  change, no new kind. Grade 1 already offered both curricula with ten LPs of
  baseline content, so this added week data to two existing slots rather than
  creating them - unlike Lincoln Learning at TK/K, which needed the baseline
  built first. Week-pacing slots: 79 to **81**.

  **OUR Math Grade 1 finishes at week 35, not 36.** Week 36 in the guide is a
  generic "Review" page - two open-ended activities, no Unit/Section/Lesson
  content - so the source file simply has no `"36"` key. That is correct, and
  it is also inert: `shiftedWindows()` only ever moves windows *earlier*, so
  week 36 is reached only at deficit 0, where the stored per-LP cells are what
  render. `moduleUnitLessonShiftedContent()` skips a missing week key
  silently, and no LP came out empty at any deficit - checked all ten, at all
  five weeks-completed values. This is the first `module_unit_lesson` file
  that is short of 36 weeks; `check_module_unit_lesson()` already tolerated it
  and prints `no entry for weeks 36`.

  Two transcription quirks are preserved on purpose and should not be
  "corrected" later: week 34's checkpoint is printed as **"Section C
  Checklist"** where all seven others say Checkpoint, and Units 3, 4, 6 and 8
  end in **"Assessments"** (plural) while Units 2, 5 and 7 say "Assessment".
  Both are as printed in the guide. The file's own `_note` also records a
  guide typo - the header rows for weeks 3-4, 5, 10, 16, 21, 24, 28 and 32
  undercount the outgoing section's last lesson - resolved in favour of the
  week's own lesson-by-lesson content and confirmed against Appendix A.

  Verified the same way as Grade K, coverage-as-ordered-prefix: at deficits 1,
  2 and 3 the rendered segments are an exact ordered prefix of the source
  file, losing only tail weeks. OUR Math gives 42, 41 and 40 of 42 segments -
  **42 of 42 at deficit 1**, because a course that already ends at week 35
  loses nothing to a one-week shift - and EL Education 39, 38 and 37 of 40.
  Lesson accounting is clean in both: OUR Math contiguous from 1 within each
  Unit (1-15, 1-22, 1-28, 1-23, 1-14, 1-17, 1-17, 1-10), EL Education
  contiguous within each Module/Unit pair, no gaps or duplicates. All 10
  previously wired grades are byte-identical, and Grade K's own OUR Math and
  EL Education output is unchanged at every deficit.

- **OUR Math and Open Up EL Education at Grade K** - 8/30/26. Two new
  curricula and a fourth `kind`, `module_unit_lesson`, wired at **Grade K
  only**. Both guides are shaped the same way and neither fits `zearn`: they
  nest a lesson range inside *two* levels (Unit > Section for OUR Math,
  Module > Unit for EL Education), and lesson numbers reset at the inner
  level for EL Education but run continuously across the outer one for OUR
  Math. A single `mission` integer cannot carry that, hence a new kind rather
  than a reshaping of the existing one.

  Three rules that came out of the build and are easy to get wrong later:

    - **Consecutive weeks are never merged.** `zearnShiftedContent()` folds
      same-mission weeks into one line; `moduleUnitLessonShiftedContent()`
      deliberately does not. One segment in, one line out - the segments are
      the guide's own week boundaries and collapsing them loses the pacing.

    - **Assessment-only segments drop the inner label.** OUR Math's Unit
      Assessment weeks carry no `lessons` key and store `unit: "Assessments"`,
      which is accurate to the guide but redundant on the page. The engine
      renders `Unit 1: Unit 1 Assessment`, not
      `Unit 1 | Section Assessments: Unit 1 Assessment`. **The fix lives in
      `moduleUnitLessonShiftedContent()`, not the data file** - do not
      "clean up" `unit: "Assessments"` in `data/our_math_gK_weeks.json`.

    - **`unit` is a string, always** - `"A"`, `"C-D"` and `"Assessments"` for
      OUR Math, `"1"`, `"2"`, `"3"` for EL Education. EL Education's units are
      numbered, and the first export typed them as ints; that was fixed in the
      file. The validator enforces `str` and does **not** accept both types.

  Verification here is **coverage, not exact match against Appendix A**. The
  stored per-LP cells compress a whole LP into one range
  (`M1 U1: Lessons 1 - Unit 1 Assessment`), while the panel enumerates one
  line per guide week; the two cannot be string-compared by construction. The
  test that was actually run: at every deficit, the rendered segments are an
  exact ordered prefix of the source file's segments, with only the tail weeks
  falling off the end of the calendar - 40 of 41 OUR Math segments and 41 of
  42 EL Education segments at deficit 1, down to 38 and 39 at deficit 3.

  Two things that look like defects in the source files and are not, both
  confirmed against the guides: LP1's **Benchmark Assessment Cycles 1 and 2**
  really do sit in week 1 of EL Education, and LP9's **repeated "Unit 2
  Assessment"** in weeks 31 and 33 is a genuine two-part assessment, not a
  duplicated row.

- **Lincoln Learning at TK and K** - 8 further slots, taking LL to **39**.
  Not a week-pacing job: `ll_week_lesson_map.json` is grade-agnostic and
  covered TK/K the moment `available[]` named them, so this was the baseline
  data those grades had never had. TK and K carried **nothing** for LL
  beforehand - absent from `available`, `display` and `content` alike.

  The per-LP content needed no authoring. All 31 existing LL slots share one
  identical block, `Lessons 1-15` through `Lessons 170-180` - the same fixed
  table the week map derives from - so the new slots reuse it verbatim.

  What did need sourcing was `display`, one name and URL per slot, and the
  two grades differ:

    - **TK has a single integrated guide** covering all four subjects,
      "Integrated TK Pacing Guide - VIE", filed under ELA. All four TK slots
      point at that one URL. **This is correct, not a copy-paste error** - do
      not "fix" it into four separate links.
    - **K has four real per-subject guides**, one URL each. Never reuse TK's
      integrated URL for K.
- **Lincoln Learning, every subject, Grades 1-8** - one file,
  `data/ll_week_lesson_map.json`, wired into **31 slots**. Reuses
  `kind: "studies_weekly"` unchanged; no engine change was needed.

  **The first curriculum with no guide-transcribed weeks at all.** Do not go
  looking for a source PDF: LL's own guides give no per-week granularity -
  assessments are listed per Learning Period with no week attached, confirmed
  against 38 district LL pacing guides and against Appendix A's own LL cells.
  The weeks are *derived*, from the fixed 180-lesson range table already used
  by the Semester Plan Generator plus the district's 2026-27 school calendar,
  on the basis that students do one LL lesson per subject per school day.
  Note the calendar has 175 instructional days against the table's 180, so the
  day-count weighting is a proportion guide, not a literal one-lesson-per-day
  count; the fixed table wins, per Loren 8/30/26.

  **One file, many slots.** The map is universal - identical at every grade
  and subject, because it derives from a table that is itself identical
  everywhere. `add_week_pacing.py` gained `--ll-math` and `--ll-other` for
  this: the same path is passed to both, eight invocations cover all 31 slots,
  and no duplicate copies of the file exist. `--ll-other` covers ELA, Science
  and HSS and **skips a subject the grade does not offer** rather than
  failing, which is what grade 3 HSS needs.

  **Two curriculum keys, already established.** The page calls it `LL` under
  Math and `Lincoln Learning` under everything else. That split predates this
  work and is baked into each grade's `available[]`; the two flags exist to
  honour it.

  Verified: every LP window reproduces the fixed lesson range exactly at
  deficit 0, at every slot checked. Like Studies Weekly it cannot match its
  stored cells line-for-line - stored holds `Lessons 1-15`, the panel holds
  the four weeks that make it up - so coverage is again the test.
- **Studies Weekly, Science and H-SS, Grades K-8** - 18 files in `data/`,
  `studies_weekly_g{K,1..8}_{science,hss}.json`, all extracted from Appendix A
  itself (Studies Weekly names its own weeks, so no separate guide PDF was
  needed). The first new curriculum rather than a new grade, and the first to
  need a third `kind`.

  **Its courses finish before the year does, on purpose**: Science runs 32
  weeks in K-5 and 28 in 6-8; H-SS runs the full 36 everywhere. Confirmed
  independently against Appendix A, which simply has **no LP entry at all**
  past the finish - grade 1 Science stops at LP9, grade 6 Science at LP8. All
  18 files are contiguous from week 1 and end exactly where Appendix A ends.

  **It cannot reproduce its stored cells, by construction.** Appendix A's
  Studies Weekly cells hold only a week range - `Weeks 1-4` - while the week
  path names each week's title. So the deficit-0 exact-match check is not a
  correctness test for this curriculum; the check that replaces it is the one
  in "Courses that finish before week 36" below.

  One Appendix A oddity, left as-is: **grade 7 Science**. Its file is 28
  contiguous weeks, matching grades 6 and 8, but Appendix A's LP9 for it reads
  `Week 36` and its LP10 carries prose about working at your own pace. A
  28-week course has no week 36, so the panel says `Course finished (no
  content past week 28)` for both LPs. That is the coherent reading and
  matches grades 6 and 8; Appendix A is the inconsistent one here.
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

`kind: "studies_weekly"`

    weeks = {"<week>": "title"}

`studiesWeeklyShiftedContent()` emits one `Week N: title` line per week in the
window, and appends `Course finished (no content past week N)` when the window
runs past the last week the course has. No week-range line and no activities -
this data carries no URLs.

`kind: "module_unit_lesson"`

    weeks = {"1".."36": [ {module: int,
                           unit: str,                 (always a string)
                           lessons: "lo-hi" or "n",   (optional)
                           assessment: str}           (optional)
                        , ... ]}

Note the shape: a week's value is a **list of segments**, so a week that
crosses a Unit or Module boundary carries both halves without folding or
dropping a lesson. At least one of `lessons` / `assessment` must be present. A
week the guide gives no Unit/Section/Lesson content for simply has **no key**
- OUR Math Grade 1 stops at 35 - and the renderer skips a missing key without
comment. Unlike `studies_weekly`, this kind prints no "Course finished" line;
it does not need one, because a window only ever reaches week 36 at deficit 0,
where the stored cells render instead.

The stored block also carries a `labels` pair naming the two levels, because
they differ per curriculum:

    "labels": {"outer": "Unit",   "inner": "Section"}   OUR Math
    "labels": {"outer": "Module", "inner": "Unit"}      EL Education

`moduleUnitLessonShiftedContent()` emits **one line per segment**, in week
order, with **no merging of consecutive weeks** (unlike `zearn`):

    {outer} {module} | {inner} {unit}: Lessons {lo-hi} [+ {assessment}]

and, for a segment with no `lessons` key, drops the inner label entirely:

    {outer} {module}: {assessment}

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

   The other flags are `--sw-science`, `--sw-hss`, `--ll-math`, `--ll-other`,
   `--our-math` and `--el-ela`; each takes a source file and each is
   optional, so a run can wire one curriculum without touching the rest.

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

### Courses that finish before week 36

Studies Weekly Science ends at week 32 (K-5) or 28 (6-8) against a 36-week
calendar, so a shifted window can run past the end of the course. That is
**not** missing data, and the panel says so rather than rendering nothing:
`Course finished (no content past week 32)`. Appendix A handles the same fact
by having no LP entry at all - grade 1 Science has no LP10 - so the panel is
strictly more informative here than the printed plan.

Because Appendix A's Studies Weekly cells hold only week ranges while the week
path names titles, exact-match against stored is meaningless for this
curriculum. **Use coverage instead**, the same test the unit-shaped grades
use: every week in the file should appear exactly once across LP1-LP10, and
the weeks must be contiguous from 1. `add_week_pacing.py` rejects an interior
gap outright, since a hole would render as a silently missing week; a short
course is fine, a holed one is not.

`module_unit_lesson` handles an early finish differently and deliberately:
OUR Math Grade 1 has no `"36"` key, and nothing is printed for that week. No
"Course finished" line is needed because `shiftedWindows()` only moves windows
earlier, so a shifted view never reaches the missing tail - only deficit 0
does, and that renders the stored cells. What to check instead is that no LP
comes out **empty** at any deficit; an empty cell would mean a whole window
landed on missing weeks.

### Derived weeks, where no guide has them

Lincoln Learning is the first curriculum whose weeks were not transcribed from
anything. Its guides carry no per-week granularity, so the weeks are computed
from a fixed lesson-range table plus the school calendar. **There is no source
PDF to check it against, and looking for one is wasted effort.**

What replaces guide-verification here is internal consistency: the derived
weeks must reconstruct the fixed table exactly. Union the lesson ranges of the
weeks in each LP window and compare against the table - LP1 must come out
1-15, LP2 16-40, and so on to LP10 at 170-180 - and confirm lessons 1-180 are
covered once each with no gaps or duplicates. That is the whole check.

### Enumerated segments vs a compressed LP range

`module_unit_lesson` cannot be string-compared against its stored per-LP cells
at all, and that is by construction, not a defect. Appendix A compresses a
whole LP into a single span - `M1 U1: Lessons 1 - Unit 1 Assessment` - while
the panel prints one line per guide week. Neither is wrong; they are different
granularities of the same plan.

The check that replaces exact match is **coverage as an ordered prefix**:
render at each deficit, flatten the LP cells back into a list of segment
lines, and confirm that list is exactly the source file's segments from week 1
onward, with only the tail weeks falling off the end of the 36-week calendar.
A segment out of order, repeated, or missing from the middle is a real defect;
a shorter list at a larger deficit is the feature working.

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
