# Handover — AI and outside-resource disclosure

官方允許 AI，要求揭露並能解釋最终作品。[正式規則](https://csc-back-to-school.devpost.com/rules) 這份文件描述本次開發中可確認的 AI 協助；最後仍需由本人核對工具、理解內容並加入未列資源。

## Short version for Devpost

OpenAI Codex assisted substantially with architecture, implementation, interface copy, synthetic demonstration scenarios, testing, debugging, research of official hackathon requirements, and submission materials. The human participant supplied the school problem, feature requirements, and the central rule that a class change requires a complete handover. Parallel AI agents supported focused development, research, and review. AI-generated code and copy require review; the participant must be able to explain the final workflow, permissions, conflict checks, and implementation decisions. Development assistance is separate from a runtime AI feature: no model-inference capability is claimed for the core product.

## Detailed contribution record

| Area | AI contribution | Human responsibility / evidence |
| --- | --- | --- |
| Product scope | Converted the supplied requirements into an implementation plan and recorded tradeoffs. | Participant supplied the school problem and handover-first requirement; review DECISIONS.md. |
| Engineering | Generated and edited application code, backend workflow and authentication code, seed data, and tests. | Review the released code and explain how authentication, role permissions, validation, and state transitions work. |
| Interface and copy | Assisted with role-oriented screens, English / Traditional Chinese text, and form/error copy. | Try the actual roles and judge whether the language and flow fit a school. |
| Test and review work | Assisted with test cases, commands, debugging, and review. | Only TEST_REPORT.md and actual command/browser results determine what passed. AI statements are not independent validation. |
| Research | Read the official hackathon overview, rules, schedule, resources, and organizer updates; identified the deadline inconsistency. | Confirm eligibility and submission choices personally; recheck official pages before submitting. |
| Submission assets | Drafted this disclosure, Devpost copy, the demo script, and screenshot plan. | Edit statements to match the released product and the participant's own understanding. |

## Tools and assets

- **AI assistant:** OpenAI Codex. Add any other actual assistant used; do not list a product merely because it was mentioned in the brief.
- **Applied development/design skills:** `[CONFIRM: copy the actual skills used from DECISIONS.md; submission messaging used the brand skill.]`
- **Application stack:** React 19, TypeScript, Vinext, Cloudflare Workers, Cloudflare D1 / SQLite. Additional libraries and versions are documented in package.json and the lockfile.
- **Demonstration data:** synthetic school classes, teachers, students, lessons, and handover scenarios. Confirm the final seed contains no real student personal or sensitive data.
- **Prior assets:** `[CONFIRM: list any pre-hackathon source, starter project, templates, fonts, icons, datasets, or design material, including licenses and which parts were changed during the event.]`
- **Sponsor services:** `[CONFIRM: list only the tools actually used, if any; Cloudflare deployment does not imply Render Workflows usage.]`

## Understanding and review checklist

- [ ] The participant can explain why handover validation must occur in the backend.
- [ ] The participant can explain the class/teacher conflict checks and allowed status transitions.
- [ ] The participant can explain why student-visible information excludes teacher-only notes.
- [ ] The participant understands password hashing, sessions, teacher invitations, and recovery-code reset.
- [ ] The participant has reproduced the core role walkthrough and reviewed TEST_REPORT.md.
- [ ] The participant has corrected AI-generated claims that are not supported by the released app.
- [ ] All significant outside resources and pre-existing work have credits and applicable licenses.

**Current status:** human acceptance, participant understanding, production verification, and final publication must not be assumed from this disclosure. Update them only when the actual review and verification have happened.
