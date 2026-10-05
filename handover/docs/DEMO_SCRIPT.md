# Handover — English demo script

Recording target: **120 seconds**, within the requested three-minute maximum and the [organizers' encouraged 1–2 minutes](https://csc-back-to-school.devpost.com/). A video is optional; the organizers do not require a three-minute recording.

Status: **recording draft, not a completed video**. Run the operations on the actual public English-only release before recording. Do not edit incomplete or unverified screens to look successful. Use TEST_REPORT.md to identify the tested version and scope.

## Before recording

1. Prepare clean synthetic demo data and confirm all three role types are available. If using admin demo reset, confirm the target environment and the action before resetting shared data.
2. Prepare four separate browser profiles or private contexts: original teacher, receiving teacher, student, and administrator. Ordinary tabs usually share cookies and do not preserve separate identities.
3. Choose an available lesson that has **not been submitted**, and verify that the substitute is free at that time.
4. Use a synthetic example: mathematics Unit 4, workbook pages 32–34, bring the workbook, and submit the worksheet. Do not include real student personal data.
5. Omit unverified optional features. Shot 7 shows the student preparation list at a narrow viewport; it does not demonstrate a physical-phone install.
6. Record primarily at 1920×1080; use a roughly 390px-wide browser viewport for the responsive student shot.
7. Long fields may be prepared in advance, but actually click submit, accept, and the preparation checkbox. Retain the loading and resulting states.

## Narration and storyboard

The narration is approximately 240–250 words, or about 120–125 words per minute. Shot timing includes operations and pauses; do not read every field aloud.

| Time | Seconds | Screen and action | Exact English narration |
| --- | ---: | --- | --- |
| 0:00–0:14 | 14 | Introduce the timetable change and product name. Point to materials and assignment information. | “A teacher is absent. Students hear, ‘Tomorrow, study on your own.’ But what should they bring? What happens to the quiz? And where should the next teacher begin?” |
| 0:14–0:27 | 13 | Use demo teacher sign-in. Open a new request, leave a required field empty, and show the missing-field feedback and disabled submission. | “Handover carries the lesson through a class change. Its rule is simple: no complete handover, no submission. Here, missing lesson context keeps the request from moving forward.” |
| 0:27–0:52 | 25 | Choose a lesson and substitute. Complete progress, plan, materials, assessment, room needs, and reminders. Submit and show Pending. Include a real, verified conflict message if time permits. | “I choose the class and a substitute, then explain our progress, the suggested lesson, materials, assignments, and reminders. Teacher notes stay separate from student information. The schedule is checked for conflicts. With the required details complete, I submit one record that everyone can follow.” |
| 0:52–1:08 | 16 | In the receiving teacher's separate context, open the pending request, review the handover, accept, and show Confirmed and the timeline. | “The receiving teacher opens the handover and accepts it. If the plan needs work, they can decline with a reason. The original teacher can revise and resubmit. Each transition remains visible in the history.” |
| 1:08–1:28 | 20 | In the student context, open the same change from Today or This Week, check a preparation task, and reload to show persistence. | “The student now sees the class change and a concrete preparation list: bring the workbook, submit the worksheet, and review the next unit. I check a task and reload. My progress is saved, and I only see information for my class.” |
| 1:28–1:43 | 15 | In the admin context, find the request, filter its status, and open the complete timeline. Show statistics only if verified. | “The school office can find the same request, filter its status, and see who acted and when. It becomes a shared operational record instead of another message to chase.” |
| 1:43–1:52 | 9 | Show the responsive English student screen at a narrow viewport with the usable preparation list. | “On a smaller screen, students still see the lesson, materials, and preparation list, with a clear next action before class.” |
| 1:52–2:00 | 8 | Close with the product name and real public URL. Include the AI-assistance disclosure. | “Our next step is a school pilot. Handover makes every class change a handover, so learning can continue.” |

## Optional replacement shot

Do not describe AI-generated handovers, QR cards, or parent links unless the released feature is verified. If larger-text or high-contrast mode has been verified, replace the 1:43–1:52 shot with the following nine-second shot while keeping the total at 120 seconds:

Screen: enable larger text on the student page and show that the complete preparation list remains readable and usable.

> “Larger text makes the preparation list easier to read. Accessibility supports the same lesson, without asking students to find a different workflow.”

A verified admin impact chart is another option. Label it **synthetic demo data** and do not present it as measured school outcomes.

## Captions, closing, and final checks

- Use English narration, captions, and interface text throughout.
- Describe the opening scenario without claiming interviews or a school pilot.
- Closing small print may say: **Built with AI assistance. See project disclosure. Synthetic demo data.**
- Use only real, shareable demo and repository URLs and confirmed participant names.
- [ ] The recording actually shows that an incomplete handover cannot be submitted.
- [ ] The receiving teacher sees the same submitted request, not a different seeded example.
- [ ] After acceptance, the student and admin show the same record.
- [ ] The student's checked preparation task remains after reload.
- [ ] The finished video is no longer than 2:00; remove setup waits, profile switching, and lengthy typing.
- [ ] Every narration claim matches the public English-only release and its test report.
- [ ] The shared video plays without requiring login.
