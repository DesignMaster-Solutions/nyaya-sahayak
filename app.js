import { eligibility, documents, QUESTIONS } from './rules.js';
import { STRINGS } from './i18n.js';

const $ = (id) => document.getElementById(id);
const fill = (s, vars) => s.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');

let lang = localStorage.getItem('ns-lang') || (navigator.language?.startsWith('hi') ? 'hi' : 'en');
let answers = {};
let index = 0;
let view = 'intro';
let details = null; // form facts, kept so a language switch rebuilds the draft
const t = (key) => STRINGS[lang][key];

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
  $('hint').hidden = q.id !== 'income';
  $('answers').replaceChildren(...(q.options || ['yes', 'no']).map((opt) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = t(opt);
    if (answers[q.id] === opt) b.className = 'chosen';
    b.onclick = () => answer(q.id, opt);
    return b;
  }));
}

function answer(id, value) {
  answers[id] = value;
  if (++index < QUESTIONS.length) { renderQuestion(); $('question').focus(); }
  else show('result');
}

const li = (text) => Object.assign(document.createElement('li'), { textContent: text });

function renderResult() {
  const r = eligibility(answers);
  $('verdict').textContent = t(r.eligible ? 'result_yes' : 'result_no');
  $('verdict').className = r.eligible ? 'ok' : 'warn';
  $('why').hidden = !r.eligible;
  $('clauses').replaceChildren(...r.clauses.map((c) => li(t(`clause_${c}`))));
  $('notes').replaceChildren(...r.notes.map((n) => li(t(n))));
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
for (const b of document.querySelectorAll('[data-restart]')) b.onclick = () => show('intro');
for (const b of document.querySelectorAll('[data-lang]')) {
  b.onclick = () => { lang = b.dataset.lang; localStorage.setItem('ns-lang', lang); render(); };
}
$('form').onsubmit = (e) => {
  e.preventDefault();
  details = Object.fromEntries(new FormData(e.target));
  show('draft-step');
};
$('print').onclick = () => { $('printable').textContent = $('draft').value; window.print(); };
$('copy').onclick = async () => {
  await navigator.clipboard.writeText($('draft').value);
  $('copy').textContent = t('copied');
  setTimeout(() => { $('copy').textContent = t('copy'); }, 2000);
};

render();
