# Round 01: documentation and delivery audit

Historical English rendering of the review on 2026-10-03 (Asia/Taipei). This audit read product/source/documentation and added only a report. It did not edit product, rerun product tests, deploy, push, or operate Devpost. Findings refer to that candidate, not the current product.

## Result and source

DOC-01/DOC-02 had not passed final delivery. English narrative, a two-minute storyboard, seven planned screenshots, official references, and an undeployed disclaimer existed, but README reconstruction/operations and AI/outside-asset disclosure were incomplete. The report could not support all P0 gates passing.

Repository: `/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon`. HEAD `111f16a17381679aba20499807b9f6cd7b306cfc`; handoff product `9f2d0389bfc04deb73959b97a165cabc00989125`. Their product/CI trees matched; HEAD was status-only. Only generated `handover/tsconfig.tsbuildinfo` was dirty and was left alone. No Git remote, public URL, or GitHub URL existed. Documentation-local Markdown links had zero broken targets (plain filename mentions were outside that check). The main demo storyboard had eight shots, 120 seconds, and 241 English narration words; its approximate 244-word label was immaterial. No screenshot files, HANDOFF, or product license existed. Vendor licenses did not license Handover itself. Official rules were reused from previously verified sources; no new external messages or rule browsing occurred.

GitHub upload was already authorized and required no duplicate approval after independent acceptance/source checks. Devpost eligibility, terms, promotion choices, and final submission remained participant actions.

## Correct portions and limits

| Area | Historical finding |
| --- | --- |
| Rules | Checklist had official sources, required/optional items, five judging criteria, award opt-ins, Taiwan October 5 15:00 deadline, and the earlier-time choice for conflicting noon/midnight wording. |
| Eligibility | Participant age/high-school status and guardian consent were explicitly pending, with no proxy submission. Root README's unverified age claim needed correction. |
| Narrative | Name, tagline, seven Devpost sections, and a concrete math lesson scenario; no invented school pilot or percentage benefit. |
| Media | 120-second script and seven-shot plan were plans, not recorded media. |
| Auth | Recovery codes and no email reset disclosed; no completed email or Google sign-in claim. |
| Architecture | React 19/TypeScript/Vinext/Workers/D1, PBKDF2, and HttpOnly sessions matched source, without proving production runtime. |
| CI | Root workflow used handover working directory/lockfile and npm ci, format, lint, types, tests, build, without bypasses. No actual remote CI result existed. |
| Demo | Synthetic names matched seed. Four role buttons called real backend session creation rather than a frontend role toggle. |

## Findings and acceptance conditions

### DOC-R01-01 [P1]: reproducible README operations missing

Locations: `handover/README.md:7,36,45`, `package.json:5`, `.env.example:1`, `vite.config.ts:17`, API route `:6`. README gave only install/dev commands, without Node >=22.13.0, architecture, actual Worker-variable precedence, DB binding, first schema/seed behavior, persistence, or reconstruction. Vite and route fallbacks used public demo values, so copying an env file was not sufficient explanation. Readers could not distinguish local Wrangler start from production publication or configure invite/DEMO_MODE reliably.

Acceptance: identify repo/app roots, Node and URL; explain in-memory tests versus Workers/D1/Sites; document actual vars, public demo invitation, and school deployment differences; explain the then-existing ensureSchema/seedIfEmpty paths and non-destructive fresh-DB verification; distinguish preview/build/start/deploy and four-role deployment checks. Unknown deployment stays pending.

### DOC-R01-02 [P1]: disclosure omitted Cursor and confirmed assets

Locations: AI disclosure `:7,22-27`, Devpost `:88,92,103`, DECISIONS `:3`. Codex was listed while authorized Cursor performed implementation and Codex handled preparation/research/review. Skills/assets/sponsors were still CONFIRM despite known Sites/Vinext starter and OpenAI/shadcn-tailwind vendor notices. Do not guess Cursor's model.

Acceptance: disclose both tools and actual contributions, confirmed starter/vendor/libraries/licenses, and skills actually read/applied with outcomes. Keep unknown prior personal work, names, and participant-understanding confirmation as human items. Remove placeholders determinable from source.

