# Handoff

Branch `handover`. Round 2 is ready for Codex review. Do not treat this file as a pass.

## What changed

- Wrong HTTP methods on action routes return 405 and do not write. Accept, decline, cancel, and complete run as one D1 batch. A lost race does not move the lesson or write a timeline row.
- Accept rechecks the slot. Cancel restores that request’s `original_*` snapshot only when the slot is free. A unique teacher slot index backs the write.
- Student JSON omits reason, reason category, teacher notes, supplements, and timeline comments.
- Draft save and submit cannot leave an incomplete Pending handover.
- Request-time DDL was removed. Schema is `db/schema.ts` plus `drizzle/0000_init.sql` and `drizzle/meta`.
- The test `batch` helper no longer awaits between statements.
- The editor blocks send until the seven fields and a fresh conflict check pass, and it keeps the draft id if submit fails.
- Opening a handover loads `GET /api/requests/:id`.
- Visual system: warm paper and green handbook. See `DESIGN_NOTES.md` and `CREDITS.md`.

## Skills actually read

- `security-best-practices` and its React frontend spec: no new HTML sinks; cookies stay HttpOnly; origin and method checks stay on mutations.
- `workers-best-practices`: D1 writes that must succeed together use `db.batch`; schema is a migration, not DDL on the request.
- `design-system`: primitive, semantic, and component tokens in `handover.css`.
- `redesign-existing-projects`: restyle the existing workspace. Landing-page patterns, stock photos, and fake stats were not applied.
- `ui-styling`: button text, focus, and checkbox width.
- `vercel-react-best-practices`: conflict checks stay debounced; no new client waterfall was added.
- `ai-debt-detector`: calendar download errors are shown; impact load failure is not an infinite spinner; a failed submit keeps the draft id.

## Checks run on this machine

From `handover/`:

- `npm test` — exit 0, 24 passed.
- `npm run lint` — exit 0.
- `npm run format:check` — exit 0.
- `npm run typecheck` — exit 0 (`tsc --noEmit` during the same session).
- `npm run build` — exit 0.

From the repo root:

- `node --experimental-strip-types --test .codex-review/reviewer-harness.test.mts .codex-review/independent-api.test.mts` — exit 0, 73 passed.

Browser notes are filled in `TEST_REPORT.md` after the local session. Public deploy and GitHub push were not done.

## Still human-only

Eligibility, names, guardian consent, Devpost terms, awards, the demo video, and the final Devpost submit. License for the product itself is not chosen; vendor OFL/ISC/MIT notices are not a product license.
