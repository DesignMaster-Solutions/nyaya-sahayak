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
