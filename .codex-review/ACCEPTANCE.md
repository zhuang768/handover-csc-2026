# Handover independent acceptance baseline

Source: user's Handover requirements and the complete Cursor prompt in this chat. This file records acceptance criteria, not implementation progress. Created 2026-10-03 Asia/Taipei.

## Ownership and evidence

Cursor implements the product. Codex independently reviews and tests stable completed rounds, then sends concrete repair prompts to the same Cursor chat. Do not edit product files while Cursor is working. Snapshot Git status, HEAD (when available), and file state at each round; rerun affected verification when the source changes. Every finding needs location, actual behavior, expected behavior, reproduction, impact, and a verifiable completion criterion. No claimed zero-bug guarantee. Completion means no known unresolved defects within the exercised scope and transparent limitations.

## P0 release gates

| ID | Requirement | Independent evidence |
| --- | --- | --- |
| AUTH-01 | Email/password registration, login, logout, persisted sessions, signed-out redirect | UI and direct API, logout/session replay |
| AUTH-02 | Student class required, teacher subject + backend invitation required, admin self-registration prohibited | Missing/invalid/forged roles rejected server-side |
| AUTH-03 | Usable password reset, proof of account ownership, session revocation; recovery codes high entropy/hashed/rotated if no email provider | Register → obtain recovery proof → reset → old password/session/proof fail → new login succeeds |
| AUTH-04 | Profile updates persist; request payload cannot change protected identity/role | Reload + forged PATCH |
| AUTH-05 | Three one-click demo roles issue real server sessions; second receiving teacher accessible | Cookie persistence and actual role-scoped API |
| ACL-01 | Students see own class only and own task progress | Other-class IDs/query tampering, forged userId, direct endpoints |
| ACL-02 | Student cannot receive teacher private notes, including list/detail/supplements/public cards/errors | Inspect network response body for private seed marker |
| ACL-03 | Teachers edit own lessons/handovers only; only assigned teacher responds | Original/recipient/third teacher account tests |
| ACL-04 | Admin-only overview/users/audit/reset; self-disable blocked | Every endpoint tested using student and teacher |
| SEC-01 | Password hashing, random server sessions, secure production cookie, parameterized DB access, no tracked secrets | Code + runtime headers + tracked-file scan |
| SEC-02 | Mutation origin/CSRF defense, bounded inputs, safe materials URLs, sensible auth throttling | Cross-origin, oversized, malformed and javascript: payloads |
| DATA-01 | Durable relational data and reconstructible schema/migrations/seed | Fresh database setup plus server restart/relogin |
| DATA-02 | 3 classes, 8 teachers, dozens of students; current/next school week; multiple request states | DB/API counts and role demos |
| SCHED-01 | Correct role-scoped weekly timetable; admin class/teacher selectors | Three role UI/API comparisons |
| SCHED-02 | Changed cells have icon/text/color and working details | UI interaction and student-safe detail |
| SCHED-03 | Actual dates/timezone, weekend/empty states, week changes | Boundary dates and empty periods |
| REQ-01 | Real move and substitute workflows, source/date/period/class, reason fields | Save → submit → respond → timetable |
| REQ-02 | Live class/teacher collision detection and useful available slots | Both collision types, backend bypass attempt |
| REQ-03 | Duplicate and concurrent submissions cannot claim one slot twice | Parallel requests against real SQL constraints |
| HAND-01 | Seven required handover sections plus multiple materials | UI missing-fields states and bypassed POST rejection |
| HAND-02 | Incomplete Draft saves; Draft/Declined edits; submitted original locked | State-dependent PATCH tests |
| HAND-03 | Append-only supplements with author/timestamp, privacy classification | Submission unchanged after supplement |
| STATE-01 | Legal Draft/Pending/Confirmed/Declined/Completed/Cancelled transitions | State matrix and forged transition tests |
| STATE-02 | Assigned teacher accept/decline, required decline comment; author revision/resubmission | Full negative/recovery flow |
| STATE-03 | Confirmation updates schedule; cancellation releases occupancy/restores correctly | Read timetable before/after, both move/substitute |
| STATE-04 | Timeline accurately records every action, actor and timestamp | Compare audit/state updates with UI |
| STUD-01 | Today/This Week, changed teacher/time/place, materials/assessment/reminders | Correct class and published-status content |
| STUD-02 | Personal preparation checklist persists and cannot edit another student's progress | Reload + two students + forged key/owner |
| NOTIF-01 | Real pending/accepted/declined/student-change events | Trigger actions rather than inspect only seed |
| NOTIF-02 | Unread/read states persist and links reach correct records | Single/all read and click navigation |
| NOTIF-03 | Day-before reminder with duplicate prevention and documented trigger | Controlled dates; repeated calls; no false push claim |
| ADMIN-01 | School list with date/class/teacher/status/search and accurate statistics | Known fixture counts and each filter |
| ADMIN-02 | Accurate actionable risk list; user management | Trigger pending/collision risks, user enable/disable |
| ADMIN-03 | Demo reset only demo data, preserves actual registrations; demos usable after reset | Register non-demo → reset → reload/login and workflow |
| UX-01 | English default, full Traditional Chinese toggle and safe seed content | Route/form/error/status strings; DOM lang |
| UX-02 | Mobile 390, tablet 768, desktop 1440; no page overflow/clipped controls | Real browser screenshots and bounding checks |
| UX-03 | Keyboard access, labels, focus/focus return, contrast, usable text enlargement | Tab/Enter/Escape and forms/modal manual check |
| UX-04 | Loading/empty/error/success, preserved unsaved input on recoverable failure | API failure and empty-data fixtures |
| UX-05 | Every displayed control works; no fake role switch/mock authoritative state | UI actions traced to backend and saved data |
| CHECK-01 | Formatting/lint/types/core/API/E2E/build pass; ≥10 meaningful core cases | Independent command exit codes and test results |
| CHECK-02 | CI agrees with local commands; no disabled checks/failing tests hidden | Workflow and command inspection |
| WEB-01 | Public URL works anonymously through own app sign-in and real demo flows | Deployed browser/API full-role acceptance |
| WEB-02 | Production auth/cookies/DB persistence/migrations work | Production login/reload/logout/API isolation |
| GIT-01 | Correct GitHub repo/branch uploaded; final tested source equals pushed commit; no secrets | Remote SHA/tree, GitHub link/access, CI |
| DOC-01 | README/DECISIONS/SUBMISSION_CHECKLIST/TEST_REPORT/HANDOFF accurate | Match claims to evidence and links |
| DOC-02 | English Devpost copy, ≤3-minute script, 5–8 actual screenshot plan, honest AI/asset disclosure | Files, runtime screenshots, duration and fact checks |
| RULE-01 | Official requirements/deadline/eligibility/AI disclosure checked; no submission/terms accepted on user's behalf | Official-source citations and outstanding human checklist |

## P1 after P0 evidence

Availability/subject-based candidates; scoped ICS download; subject handover templates; admin immutable audit; student viewed/prepared receipts; dark mode and print. Every implemented or advertised feature must be tested. Prioritization follows original brief: optional work may be reduced for deadline, P0 may not be silently reduced.

## P2 after P0

Select 2–3 feasible educational/social-good features, preferably accessible student mode and truthful aggregate learning-continuity analysis. Any QR/parent public card must use high-entropy revocable token and student-safe data. Any AI feature must make real backend model calls, protect secrets/private data, require teacher approval, and degrade safely; deterministic templates must not be called AI.

## Completion and external actions

User expressly authorized coordinating this Cursor chat and GitHub upload. Public deployment is in the original task; credentials/legal agreements/payment/new sensitive access must follow applicable instructions. Never push unreviewed changes, leak secrets, force-push, reset/stash unrelated work, delete actual registrations, or click Devpost final submission. Only the human confirms age/eligibility/guardian consent and final entry.

Final delivery includes public URL, GitHub/PR, real demo instructions, independent report and remaining human actions. Notify meaningful findings/failure/action required/completion; keep unchanged waiting state quiet.
