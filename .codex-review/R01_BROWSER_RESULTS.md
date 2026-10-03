# R01 independent browser and command evidence

Reviewed product tree at root HEAD `111f16a17381679aba20499807b9f6cd7b306cfc`, 2026-10-03 Asia/Taipei. Product code was not edited by reviewer.

## Commands actually rerun

- npm test: exit 0, 24 tests passed. These are API tests, not browser E2E.
- npm run lint: exit 0.
- npm run typecheck: exit 0.
- npm run format:check: exit 0.
- npm run build: exit 0, Vinext client/server output present.
- Production build launched through local Wrangler on port 8789, isolated `.codex-review/worker-state`. `node .codex-review/worker-smoke.mjs` passed anonymous rejection, student/teacher/admin demo real cookies, role-scoped workspace, logout replay. Counts: student20/1, teacher5/2, admin60/7 lessons/requests. Worker stopped after check. This does not establish deployed migrations or public acceptance.

## Actual browser findings

Codex in-app browser, separate tab/session from Cursor QA, localhost5173. CUA Playwright DOM and computed-style reads used.

1. **HAND-01 fails**: Original teacher → Handovers → New handover leaves all seven handover fields blank and covering teacher unset. `Send for confirmation` is enabled (`isEnabled()===true`). No live missing-fields list. The backend rejection does not satisfy the explicit UI gate requirement.
2. **UX-03 fails**: On mobile390, Overview `Open handover` computed text `rgb(18,32,51)` against `rgb(29,78,216)` background. CSS inherited text overrides white primary text, contrast below4.5:1. See frontend report for specificity and calculation.
3. **UX-05 fails**: Timetable ordinary Math lesson with no request ID is rendered as a button; click leaves DOM unchanged because handler only acts when requestId exists. Present it as noninteractive or offer meaningful detail/create flow.
4. **Student payload/UI classification gap confirmed**: Student → Open handover shows `Reason: School schedule sample`, and progress/plan/equipment in addition to student sections. Private teacher reason must be excluded server-side and in UI; exact private-marker regression is required. Do not infer all progress/equipment is sensitive; decide allowed student fields explicitly.
5. **UX-01 fails**: After switching to Traditional Chinese, timeline events remain `created`, `submitted`, `confirmed`. Seed/user content may remain in its authored language; system event names must use i18n. Full translated system errors/events still pending.
6. **Material fixture**: Sample worksheet is `https://example.org/worksheet`, and template code inserts an example.org fake material. Replace with a real accessible demo worksheet hosted with the app; verify link opens actual instructional content. No external worksheet availability claim was made here.

## Layout measurements only

New handover editor measured document scrollWidth equal viewport width at390,768,1440. No root horizontal overflow in that limited page state. This does NOT pass whole-role viewport QA, focus behavior, print, dark mode, accessible toggles, error paths or long content.

Captured desktop Traditional Chinese student detail screenshot through CUA. Student test made no request or todo mutations; only real demo login/logout and preferences in separate browser session.

## Deployment gate

db/schema.ts is empty; drizzle/meta/_journal.json entries empty while0000_init.sql exists; service calls ensureSchema runtimeDDL. Sites production requires real schema, generated migration metadata and no request-time DDL. Correct before publish, then prove fresh migration+seed and deployed flow. Root Git exists and branch is handover; no remote yet. Root/handover split must be handled deliberately for GitHub versus Sites source checkout.
