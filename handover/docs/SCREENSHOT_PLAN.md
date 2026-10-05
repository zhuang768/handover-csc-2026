# Handover — Screenshot plan

Target: seven real operating screenshots from the English interface. This is a capture plan, **not evidence that the screenshots have been produced**. Capture after the corresponding behavior is verified. Screenshots do not replace a complete workflow test. The actual file inventory is in [screenshots/README.md](screenshots/README.md).

Use one consistent synthetic scenario so class, subject, and request details agree between captures. Suggested desktop size: 1440×900; narrow viewport: 390×844. Crop only irrelevant browser chrome. Do not remove errors or alter data to fabricate success.

| # | Suggested filename | Role and screen | Required evidence | English caption |
| --- | --- | --- | --- | --- |
| 1 | `teacher-next-action.png` | Original teacher home or week timetable | This week's lessons, incomplete or unconfirmed requests, and the create-request action; the purpose should be clear within 30 seconds. | “A teacher sees which class changes need their next action.” |
| 2 | `required-handover.png` | Teacher request editor | One empty required field, visible missing-field feedback, and unavailable submission. | “A complete handover is required before a change can be submitted.” |
| 3 | `schedule-conflict.png` | Teacher selecting a target slot | A real conflict and the affected class or teacher; include available-slot suggestions if implemented and verified. | “Schedule conflicts are explained before a request moves forward.” |
| 4 | `receiving-teacher.png` | Receiving teacher's request detail | Progress, materials, and response action, using synthetic names. | “The receiving teacher reviews the lesson context before confirming.” |
| 5 | `student-mobile.png` | Student home or detail at a narrow viewport | Original and receiving teacher, new time and place, materials, and a saved preparation task; no private teacher notes. | “Students get the change and a preparation checklist for their class.” |
| 6 | `admin-history.png` | Admin overview and request detail | Search, status filters, timeline, and who acted when. | “The school office follows the same record from request to confirmation.” |
| 7 | `student-preparation.png` | English student preparation list at a narrow viewport | Readable English text and a clear next action. Show larger text only if verified. | “Students can read and complete their preparation list on a smaller screen.” |

## Cover choice

Use shot 2 or 5 for the cover, with the short line **Every class change needs a complete handover.** A decorative sign-in screen should not be the main evidence. If creating a separate composite cover, label it as a cover rather than an actual app screenshot.

## Capture steps

1. Prepare clean synthetic data and verify the signed-in role for each browser context. Separate tabs do not guarantee separate identities. Confirm the target before any shared demo reset.
2. Complete one real handover workflow and keep the scenario consistent.
3. Capture the seven scenes above. Omit unverified optional features.
4. Save actual captures under `docs/screenshots/`, with final dimensions, capture date, and tested version.
5. Order the uploads by workflow in Devpost and add the English captions.

## Image checks

- [ ] No `.env`, API keys, session tokens, recovery codes, or real passwords are visible.
- [ ] No real student personal, health, counseling, or special-needs information is visible.
- [ ] Every screen comes from the actual usable version and shows working actions.
- [ ] Desktop and narrow-viewport content is not clipped; buttons and feedback remain readable.
- [ ] Text, icons, and status agree, and changes are not indicated by color alone.
- [ ] Shot 3 shows a real blocking conflict; shot 5 shows a saved checked task.
- [ ] Images, video, submission copy, and test report correspond to the same released version.
- [ ] All visible text is English. Narrow desktop viewports are not physical-phone installation evidence.
