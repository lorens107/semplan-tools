/* Drives the built page in a real browser and snapshots the week-shift panel.
 *
 *   node web/verify_week_shift.js <built.html> <grade> [weeksCompletedInLP1]
 *
 * Prints JSON: whether the "Behind on weeks?" panel is offered for that grade,
 * which subjects it offers a field for, and the preview text the page renders
 * once the field is set. Used to diff a rebuilt artifact against the committed
 * one, so a reconstruction can be shown not to regress.
 */
const { chromium } = require('playwright');
const path = require('path');

const file = process.argv[2];
const grade = process.argv[3] || '3';
const weeks = process.argv[4] === undefined ? '1' : process.argv[4];

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });

  await page.goto('file://' + path.resolve(file));

  const setSelect = async (id, value) => {
    await page.evaluate(([id, value]) => {
      const el = document.getElementById(id);
      el.value = value;
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }, [id, value]);
  };

  await setSelect('grade', grade);
  // pick the two curricula the week-level data is meant to cover
  const picks = { Math: 'Zearn', ELA: 'Beyond the Page' };
  for (const [subject, curriculum] of Object.entries(picks)) {
    const has = await page.evaluate(([id, v]) => {
      const el = document.getElementById(id);
      return !!el && [...el.options].some(o => o.value === v);
    }, ['sel-' + subject, curriculum]);
    if (has) await setSelect('sel-' + subject, curriculum);
  }

  const panel = async () => page.evaluate(() => {
    const block = document.getElementById('week-shift-block');
    const visible = !!block && block.style.display !== 'none';
    const fields = [...document.querySelectorAll('#week-shift-fields input')]
      .map(i => ({ id: i.id, label: (i.previousSibling || {}).textContent || null,
                   min: i.min, max: i.max }));
    return { visible, fields, note: (block.querySelector('.week-shift-note') || {}).textContent || null };
  });

  const before = await panel();

  for (const f of before.fields) {
    await page.evaluate(([id, v]) => {
      const el = document.getElementById(id);
      el.value = v;
      el.dispatchEvent(new Event('input', { bubbles: true }));
    }, [f.id, weeks]);
  }

  const output = await page.evaluate(() => {
    const norm = s => s.replace(/[ \t]+/g, ' ').trim();
    return {
      summary: norm(document.getElementById('summary').innerText || ''),
      body: norm(document.getElementById('output').innerText || ''),
    };
  });

  console.log(JSON.stringify({
    file: path.basename(file), grade, weeksCompletedInLP1: weeks,
    panel: before, output, errors,
  }, null, 2));
  await browser.close();
})();
