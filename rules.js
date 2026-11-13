// Section 12, Legal Services Authorities Act, 1987: who is entitled to free legal services.
// Pure functions only, shared by the browser app and the node tests.

export const CLAUSES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

// Question id -> clause it can satisfy. Order is the order the app asks them.
export const QUESTIONS = [
  { id: 'scst', clause: 'a' },
  { id: 'trafficking', clause: 'b' },
  { id: 'woman', clause: 'c' },
  { id: 'child', clause: 'c' },
  { id: 'disability', clause: 'd' },
  { id: 'disaster', clause: 'e' },
  { id: 'workman', clause: 'f' },
  { id: 'custody', clause: 'g' },
  { id: 'income', clause: 'h', options: ['yes', 'no', 'unsure'] },
];

// Section 12(h) income ceiling per year, as listed by NALSA (FAQ table, read 05/11/2026).
// It is a floor: a State may have notified a higher amount, so the app still says to confirm with the DLSA.
export const INCOME_SOURCE = 'https://nalsa.gov.in/legal-aid/';
export const SUPREME_COURT_LIMIT = 500000;
export const INCOME_LIMITS = [
  ['Andhra Pradesh', 300000],
  ['Arunachal Pradesh', 100000],
  ['Assam', 300000],
  ['Bihar', 150000],
  ['Chhattisgarh', 150000],
  ['Goa', 300000],
  ['Gujarat', 100000],
  ['Haryana', 300000],
  ['Himachal Pradesh', 300000],
  ['Jammu & Kashmir', 300000],
  ['Jharkhand', 300000],
  ['Karnataka', 300000],
  ['Kerala', 300000],
  ['Madhya Pradesh', 200000],
  ['Maharashtra', 300000],
  ['Manipur', 300000],
  ['Meghalaya', 300000],
  ['Mizoram', 25000],
  ['Nagaland', 100000],
  ['Odisha', 300000],
  ['Punjab', 300000],
  ['Rajasthan', 300000],
  ['Sikkim', 300000],
  ['Telangana', 300000],
  ['Tamil Nadu', 300000],
  ['Tripura', 150000],
  ['Uttar Pradesh', 300000],
  ['Uttarakhand', 300000],
  ['West Bengal', 100000],
  ['Andaman & Nicobar Islands', 300000],
  ['Chandigarh', 300000],
  ['Dadra & Nagar Haveli', 15000],
  ['Daman & Diu', 100000],
  ['Delhi', 300000],
  ['Ladakh', 100000],
  ['Lakshadweep', 300000],
  ['Puducherry', 100000],
];

// What a State authority publishes on its own site beyond the NALSA table, read by us on the date given.
// Only States whose official site answers from outside India (33 of 37 refused or did not resolve on 08/11/2026).
// `basis` and each `wider` entry are i18n keys; amounts stay here, never in the texts (null = no income limit).
export const STATE_READ = {
  Delhi: {
    url: 'https://dslsa.org/legal-aid-wing/',
    date: '2026-11-08',
    basis: 'dl_basis',
    limit: 300000,
    wider: [['dl_senior', 400000], ['dl_trans', 400000], ['dl_acid', null], ['dl_hiv', null]],
  },
};

/** @returns {object|null} what the State's own authority site says, or null when we could not read it */
export function stateRead(state) {
  return STATE_READ[state] ?? null;
}

/** @returns {number|null} rupees per year, or null for a name not in the NALSA table */
export function incomeLimit(state) {
  return INCOME_LIMITS.find(([s]) => s === state)?.[1] ?? null;
}

/**
 * @param {Record<string, 'yes'|'no'|'unsure'>} answers
 * @returns {{eligible: boolean, clauses: string[], notes: string[]}}
 * notes are i18n keys, so the UI can explain them in any language.
 */
export function eligibility(answers = {}) {
  const yes = (id) => answers[id] === 'yes';
  const clauses = [];
  const notes = [];

  if (yes('scst')) clauses.push('a');
  if (yes('trafficking')) clauses.push('b');
  if (yes('woman') || yes('child')) clauses.push('c');
  if (yes('disability')) clauses.push('d');
  if (yes('disaster')) clauses.push('e');
  if (yes('workman')) clauses.push('f');
  if (yes('custody')) clauses.push('g');
  // Income ceilings are notified per State and change; we never compare numbers ourselves.
  if (yes('income')) {
    clauses.push('h');
    notes.push('note_h_confirm');
  } else if (answers.income === 'unsure') {
    notes.push('note_income_unsure');
  }

  const eligible = clauses.length > 0;
  if (eligible && clauses.every((c) => c === 'h')) notes.push('note_only_h');
  if (!eligible) notes.push('note_not_eligible');
  return { eligible, clauses, notes };
}

/** Document checklist (i18n keys) for the DLSA application, given the clauses relied on. */
export function documents(clauses = []) {
  const docs = ['doc_id', 'doc_address', 'doc_case_papers'];
  if (clauses.includes('a')) docs.push('doc_caste');
  if (clauses.includes('b')) docs.push('doc_trafficking');
  if (clauses.includes('c')) docs.push('doc_age');
  if (clauses.includes('d')) docs.push('doc_disability');
  if (clauses.includes('e')) docs.push('doc_disaster');
  if (clauses.includes('f')) docs.push('doc_workman');
  if (clauses.includes('g')) docs.push('doc_custody');
  if (clauses.includes('h')) docs.push('doc_income_affidavit');
  return docs;
}

// Link that opens straight on the same result for whoever receives it. Only the language and the
// nine answers travel: nothing typed, no State, nothing personal.
export function shareUrl(origin, answers, lang) {
  return `${origin}/?${new URLSearchParams({ lang, ...Object.fromEntries(QUESTIONS.map((q) => [q.id, answers[q.id]])) })}`;
}

// Answers from a shared link, or null unless every question has one of its own options.
export function answersFrom(search) {
  const p = new URLSearchParams(search);
  const a = Object.fromEntries(QUESTIONS.map((q) => [q.id, p.get(q.id)]));
  return QUESTIONS.every((q) => (q.options || ['yes', 'no']).includes(a[q.id])) ? a : null;
}
