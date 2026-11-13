import { eligibility, documents, shareUrl, answersFrom, QUESTIONS, INCOME_LIMITS, SUPREME_COURT_LIMIT, incomeLimit, stateRead } from './rules.js';
import { STRINGS } from './i18n.js';

const $ = (id) => document.getElementById(id);
const fill = (s, vars) => s.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');

const qLang = new URLSearchParams(location.search).get('lang');
let lang = ['en', 'hi'].includes(qLang) ? qLang : localStorage.getItem('ns-lang') || (navigator.language?.startsWith('hi') ? 'hi' : 'en');
let answers = {};
let index = 0;
let view = 'intro';
let details = null; // form facts, kept so a language switch rebuilds the draft
let state = ''; // only to show the NALSA income limit; never counted or sent
const t = (key) => STRINGS[lang][key];
// Anonymous usage count for the impact data: event name and language only, never answers or details.
// ?nostats keeps our own tests and demo recordings out of the public impact numbers.
const NOSTATS = new URLSearchParams(location.search).has('nostats');
const count = (event) => NOSTATS || navigator.sendBeacon?.('/api/event', JSON.stringify({ event, lang }));

function show(id) {
  view = id;
  for (const s of ['intro', 'quiz', 'result', 'form-step', 'draft-step']) $(s).hidden = s !== id;
  render();
  $(id).querySelector('[tabindex="-1"]')?.focus();
}

function render() {
  document.documentElement.lang = lang;
  document.title = `${t('title')} · Section 12`;
  for (const el of document.querySelectorAll('[data-t]')) el.textContent = t(el.dataset.t);
  $('share-tool').href = `https://wa.me/?text=${encodeURIComponent(fill(t('share_text'), { url: location.origin }))}`;
  for (const b of document.querySelectorAll('[data-lang]')) b.setAttribute('aria-pressed', b.dataset.lang === lang);
  if (view === 'quiz') renderQuestion();
  if (view === 'result') renderResult();
  if (view === 'draft-step') { renderDocs(); $('draft').value = buildDraft(details); }
}

function renderQuestion() {
  const q = QUESTIONS[index];
  $('step').textContent = fill(t('step'), { n: index + 1, total: QUESTIONS.length });
  $('bar').style.width = `${(index / QUESTIONS.length) * 100}%`;
  $('question').textContent = t(`q_${q.id}`);
  const income = q.id === 'income';
  $('hint').hidden = !income;
  $('state-wrap').hidden = !income;
  if (income) renderLimit();
  $('answers').replaceChildren(...(q.options || ['yes', 'no']).map((opt) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = t(opt);
    if (answers[q.id] === opt) b.className = 'chosen';
    b.onclick = () => answer(q.id, opt);
    return b;
  }));
}

function renderLimit() {
  const sel = $('state');
  if (!sel.options.length) sel.append(new Option('', ''), ...INCOME_LIMITS.map(([s]) => new Option(s, s)));
  sel.options[0].textContent = t('income_state_pick');
  sel.value = state;
  const limit = incomeLimit(state);
  const rs = (n) => n.toLocaleString('en-IN');
  $('limit').hidden = limit === null;
  if (limit !== null) $('limit').textContent = fill(t('income_limit'), { state, limit: rs(limit), sc: rs(SUPREME_COURT_LIMIT) });
  const sr = stateRead(state);
  $('state-read').hidden = !sr;
  if (!sr) return;
  const date = new Date(`${sr.date}T00:00:00`).toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  $('sr-text').textContent = fill(t('sr_read'), { date, basis: t(sr.basis), limit: rs(sr.limit) });
  $('sr-list').replaceChildren(...sr.wider.map(([key, lim]) => li(fill(t(key), { limit: lim === null ? '' : rs(lim) }))));
  $('sr-link').href = sr.url;
  $('sr-link').textContent = t('sr_link');
}

function answer(id, value) {
  answers[id] = value;
  if (++index < QUESTIONS.length) { renderQuestion(); $('question').focus(); }
  else { show('result'); count('check'); if (eligibility(answers).eligible) count('eligible'); }
}

const li = (text) => Object.assign(document.createElement('li'), { textContent: text });

function renderResult() {
  const r = eligibility(answers);
  $('verdict').textContent = t(r.eligible ? 'result_yes' : 'result_no');
  $('verdict').className = r.eligible ? 'ok' : 'warn';
  $('why').hidden = !r.eligible;
  $('clauses').replaceChildren(...r.clauses.map((c) => li(t(`clause_${c}`))));
  $('notes').replaceChildren(...r.notes.map((n) => li(t(n))));
  $('pass').href = `https://wa.me/?text=${encodeURIComponent(`${t('pass_text')} ${shareUrl(location.origin, answers, lang)}`)}`;
}

function renderDocs() {
  $('docs').replaceChildren(...documents(eligibility(answers).clauses).map((d) => li(t(d))));
}

function buildDraft(f) {
  const { clauses } = eligibility(answers);
  const docs = documents(clauses);
  const v = {
    ...f,
    district: f.district.trim(),
    guardian_line: f.guardian.trim() ? fill(t('app_guardian'), f) : '',
    phone_line: f.phone.trim() ? fill(t('app_phone'), f) : '',
    clauses: clauses.map((c) => `- ${t(`clause_${c}`)}`).join('\n') || '-',
    docs: docs.map((d, i) => `${i + 1}. ${t(d)}`).join('\n'),
    date: new Date().toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN'),
  };
  return [t('app_to'), t('app_subject'), t('app_body'), t('app_sign')].map((s) => fill(s, v)).join('\n\n');
}

$('start').onclick = () => { answers = {}; index = 0; show('quiz'); };
$('back').onclick = () => { if (index > 0) { index--; renderQuestion(); } else show('intro'); };
$('to-form').onclick = () => show('form-step');
$('pass').onclick = () => count('share_link');
$('state').onchange = (e) => { state = e.target.value; renderLimit(); };
for (const b of document.querySelectorAll('[data-restart]')) b.onclick = () => show('intro');
for (const b of document.querySelectorAll('[data-lang]')) {
  b.onclick = () => { lang = b.dataset.lang; localStorage.setItem('ns-lang', lang); render(); };
}
$('form').onsubmit = (e) => {
  e.preventDefault();
  details = Object.fromEntries(new FormData(e.target));
  show('draft-step');
  count('draft');
};
$('share').onclick = async () => {
  count('share');
  const text = $('draft').value;
  if (navigator.share) { try { await navigator.share({ text }); } catch { /* user closed the sheet */ } }
  else window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
};
$('print').onclick = () => { $('printable').textContent = $('draft').value; window.print(); };
$('copy').onclick = async () => {
  await navigator.clipboard.writeText($('draft').value);
  $('copy').textContent = t('copied');
  setTimeout(() => { $('copy').textContent = t('copy'); }, 2000);
};

// A link sent by a relative opens straight on the result they saw (not counted as a check).
const shared = answersFrom(location.search);
if (shared) { answers = shared; index = QUESTIONS.length; show('result'); } else render();

// Opens offline after the first visit (sw.js): the questions, the rules and the letter need no network.
navigator.serviceWorker?.register('sw.js').catch(() => {});