### DOC-R01-03 [P1]: claimed Origin protection contradicted GET mutation

Locations: DECISIONS `:13`, API contract `:3,17`, service `:1945,2067`. Docs promised all mutations protected and submit POST-only. Source checked Origin only for non-GET/HEAD and lacked a consistent action-method gate. The earlier R01_PRELIMINARY reproduced GET-submit mutation; this audit reread the gap but did not rerun exploitation.

Acceptance: fix method enforcement first; independently prove GET/HEAD/wrong methods preserve status, locks, notifications, and audit. Keep POST/Origin claims aligned with implementation. Merely weakening wording or adding a limitation cannot pass SEC/P0.

### DOC-R01-04 [P2]: API success was not browser/D1/P0 success

Locations: TEST_REPORT `:14,21,36,40,44`, CURSOR_STATUS `:43`, API test `:329`. Twenty-four tests called handleApi with in-memory SQLite. A test named progress survives reload performed another API GET, not browser reload or Worker/D1 restart. Honest unverified viewport/Playwright/public-URL notes conflicted with completed CHECK-01, whose baseline also required E2E. Duplicate empty headings reduced clarity.

Acceptance: separate API counts, commands, browser smoke, independent review, and deployed checks. Label repeated API reads accurately. Track role flow, return/resubmit, conflicts, authorization, reset, and real 390/768/1440 viewports as Pass/Fail/Not run with version/evidence. Align handoff UX/WEB/CHECK-01 statuses; 24 green tests do not prove every control.

### DOC-R01-05 [P2]: product entry, HANDOFF, and license missing

Root README was old contest notes with an unverified age-16 claim and QRAlarm discussion. Original notes were already copied into docs, so root could point to Handover while preserving history. JSON handoff existed, but no product HANDOFF or main LICENSE existed.

Acceptance: product entry and clearly historical notes; README links to submission/report/decisions/handoff and a 30-second tour; HANDOFF with tested commit, commands, failures, next steps, external state, and human items. State the real product license choice or unspecified status, never infer it from vendor MIT.

### DOC-R01-06 [P2]: final copy and remaining actions needed integration

Devpost `:42,66,98-112` and checklist `:96` retained verification gates/CONFIRM. Useful draft caution was not ready-to-submit delivery. Repeated GitHub authorization was incorrectly a human-only task. Unknown video/names/prior work must not be fabricated; engineering-verifiable assets/results/release state should be completed.

Acceptance: copy matches accepted capabilities and actual URLs, removes engineering placeholders, and keeps known demo/recovery/reminder limits. Human-only items are eligibility/team/guardian, terms/award/promotion choices, video, and final Devpost submit. GitHub push remains authorized pending acceptance; website follows existing explicit authorization/platform access.

## Historical delivery matrix

| Item | Then-current status | Needed for completion |
| --- | --- | --- |
| Checklist | Sources and deadline/eligibility separated | Final status and human items aligned |
| README | Partial | Reproducible environment/DB/seed/architecture/deploy/license/tour |
| DECISIONS | Basic architecture/tradeoffs | Evidence-backed security and skill outcomes |
| Devpost | Draft | Verifiable placeholders removed, real URLs and tested claims |
| Demo | Length/format planned | Rehearsed recorded public video |
| Screenshots | Seven planned | Actual version-matched images |
| Disclosure | Partial | Cursor/Codex/starter/vendor/skills complete |
| Report | API/commands/single-role smoke | Independent P0, roles/viewports/deployment |
| HANDOFF | JSON only | Product handoff with final state/next steps |
| CI | Workflow present | Tested commit pushed and actual remote result |
| Public/GitHub URLs | Absent | Authorized release and remote-SHA verification |
| Devpost submit | Not performed | Participant confirmation/submission receipt |

Next review: reread stable repaired source/docs; verify method security, root CI inclusion, clean install/fresh DB, internal links/placeholders/credits/license, and separately record GitHub push, CI, public deploy, and Devpost. The old bilingual editorial requirement is retained here only as history; current maintained text is English.
