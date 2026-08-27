#!/usr/bin/env python3
"""Inline web/shell.html's three <script src> tags into one standalone page.

Reconstructed 8/27/26 from the committed artifact, which was the only place
the current source existed. The rules are one-for-one with what that file
looked like:

    <script src="web_data.js">  ->  <script>window.PLAN_DATA={...compact...}
    <script src="engine.js">    ->  <script> + web/engine.js verbatim
    <script src="app.js">       ->  <script> + web/app.js verbatim

web_data.json is pretty-printed on disk so it diffs; it is re-serialised
compact here, exactly as build_web_data.py emitted it into the page.
"""
import json, pathlib, sys

WEB = pathlib.Path(__file__).parent / 'web'
OUT = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else 'Semester Plan Pacing.html')

data = json.loads((WEB / 'web_data.json').read_text(encoding='utf-8'))
data_line = 'window.PLAN_DATA=' + json.dumps(data, ensure_ascii=False) + ';'

parts = {
    '<script src="web_data.js"></script>': '<script>' + data_line + '</script>',
    '<script src="engine.js"></script>':
        '<script>' + (WEB / 'engine.js').read_text(encoding='utf-8').rstrip('\n') + '\n</script>',
    '<script src="app.js"></script>':
        '<script>' + (WEB / 'app.js').read_text(encoding='utf-8').rstrip('\n') + '\n</script>',
}

page = (WEB / 'shell.html').read_text(encoding='utf-8')
for tag, inline in parts.items():
    if tag not in page:
        sys.exit('shell.html is missing ' + tag)
    page = page.replace(tag, inline)

OUT.write_text(page, encoding='utf-8')
# the dev shell loads the same data without needing a server
(WEB / 'web_data.js').write_text(data_line + '\n', encoding='utf-8')
print('wrote', OUT, OUT.stat().st_size, 'bytes')
