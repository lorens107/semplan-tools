/* The page around the engine: the pickers, the preview tables, and the Copy
 * buttons.
 *
 * A Copy button puts two things on the clipboard. text/html is a table shaped
 * like the range it pastes into, carrying the district's own cell formatting
 * and a real <a> on each activity name — that is what survives a normal Ctrl+V
 * into Google Sheets, line breaks inside a cell included. text/plain is a TSV
 * fallback with multi-line cells quoted.
 *
 * The copy goes through a `copy` event handler and execCommand rather than
 * navigator.clipboard.write, because that path works whether the page is
 * opened from a hosted URL or a local file.
 */
(function () {
  'use strict';

  var DATA = window.PLAN_DATA;
  var engine = window.PlanEngine;
  var SUBJECTS = DATA.subject_order;

  // The blank district template's own formatting, so a paste lands looking
  // like the rest of the plan. These are literal colours on purpose: they
  // belong to the sheet, not to this page, and must not follow its theme.
  var CELL_CSS = 'font-family:Arial,Helvetica,sans-serif;font-size:10pt;' +
    'vertical-align:top;white-space:pre-wrap;background-color:#E9F0FA;' +
    'border-right:1px solid #000000;padding:2px 4px;';
  var B_CELL_CSS = CELL_CSS + 'border-left:1px solid #000000;';

  var payloads = {};
  var state = { grade: '1', curricula: {}, starts: {}, peStart: 1, weekShift: {} };

  /* ------------------------------------------------------------------ helpers */

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function esc(text) {
    return String(text == null ? '' : text)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function runsHtml(runs) {
    return runs.map(function (run) {
      var text = esc(run.text);
      return run.url ? '<a href="' + esc(run.url) + '">' + text + '</a>' : text;
    }).join('<br>');
  }

  function tableHtml(rows, css) {
    var out = ['<table border="0" cellspacing="0" cellpadding="0"><tbody>'];
    rows.forEach(function (row) {
      out.push('<tr>');
      row.forEach(function (runs) {
        out.push('<td style="' + css + '">' + runsHtml(runs) + '</td>');
      });
      out.push('</tr>');
    });
    out.push('</tbody></table>');
    return out.join('');
  }

  function tableText(rows) {
    return rows.map(function (row) {
      return row.map(function (runs) {
        var text = runs.map(function (r) { return r.text; }).join('\n');
        if (/[\n\t"]/.test(text)) text = '"' + text.replace(/"/g, '""') + '"';
        return text;
      }).join('\t');
    }).join('\n');
  }

  function addPayload(key, rows, css) {
    payloads[key] = { html: tableHtml(rows, css || CELL_CSS), text: tableText(rows) };
    return key;
  }

  function copyPayload(key, button) {
    var payload = payloads[key];
    if (!payload) return;
    var handler = function (event) {
      event.clipboardData.setData('text/html', payload.html);
      event.clipboardData.setData('text/plain', payload.text);
      event.preventDefault();
    };
    document.addEventListener('copy', handler);
    var holder = document.createElement('textarea');
    holder.value = payload.text;
    holder.setAttribute('readonly', '');
    holder.style.position = 'fixed';
    holder.style.top = '-1000px';
    document.body.appendChild(holder);
    holder.select();
    var ok = false;
    try { ok = document.execCommand('copy'); } catch (err) { ok = false; }
    document.body.removeChild(holder);
    document.removeEventListener('copy', handler);

    var label = button.getAttribute('data-label') || button.textContent;
    button.setAttribute('data-label', label);
    button.textContent = ok ? 'Copied' : 'Press Ctrl+C';
    button.className = ok ? 'done' : '';
    window.setTimeout(function () {
      button.textContent = label;
      button.className = '';
    }, 1700);
  }

  function copyButton(label, key, extra) {
    var button = el('button', extra || '', label);
    button.addEventListener('click', function () { copyPayload(key, button); });
    return button;
  }

  function where(parts) {
    var span = el('span', 'where');
    parts.forEach(function (part) {
      if (typeof part === 'string') span.appendChild(document.createTextNode(part));
      else span.appendChild(part);
    });
    return span;
  }

  function codeSpan(text) { return el('code', null, text); }

  /* ------------------------------------------------------------------ controls */

  function gradeSelect() {
    var select = document.getElementById('grade');
    Object.keys(DATA.grades).forEach(function (grade) {
      var option = el('option', null, DATA.grades[grade].label);
      option.value = grade;
      select.appendChild(option);
    });
    select.value = state.grade;
    select.addEventListener('change', function () {
      state.grade = select.value;
      state.curricula = {};
      state.starts = {};
      state.peStart = 1;
      state.weekShift = {};
      buildSubjectControls();
      render();
    });
  }

  function lpOptions(select) {
    for (var lp = 1; lp <= engine.LAST_LP; lp++) {
      var option = el('option', null, 'LP' + lp);
      option.value = String(lp);
      select.appendChild(option);
    }
  }

  function buildSubjectControls() {
    var host = document.getElementById('subjects');
    var timing = document.getElementById('timing-fields');
    host.textContent = '';
    timing.textContent = '';
    var options = engine.optionsFor(DATA, state.grade);

    SUBJECTS.forEach(function (subject) {
      var list = options[subject] || [];
      var field = el('div', 'field');
      var id = 'sel-' + subject;
      var label = el('label', null, DATA.subject_heading[subject] || subject);
      label.setAttribute('for', id);

      var select = el('select');
      select.id = id;
      var none = el('option', null, list.length ? 'Not taking this' : 'No pacing for this grade');
      none.value = '';
      select.appendChild(none);
      list.forEach(function (item) {
        var option = el('option', null,
          item.name + (item.supplement ? '  (supplement)' : ''));
        option.value = item.key;
        select.appendChild(option);
      });
      if (!list.length) select.disabled = true;

      // A subject can carry a core curriculum plus a supplement on the row
      // beneath it, which is the second menu.
      var second = el('select');
      second.id = id + '-2';
      var noSecond = el('option', null, 'no second row');
      noSecond.value = '';
      second.appendChild(noSecond);
      list.forEach(function (item) {
        var option = el('option', null, item.name);
        option.value = item.key;
        second.appendChild(option);
      });
      if (!list.length) second.disabled = true;
      var secondField = el('div', 'field');
      var secondLabel = el('label', null, 'Second row');
      secondLabel.setAttribute('for', second.id);
      secondField.appendChild(secondLabel);
      secondField.appendChild(second);

      function changed() {
        var picked = [];
        if (select.value) picked.push(select.value);
        if (second.value && second.value !== select.value) picked.push(second.value);
        state.curricula[subject] = picked;
        updateWeekShiftFields();
        render();
      }
      select.addEventListener('change', changed);
      second.addEventListener('change', changed);

      field.appendChild(label);
      field.appendChild(select);
      var stack = el('div', 'stack');
      stack.appendChild(field);
      stack.appendChild(secondField);
      host.appendChild(stack);

      // start LP for this subject
      var startField = el('div', 'field');
      var startId = 'start-' + subject;
      var startLabel = el('label', null,
        (DATA.subject_heading[subject] || subject) + ' starts');
      startLabel.setAttribute('for', startId);
      var start = el('select', 'lp');
      start.id = startId;
      lpOptions(start);
      start.value = '1';
      start.addEventListener('change', function () {
        state.starts[subject] = parseInt(start.value, 10);
        render();
      });
      startField.appendChild(startLabel);
      startField.appendChild(start);
      timing.appendChild(startField);
    });

    var peField = el('div', 'field');
    var peLabel = el('label', null, 'PE starts');
    peLabel.setAttribute('for', 'start-PE');
    var peSelect = el('select', 'lp');
    peSelect.id = 'start-PE';
    lpOptions(peSelect);
    peSelect.value = '1';
    peSelect.addEventListener('change', function () {
      state.peStart = parseInt(peSelect.value, 10);
      render();
    });
    peField.appendChild(peLabel);
    peField.appendChild(peSelect);
    timing.appendChild(peField);

    // Sensible opening position: the first curriculum each subject offers.
    SUBJECTS.forEach(function (subject) {
      var list = options[subject] || [];
      if (!list.length) return;
      var select = document.getElementById('sel-' + subject);
      select.value = list[0].key;
      state.curricula[subject] = [list[0].key];
    });
    state.weekShift = {};
    updateWeekShiftFields();
  }

  // Rebuilds the week-shift inputs to match whichever curricula are
  // currently picked. Only subjects whose first-row curriculum has real
  // week-level source data (engine.optionsFor(...).weekShiftable) get a
  // field; everyone else's row is left alone entirely.
  function updateWeekShiftFields() {
    var block = document.getElementById('week-shift-block');
    var host = document.getElementById('week-shift-fields');
    host.textContent = '';
    var options = engine.optionsFor(DATA, state.grade);
    var any = false;

    SUBJECTS.forEach(function (subject) {
      var picked = (state.curricula[subject] || [])[0];
      if (!picked) return;
      var list = options[subject] || [];
      var item = list.filter(function (x) { return x.key === picked; })[0];
      if (!item || !item.weekShiftable) return;
      any = true;

      var field = el('div', 'field');
      var id = 'weekshift-' + subject;
      var label = el('label', null,
        (DATA.subject_heading[subject] || subject) + ': weeks completed in LP1');
      label.setAttribute('for', id);
      var input = document.createElement('input');
      input.type = 'number';
      input.min = '0';
      input.max = '4';
      input.className = 'weeks';
      input.id = id;
      input.placeholder = 'full';
      input.value = state.weekShift[subject] || '';
      input.addEventListener('input', function () {
        var n = parseInt(input.value, 10);
        if (input.value === '' || isNaN(n) || n <= 0) {
          delete state.weekShift[subject];
        } else {
          // LP1 normally runs 4 weeks (3 for the shorter LPs) - a value of 4
          // or more means nothing was missed, so store it as no shift.
          var normalWeeks = 4;
          var deficit = Math.max(0, normalWeeks - n);
          if (deficit > 0) state.weekShift[subject] = deficit;
          else delete state.weekShift[subject];
        }
        render();
      });
      field.appendChild(label);
      field.appendChild(input);
      host.appendChild(field);
    });

    block.style.display = any ? '' : 'none';
  }

  /* -------------------------------------------------------------- the preview */

  function previewTable(section, sem) {
    var scroll = el('div', 'scroll');
    var table = el('table');
    var thead = el('thead');
    var headRow = el('tr');
    headRow.appendChild(el('th', null, 'Row'));
    sem.lps.forEach(function (lp) { headRow.appendChild(el('th', null, 'LP' + lp)); });
    thead.appendChild(headRow);
    table.appendChild(thead);

    var tbody = el('tbody');
    section.rows.forEach(function (row, index) {
      var tr = el('tr');
      var ref = el('td', 'rowref');
      ref.appendChild(el('b', null, String(row)));
      var name = section.rowLabels[row];
      if (name) ref.appendChild(document.createTextNode(name));
      tr.appendChild(ref);

      sem.cells[index].forEach(function (runs) {
        var td = el('td');
        if (!runs.length) {
          td.className = 'empty';
          td.textContent = '—';
        } else if (runs.length === 1 && runs[0].text === DATA.no_work) {
          td.className = 'nwa';
          td.textContent = DATA.no_work;
        } else {
          runs.forEach(function (run, i) {
            if (i) td.appendChild(document.createElement('br'));
            if (run.url) {
              var link = el('a', null, run.text);
              link.href = run.url;
              link.target = '_blank';
              link.rel = 'noopener';
              td.appendChild(link);
            } else {
              td.appendChild(document.createTextNode(run.text));
            }
          });
        }
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    scroll.appendChild(table);
    return scroll;
  }

  // The pacing guides supplying lesson numbers for whatever is selected in
  // this subject right now. Empty for every subject and grade that has none,
  // which is all of them but Grade 1 ELA on Lincoln Learning.
  function lessonRangeSources(subjectKey) {
    var notes = ((DATA.grades[state.grade] || {}).lesson_range_notes
                 || {})[subjectKey] || {};
    var out = [];
    (state.curricula[subjectKey] || []).forEach(function (curriculum) {
      var source = notes[curriculum];
      if (source && out.indexOf(source) === -1) out.push(source);
    });
    return out;
  }

  function sectionCard(section) {
    var card = el('div', 'card');
    card.appendChild(el('h2', null, section.subject));

    var meta = el('p', 'meta');
    meta.appendChild(document.createTextNode(section.label));
    if (section.curricula.length) {
      section.curricula.forEach(function (item) {
        if (!item.text) return;
        meta.appendChild(el('span', 'sep', '·'));
        if (item.url) {
          var link = el('a', null, item.text);
          link.href = item.url;
          link.target = '_blank';
          link.rel = 'noopener';
          meta.appendChild(link);
        } else {
          meta.appendChild(document.createTextNode(item.text));
        }
      });
    } else {
      meta.appendChild(el('span', 'sep', '·'));
      meta.appendChild(document.createTextNode('Standards Activity row'));
    }
    card.appendChild(meta);

    // Where a cell's lesson numbers come from a curriculum's own pacing guide
    // rather than from Appendix A, the card names that document. Lincoln
    // Learning's Grade 1 ELA entry in Appendix A lists checkpoints and no
    // lesson numbers, so its ranges are merged in from the CORE ELA guide and
    // a reader should be able to see which source said what.
    var sources = lessonRangeSources(section.key);
    if (sources.length) {
      var note = el('p', 'meta source-note',
        'Lesson numbers from ' + sources.join('; ') +
        '. Everything else on this row is Appendix A of the LP Meeting Plan.');
      card.appendChild(note);
    }

    if (section.curricula.length) {
      var key = addPayload(section.key + '-cur',
        section.curricula.map(function (item) {
          return [[{ text: item.text, url: item.url }]];
        }), B_CELL_CSS);
      var bar = el('div', 'bar');
      bar.appendChild(copyButton('Copy Curricula', key));
      bar.appendChild(where(['paste at ', codeSpan(section.curriculaAnchor),
        ' on the Fall tab — Spring mirrors it automatically']));
      card.appendChild(bar);
    }

    section.semesters.forEach(function (sem) {
      var head = el('div', 'semhead',
        sem.name + ' — LP' + sem.lps[0] + ' to LP' + sem.lps[sem.lps.length - 1]);
      card.appendChild(head);

      var key = addPayload(section.key + '-' + sem.name, sem.cells);
      var bar = el('div', 'bar');
      bar.appendChild(copyButton('Copy ' + sem.name + ' assignments', key, 'primary'));
      bar.appendChild(where(['paste at ', codeSpan(sem.anchor),
        ' on the ' + sem.name + ' Sem Plan tab (' + sem.range + ')']));
      card.appendChild(bar);
      card.appendChild(previewTable(section, sem));
    });

    return card;
  }

  function wholeCard(plan) {
    var whole = plan.whole;
    var card = el('div', 'card');
    card.appendChild(el('h2', null, 'Whole plan at once'));
    var meta = el('p', 'meta');
    meta.appendChild(document.createTextNode(
      'Every subject in one paste, for a plan you are filling from scratch. ' +
      'Same content as the blocks above.'));
    card.appendChild(meta);

    if (plan.curriculaAnchor) {
      // Every row in the range, not only the ones the tool writes. The range
      // starts at the first iReady row, and those carry the template's own
      // names — leaving them blank here would wipe them on paste.
      var rows = whole.curricula.map(function (item) {
        return [item.text ? [{ text: item.text, url: item.url }] : []];
      });
      var key = addPayload('all-cur', rows, B_CELL_CSS);
      var bar = el('div', 'bar');
      bar.appendChild(copyButton('Copy Curricula', key));
      bar.appendChild(where(['paste at ', codeSpan('B' + whole.rows[0]),
        ' on the Fall tab']));
      card.appendChild(bar);
    }

    whole.semesters.forEach(function (sem) {
      var key = addPayload('all-' + sem.name, sem.cells);
      var bar = el('div', 'bar');
      bar.appendChild(copyButton('Copy ' + sem.name + ' assignments', key));
      bar.appendChild(where(['paste at ', codeSpan(sem.anchor),
        ' on the ' + sem.name + ' Sem Plan tab (' + sem.range + ')']));
      card.appendChild(bar);
    });
    return card;
  }

  function summaryStrip(plan) {
    var strip = el('div', 'summary');
    plan.sections.forEach(function (section) {
      var pill = el('span', 'pill');
      pill.appendChild(el('b', null, section.subject));
      var rows = section.rows.length;
      pill.appendChild(document.createTextNode(
        'row' + (rows === 1 ? ' ' : 's ') +
        (rows === 1 ? section.rows[0]
                    : section.rows[0] + '–' + section.rows[rows - 1])));
      strip.appendChild(pill);
    });
    if (plan.warnings.length) {
      var note = el('span', 'pill count');
      note.appendChild(el('b', null, String(plan.warnings.length)));
      note.appendChild(document.createTextNode(
        plan.warnings.length === 1 ? 'note' : 'notes'));
      strip.appendChild(note);
    }
    return strip;
  }

  /* -------------------------------------------------------------------- render */

  function render() {
    var host = document.getElementById('output');
    var summary = document.getElementById('summary');
    host.textContent = '';
    summary.textContent = '';
    payloads = {};

    var picked = {};
    var any = false;
    SUBJECTS.forEach(function (subject) {
      var list = (state.curricula[subject] || []).filter(Boolean);
      if (list.length) { picked[subject] = list; any = true; }
    });
    if (!any) {
      var empty = el('div', 'empty-state',
        'Pick a curriculum for at least one subject and the pacing appears here.');
      host.appendChild(empty);
      return;
    }

    var starts = {};
    SUBJECTS.forEach(function (subject) {
      starts[subject] = state.starts[subject] || 1;
    });

    var plan;
    try {
      plan = engine.build(DATA, {
        grade: state.grade,
        curricula: picked,
        startLps: starts,
        includePe: true,
        peStart: state.peStart,
        weekShift: state.weekShift,
      });
    } catch (err) {
      host.appendChild(el('div', 'empty-state', err.message));
      return;
    }

    summary.appendChild(summaryStrip(plan));
    plan.sections.forEach(function (section) {
      host.appendChild(sectionCard(section));
    });
    if (plan.whole) host.appendChild(wholeCard(plan));

    if (plan.warnings.length) {
      var card = el('div', 'card');
      card.appendChild(el('h2', null, 'Notes on this build'));
      var notes = el('div', 'notes');
      plan.warnings.forEach(function (warning) {
        notes.appendChild(el('p', null, warning));
      });
      card.appendChild(notes);
      host.appendChild(card);
    }
  }

  gradeSelect();
  buildSubjectControls();
  render();
})();

