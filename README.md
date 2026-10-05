# CSC Back-to-School Hackathon

The project is [Handover](handover/README.md), an English-language school timetable and handover app.

- [Live app](https://handover-campus-2026.ziz81503.workers.dev/)
- [Public source](https://github.com/zhuang768/handover-csc-2026)
- [Workflow runs](https://github.com/zhuang768/handover-csc-2026/actions)
- [Setup and demo guide](handover/README.md)
- [Submission checklist](handover/SUBMISSION_CHECKLIST.md)
- [Devpost draft](handover/docs/DEVPOST_SUBMISSION.md)
- [Test report](handover/TEST_REPORT.md)
- [AI disclosure](handover/docs/AI_DISCLOSURE.md)

The Cloudflare Workers address is the primary live app. It uses a separate Cloudflare D1 database; no data was moved from the [original Sites app](https://handover-campus-2026.ziz81503.chatgpt.site/), which remains available with its existing data. Sign in again on the new address: sessions and accounts from the original origin do not transfer. Historical Sites verification remains recorded in the test report and is not evidence of a new Cloudflare production test.

The current Cloudflare app passed a real four-session handover workflow, student privacy and preparation persistence, timetable restoration, logout replay rejection, HTTPS resource checks, and a controlled Chromium offline reload. See [the Cloudflare test record](handover/TEST_REPORT.md#cloudflare-deployment-2026-10-05). Physical-phone installation remains unverified.

The [translated original hackathon notes](handover/docs/ORIGINAL_HACKATHON_NOTES.md) preserve the personal planning notes from the start of the competition. They are historical context, not participant eligibility verification or a final submission.

The participant must personally confirm eligibility, team details, terms, and prize choices, and submit the project on Devpost. Publishing this repository or website does not submit the competition entry.
