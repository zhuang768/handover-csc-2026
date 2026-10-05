# Handover — AI and outside-resource disclosure

The organizers allow AI use, require disclosure, and expect the participant to explain the final project. See the [official rules](https://csc-back-to-school.devpost.com/rules). This document records confirmed AI assistance during development. The participant must verify the tools, understand the work, and add any unlisted resources.

## Short version for Devpost

OpenAI Codex and Cursor assisted with architecture, implementation, interface copy, synthetic demonstration scenarios, testing, debugging, research of official hackathon requirements, and submission materials. The human participant supplied the school problem, feature requirements, and the central rule that a class change requires a complete handover. Parallel AI agents supported focused development, research, and review. AI-generated code and copy require review; the participant must be able to explain the final workflow, permissions, conflict checks, and implementation decisions. Development assistance is separate from a runtime AI feature: no model-inference capability is claimed for the core product.

## Detailed contribution record

| Area | AI contribution | Human responsibility / evidence |
| --- | --- | --- |
| Product scope | Converted the supplied requirements into an implementation plan and recorded tradeoffs. | Participant supplied the school problem and handover-first requirement; review DECISIONS.md. |
| Engineering | Generated and edited application code, backend workflow and authentication code, seed data, and tests. | Review the released code and explain how authentication, role permissions, validation, and state transitions work. |
| Interface and copy | Assisted with role-oriented screens, interface text, form/error copy, and the English-only update. | Try the actual roles and judge whether the English copy and flow fit a school. |
| Test and review work | Assisted with test cases, commands, debugging, and review. | Only TEST_REPORT.md and actual command/browser results determine what passed. AI statements are not independent validation. |
| Research | Read the official hackathon overview, rules, schedule, resources, and organizer updates; identified the deadline inconsistency. | Confirm eligibility and submission choices personally; recheck official pages before submitting. |
| Submission assets | Drafted this disclosure, Devpost copy, the demo script, and screenshot plan. | Edit statements to match the released product and the participant's own understanding. |

## Tools and assets

- **AI assistants:** OpenAI Codex and Cursor. Model names are not guessed beyond what each tool reports in its own session.
- **Applied skills this round:** security-best-practices (React frontend notes), workers-best-practices (D1 batch, no request-time DDL), design-system tokens, redesign-existing-projects (dashboard, not a landing page), ui-styling (contrast and focus), vercel-react-best-practices (no extra waterfalls), ai-debt-detector (failed effects and silent calendar errors).
- **Application stack:** React 19, TypeScript, Vinext, Cloudflare Workers, Cloudflare D1 / SQLite. Additional libraries and versions are documented in package.json and the lockfile.
- **Demonstration data:** synthetic school classes, teachers, students, lessons, and handover scenarios. Confirm the final seed contains no real student personal or sensitive data.
- **Prior assets:** Vinext / Cloudflare Sites starter already in this folder. The English-only app uses Manrope (OFL). Earlier versions used a Noto Sans TC subset, removed in the English-only update. Icons: lucide-react (ISC, with Feather MIT portions). See `CREDITS.md`. No stock photos.
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
