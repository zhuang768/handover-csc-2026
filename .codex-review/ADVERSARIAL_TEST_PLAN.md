# Independent adversarial tests to run after a stable Cursor round

These are planned checks, not passed tests. Use teacher A (original), B (recipient), C (unrelated), student S1 (same class), S2 (another class), admin, and a normally registered non-demo account R. Inspect both HTTP responses and final database state. Use production-like local Worker/D1 or the actual chosen equivalent, not only a mocked frontend.

1. Full teacher → recipient → student → admin flow, reload/relogin at every persistent step.
2. Remove each of seven required sections, whitespace-only values, no valid materials: direct submit rejects, remains Draft, no slot leaks.
3. Incomplete Draft saves; submitted content cannot be overwritten; append-only supplements preserve original/timestamps.
4. Decline requires comment; decline frees target reservation; edit/resubmit/confirm retains all historical events.
5. Independently test class and teacher conflict at both submit and acceptance. Test room conflict only if the implementation promises room exclusivity; do not silently expand the original scope.
6. Promise.all two source lessons claiming one class/teacher slot: at most one succeeds, no partial claims remain.
7. Promise.all two drafts for the same source lesson but different targets: at most one succeeds.
8. Change occupancy after Pending; recipient acceptance rechecks safely.
9. Simultaneous accept/cancel: state, timetable, reservations, audit and notifications stay consistent.
10. Cancel confirmed move: original date/period/room/teacher restored, new slot released. Cancel substitute restores original teacher.
11. If the original slot is newly occupied, cancellation must fail atomically or use an explicitly documented safe resolution; never overwrite another lesson or lose a course.
12. Every invalid state jump rejects with no side effect. Completion timing follows the defined product rule; confirm completed/cancelled cannot be replayed inconsistently.
13. Teacher C cannot read private unrelated records or mutate/submit/respond/supplement them. A cannot respond as B.
14. Student directly calls every teacher/admin API and tampers classId/teacherId/userId. Backend rejects or remains scoped; never download all school data for frontend filtering.
15. Put a unique private marker in teacherNotes and internal comments. Student list/detail/notifications/calendar/print/any public cards must not leak it in raw payloads. Consider supplements/timeline/comments separately, not just handover.teacherNotes.
16. Reuse logged-out, expired, modified, disabled-account and pre-password-reset cookies: all fail. Logout removes server authorization, not just client storage.
17. Invalid/missing teacher invite and admin signup fail; real recovery proof rotates on reset and invalidates all old sessions.
18. Cross-origin writes, huge/malformed JSON, invalid dates/periods, javascript:/data: links, repeated auth attempts: safe errors/no XSS/no bypass. Throttling persists across Worker instances when required by architecture.
19. Register R; create profile/request/checklist data related to demo classes/teachers/lessons; demo reset must preserve R and all its meaningful records/relations. Check foreign-key cascade and orphan risks, not just account survival. Fresh demo sessions and all three roles work afterwards.
20. Two students' todo/view/read states are isolated. Repeated views do not inflate unique counts. No API permits arbitrary audit update/delete; successful operations have accurate logs.
21. Change conflict form inputs rapidly and delay the older response: stale results cannot overwrite newest validation, final submit always rechecks server-side.
22. Force 401/403/409/500/offline: no false success, no permanently busy button, recoverable input preserved.
23. All roles and primary flows at 390×844, 768×1024, 1440×900; detect overflow, clipped controls, scrollable modal, keyboard-only access/focus return, English/Traditional Chinese errors and aria labels.
24. Root/list/detail initial load and repeated hydration produce no console/page errors. Fresh DB migrations and existing DB upgrade both work.
25. Final public environment three-role workflow and GitHub remote SHA/CI match the exact tested source. Expected URL, localhost, seed-only demo or unexecuted test report is not acceptance.

Record actor, request ID, command, status/response, DB before/after, source snapshot and actual test time. Reject guessed findings; verify and then send focused repair prompts. Keep any test-only writes isolated from real user data and respect UI restrictions when testing account credentials.
