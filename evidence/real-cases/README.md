# Real cases: people who did not get the free legal aid they were entitled to

Every case here is a real, published decision. I searched indiankanoon.org on 5 November 2026 for
decisions of the Supreme Court and the High Courts where a person did not get the free legal aid owed
to them (Section 12 of the Legal Services Authorities Act 1987, Article 39A and 21 of the Constitution,
section 304 CrPC) and that failure weighed in the result. I read each decision in full. The text of each
one is saved in `sources/`, and `cases.json` keeps what each decision states. A field the decision does
not state is `null`; nothing is estimated.

`tests/real-cases.test.mjs` checks every quote word for word against the saved decision, replays each
person through the app's own `eligibility()` and `documents()` from `rules.js`, and checks the numbers on
this page against `cases.json`.

## The cases

| Case | Court, date | Who | What was missing | Result |
|---|---|---|---|---|
| [Hussainara Khatoon](https://indiankanoon.org/doc/1373215/) | Supreme Court, 9 Mar 1979 | poor undertrials in Bihar jails, some held since 1972 | a lawyer to apply for bail | those held beyond the maximum sentence released; State told to give a lawyer at State cost |
| [Khatri (Bhagalpur blindings)](https://indiankanoon.org/doc/1122133/) | Supreme Court, 19 Dec 1980 | blinded undertrials, Bihar | never asked at first production or remand if they wanted a lawyer | magistrates across India told to inform every indigent accused |
| [Suk Das](https://indiankanoon.org/doc/765136/) | Supreme Court, 10 Mar 1986 | poor accused, Arunachal Pradesh | never told of free legal aid; tried without a lawyer | conviction set aside |
| [Mohd. Hussain](https://indiankanoon.org/doc/147661398/) | Supreme Court, 31 Aug 2012 | accused in custody since 1998, Delhi | no meaningful counsel at trial | death sentence set aside; retrial |
| [Rajoo](https://indiankanoon.org/doc/191628518/) | Supreme Court, 9 Aug 2012 | convict on appeal, Madhya Pradesh | High Court never asked if he wanted legal aid | High Court judgment set aside; appeal reheard |
| [Anokhilal](https://indiankanoon.org/doc/110783225/) | Supreme Court, 18 Dec 2019 | accused in custody, Madhya Pradesh | legal aid lawyer named the day charges were framed | death sentence set aside; fresh trial; norms for legal aid counsel |
| [Naveen](https://indiankanoon.org/doc/34705863/) | Supreme Court, 19 Oct 2023 | accused in jail, Madhya Pradesh | legal aid lawyer named the day of the charge-sheet | death sentence set aside; fresh trial with a senior DLSA counsel |
| [Ashok](https://indiankanoon.org/doc/84781373/) | Supreme Court, 2 Dec 2024 | accused jailed 12 years 9 months before bail, Uttar Pradesh | no lawyer at charge and at the main witness | acquitted; directions to every State Legal Services Authority |
| [Sovaran Singh Prajapati](https://indiankanoon.org/doc/41463034/) | Supreme Court, 4 Feb 2025 | accused in jail, "of considerably less means", Uttar Pradesh | witnesses examined without counsel; legal aid lawyer late and changed | death sentence set aside; fresh trial |
| [Tarun Sharma](https://indiankanoon.org/doc/105782916/) | Supreme Court, 1 Sep 2025 | convict serving life, in prison, Haryana | amicus named and appeal heard the same day | acquitted and released |
| [Nazim and four others](https://indiankanoon.org/doc/5653441/) | Delhi HC, 14 Sep 2017 | 5 accused on bail | six witnesses examined with no counsel and no legal aid substitute | convictions set aside; retrial |
| [Rakesh](https://indiankanoon.org/doc/171823597/) | Allahabad HC, 18 May 2018 | "a man of no education and no means", Uttar Pradesh | counsel deserted him; never offered a State counsel | life sentence set aside; fresh trial |
| [Manglu](https://indiankanoon.org/doc/41457796/) | Allahabad HC, 21 Dec 2018 | told the court he was very poor; in jail since 2003 | no counsel at charge and at the main witness | life sentence set aside; fresh trial |
| [Govindaraju](https://indiankanoon.org/doc/189384070/) | Karnataka HC, 23 Dec 2020 | accused, Karnataka | cross-examination closed as nil, no legal aid counsel | life sentence set aside; witnesses to be cross-examined |
| [Shambhu Nath Singh and two others](https://indiankanoon.org/doc/115636534/) | Patna HC, 20 Jan 2022 | 3 accused in jail throughout the trial, Bihar | no counsel from charge to the end; 11 of 15 witnesses not cross-examined | life sentences set aside; fresh trial |
| [Ramu](https://indiankanoon.org/doc/128366366/) | Allahabad HC, 7 Aug 2024 | "financially destitute" prisoner, in jail since 2008 | no legal aid to seek bail for over a decade | interim bail in 2022 after 14 years in jail, made absolute in 2024; directions to DLSAs and jails |

## The numbers

- 16 decisions: 20 named people, plus 2 group cases (Hussainara, Khatri) where the Court gives no count.
  7 States and Union Territories; 11 from 2015 onwards, 5 classics.
- In 12 the person had no lawyer at a stage that mattered, or was never told or asked. In the other 4
  (Mohd. Hussain, Anokhilal, Naveen, Tarun Sharma) there was a legal aid lawyer, named too late to prepare.
- What it cost: death sentences set aside in 4, life sentences in 4; Manglu spent more than fourteen years
  in jail before his appeal was heard, Ramu about 14 before interim bail.

## What the app would have said

For each person I filled in only the answers the decision supports: "yes" only where the text states the
fact, and "unsure" on income where the text says poor but gives no figure (none of them gives one).

- The app says **eligible in 11 of 16**, all 11 through clause (g), custody. It also lists
  the matching documents (jail details for (g), a disability certificate for the blinded Khatri prisoners).
- For 2 more (Suk Das, Rakesh), poor but with no income figure and no stated custody, the app does not say
  eligible: it shows the State's income ceiling and sends them to the DLSA or 15100 (`note_income_unsure`).
- 3 get "not eligible" from the stated facts alone (Rajoo, Nazim's group, Govindaraju): the decisions do not
  say whether they were in custody or poor. The app still points them to the DLSA, but this is a real gap.
- Same reason as the court: **4 of 16** (Hussainara, Khatri, Ramu, Shambhu Nath), where the court itself
  rested on custody. In 2 the court pointed to poverty (h) while the app gets there by custody (g); in 7 the
  court rested on the right of every unrepresented accused to counsel (section 304 CrPC, Article 21), which
  is wider than the Section 12 categories the app asks about.

Every case where the app and the court differ says why in `divergence` in `cases.json`.

## Limits

- This is not field use. None of these people used the app; most cases predate it. It shows that the app
  asks the questions that decide real entitlement and sends the person to the right door early, not that
  it changed an outcome.
- The app cannot fix a lawyer named too late (4 cases) or a court that does not appoint one; it can only
  get the application to the DLSA earlier and in writing.
- All 16 are criminal cases; the search found no reported decision where a woman, child, SC/ST person or
  trafficking victim was denied aid as a litigant in her own right. Published decisions are the ones that
  reached a High Court; the people who never got there are not here.
- There are 8 decisions I read and left out, listed in `excluded` with the reason: 2 counter-examples where
  the court found the legal aid adequate (Jitendra Kushwah, Dinesh), and 6 where legal aid was not what
  decided the case.
