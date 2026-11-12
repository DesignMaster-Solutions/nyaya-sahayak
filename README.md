# Nyaya Sahayak (न्याय सहायक)

A free, open-source helper that tells an Indian citizen, in under 2 minutes, whether they are
entitled to **free legal aid under Section 12 of the Legal Services Authorities Act, 1987**, and
drafts their application to the Secretary of the **District Legal Services Authority (DLSA)**,
in English and Hindi.

Built for *Code for a Billion*, track **Timely Justice**.
Demo video (85 s): <https://youtu.be/Mnqa7ExGQFI> (script and sources of every frame in [video/](video/)).

- Static web app: `index.html`, `app.js`, `rules.js`, `i18n.js`, `styles.css`. No framework, no
  paid API, no cookies, no account. About 30 KB in total, so it loads on a cheap phone on a weak
  connection. Answers and personal details never leave the device; the only server code is a tiny
  Worker (`worker.js`) that counts anonymous events for the impact data (see *Usage numbers*).
- One question per screen, then a result card listing the clause(s) of Section 12 that apply and why.
- "Draft my application" builds an editable, printable letter to the Secretary, DLSA, with the
  person's facts, the clause(s) relied on and a checklist of documents (ID, caste or disability
  certificate when relevant, affidavit of income when relying on clause (h)).
- "Send on WhatsApp" sends the letter to the person's own chat, a relative or a paralegal (the
  system share sheet where available, `wa.me` otherwise); "Share this tool on WhatsApp" passes the
  link on, which is how it travels between DLSAs, Common Service Centres and NGOs.

## Usage numbers (impact data)

Live, public and anonymous: **https://nyaya-sahayak.designmaster.workers.dev/stats** (JSON at
`/api/stats`). The app sends four events with `navigator.sendBeacon`: `check` (all nine questions
answered), `eligible` (the result named at least one clause), `draft` (a DLSA letter was built) and
`share` (letter sent or tool shared on WhatsApp), each with the language only. Nothing else is
sent: no answers, no names, no addresses, and the Worker never stores an IP. The counts live in
one Durable Object (`worker.js`, class `Counter`), so concurrent increments are not lost, and are
kept as totals, per language and per day (UTC).
The first three checks, eligible results and drafts counted on 31 October 2026 are our own
smoke tests on two phones right after the deploy. The counter cannot tell a visitor from one of
our own later tests that forgot `?nostats`, so we do not claim the later counts as third-party use.

The app opens offline after the first visit (`sw.js`, network first, cache only when the network
fails; `/api/` is never cached): the questions, the rules and the draft letter run in the browser.

## Real cases

[`evidence/real-cases/`](evidence/real-cases/) holds 16 real Supreme Court and High Court decisions
(1979 to 2025) where a person did not get the free legal aid they were entitled to, and it changed the
result: death and life sentences set aside, retrials, people in jail for 14 years without a lawyer for
bail. Each decision is saved in full, and `tests/real-cases.test.mjs` checks every quote word for word and
replays each person through `eligibility()` and `documents()`. Using only facts the decisions state, the
app says eligible in 11 of 16 (clause (g), custody) and sends 2 more to the DLSA on income; where it
differs from the court, `cases.json` says why. It is not field use: none of these people used the app.

## Setup

Requirements: Node.js 20+ (only for the tests and for `wrangler`).

```sh
npm test                      # same as: node --test (rules, i18n and the usage counter)
npx wrangler dev              # app + counter at http://localhost:8787
# or any static server, e.g.  python3 -m http.server 8000  (app only, the counter is skipped)
```

The app uses ES modules, so open it through a server, not as `file://`.

### Deploy (Cloudflare Workers static assets)

`wrangler.toml` deploys the folder as static assets under the Worker name `nyaya-sahayak`, with
`worker.js` answering only `/api/*` and a SQLite-backed Durable Object (migration `v1`) for the
counter; both are within the free plan. `.assetsignore` keeps tests, docs and config out of the upload.

```sh
npx wrangler login
npx wrangler deploy
```

## How the rules work

`rules.js` exports a pure function `eligibility(answers) -> { eligible, clauses[], notes[] }`
and `documents(clauses)`. `notes` and documents are i18n keys, so the same logic serves both
languages. `tests/rules.test.mjs` covers every Section 12 clause (a) to (h), the not-eligible case,
the "unsure about income" case, and checks that English and Hindi have the same keys.
`tests/worker.test.mjs` covers the counter: valid events are counted in total, per language and
per day; unknown events, unknown languages and broken JSON are rejected and nothing is stored;
`/api/*` reaches the counter and every other path is served as a static file.

