/* Multi-grade week-shift regression snapshot.
 *
 *   node web/verify_week_shift_all.js <built.html> [grades] > snapshot.json
 *
 * For every grade, every subject, and every curriculum that grade offers with
 * week-level data, renders the plan at weeks-completed 0-4 and prints the
 * lot as JSON. Diff two snapshots to prove a data change touched only what it
 * was meant to touch.
 *
 * Why this exists as its own script rather than a scratch file: the obvious
 * way to write it is wrong in two ways that both fail silently.
 *
 *   1. state.curricula persists across grade changes within one page load, so
 *      a subject left unset keeps the previous grade's pick and its rows flip
 *      between baked and shifted for reasons that have nothing to do with the
 *      change under test. Every subject is therefore set explicitly on every
 *      iteration - to '' when it is not the one being exercised.
 *   2. Filtering the output rows by curriculum name misses slots whose display
 *      name does not contain it. Lincoln Learning at TK and K is named after
 *      the VIE pacing guides ("Mathematics K Pacing Guide - VIE"), so a name
 *      filter drops 8 of its 39 slots and reports a clean pass on the rest.
 *      The whole rendered body is captured instead.
 */
const { chromium } = require('playwright');
const path = require('path');

const file = process.argv[2];
if (!file) {
  console.error('usage: node web/verify_week_shift_all.js <built.html> [grades]');
  process.exit(2);
}

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  // The Google Fonts stylesheet is unreachable offline; that is not a failure.
  page.on('console', m => {
    const t = m.text();
    if (m.type() === 'error' && !/ERR_CONNECTION_RESET|ERR_NAME_NOT_RESOLVED/.test(t)) {
      errors.push('console: ' + t);
    }
  });
  await page.goto('file://' + path.resolve(file));

  const grades = process.argv[3]
    ? process.argv[3].split(',')
    : await page.evaluate(() => Object.keys(window.PLAN_DATA.grades));

  const out = await page.evaluate(async (grades) => {
    const fire = (el, type) => el.dispatchEvent(new Event(type, { bubbles: true }));
    const norm = s => (s || '').replace(/[ \t]+/g, ' ').trim();
    const DATA = window.PLAN_DATA;
    const SUBJECTS = DATA.subject_order;
    const res = {};

    for (const grade of grades) {
      const gradeSel = document.getElementById('grade');
      gradeSel.value = grade;
      fire(gradeSel, 'change');

      const options = window.PlanEngine.optionsFor(DATA, grade);
      const slots = [];
      SUBJECTS.forEach(subject => {
        (options[subject] || []).forEach(item => {
          if (item.weekShiftable) slots.push([subject, item.key]);
        });
      });

      res[grade] = {};
      for (const [subject, curriculum] of slots) {
        // Set every subject on this pass - '' for the ones not under test -
        // so no stale pick from a previous grade or slot can leak in.
        SUBJECTS.forEach(s => {
          const el = document.getElementById('sel-' + s);
          if (!el) return;
          el.value = (s === subject) ? curriculum : '';
          fire(el, 'change');
        });

        const byWeeks = {};
        for (const w of [0, 1, 2, 3, 4]) {
          for (const input of document.querySelectorAll('#week-shift-fields input')) {
            input.value = String(w);
            fire(input, 'input');
          }
          byWeeks[w] = norm(document.getElementById('output').innerText);
        }
        res[grade][subject + ' / ' + curriculum] = byWeeks;
      }
    }
    return res;
  }, grades);

  const slotCount = Object.values(out).reduce((n, g) => n + Object.keys(g).length, 0);
  console.log(JSON.stringify({ grades, slotCount, out, errors }, null, 1));
  await browser.close();
})();
