# Handover — Devpost submission copy

Status: **submission draft, not a submitted Devpost entry**. The public website, repository, and earlier successful CI run are linked below. [TEST_REPORT.md](../TEST_REPORT.md) records historical local, legacy-upgrade, HTTPS, version 3 offline, and real-update checks from before the English-only update. The English-only update subsequently passed 34 product tests, 13 dev-browser cases, and 6 built-browser cases locally, with format, lint, types, and build also passing. Hosted English-only verification and the full-repository text scan are pending. Physical-phone installation remains unverified; check the actual workflow for current CI results. The participant must complete the `[CONFIRM]` fields and retain the stated scope and limitations.

## Project name

Handover

## Tagline

Every class change needs a complete handover.

## Short description

Handover connects teachers, students, and school administrators around one class-change record. Teachers must complete the handover before submitting a change, so the next teacher knows what to teach and students know how to prepare.

## 30-second judge guide

Try the seeded Teacher, Student, and Admin accounts from the login page. As a teacher, open a class-change request and see which handover fields are still missing. Complete the handover, submit it, and sign in as the receiving teacher to confirm. Then open the student view to see materials and preparation tasks, and the admin view to follow the record.

All demonstration people and classroom scenarios are synthetic. Use the demo reset before your walkthrough if other visitors have changed the shared demonstration data.

## Inspiration

A math teacher is unexpectedly absent. A message says, “Tomorrow, study on your own.” Students still need to know whether to bring their workbook, submit yesterday's assignment, or prepare for a quiz. The teacher taking over needs to know which unit the class reached. The school office needs to know whether the class has actually been covered.

A changed time or teacher is only part of a class change. The lesson also needs to move with it. We designed Handover around a simple rule: a teacher cannot submit a class change without a complete handover.

The scenario is an illustrative school-life problem, not a claim that a particular school or teacher has tested this project.

## What it does

Handover gives each role a clear next action:

- **Teachers:** choose a class, request a time change or substitute, and supply lesson progress, teaching guidance, materials, assignments, quizzes, room needs, student reminders, and teacher notes. Missing information blocks submission.
- **Receiving teachers:** review the same handover, accept the request, or decline with a reason so the original teacher can revise and resubmit.
- **Students:** see relevant class changes and a preparation checklist. Student-facing materials and reminders are separate from notes intended for teachers.
- **School administrators:** inspect requests across the school, filter records, and follow status history.

The workflow is Draft → Pending → Confirmed or Declined → Completed or Cancelled, with revision after a decline. Conflict checks prevent incompatible changes. The interface is English-only, with responsive layouts for classroom use on smaller screens.

Before the English-only update, the core request lifecycle, conflict rejection, and student privacy were checked through four demo sessions on the deployed HTTPS app. Historical public version 3 also passed a real controlled offline reload and an offline-save failure check, and a native browser completed a real version 1 → 3 update while preserving the student session and the then-selected language. Responsive layouts were tested in desktop Chromium viewports; physical-phone installation is still unverified. No runtime AI generation, QR sharing, parent access, Google sign-in, or calendar subscription is claimed.

## How we built it

The interface uses React 19 and TypeScript. Vinext provides a Next.js-compatible application structure, running on Cloudflare Workers. Cloudflare D1 stores relational school and workflow records in SQLite. The application owns its backend authentication rather than relying on a visual role switch: email and password login, salted PBKDF2 password hashes, and HttpOnly sessions.

Authorization belongs in the backend. Students are scoped to their class, teachers to their own lessons and assigned handovers, and administrators to school management. The shared workflow model ties together required handover validation, schedule conflicts, allowed status transitions, and the audit trail.

Demo accounts and synthetic seed records make the school scenario easy to explore. Account recovery uses a recovery code issued at registration. We deliberately did not connect an email delivery service, so the prototype does not send password-reset emails.

The app is published at the HTTPS link below. Its hosted session cookies were checked for Secure and HttpOnly, and private API responses for `no-store`. Recovery and ordinary registration have local automated coverage; the hosted release walkthrough used demo sessions and did not exercise ordinary registration or demo reset.

## Challenges we ran into

The hardest design question was what “ready to hand over” actually means. A form with an optional notes box can still leave a substitute unprepared. We made the necessary lesson context part of the request contract, and made the missing information visible before submission.

Another challenge was serving three roles from one record without exposing every field to everyone. Students need materials, assignments, quizzes, and reminders. Receiving teachers need the instructional context. Administrators need the status and operational record. The interface and backend must agree on those boundaries.

Moving a class also creates scheduling risks. A valid request needs both a complete handover and a compatible time slot. Tests cover the ordinary walkthrough and attempts to bypass those rules through the API.

## Accomplishments we're proud of