**Income limits come from one official table.** On the income question the person picks their
State or Union Territory and the app shows the yearly ceiling NALSA lists for it (37 States/UTs,
from the table in the NALSA legal-aid FAQ, https://nalsa.gov.in/legal-aid/ , read 05/11/2026),
the Rs 5 lakh limit for a Supreme Court case, and that an affidavit of income is generally
accepted as proof (Section 13(2)). The person still answers yes or no; the State is not stored or
counted. NALSA's table is a floor (a State may notify a higher amount), so a "yes" yields clause (h)
as *likely* and the note to confirm with the DLSA stays. The figures live only in `INCOME_LIMITS`
in `rules.js`; a test checks the table against NALSA's values and fails if an amount in rupees or
lakhs is ever typed into the strings.

## How it was built

The project was built in the **AgentFoundry IDE** with **Claude Code** as the coding agent.
AgentFoundry handed Claude Code the project brief (`BRIEF.md`) and a single prompt; Claude Code
read the brief, wrote the tests for every Section 12 clause first, implemented `rules.js` and the
bilingual strings until `node --test` passed, then built the UI, the Cloudflare config and this
README, and committed the result with conventional commits. Hindi text was written by the agent
and should be reviewed by a native speaker with legal-aid experience before public launch. A second
independent reading on 07 Nov 2026 fixed 10 strings (gender agreement in the "is the person a woman"
question, singular "शामिल है" after the custody list, "नीचे का पाठ" for the draft text, the affidavit
formula "मेरी जानकारी के अनुसार सत्य हैं", "कितनी जाँचें की गईं" in the intro, among others); the native review is still missing.
Corrections are welcome as issues or pull requests.

## Legal sources

- The Legal Services Authorities Act, 1987 (Act No. 39 of 1987), Section 12 (Criteria for giving
  legal services), official text on India Code: https://www.indiacode.nic.in
- Constitution of India, Article 23 (prohibition of traffic in human beings and forced labour).
- National Legal Services Authority (NALSA): https://nalsa.gov.in . Helpline **15100**.
- Tele-Law (Department of Justice), free legal advice through Common Service Centres:
  https://www.tele-law.in
- State Legal Services Authorities publish their State's notified income limit; every district
  has a DLSA.

### The one State authority we could read

NALSA's table is a floor: a State may notify a higher amount or wider categories. On 8 November
2026 we tried the official sites of the State authorities from outside India (list and HTTP
codes in `evidence/dslsa/probe-2026-11-08.txt`): only Delhi, Maharashtra and Jharkhand answered,
and only Delhi publishes its eligibility list on the page itself. So when the person picks
**Delhi**, the income step also shows what DSLSA says on https://dslsa.org/legal-aid-wing/
(Delhi Legal Services Authority Regulation 2002, Chapter VI, Rule 9; text saved in
`evidence/dslsa/legal-aid-wing.txt`): the same annual limit NALSA lists for everyone else,
a higher one for senior citizens and transgender persons, and no income limit for acid attack
victims and persons infected or affected by HIV/AIDS. The figures live in `STATE_READ` in
`rules.js`, never in the texts, and a test checks that the Delhi figure equals NALSA's (the card
says "the same"). Maharashtra links the PDF of its own Rules, 1998 (read the same day, text in
`evidence/mslsa/rules-1998-rule-16.txt`): rule 16 still prints the 1998 ceiling, Rs 72,000, with
an asterisk and no footnote, below the Rs 3 lakh NALSA now lists for the State, so the app keeps
NALSA's figure and shows no Maharashtra card. Jharkhand only links PDFs that do not state the
limit; the other 33 sites refused the connection or did not resolve, so for them the card still
says to confirm with the DLSA or call 15100.


## Figures quoted in the submission

- 4,34,302 of 5,73,220 prisoners (75.8%) were undertrials on 31 December 2022: NCRB, Prison
  Statistics India 2022, Executive Summary,
  https://www.ncrb.mha.gov.in/uploads/nationalcrimerecordsbureau/custom/psiyearwise2022/170161282705ExecutiveSummary2022.pdf
- 15,50,164 people received legal aid under the LSA Act in 2023-24, 11,591 (0.74%) of them persons
  with disabilities: Ministry of Law and Justice, written reply in the Rajya Sabha, PIB release
  2159189 of 21 August 2025, https://www.pib.gov.in/PressReleasePage.aspx?PRID=2159189

This tool gives information, not legal advice.

## License

MIT, see [LICENSE](LICENSE). Anyone, including Code for India and any DLSA or NGO, may run, copy and adapt it.
