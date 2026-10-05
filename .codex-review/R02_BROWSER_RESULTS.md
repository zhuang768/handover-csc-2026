# R02 independent browser and build recheck

Historical review, 2026-10-04 Asia/Taipei. Product `73d32c1ee1a5d764d0dcf8b755b60c0de6eb808a`; handoff HEAD `1f1fe77` was status-only with identical app tree. Product edits had stopped except generated tracked tsbuildinfo. Root used its own Cua tab at `http://127.0.0.1:5173/`, without controlling Cursor's testing browser or editing product.

## Commands and verified behavior

Product npm test passed 24/24, exit 0. Lint, formatting, types, and Worker/client build exited 0. Node 26 module.register deprecation was informational. Independent advanced API results remain in R02_API_RESULTS; 24 product tests did not constitute full acceptance.

Real student/original-teacher/admin demo sign-in and logout switched actual role data. Student detail hid reason/category/teacherNotes, with raw-payload protection separately tested by API review. A student's first preparation checkbox survived reload/reopening; root restored only its own checkbox afterward. The historical translated original-teacher empty form showed seven missing items and disabled send; source options had class/date/subject/period and initialized original arrangement. Applying the template used a real absolute same-site worksheet URL but send stayed disabled without covering teacher. Main button computed white `(255,255,255)` on forest green `(36,107,86)`, fixing R01 contrast. Admin Class 8A + Pending + Maya filters left the expected pending Science request.

## Confirmed historical failures

1. At the same real 1440x900 viewport, the translated shell was 608px, main 388px, content 324px, leaving about 864px blank. Heading/refresh wrapped. English restored shell 1440px/main 1220px. Login was also clamped. CSS `.handover-root :lang(zh)` imposed 38em on all inherited-language descendants. Limit prose only, never shell/main/form/buttons; verify actual content width at 390/768/1440 rather than hide overflow.
2. Next lesson showed Monday October 5 P1 Math/Maya but combined a Maya-to-Jonah calculator reminder from Friday October 9 P4. app `:842-850` independently selected first confirmed request and next lesson, then merged them `:883-889`. Match lessonId/requestId and public state, or show original arrangement; other changes need their own date/period card.
3. Timeline remained raw ISO + Seed + created/submitted/confirmed and admin risk sentences stayed English under the then-required translated locale. Map system codes/date formatting; names and user-written content may stay original. This was a historical bilingual requirement, now superseded by English-only scope.
4. Seed Practice worksheet still used `https://example.org/worksheet` (stable service `:570`), while a same-site worksheet existed. Fresh/reset/student materials needed real accessible assets. The translated subject-template button still inserted fixed English text; changing a subject label alone did not produce meaningful subject-specific/localized content.
5. Admin overview showed lessons 60/Pending 2/Declined 1/Ready 2 but omitted real `stats.weekly` change counts already supplied by backend.

## Viewport evidence limit

Root measured 1440x900. A requested 390x844 override left the old tab unchanged; a new temporary tab was 1280x720 and was closed. Root therefore verified only real 1440 in this round. Cursor's 390/768/1440 claims still needed real viewport evidence/reproducible project tests. Documented APIs were used; no internal browser modifications. Known backend failures remained, so no full multi-role/multi-size pass was fabricated. R03 would continue real flows, keyboard/reduced-motion, and screenshots.
