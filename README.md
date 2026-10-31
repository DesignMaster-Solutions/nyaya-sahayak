# Nyaya Sahayak (न्याय सहायक)

A free, open-source helper that tells an Indian citizen, in under 2 minutes, whether they are
entitled to **free legal aid under Section 12 of the Legal Services Authorities Act, 1987**, and
drafts their application to the Secretary of the **District Legal Services Authority (DLSA)**,
in English and Hindi.

Built for *Code for a Billion*, track **Timely Justice**.

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
smoke tests on two phones right after the deploy; everything after that is public use.

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

**Income limits are never hardcoded.** They are notified by each State Government (and by the
Central Government for the Supreme Court) and change over time. The app asks the person whether
their income is below their State's notified limit; a "yes" yields clause (h) as *likely*, with a
note to confirm the limit with the State Legal Services Authority or NALSA. A test fails if an
amount in rupees or lakhs ever appears in the strings.

## How it was built

The project was built in the **AgentFoundry IDE** with **Claude Code** as the coding agent.
AgentFoundry handed Claude Code the project brief (`BRIEF.md`) and a single prompt; Claude Code
read the brief, wrote the tests for every Section 12 clause first, implemented `rules.js` and the
bilingual strings until `node --test` passed, then built the UI, the Cloudflare config and this
README, and committed the result with conventional commits. Hindi text was written by the agent
and should be reviewed by a native speaker with legal-aid experience before public launch.

## Legal sources

- The Legal Services Authorities Act, 1987 (Act No. 39 of 1987), Section 12 (Criteria for giving
  legal services), official text on India Code: https://www.indiacode.nic.in
- Constitution of India, Article 23 (prohibition of traffic in human beings and forced labour).
- National Legal Services Authority (NALSA): https://nalsa.gov.in . Helpline **15100**.
- Tele-Law (Department of Justice), free legal advice through Common Service Centres:
  https://www.tele-law.in
- State Legal Services Authorities publish their State's notified income limit; every district
  has a DLSA.

This tool gives information, not legal advice.
