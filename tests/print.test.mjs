import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../styles.css', import.meta.url), 'utf8');
const print = css.slice(css.indexOf('@media print'));

// A reader on DEV.to (KomoPDF, 08/11/2026) pointed out that low-end Android WebViews drop Devanagari conjuncts
// when the print stylesheet only says `serif`, and that the browser's URL/date header makes the printed
// application look like a webpage. The printable block must name a Devanagari-capable stack and hide the header.
test('print stylesheet names a Devanagari font stack and suppresses the browser header/footer', () => {
  assert.match(print, /#printable\s*{[^}]*"Noto Sans Devanagari"/, 'Devanagari fallback font');
  assert.match(print, /#printable\s*{[^}]*system-ui/, 'system-ui first (Android forks ship Noto via system font)');
  assert.match(print, /@page\s*{[^}]*margin:\s*0/, '@page margin 0 is what hides Chrome/WebView headers and footers');
  assert.match(print, /#printable\s*{[^}]*padding:\s*15mm/, 'the 15 mm paper margin moves to padding');
});
