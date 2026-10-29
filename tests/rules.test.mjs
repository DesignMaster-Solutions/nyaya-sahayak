import { test } from 'node:test';
import assert from 'node:assert/strict';
import { eligibility, documents, QUESTIONS, CLAUSES } from '../rules.js';
import { STRINGS } from '../i18n.js';

const allNo = Object.fromEntries(QUESTIONS.map((q) => [q.id, 'no']));
const only = (id, value = 'yes') => ({ ...allNo, [id]: value });

const single = [
  ['scst', 'a', 'Scheduled Caste or Scheduled Tribe'],
  ['trafficking', 'b', 'victim of trafficking or begar'],
  ['woman', 'c', 'a woman'],
  ['child', 'c', 'a child'],
  ['disability', 'd', 'person with disability'],
  ['disaster', 'e', 'victim of mass disaster, violence, atrocity or natural/industrial disaster'],
  ['workman', 'f', 'industrial workman'],
  ['custody', 'g', 'in custody'],
  ['income', 'h', 'income below the State-notified limit'],
];

for (const [id, clause, label] of single) {
  test(`Section 12(${clause}): ${label}`, () => {
    const r = eligibility(only(id));
    assert.equal(r.eligible, true);
    assert.deepEqual(r.clauses, [clause]);
  });
}

test('not eligible when every answer is no', () => {
  const r = eligibility(allNo);
  assert.equal(r.eligible, false);
  assert.deepEqual(r.clauses, []);
  assert.ok(r.notes.includes('note_not_eligible'));
});

test('empty answers are not eligible', () => {
  assert.equal(eligibility().eligible, false);
});

test('(h) is only "likely": user must confirm the State limit', () => {
  const r = eligibility(only('income'));
  assert.ok(r.notes.includes('note_h_confirm'));
  assert.ok(r.notes.includes('note_only_h'));
});

test('unsure about income does not grant (h) but points to the SLSA/NALSA', () => {
  const r = eligibility(only('income', 'unsure'));
  assert.equal(r.eligible, false);
  assert.deepEqual(r.clauses, []);
  assert.ok(r.notes.includes('note_income_unsure'));
});

test('woman and child together count clause (c) once', () => {
  assert.deepEqual(eligibility({ ...allNo, woman: 'yes', child: 'yes' }).clauses, ['c']);
});

test('several clauses are listed in statute order', () => {
  const r = eligibility({ ...allNo, custody: 'yes', scst: 'yes', income: 'yes' });
  assert.deepEqual(r.clauses, ['a', 'g', 'h']);
  assert.ok(!r.notes.includes('note_only_h'));
});

test('documents: base list plus certificates for the clauses relied on', () => {
  assert.deepEqual(documents([]), ['doc_id', 'doc_address', 'doc_case_papers']);
  const d = documents(['a', 'd', 'h']);
  assert.ok(d.includes('doc_caste'));
  assert.ok(d.includes('doc_disability'));
  assert.ok(d.includes('doc_income_affidavit'));
  assert.ok(!documents(['a']).includes('doc_income_affidavit'));
});

test('no income figure is hardcoded in rules or strings', () => {
  const text = JSON.stringify(STRINGS);
  assert.doesNotMatch(text, /(₹|Rs\.?\s?)\s?\d/);
  assert.doesNotMatch(text, /\d[\d,]*\s?(lakh|लाख)/i);
});

test('en and hi have the same keys, covering every question, clause, note and document', () => {
  assert.deepEqual(Object.keys(STRINGS.hi).sort(), Object.keys(STRINGS.en).sort());
  const needed = [
    ...QUESTIONS.map((q) => `q_${q.id}`),
    ...CLAUSES.map((c) => `clause_${c}`),
    'note_h_confirm', 'note_income_unsure', 'note_only_h', 'note_not_eligible',
    ...documents(CLAUSES),
  ];
  for (const k of needed) assert.ok(STRINGS.en[k], `missing en.${k}`);
});