The project turns a school communication problem into a concrete workflow: complete the handover, get an explicit response, then show each person the information they need for the next lesson.

On 2026-10-04, before the English-only update, Round 5 verification passed 33 product tests, 85 independent reviewer tests, 9 dev-browser cases, and 6 built-Worker browser cases. The final canonical offline-page repair passed 34 product tests, all 6 built-browser cases, and 28 service-worker behavior checks. The same authored offline test then passed 1/1 against the actual public HTTPS app. Three additional probes upgraded genuine R02 databases, including two interrupted seed attempts, while preserving ordinary accounts and established records. GitHub CI passed for the earlier released version. The deployed HTTPS walkthrough completed conflict rejection, return and resubmission, confirmation, cancellation, student privacy and todo persistence, timetable restoration, and logout revocation across four demo sessions. These counts describe separate suites and checks, not a single combined total. The validation report below records their scope, the earlier failed hosting attempt, and the successful final hosted checks.

We do not yet have school pilot data or measured effects on teacher workload, missed lessons, or student outcomes. The current evidence should come from the working prototype and reproducible tests.

## What we learned

Complete information is easier to protect when it is required by the workflow instead of left to habit. Permissions are also part of product design: deciding which information a student needs changes both the screen and the backend response.

AI assisted the development process substantially. The project still needs a human who can explain its decisions, reproduce the walkthrough, and evaluate whether its behavior is useful for a school. See the AI-use disclosure below for the tools and contribution boundaries.

**Human learning check:** the participant should review this section, replace it with their own understanding where appropriate, and be prepared to explain the validation, state transitions, conflict detection, authentication, and role permissions to judges.

## What's next

We would run a small, permission-based pilot using a school's existing class schedule, observe where teachers struggle to complete a handover, and simplify those fields. A pilot would measure incomplete handovers, preparation-task completion, and time spent resolving class-change questions before we claim an improvement.

Operational next steps include school-approved account provisioning, email recovery, and isolated demonstration sessions. Additional integrations and AI assistance would be considered after the core workflow is reliable and the school's data requirements are clear.

## Built with

React 19 · TypeScript · Vinext · Cloudflare Workers · Cloudflare D1 / SQLite · Drizzle ORM · Lucide · CSS · Playwright · Node.js test runner · OpenAI Codex · Cursor

## AI-use disclosure

OpenAI Codex and Cursor assisted substantially with architecture, implementation, interface copy, synthetic demo scenarios, testing, debugging, official-rule research, and submission materials. The human participant supplied the school problem and the required handover-first workflow. AI-generated code and copy require review, and the participant must be able to explain the final product. This is development assistance; no model-inference feature is claimed as part of the core product. Prior pieces include the Vinext starter, Manrope, and Lucide. Earlier versions used a Noto Sans TC subset, removed in the English-only update. Full disclosure: [AI_DISCLOSURE.md](AI_DISCLOSURE.md).

## Links and team

| Devpost field | Value to enter |
| --- | --- |
| Public demo | [Handover live app](https://handover-campus-2026.ziz81503.chatgpt.site); public access, historical version 3's hosted offline reload, and a real browser update were checked before the English-only update. Verify the current release before submitting. |
| Source code | [zhuang768/handover-csc-2026](https://github.com/zhuang768/handover-csc-2026) |
| Demo video | `[CONFIRM: uploaded 2-minute walkthrough URL, if provided]` |
| Screenshots | Eight actual English captures from 2026-10-05 are listed with measured dimensions in [screenshots/README.md](screenshots/README.md). Select the relevant files for upload. |
| Team members | `[CONFIRM: participant name and Devpost profile; add all actual teammates]` |
| Prior work / outside assets | Vinext starter, Manrope, and Lucide; see [CREDITS.md](../CREDITS.md). `[CONFIRM: disclose any additional prior participant work or outside assets.]` |
| Validation report | [TEST_REPORT.md](../TEST_REPORT.md); [earlier successful GitHub CI](https://github.com/zhuang768/handover-csc-2026/actions/runs/37145231969); [current workflow runs](https://github.com/zhuang768/handover-csc-2026/actions). |

## Known limitations to carry into the final submission

- No school has been claimed as a pilot partner, and no outcome statistics have been measured.
- Password recovery uses a registration-issued recovery code. The prototype does not deliver reset emails.
- The shared demo uses synthetic records; data isolation and production account provisioning need evaluation before school adoption.
- Physical iPhone/Android installation and standalone launch have not been tested. Responsive desktop viewports are not physical-device evidence.
- Reminders are created on workspace load rather than sent through background push; calendar export is a file download rather than a subscription.
- The product is currently unlicensed; third-party assets retain their own notices in CREDITS.md.
- Final Devpost submission, participant eligibility, team details, terms, and any uploaded video require the participant's own action.
