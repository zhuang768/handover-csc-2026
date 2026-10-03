# Handover — Devpost submission copy

狀態：**提交草稿，尚未由此文件證明驗收或公開部署完成。** 後續需依 TEST_REPORT.md 與實際版本更新。`[CONFIRM]` 欄位必須由本人補齊；尚未通過的功能應刪除，不要直接把整份草稿當作已驗證主張貼上。

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

The workflow is Draft → Pending → Confirmed or Declined → Completed or Cancelled, with revision after a decline. Conflict checks prevent incompatible changes. The interface supports English and Traditional Chinese, with responsive layouts for classroom use on phones.

**Verification gate:** the paragraph above describes the intended release scope. Before publishing, retain each claim only when the current deployment and TEST_REPORT.md demonstrate it. Optional features must be listed separately if verified; this draft does not claim runtime AI generation, QR sharing, parent access, Google sign-in, or calendar subscriptions.

## How we built it

The interface uses React 19 and TypeScript. Vinext provides a Next.js-compatible application structure, running on Cloudflare Workers. Cloudflare D1 stores relational school and workflow records in SQLite. The application owns its backend authentication rather than relying on a visual role switch: email and password login, salted PBKDF2 password hashes, and HttpOnly sessions.

Authorization belongs in the backend. Students are scoped to their class, teachers to their own lessons and assigned handovers, and administrators to school management. The shared workflow model ties together required handover validation, schedule conflicts, allowed status transitions, and the audit trail.

Demo accounts and synthetic seed records make the school scenario easy to explore. Account recovery uses a recovery code issued at registration. We deliberately did not connect an email delivery service, so the prototype does not send password-reset emails.

**Verification gate:** describe deployed infrastructure only after the release has actually been published and checked. Keep the recovery-code limitation visible in the final description.

## Challenges we ran into

The hardest design question was what “ready to hand over” actually means. A form with an optional notes box can still leave a substitute unprepared. We made the necessary lesson context part of the request contract, and made the missing information visible before submission.

Another challenge was serving three roles from one record without exposing every field to everyone. Students need materials, assignments, quizzes, and reminders. Receiving teachers need the instructional context. Administrators need the status and operational record. The interface and backend must agree on those boundaries.

Moving a class also creates scheduling risks. A valid request needs both a complete handover and a compatible time slot. Our verification plan covers both the ordinary walkthrough and attempts to bypass those rules through the API.

## Accomplishments we're proud of

The project turns a school communication problem into a concrete workflow: complete the handover, get an explicit response, then show each person the information they need for the next lesson.

**Replace this sentence with measured release evidence before submitting:** `[CONFIRM: number and scope of automated checks, completed role walkthroughs, deployed test date, and the exact implementation revision.]`

We do not yet have school pilot data or measured effects on teacher workload, missed lessons, or student outcomes. The current evidence should come from the working prototype and reproducible tests.

## What we learned

Complete information is easier to protect when it is required by the workflow instead of left to habit. Permissions are also part of product design: deciding which information a student needs changes both the screen and the backend response.

AI assisted the development process substantially. The project still needs a human who can explain its decisions, reproduce the walkthrough, and evaluate whether its behavior is useful for a school. See the AI-use disclosure below for the tools and contribution boundaries.

**Human learning check:** the participant should review this section, replace it with their own understanding where appropriate, and be prepared to explain the validation, state transitions, conflict detection, authentication, and role permissions to judges.

## What's next

We would run a small, permission-based pilot using a school's existing class schedule, observe where teachers struggle to complete a handover, and simplify those fields. A pilot would measure incomplete handovers, preparation-task completion, and time spent resolving class-change questions before we claim an improvement.

Operational next steps include school-approved account provisioning, email recovery, and isolated demonstration sessions. Additional integrations and AI assistance would be considered after the core workflow is reliable and the school's data requirements are clear.

## Built with

React 19 · TypeScript · Vinext · Cloudflare Workers · Cloudflare D1 / SQLite · OpenAI Codex

`[CONFIRM: add the actual tested UI, validation, styling, and testing libraries from package.json; remove tools that were not used.]`

## AI-use disclosure

OpenAI Codex assisted substantially with architecture, implementation, interface copy, synthetic demo scenarios, testing, debugging, official-rule research, and submission materials. The human participant supplied the school problem and the required handover-first workflow. AI-generated code and copy require review, and the participant must be able to explain the final product. This is development assistance; no model-inference feature is claimed as part of the core product. Full disclosure: [AI_DISCLOSURE.md](AI_DISCLOSURE.md).

## Links and team

| Devpost field | Value to enter |
| --- | --- |
| Public demo | `[CONFIRM: published URL, checked in an unauthenticated browser]` |
| Source code | `[CONFIRM: publicly accessible GitHub repository URL]` |
| Demo video | `[CONFIRM: uploaded 2-minute walkthrough URL, if provided]` |
| Screenshots | Use the actual captures listed in [SCREENSHOT_PLAN.md](SCREENSHOT_PLAN.md). |
| Team members | `[CONFIRM: participant name and Devpost profile; add all actual teammates]` |
| Prior work / outside assets | `[CONFIRM: identify any pre-existing code or assets; do not assume “none”]` |
| Validation report | Link the released repository's TEST_REPORT.md. |

## Known limitations to carry into the final submission

- No school has been claimed as a pilot partner, and no outcome statistics have been measured.
- Password recovery uses a registration-issued recovery code. The prototype does not deliver reset emails.
- The shared demo uses synthetic records; data isolation and production account provisioning need evaluation before school adoption.
- `[CONFIRM: add any remaining incomplete, reduced-scope, unavailable, or only locally verified feature from TEST_REPORT.md.]`
- Public deployment, repository access, and final Devpost submission remain unconfirmed until their actual URLs and evidence are supplied.
