// Replays real court decisions (evidence/real-cases) where a person did not get the free legal aid they
// were entitled to, through the app's own eligibility() and documents().
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { eligibility, documents, QUESTIONS } from '../rules.js';

const dir = new URL('../evidence/real-cases/', import.meta.url);
const { cases, excluded } = JSON.parse(readFileSync(new URL('cases.json', dir), 'utf8'));
const flat = (s) => s.replace(/\s+/g, ' ');
const ids = QUESTIONS.map((q) => q.id);

test('there are real cases and every id is unique', () => {
  assert.ok(cases.length >= 8);
  assert.equal(new Set([...cases, ...excluded].map((c) => c.id)).size, cases.length + excluded.length);
});

for (const c of [...cases, ...excluded]) {
  test(`${c.id}: the quote is verbatim in the saved decision`, () => {
    assert.match(c.url, /^https:\/\/indiankanoon\.org\/doc\/\d+\/$/);
    assert.equal(c.source, `sources/${c.url.match(/\d+/)[0]}.txt`);
    const src = flat(readFileSync(new URL(c.source, dir), 'utf8'));
    assert.ok(src.includes(flat(c.quote)), c.quote);
  });
}

for (const c of cases) {
  const r = c.replay;

  test(`${c.id}: answers come only from facts the decision states`, () => {
    for (const [id, v] of Object.entries(r.answers)) {
      assert.ok(ids.includes(id), id);
      assert.ok(['yes', 'no', 'unsure'].includes(v), `${id}=${v}`);
      // Every "yes" must be backed by a fact the decision states, with where it says so.
      if (v === 'yes') assert.ok(c.facts_where?.[id], `no source for ${id}=yes`);
    }
    if (r.answers.income === 'unsure') assert.ok(c.facts_where?.poor, 'unsure income needs the poverty the text states');
  });

  test(`${c.id}: the app gives the expected result and documents`, () => {
    const got = eligibility(r.answers);
    assert.equal(got.eligible, r.expect.eligible);
    assert.deepEqual(got.clauses, r.expect.clauses);
    assert.deepEqual(documents(got.clauses), r.expect.documents);
    for (const n of r.expect.notes ?? []) assert.ok(got.notes.includes(n), n);
    // Agreement = the app names a clause matching the reason the court gave. Anything else must be written down.
    const agrees = r.court_clauses.some((k) => got.clauses.includes(k));
    assert.equal(agrees, r.divergence === null, r.divergence ?? 'disagreement with the decision must be written down');
  });
}

test('aggregates written in the README match cases.json', () => {
  const persons = cases.reduce((s, c) => s + (c.persons ?? 0), 0);
  const groups = cases.filter((c) => c.persons === null);
  const eligible = cases.filter((c) => eligibility(c.replay.answers).eligible);
  const custody = cases.filter((c) => eligibility(c.replay.answers).clauses.includes('g'));
  const unsure = cases.filter((c) => c.replay.answers.income === 'unsure' && !eligibility(c.replay.answers).eligible);
  const sameReason = cases.filter((c) => c.replay.divergence === null);
  const since2015 = cases.filter((c) => c.decision_date >= '2015');
  const states = new Set(cases.map((c) => c.state));
  const readme = flat(readFileSync(new URL('README.md', dir), 'utf8'));
  for (const s of [
    `${cases.length} decisions`, `${persons} named people`, `${groups.length} group cases`, `${states.size} States`, `${since2015.length} from 2015`,
    `${eligible.length} of ${cases.length}`, `${custody.length} through clause (g)`, `${sameReason.length} of ${cases.length}`,
    `${unsure.length} more`, `${excluded.length} decisions I read and left out`,
  ]) assert.ok(readme.includes(s), s);
});
