# R05 independent backend source review

Historical focused read-only review, 2026-10-04 Asia/Taipei. The reviewer read service/API-test diffs without edits, shared moving tests, new suites/globs, or external service operations.

Result: passed after the first frozen source's existing-lesson overwrite was locally repaired. Replacement blobs stayed identical before/after rereads. No new concrete source defect remained. Runtime, historical upgrade, and publication rely on root's separate execution.

## First frozen source

Base `6b7b7cd734e9af06785d7f854d75dc8f3a160c6f`; service `a80f03a850e4c1a081b65ebf700b8f5876ea92a4`; tests `15ed4055ac5928d70467bb48d2434a8d7b3032b4`. Backend released source at 2026-10-03 18:20:32 UTC. Initial hash-object matched both. The reviewer read the complete two-file diff. Author-reported 26 API/85 independent plus format/lint/types were not reviewer executions; three genuine historical probes were reserved for root after pinning and separate from 85 counts.

## Reviewed repairs

1. schoolReady requires seed_complete=1 and seed_revision=2. An old R04 completion marker cannot skip a one-lesson partial DB. Repair and both markers share one D1 batch; failure cannot leave only the new marker.
2. Immutable dates in original demo lesson IDs determine original Monday using earliest valid seed date, rather than a legally moved current date. Default Monday is only for zero lessons.
3. Classes/users fill missing rows only. Lesson WHERE NOT EXISTS(id)/ON CONFLICT(id) DO NOTHING preserves existing rows and does not swallow teacher-slot uniqueness faults as generic OR IGNORE could.
4. Existing sample request IDs are skipped entirely, preventing lesson/timeline/notification/lock replay. Concurrent post-read insertion is protected by NOT EXISTS/ID conflict.
5. Each repair creates a unique token stored on newly inserted sample requests. Timeline, notifications, pending locks, and confirmed/completed lesson effects require the same request ID/token; a losing batch cannot apply winner effects. This alone does not establish lesson-preservation safety.
6. Stub repair is restricted to seven known demo IDs, is_demo=1, default title/URL, and exactly the original two material keys. Only URL changes; handover_json CAS prevents concurrent overwrite. Ordinary same-URL records, edited titles, and additional metadata survive.
7. Product regressions cover partial rollback/parallel repair/markers/accounts/sessions and exact demo stub/ordinary/edited materials/idempotency. Injected fixtures are not falsely called genuine R02 service faults.

## First finding, then repaired

First service `:905` updated teacher/date/period/room after a new missing Confirmed/Completed sample won insertion. WHERE checked lesson ID/token only, not whether the lesson was newly inserted or still matched immutable template.

Concrete path: genuine R02 sequential seed could stop after Class 7A Friday P4 Math but before samples. Old seeded marker allowed normal use. A legitimate handover could edit that existing lesson while demo-request-confirmed remained absent. Although R05 lesson INSERT preserved existing IDs, later winning sample effects could restore template room such as A-201, violating partial-upgrade preservation.

This was a source trace, not this reviewer's runtime reproduction. Existing tests preserved earliest Monday P1 rather than the sample's lesson, so green tests did not exclude the branch. Root accepted the finding and authorized a focused backend repair; reviewer added no release gate or source changes.

## Replacement frozen source

Service `145faf7f27e82e44f2e56ea44e4ca33993c47932`; tests `a43383679244dae8ea2171f682e3e486695d8b13`. Three hash-object checks matched before/after. Concurrent frontend changes were outside this two-file freeze.

Service `:758` reads existing demo lessons; `:836` compares teacher/date/period/room to immutable seed. Changed lessons receive missing samples as inactive Cancelled, with original/target snapshots from current arrangement. Status branching prevents pending locks/notifications or confirmed/completed updates, while restoring full lesson inventory/missing IDs. Existing request IDs still skip all repair replay.

The expanded product case uses a 20-lesson partial fixture and missing known confirmed sample, then real move/submit/accept/Completed/supplement APIs. Negative controls assert changed date/period. Upgrade preserves every lesson, established request, timeline/supplement/notification; the new sample is Cancelled/current snapshot with no active lock or submitted/confirmed/completed event. It remains a product fixture, distinct from genuine historical R02 probes.

Normal routes at `:2441` await seedIfEmpty before mutation. Losing repair insertion/effects retain token gating; no speculative gate for unspecified direct DB writes was introduced.

Root separately reported 33 product tests, formatting/lint/types/build, 85 independent counts (zero skips), nine dev/six built tests, offline direct 200/no Location, and a four-session lifecycle/privacy/todo/restore/logout Worker preflight passing. These were not reviewer runs. Genuine historical probes waited for root's fixed commit; public HTTPS/GitHub CI/physical phones remained separate. No finding remained open, so root could integrate delivery docs and commit.
