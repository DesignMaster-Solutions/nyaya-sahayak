# Nyaya Sahayak — brief (Code for a Billion, track Timely Justice)

Goal: a free, open-source agent that tells an Indian citizen in under 2 minutes whether they are
entitled to FREE legal aid under Section 12 of the Legal Services Authorities Act, 1987, and drafts
the application to the District Legal Services Authority (DLSA), in English and Hindi.

Facts we may use (statute, no invented numbers):
- Section 12 categories: (a) member of a Scheduled Caste or Scheduled Tribe; (b) victim of trafficking
  in human beings or begar (Art. 23); (c) a woman or a child; (d) a person with disability;
  (e) victim of mass disaster, ethnic violence, caste atrocity, flood, drought, earthquake or industrial
  disaster; (f) an industrial workman; (g) in custody, including a protective home, juvenile justice
  home or psychiatric hospital/nursing home; (h) annual income below the amount notified by the State
  Government (or the Central Government for the Supreme Court).
- Income ceilings differ by state and change by notification: do NOT hardcode them. Ask the user and
  point to NALSA (https://nalsa.gov.in) and the State Legal Services Authority; criterion (h) answer is
  "likely, confirm your state's notified limit".
- Contact: NALSA helpline 15100; Tele-Law; every district has a DLSA.

Build:
- Static web app (index.html + app.js + i18n en/hi), no backend, no paid API, works offline-ish on a
  cheap phone (< 100 KB, no framework).
- Question flow one step at a time; result card lists which clause(s) of Section 12 apply and why.
- "Draft my application" builds a plain-text/printable application to the Secretary, DLSA, with the
  person's facts and the clause, plus a checklist of documents (ID, caste/disability certificate when
  relevant, affidavit of income when relying on (h)).
- rules.js = pure function eligibility(answers) -> {eligible, clauses[], notes[]}; tests in
  tests/rules.test.mjs runnable with `node --test`.
- README with setup, how AgentFoundry was used, and the legal sources.
- Deploy target: Cloudflare Workers static assets (wrangler.toml), account later.
