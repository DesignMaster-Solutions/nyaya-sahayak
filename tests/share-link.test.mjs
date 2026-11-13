// Someone at home can run the check and send the same result to the relative who needs the lawyer.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { shareUrl, answersFrom, eligibility, QUESTIONS } from '../rules.js';
import { STRINGS } from '../i18n.js';

const O = 'https://x.example';
const all = (v) => Object.fromEntries(QUESTIONS.map((q) => [q.id, v]));

test('answers round-trip through the link and give the same verdict', () => {
  for (const a of [all('no'), all('yes'), { ...all('no'), income: 'unsure' }, { ...all('no'), woman: 'yes' }]) {
    for (const lang of ['en', 'hi']) {
      const url = new URL(shareUrl(O, a, lang));
      assert.equal(url.searchParams.get('lang'), lang);
      assert.equal(url.pathname, '/');
      const back = answersFrom(url.search);
      assert.deepEqual(back, a);
      assert.deepEqual(eligibility(back), eligibility(a));
    }
  }
});

test('the link carries only the language and the nine yes/no answers', () => {
  const url = new URL(shareUrl(O, { ...all('no'), name: 'x', state: 'Delhi' }, 'hi'));
  assert.deepEqual([...url.searchParams.keys()].sort(), ['lang', ...QUESTIONS.map((q) => q.id)].sort());
});

test('a missing or unknown answer opens the normal first screen', () => {
  const ok = new URL(shareUrl(O, all('no'), 'en')).searchParams;
  const without = new URLSearchParams(ok); without.delete('custody');
  const bad = new URLSearchParams(ok); bad.set('scst', '<script>');
  const unsure = new URLSearchParams(ok); unsure.set('woman', 'unsure'); // only income accepts unsure
  for (const s of ['', '?lang=hi', `?${without}`, `?${bad}`, `?${unsure}`]) assert.equal(answersFrom(s), null, s);
});

test('app.js opens a shared link on the result and offers the link; worker and /stats know the event', () => {
  const read = (f) => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
  const app = read('app.js');
  assert.match(app, /answersFrom\(location\.search\)/);
  assert.match(app, /shareUrl\(location\.origin, answers, lang\)/);
  assert.match(app, /count\('share_link'\)/);
  assert.match(read('index.html'), /id="pass"/);
  for (const f of ['worker.js', 'stats.html']) assert.ok(read(f).includes("'share_link'"), f);
  for (const l of ['en', 'hi']) for (const k of ['pass_on', 'pass_text']) assert.ok(STRINGS[l][k], `${l}.${k}`);
});
