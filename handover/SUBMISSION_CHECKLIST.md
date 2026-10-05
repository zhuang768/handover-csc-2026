# Handover — Submission checklist

Official information checked: 2026-10-03 (Asia/Taipei). Delivery evidence updated: 2026-10-05. Delivery verification and Devpost form submission are tracked separately. Unchecked items require completion or the participant's confirmation. Historical Sites results are identified separately from current English-only and Cloudflare checks.

## Current primary demo

Use [Handover on Cloudflare Workers](https://handover-campus-2026.ziz81503.workers.dev/) as the primary live link. It has a separate Cloudflare D1 database. The [original Sites app](https://handover-campus-2026.ziz81503.chatgpt.site/) and its records remain available; no data was moved. First use of the new address requires sign-in again, and original Sites accounts and sessions do not transfer. Historical Sites checks below remain evidence for their recorded releases, not a new Cloudflare production test or CI pass.

- [x] The Cloudflare live URL passed HTTPS resource and private-API checks, and four real demo sessions completed decline, revision, confirmation, cancellation, student privacy/preparation persistence, timetable restoration, and logout replay rejection. See [the Cloudflare test record](TEST_REPORT.md#cloudflare-deployment-2026-10-05).
- [x] A hosted Chromium case verified an actual controlled offline reload on the Cloudflare origin. Separately, all six `test:e2e:cloudflare` built cases passed against an isolated local D1; that local command is not a hosted test. See [the same test record](TEST_REPORT.md#cloudflare-deployment-2026-10-05).
- [ ] Physical iPhone/Android home-screen installation and standalone launch remain unverified.

## Deadline and countdown

| Item                         | Official time              | Taiwan time            |
| ---------------------------- | -------------------------- | ---------------------- |
| Submission opens             | 2026-09-04 00:00 PDT       | 2026-09-04 15:00       |
| Platform submission deadline | **2026-10-05 00:00 PDT**   | **2026-10-05 15:00**   |
| Target submission time       | Three hours early          | **2026-10-05 12:00**   |
| Judging period               | 10/5 00:00–10/12 00:00 PDT | 10/5 15:00–10/12 15:00 |
| Winners announced            | 2026-10-12 08:00 PDT       | 2026-10-12 23:00       |

Times come from the [official platform schedule](https://csc-back-to-school.devpost.com/details/dates). PDT in October 2026 is UTC−7; Taiwan is UTC+8, a 15-hour difference.

**Deadline inconsistency recorded on the check date:** the [rules](https://csc-back-to-school.devpost.com/rules) say October 5 at **12:00 PM Pacific**, which is October 6 at 03:00 Taiwan time. The platform schedule and page header say October 5 at **12:00am PDT**. Plan and submit by the earlier deadline, **October 5 at 15:00 Taiwan time**. Do not rely on a later submission being accepted. The participant can contact the organizer at webbcsc@gmail.com if clarification is needed; this project has not sent an email on their behalf.

Recalculate the countdown using the current time rather than treating “two days left” as a fixed value. The browser console can calculate the remaining hours:

```js
const deadline = new Date("2026-10-05T15:00:00+08:00");
console.log(
  Math.max(0, (deadline.getTime() - Date.now()) / 3_600_000).toFixed(1),
);
```

## Eligibility and project origins: participant confirmation

- [ ] Every teammate is a **high-school student aged 13–18**; the entry is individual or a **team of 1–4**. The historical note describing the participant as 16 is not current identity verification.
- [ ] Confirm residence, event exceptions, and Devpost account requirements. Minors must confirm legally valid parent or guardian consent.
- [ ] Substantial development took place during the official competition period. Pre-existing code, templates, data, and design sources are disclosed.
- [ ] All demonstration data is synthetic; any use of real data has the necessary permission.
- [ ] The project and description do not promote cheating, harm, or harassment.

Eligibility, development-period, and data requirements follow the [official rules](https://csc-back-to-school.devpost.com/rules). Account and minor-consent requirements follow the [Devpost terms](https://info.devpost.com/legal/terms-of-service). Eligibility must be confirmed by the participant.

## Required submission content

Check these items only after entering and confirming them in the Devpost form. Having a website and repository ready does not mean the form has been submitted.

- [ ] **Name:** Handover.
- [ ] **Problem and audience:** scattered class-change information; original teachers, receiving teachers, students, and the school office need one shared handover record.
- [ ] **Project description:** enter the [Devpost copy](docs/DEVPOST_SUBMISSION.md), retaining only verified feature claims.
- [ ] **At least one form of demonstration evidence:** an accessible demo, website, video, screenshots, photographs, or other clear evidence.
- [ ] **Tools and resources:** frameworks, libraries, platforms, outside assets, prior code, sources, and licenses.
- [ ] **AI disclosure:** include the [AI disclosure](docs/AI_DISCLOSURE.md) and explain AI's contributions.
- [ ] **Team information:** the participant's name and Devpost profile, with every actual teammate added to the submission.
- [ ] **Source, build, or design files:** this project has source code, so include a judge-accessible repository link and reconstruction instructions.
- [ ] Open every submitted link in a private browser window and confirm that judges do not need a private account or authorization.

This follows the [organizer's submission checklist](https://csc-back-to-school.devpost.com/updates/46587-one-week-left-submission-checklist). Complete any additional required fields shown by the actual platform form.

## Optional content and prize participation

**A demo video is optional.** The organizers encourage 1–2 minutes and do not state a hard three-minute limit. The [video script](docs/DEMO_SCRIPT.md) targets two minutes, within the requested maximum of three minutes. A public website is not the only accepted form of demonstration evidence, but a working URL remains part of this project's delivery. [Competition overview](https://csc-back-to-school.devpost.com/)

| Prize                 |           Cash | Awards |
| --------------------- | -------------: | -----: |
| CSC Innovation Gold   |         US$250 |      1 |
| CSC Innovation Silver |         US$100 |      1 |
| CSC Innovation Bronze |          US$50 |      1 |
| Honorable Mention     | No cash listed |      5 |

Sponsor credits and subscriptions are non-cash benefits subject to each service's requirements; do not present them as redeemable cash prizes. The Render reward requires **Render Workflows**. This project's Cloudflare architecture does not establish eligibility for that reward. See the [prize section](https://csc-back-to-school.devpost.com/#prizes) for details and conditions.

- [ ] Decide personally whether to select applicable **Sponsor / Special Prizes** in Devpost. Using a sponsor tool does not automatically enter a prize category. [Organizer reminder](https://csc-back-to-school.devpost.com/updates/46517-two-weeks-left-we-re-just-past-halfway)
- [ ] For Innovation Award or Honorable Mention participation, agree to the required public source or project link, organizer publicity, and explanation of the project and AI use. [Prize rules](https://csc-back-to-school.devpost.com/rules)
- [ ] Before claiming sponsor benefits, confirm age, account, guardian-consent, and redemption requirements separately.

## Judging criteria and evidence

The organizers list **Learning, Design, Creativity, Functionality, and Impact**, without published percentage weights. Do not substitute the attachment's three abbreviated categories for the complete rubric. [Judging criteria](https://csc-back-to-school.devpost.com/#judging-criteria)

| Criterion     | Handover demonstration strategy                                                                                                    |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Learning      | Explain required handover fields, permissions, conflict checks, state transitions, implementation tradeoffs, and AI contributions. |
| Design        | Make each role's next action clear; show the mobile layout and missing-field feedback.                                             |
| Creativity    | Show the enforced rule that a complete handover is required before submission, addressing fragmented class-change information.     |
| Functionality | Walk continuously through teacher submission, receiving-teacher confirmation, student preparation, and the school-office overview. |
| Impact        | Identify the intended beneficiaries. Do not claim percentage time savings or improved grades without pilot data.                   |

Judges can change; review the [Judges section](https://csc-back-to-school.devpost.com/#judges) before submitting. On 2026-10-03 it listed CSC school judges and external technical and product judges. No special login conditions are needed for individual judges.

## Completed delivery evidence before the English-only update

- [x] The HTTPS website was published with public access: [Handover](https://handover-campus-2026.ziz81503.chatgpt.site).
- [x] Source was made public under the existing authorization: [zhuang768/handover-csc-2026](https://github.com/zhuang768/handover-csc-2026).
- [x] An earlier version passed GitHub CI: [actual run](https://github.com/zhuang768/handover-csc-2026/actions/runs/37145231969). Check the [actual workflows](https://github.com/zhuang768/handover-csc-2026/actions) for later repairs and documentation changes.
- [x] Round 5 passed 33 local product tests, 85 independent reviewer tests, 9 dev E2E cases, 6 built E2E cases, and 3 genuine R02 historical-upgrade probes against a pinned version. Round 6's offline repair passed 34 product tests and all 6 built E2E cases. See [TEST_REPORT.md](TEST_REPORT.md) for scope.
- [x] Four HTTPS demo sessions completed conflict 409, Draft → Pending → Declined → revised Pending → Confirmed → Cancelled, student privacy and todo persistence, timetable restoration, and logout revocation. Secure/HttpOnly cookies and private-response `no-store` were checked. This ran before public access was enabled; ordinary registration and demo reset were not exercised in production.
- [x] After public access was enabled, anonymous root access returned 200; anonymous API access returned 401 with `no-store`; the manifest, four PNG icons, and service-worker MIME were checked.
- [x] Historical version 3's canonical `/offline.htm` passed strict HTTP checks: 200, no redirect, `text/html`, and the designed page. The same authored offline test passed 1/1 against actual HTTPS, checking a real controller, public cache, the then-bilingual offline reload, and an offline save that neither reported false success nor persisted after reconnecting. No reset or successful profile write was performed.
- [x] A native browser completed a real version 1 → 3 waiting-worker update. An unsaved Mina 7A change showed only a warning; restoring the original value allowed a real reload that retained the student session and the then-selected language and dismissed the banner.
- [ ] Physical iPhone/Android Add to Home Screen and standalone launch. A desktop mobile viewport is not physical-device installation evidence.

## English-only local verification, 2026-10-05

- [x] The root ran formatting, lint, types, build, and 34 product tests; all exited 0. The dev browser suite passed 13/13 and the direct built suite passed 6/6 in 6.7 seconds.
- [x] Eight actual English screenshots were regenerated on 2026-10-05. Measured dimensions are in [the screenshot inventory](docs/screenshots/README.md); student and teacher captures were visually checked for signed-in workspaces.
- [x] The full-repository `npm run check:english` scan passed after reviewer-document translation, as recorded in `TEST_REPORT.md`.
- [x] Sites version 5 passed its English-only hosted offline and strict resource checks. This historical Sites result is not a new Cloudflare production pass.

## Quality and delivery verification

- [x] [TEST_REPORT.md](TEST_REPORT.md) records historical end-to-end, decline/resubmit, conflict, authorization, desktop viewport, and local demo-reset results, separating hosted and physical-device limits.
- [x] Formatting, lint, types, unit/integration tests, build, and CI results are recorded accurately for their tested versions.
- [x] The main workflow was exercised on HTTPS, rather than only locally; public anonymous and offline-check scope is listed above.
- [ ] The participant's video shows only verified features, with every visible operation and result checked against the final English-only release.
- [x] README includes the URL, demo access, installation, environment variables, seed behavior, licensing, and known limitations.
- [x] Password reset clearly uses recovery codes and does not claim outbound email.
- [x] The [actual screenshot inventory](docs/screenshots/README.md) contains eight regenerated English-only synthetic-data captures, with no real student names, sensitive information, or secrets.
- [ ] Match the video and copy to the deployed version and include a short AI-use statement.

## Final steps only the participant can complete

- [ ] Confirm eligibility, teammates, Devpost terms, guardian consent, and prize-publicity choices.
- [ ] Record/upload the optional video and confirm its public playback link.
- [ ] Enter the text, URLs, and teammates in Devpost, choose prizes, and submit/publish the entry.
- [ ] Confirm successful submission before the **October 5 at 12:00 Taiwan time** target and save the submission page and success screen. Do not exceed **October 5 at 15:00 Taiwan time**.

The organizers require a completed and published submission, not only a draft. [Final submission reminder](https://csc-back-to-school.devpost.com/updates/45925-3-days-remaining-final-call-for-submissions). Checking this list or creating a Git commit does not mean Devpost has received the entry.
