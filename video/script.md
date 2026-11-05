# Demo video script (Code for a Billion 2026, submission #42)

Promise: for a judge of the Governance track, this video shows the live app telling a person in
custody that Section 12(g) entitles them to a free lawyer and drafting the DLSA application, in
about 85 seconds, with every number traceable to the README or the app.
Viewer: evaluator, watches once, may be muted (every claim is also on screen).
Shape: product walkthrough, prints of the live app on a real phone (Redmi Note 14 Pro, 375x721),
opened with `?nostats` so the recording never enters the public counter (checked: /api/stats
identical before and after). Details in the form are a sample, never sent anywhere.
Render: `python3 ~/Dev/clauditor/skills/video-editing/scripts/demo_slides.py video/demo.json`,
then `loudnorm` to -14 LUFS.

| # | Visual | Narration (core) | Source |
|---|--------|------------------|--------|
| 1 | NCRB figure and Section 12(g) | Three in four of India's prisoners were undertrials; every person in custody is entitled to a free lawyer, but has to ask. | NCRB Prison Statistics India 2022; LSA Act s.12 |
| 2 | Intro screen + question 1 | Legal aid reached 15,50,164 people in 2023-24; the app answers: am I entitled, what do I write? | PIB 2159189 |
| 3 | Questions 8 and 9 | Nine yes/no questions cover every clause; income limits are never hardcoded. | rules.js, tests/rules.test.mjs |
| 4 | Result card | Names Section 12(g); unsure about income points to the DLSA or NALSA 15100. | app result screen |
| 5 | Form + drafted letter | Letter to the Secretary, DLSA, with facts, clause and a request for a panel lawyer; details stay on the phone. | app draft screen |
| 6 | Documents + Hindi letter | Document checklist; one tap rebuilds the letter in Hindi; print or WhatsApp. | app draft screen |
| 7 | Real output of `node --test tests/rules.test.mjs` | Pure function, 18 tests, a test fails if a rupee amount appears. | test run at render time |
| 8 | URL, licence, size, /stats | Free, open source, about 30 KB, information not legal advice. | README |

Off screen: real personal data, any promise of an outcome in court.
