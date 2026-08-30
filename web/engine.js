/* Semester Plan pacing engine, browser side.
 *
 * A port of the assembly half of generate_plan.py and copy_out.py: which block
 * a subject goes in, which rows its curricula claim, where NWA goes, how a
 * late start shifts the pacing, how Beyond the Page splits across three
 * subject rows, and the PE order with its pinned LPs.
 *
 * The other half is not ported. Every assignment cell was worked out by the
 * Python condenser ahead of time and baked into web_data.json by
 * build_web_data.py, so the text in a cell here is the text the verified tool
 * produced, not a second implementation of it. Same for the ten district
 * templates: only their row layout is needed at runtime, and that is in the
 * data too.
 *
 * No DOM in this file. verify_web.js runs it under Node and diffs every cell
 * against the Python tool.
 */
(function (root) {
  'use strict';

  var LAST_LP = 10;

  function collapse(text) {
    return String(text == null ? '' : text).replace(/\s+/g, ' ').trim();
  }

  function span(rows) {
    if (!rows.length) return [];
    var lo = Math.min.apply(null, rows), hi = Math.max.apply(null, rows), out = [];
    for (var r = lo; r <= hi; r++) out.push(r);
    return out;
  }

  /* ---------------------------------------------------- curricula resolution */

  // A TK-2 student on Beyond the Page for ELA is on it for Science and H-SS
  // too: it is one integrated course in those grades. Fill those rows in
  // rather than leaving them blank because they were not picked.
  function applyBtpIntegration(data, grade, chosen, notes) {
    if (data.btp_integrated_grades.indexOf(grade) < 0) return chosen;
    if ((chosen.ELA || []).indexOf('Beyond the Page') < 0) return chosen;
    data.btp_integrated_subjects.forEach(function (subject) {
      var current = chosen[subject] || [];
      if (current.indexOf('Beyond the Page') >= 0) return;
      chosen[subject] = ['Beyond the Page'].concat(current);
      notes.push(subject + ': Beyond the Page added as the first curriculum' +
        (current.length ? ', above ' + current.join(', ') : '') +
        ' — it is one integrated course with ELA in this grade.');
    });
    return chosen;
  }

  // Beyond the Page is a single course, so its three rows share one start LP.
  function normalizeStarts(data, grade, chosen, startLps, notes) {
    var out = {};
    Object.keys(chosen).forEach(function (subject) {
      var value = parseInt((startLps || {})[subject], 10);
      out[subject] = (value >= 1 && value <= LAST_LP) ? value : 1;
    });
    var elaStart = out.ELA;
    if (elaStart && (chosen.ELA || []).indexOf('Beyond the Page') >= 0) {
      data.btp_integrated_subjects.forEach(function (subject) {
        if ((chosen[subject] || []).indexOf('Beyond the Page') >= 0 &&
            out[subject] !== elaStart) {
          out[subject] = elaStart;
          notes.push(subject + ': start LP matched to ELA (LP' + elaStart +
            ') — Beyond the Page is one course here.');
        }
      });
    }
    return out;
  }

  /* --------------------------------------------------------- block selection */

  // Every student sits in exactly one Science block and one Math block. Where
  // a grade offers alternatives this always resolves to one: the integrated
  // Science course, and the standard Math course rather than Accelerated or
  // IM 1. A block the student is not in stays completely empty.
  function chooseBlock(data, subject, candidates, label, warnings) {
    if (!candidates || !candidates.length) return null;
    if (candidates.length === 1) return candidates[0];

    function named(list) {
      return list.map(function (b) { return "'" + b.label + "'"; }).join(', ');
    }

    if (subject === 'Science') {
      var integrated = candidates.filter(function (b) {
        return b.label.toLowerCase().indexOf('integrated') >= 0;
      });
      if (integrated.length) {
        var others = candidates.filter(function (b) {
          return integrated.indexOf(b) < 0;
        });
        warnings.push(label + ": used '" + integrated[0].label + "' (left " +
          named(others) + ' empty)');
        return integrated[0];
      }
    }

    if (subject === 'Math') {
      var standard = candidates.filter(function (b) {
        var low = b.label.toLowerCase();
        return !data.non_standard_math.some(function (t) {
          return low.indexOf(t) >= 0;
        });
      });
      if (standard.length) {
        var skipped = candidates.filter(function (b) {
          return standard.indexOf(b) < 0;
        });
        if (skipped.length) {
          warnings.push(label + ": used '" + standard[0].label + "' (left " +
            named(skipped) + ' empty)');
        }
        return standard[0];
      }
    }

    warnings.push(label + ': ' + candidates.length + ' blocks (' +
      candidates.map(function (b) { return b.label; }).join(', ') +
      '); used the first');
    return candidates[0];
  }

  /* ------------------------------------------------------------ PE scheduling */

  // Pinned topics take their LP first and keep it whatever the start LP is:
  // they are tied to a date the district has already set. Everything else
  // flows in list order through the LPs that are left.
  function peSchedule(entry, startLp) {
    var topics = entry.topics || [];
    if (!topics.length) return { plan: {}, dropped: [] };
    var start = Math.min(Math.max(1, parseInt(startLp, 10) || 1), LAST_LP);
    var plan = {}, pinnedTitles = {};

    Object.keys(entry.pins || {}).forEach(function (lp) {
      var topic = entry.pins[lp], n = parseInt(lp, 10);
      if (n >= 1 && n <= LAST_LP && topics.indexOf(topic) >= 0) {
        plan[n] = topic;
        pinnedTitles[topic] = true;
      }
    });

    var flowing = topics.filter(function (t) { return !pinnedTitles[t]; });
    var open = [];
    for (var lp = start; lp <= LAST_LP; lp++) if (!plan[lp]) open.push(lp);
    open.forEach(function (lp, i) { if (i < flowing.length) plan[lp] = flowing[i]; });
    return { plan: plan, dropped: flowing.slice(open.length) };
  }

  // Word for word what pe.overflow_warning writes, so the two implementations
  // can be diffed rather than eyeballed.
  function peOverflow(entry, startLp, sched) {
    if (!(entry.topics || []).length || !sched.dropped.length) return null;
    var lps = Object.keys(sched.plan).map(Number);
    var last = lps.length ? sched.plan[Math.max.apply(null, lps)] : 'nothing';
    var start = Math.max(1, parseInt(startLp, 10) || 1);
    var note = 'PE: starting in LP' + start + ' leaves no room for ' +
      sched.dropped.join(', ') + '. The last PE assignment of the year is now ' +
      last + ', not ' + entry.topics[entry.topics.length - 1] + '.';
    var held = Object.keys(entry.pins || {})
      .map(Number)
      .filter(function (lp) { return sched.plan[lp] === entry.pins[lp]; })
      .sort(function (a, b) { return a - b; })
      .map(function (lp) { return entry.pins[lp] + ' in LP' + lp; });
    if (held.length) {
      note += ' ' + held.join(', ') +
        ' stayed put — it is tied to a district testing date.';
    }
    return note;
  }

  /* ------------------------------------------------------------- the fill pass */

  function contentFor(grade, data, subject, curriculum, lp) {
    var byCurriculum = ((data.grades[grade].content || {})[subject] || {});
    var block = (byCurriculum[curriculum] || {})[String(lp)];
    return block || null;
  }

  /* --------------------------------------------------- week-level pacing shift
   *
   * A port of week_shift.py, built 8/27/26 for a student completing weeks 1-3
   * of LP1 in Beyond the Page and Zearn, with the rest of the year sliding
   * back to match. Only offered where data.week_pacing has real, guide-sourced
   * per-week data for that grade/subject/curriculum - see weekPacingFor().
   * Everything else keeps using the ordinary per-LP baked cells above.
   */

  function weekPacingFor(data, grade, subject, curriculum) {
    var bySubject = ((data.week_pacing || {})[grade] || {})[subject] || {};
    return bySubject[curriculum] || null;
  }

  // {lp: [start, end] or null}. LP1 ends `deficit` weeks early; every later
  // LP keeps its normal length but slides back by that many weeks. null means
  // the window has run entirely past week 36 - the curriculum doesn't reach
  // that LP this year, same as any curriculum that finishes before LP10.
  function shiftedWindows(data, deficit) {
    var out = {}, total = 36;
    Object.keys(data.week_windows).forEach(function (lp) {
      var win = data.week_windows[lp], start = win[0], end = win[1];
      var newStart, newEnd;
      if (lp === '1') {
        newStart = start; newEnd = end - deficit;
      } else {
        var length = end - start + 1;
        newStart = start - deficit; newEnd = newStart + length - 1;
      }
      if (newStart > total || newEnd < newStart) { out[lp] = null; return; }
      if (newEnd > total) newEnd = total;
      out[lp] = [newStart, newEnd];
    });
    return out;
  }

  function weekRangeLine(win) {
    if (!win) return null;
    return win[0] === win[1] ? ('Week ' + win[0]) : ('Weeks ' + win[0] + '-' + win[1]);
  }

  function zearnShiftedContent(weeks, win) {
    if (!win) return { lines: ['Curriculum finished before this LP (week range ran out)'], activities: [] };
    var chunks = [];
    for (var wk = win[0]; wk <= win[1]; wk++) {
      var entry = weeks[String(wk)];
      if (!entry) continue;
      var parts = entry.lessons.split('-');
      var lo = parseInt(parts[0], 10), hi = parseInt(parts[1] || parts[0], 10);
      var last = chunks.length ? chunks[chunks.length - 1] : null;
      if (last && last.mission === entry.mission) {
        last.lo = Math.min(last.lo, lo);
        last.hi = Math.max(last.hi, hi);
        if (entry.assessment) last.assessments.push(entry.assessment);
      } else {
        chunks.push({
          mission: entry.mission, lo: lo, hi: hi,
          assessments: entry.assessment ? [entry.assessment] : [],
        });
      }
    }
    var lines = chunks.map(function (c) {
      var line = 'Mission ' + c.mission + ': ' +
        (c.lo === c.hi ? ('Lesson ' + c.lo) : ('Lessons ' + c.lo + '-' + c.hi));
      c.assessments.forEach(function (a) { line += ' + ' + a; });
      return line;
    });
    return { lines: lines, activities: [] };
  }

  function btpElaShiftedContent(weekTags, win) {
    if (!win) return { lines: ['Curriculum finished before this LP (week range ran out)'], activities: [] };
    var gapByWeek = weekTags.gap_by_week;
    var acts = [];
    for (var wk = win[0]; wk <= win[1]; wk++) {
      var a = gapByWeek[String(wk)];
      if (a) acts.push(a);
    }
    // cursive is optional - grades 7 and 8 carry no cursive component at all
    if (weekTags.cursive) acts.push(weekTags.cursive);
    var lines = [weekRangeLine(win)];
    acts.forEach(function (a, i) {
      if (i) lines.push('');
      lines.push(a.text);
    });
    return { lines: lines, activities: acts };
  }

  /* Studies Weekly names its own weeks - one title per week, no mission or
   * lesson structure and no gap activities, so it needs its own renderer
   * rather than a variant of the other two. Its courses also finish before
   * the year does: Science runs 32 weeks in K-5 and 28 in 6-8, against a
   * 36-week calendar, while H-SS runs the full 36.
   *
   * A window past the end says so in as many words. Silently rendering
   * nothing would look like missing data, which is exactly what the shifted
   * view must not do.
   */
  function studiesWeeklyShiftedContent(weeks, win) {
    if (!win) return { lines: ['Curriculum finished before this LP (week range ran out)'], activities: [] };
    var last = 0;
    Object.keys(weeks).forEach(function (k) {
      var n = parseInt(k, 10);
      if (n > last) last = n;
    });
    var lines = [];
    for (var wk = win[0]; wk <= win[1]; wk++) {
      var title = weeks[String(wk)];
      if (title) lines.push('Week ' + wk + ': ' + title);
    }
    if (win[1] > last) {
      lines.push('Course finished (no content past week ' + last + ')');
    }
    return { lines: lines, activities: [] };
  }

  // The one entry point build() calls. Returns null when this
  // grade/subject/curriculum has no real week data, so the caller falls back
  // to the normal per-LP content untouched.
  function weekShiftedContentFor(data, grade, subject, curriculum, lp, deficit) {
    var pacing = weekPacingFor(data, grade, subject, curriculum);
    if (!pacing) return null;
    var win = shiftedWindows(data, deficit)[String(lp)];
    if (pacing.kind === 'zearn') return zearnShiftedContent(pacing.weeks, win);
    if (pacing.kind === 'btp_ela') return btpElaShiftedContent(pacing.weeks, win);
    if (pacing.kind === 'studies_weekly') return studiesWeeklyShiftedContent(pacing.weeks, win);
    return null;
  }

  // The sheet as the writer sees it: text and activities per row per LP, plus
  // the Curricula column. Starts as whatever the district template ships.
  function blankSheet(layout) {
    var cells = {}, colB = {};
    Object.keys(layout.rows).forEach(function (row) {
      var entry = layout.rows[row];
      colB[row] = { name: entry.name, url: null, fromTemplate: true };
      cells[row] = {};
      [['fall', 0], ['spring', 0]].forEach(function () {});
      ['fall', 'spring'].forEach(function (half) {
        Object.keys(entry[half] || {}).forEach(function (lp) {
          cells[row][lp] = { text: entry[half][lp], activities: [] };
        });
      });
    });
    return { cells: cells, colB: colB };
  }

  function claimRow(sheet, block, name, claimed) {
    for (var row = block.start; row <= block.end; row++) {
      var held = sheet.colB[row];
      if (held && collapse(held.name) === name) return row;
    }
    for (var r = block.start; r <= block.end; r++) {
      if (sheet.colB[r] || claimed[r]) continue;
      claimed[r] = true;
      return r;
    }
    return block.end;
  }

  function build(data, options) {
    var grade = options.grade;
    var entry = data.grades[grade];
    if (!entry) throw new Error('No pacing loaded for grade ' + grade);

    var warnings = [], notes = [];
    var chosen = {};
    data.subject_order.forEach(function (subject) {
      var picked = (options.curricula || {})[subject];
      var list = (picked || []).filter(Boolean);
      if (list.length) chosen[subject] = list.slice();
    });
    if (!Object.keys(chosen).length) {
      throw new Error('Pick a curriculum for at least one subject.');
    }
    chosen = applyBtpIntegration(data, grade, chosen, notes);

    var ordered = {};
    data.subject_order.forEach(function (s) {
      if (chosen[s]) ordered[s] = chosen[s];
    });
    chosen = ordered;

    var starts = normalizeStarts(data, grade, chosen, options.startLps, notes);
    var includePe = options.includePe !== false;
    var peStart = parseInt(options.peStart, 10) || 1;

    var layout = entry.layout;
    var sheet = blankSheet(layout);
    var claimed = {};
    var rowsUsed = {}, usedBlocks = [], touched = {};
    var links = {};

    data.subject_order.forEach(function (subject) {
      var keys = chosen[subject];
      if (!keys) return;
      var candidates = layout.blocks[subject];
      if (!candidates || !candidates.length) {
        warnings.push(subject + ': no such block in this template');
        return;
      }
      var block = chooseBlock(data, subject, candidates, subject, warnings);
      usedBlocks.push(block);
      rowsUsed[subject] = [];

      keys.forEach(function (curriculum) {
        var shown = ((entry.display[subject] || {})[curriculum]) || {};
        var name = shown.name || curriculum;
        if (!shown.url) {
          warnings.push(subject + ': no pacing guide link for ' + curriculum +
            ' at grade ' + grade);
        }
        var row = claimRow(sheet, block, name, claimed);
        sheet.colB[row] = { name: name, url: shown.url || null };
        rowsUsed[subject].push(row);
        touched[row] = true;
        if (!sheet.cells[row]) sheet.cells[row] = {};

        var offset = Math.max(1, starts[subject] || 1) - 1;
        var weekDeficit = parseInt((options.weekShift || {})[subject], 10) || 0;
        var hasWeekPacing = weekDeficit > 0 &&
          !!weekPacingFor(data, grade, subject, curriculum);
        if (weekDeficit > 0 && offset > 0 && hasWeekPacing) {
          notes.push(subject + ' (' + curriculum + '): week-shift and a ' +
            'late start were both set - week-shift wins, the late start is ' +
            'ignored for this row.');
        }
        var started = false;
        for (var lp = 1; lp <= LAST_LP; lp++) {
          var found;
          if (hasWeekPacing) {
            found = weekShiftedContentFor(data, grade, subject, curriculum,
              lp, weekDeficit);
          } else {
            var sourceLp = lp - offset;
            if (sourceLp < 1) continue;   // before this student began
            found = contentFor(grade, data, subject, curriculum, sourceLp);
          }
          var cell = sheet.cells[row][lp];
          if (!found) {
            // The curriculum has run out before LP10, or has nothing this LP.
            // Say so rather than leaving a blank that reads as an oversight.
            // Only after it started: LPs before a late start stay empty.
            if ((started || offset === 0) && (!cell || !cell.text)) {
              sheet.cells[row][lp] = { text: data.no_work, activities: [] };
              touched[row] = true;
            }
            continue;
          }
          started = true;
          var text = found.lines.join('\n');
          var existing = cell && cell.text ? collapse(cell.text) : '';
          if (existing && text.indexOf(existing) < 0) text = existing + '\n' + text;
          sheet.cells[row][lp] = { text: text, activities: found.activities };
          touched[row] = true;
          found.activities.forEach(function (item) {
            links[lp + '|' + subject + '|' + item.text] = item.url;
          });
        }
      });
    });

    // NWA into the empty assignment cells of the iReady rows, but only inside
    // the blocks this student is actually in. Grades 6-8 pre-fill an iReady
    // row in blocks the student is not in, and those stay completely empty.
    Object.keys(layout.rows).forEach(function (key) {
      var row = parseInt(key, 10);
      if (!layout.rows[key].iready) return;
      var inside = usedBlocks.some(function (b) {
        return row >= b.start && row <= b.end;
      });
      if (!inside) return;
      if (!sheet.cells[row]) sheet.cells[row] = {};
      for (var lp = 1; lp <= LAST_LP; lp++) {
        var cell = sheet.cells[row][lp];
        if (!cell || !cell.text) {
          sheet.cells[row][lp] = { text: data.no_work, activities: [] };
          touched[row] = true;
        }
      }
    });

    // PE is not a curriculum choice: every student in a grade does the same
    // ten standards activities, one per LP, so it fills itself.
    var peRow = null;
    if (includePe) {
      if (!(entry.pe.topics || []).length) {
        warnings.push('PE: no standards activities loaded for grade ' + grade +
          ', so the PE row is left blank');
      } else if (layout.pe_row) {
        var sched = peSchedule(entry.pe, peStart);
        peRow = layout.pe_row;
        if (!sheet.cells[peRow]) sheet.cells[peRow] = {};
        for (var lp = 1; lp <= LAST_LP; lp++) {
          var topic = sched.plan[lp];
          if (!topic) continue;
          sheet.cells[peRow][lp] = {
            text: topic, activities: [],
            url: (entry.pe.links || {})[topic] || null,
          };
          touched[peRow] = true;
        }
        var note = peOverflow(entry.pe, peStart, sched);
        if (note) warnings.push(note);
      }
    }

    // What a late start pushes past LP10, said out loud rather than dropped.
    Object.keys(chosen).forEach(function (subject) {
      var offset = Math.max(1, starts[subject] || 1) - 1;
      if (!offset) return;
      chosen[subject].forEach(function (curriculum) {
        var lost = [];
        for (var lp = 1; lp <= LAST_LP; lp++) {
          if (lp + offset > LAST_LP &&
              contentFor(grade, data, subject, curriculum, lp)) lost.push(lp);
        }
        if (lost.length) {
          warnings.push(subject + ' (' + curriculum + '): starting in LP' +
            (offset + 1) + " pushes the curriculum's LP" + lost[0] + '-' +
            lost[lost.length - 1] + ' past LP10, so it does not fit this year');
        }
      });
    });

    return assemble(data, grade, sheet, {
      rowsUsed: rowsUsed, touched: touched, peRow: peRow, links: links,
      layout: layout, warnings: notes.concat(warnings),
    });
  }

  /* ------------------------------------------------------------- the sections */

  function cellRuns(sheet, row, lp, subject, links) {
    var cell = (sheet.cells[row] || {})[lp];
    if (!cell || cell.text == null || cell.text === '') return [];
    var lines = String(cell.text).split('\n');
    return lines.map(function (line) {
      var url = links[lp + '|' + subject + '|' + line] || null;
      if (!url && cell.url && lines.length === 1) url = cell.url;
      return { text: line, url: url };
    });
  }

  function grid(sheet, rows, lps, subject, links) {
    return rows.map(function (row) {
      return lps.map(function (lp) {
        return cellRuns(sheet, row, lp, subject, links);
      });
    });
  }

  function curriculumCells(sheet, rows) {
    return rows.map(function (row) {
      var held = sheet.colB[row];
      return {
        row: row,
        text: held ? held.name : '',
        url: held ? (held.url || null) : null,
      };
    });
  }

  var SEMESTERS = [
    { name: 'Fall', lps: [1, 2, 3, 4, 5] },
    { name: 'Spring', lps: [6, 7, 8, 9, 10] },
  ];

  function semestersFor(sheet, rows, subject, links) {
    return SEMESTERS.map(function (sem) {
      return {
        name: sem.name,
        lps: sem.lps.slice(),
        anchor: 'D' + rows[0],
        range: 'D' + rows[0] + ':H' + rows[rows.length - 1],
        cells: grid(sheet, rows, sem.lps, subject, links),
      };
    });
  }

  function assemble(data, grade, sheet, state) {
    var entry = data.grades[grade];
    var touched = Object.keys(state.touched).map(Number).sort(function (a, b) {
      return a - b;
    });
    var sections = [];

    data.subject_order.forEach(function (subject) {
      var used = state.rowsUsed[subject];
      if (!used || !used.length) return;
      var block = null;
      (state.layout.blocks[subject] || []).forEach(function (b) {
        if (used[0] >= b.start && used[0] <= b.end) block = b;
      });
      if (!block) return;
      var inBlock = touched.filter(function (r) {
        return r >= block.start && r <= block.end;
      });
      if (!inBlock.length) return;
      var rows = span(inBlock);
      // The label is for reading; the Curricula payload keeps the raw text.
      var labels = {};
      rows.forEach(function (r) {
        labels[r] = sheet.colB[r] ? collapse(sheet.colB[r].name) : '';
      });
      sections.push({
        key: subject,
        subject: data.subject_heading[subject] || subject,
        label: block.label,
        rowLabels: labels,
        curricula: curriculumCells(sheet, span(used)),
        curriculaAnchor: 'B' + Math.min.apply(null, used),
        rows: rows,
        semesters: semestersFor(sheet, rows, subject, state.links),
      });
    });

    if (state.peRow && state.touched[state.peRow]) {
      var peLabels = {};
      peLabels[state.peRow] = sheet.colB[state.peRow]
        ? collapse(sheet.colB[state.peRow].name) : 'Standards Activity';
      sections.push({
        key: 'PE',
        subject: 'Physical Education',
        label: state.layout.pe_label || 'Physical Education',
        rowLabels: peLabels,
        curricula: [],
        curriculaAnchor: null,
        rows: [state.peRow],
        semesters: semestersFor(sheet, [state.peRow], 'PE', state.links),
      });
    }

    var whole = null;
    if (touched.length) {
      var allRows = span(touched);
      var byRow = {};
      sections.forEach(function (section) {
        section.rows.forEach(function (row, index) {
          byRow[row] = { section: section, index: index };
        });
      });
      whole = {
        rows: allRows,
        curricula: curriculumCells(sheet, allRows),
        semesters: SEMESTERS.map(function (sem, semIndex) {
          return {
            name: sem.name,
            lps: sem.lps.slice(),
            anchor: 'D' + allRows[0],
            range: 'D' + allRows[0] + ':H' + allRows[allRows.length - 1],
            // Read the sheet first, so rows no section covers still come
            // across — the district's own "Average 20 minutes/day" line above
            // the PE row is one, and leaving it blank would wipe it on paste.
            // Then take the rows a section did cover from that section, which
            // is where the per-line links were resolved.
            cells: allRows.map(function (row) {
              var found = byRow[row];
              if (found) {
                return found.section.semesters[semIndex].cells[found.index];
              }
              return sem.lps.map(function (lp) {
                return cellRuns(sheet, row, lp, null, state.links);
              });
            }),
          };
        }),
      };
    }

    return {
      grade: grade,
      gradeLabel: entry.label,
      sections: sections,
      whole: whole,
      curriculaAnchor: touched.length ? 'B' + span(touched)[0] : null,
      warnings: state.warnings,
    };
  }

  /* ----------------------------------------------------------- what a grade has */

  function optionsFor(data, grade) {
    var entry = data.grades[grade];
    if (!entry) return {};
    var out = {};
    data.subject_order.forEach(function (subject) {
      var list = entry.available[subject];
      if (!list || !list.length) return;
      out[subject] = list.map(function (curriculum) {
        var shown = (entry.display[subject] || {})[curriculum] || {};
        return {
          key: curriculum,
          name: shown.name || curriculum,
          url: shown.url || null,
          supplement: data.supplements.indexOf(curriculum) >= 0,
          weekShiftable: !!weekPacingFor(data, grade, subject, curriculum),
        };
      });
    });
    return out;
  }

  var api = { build: build, optionsFor: optionsFor, peSchedule: peSchedule,
              LAST_LP: LAST_LP, shiftedWindows: shiftedWindows,
              weekShiftedContentFor: weekShiftedContentFor,
              weekPacingFor: weekPacingFor };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.PlanEngine = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);

