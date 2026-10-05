# R04 fixed-candidate documentation, CI, migration, and screenshot review

Historical focused read-only review, 2026-10-04 Asia/Taipei. No product edits, server, GUI, install, build, push, or deploy were performed by this reviewer.

R03 schema/metadata/local migration/package code was unchanged and its evidence could be reused. R04 repaired README production-migration wording, historical verification sections, app ignore, and duplicate screenshots. Two remaining copy/media issues: screenshot 07 was still loading rather than teacher home, and iOS Open as Web App steps were out of order. These were not database/deployment failures; root's separate runtime evidence determined release readiness.

## Fixed source and executed scope

Product `6b7b7cd734e9af06785d7f854d75dc8f3a160c6f`; initial status-only HEAD `7e76a4a1cdccec8b212a6ad7e0b674e425dbdfb8`; app tree `ebbe56dda33a1547d67f17367bc067fe7a6eb2ab`. Initial product/CI status was clean and trees matched. The reviewer read fixed git show/diff, PNG IHDR/SHA-256, and images. Concurrent root E2E rewrote working copies 02/08, so those images were exported from fixed blobs to an owned temporary directory for inspection. Final working diff contained those root-generated image differences; this report did not call the moving worktree clean.

Initial status/rev-parse passed. Diff against R03 across drizzle, schema, hosting, build, scripts, and lockfile exited 0 (unchanged), avoiding redundant broad install/build/migrations. Fixed-image inspection passed: eight unique PNGs, widths 05/06/08 truly 390, seven healthy app views, one mislabeled loading view. An initial assertion comparing working PNG bytes to fixed blobs failed because concurrent E2E changed 02/08; fixed-only recheck passed. That was an evidence-source limit, not a product failure.

## Reused migration/package evidence

Both rounds had drizzle tree `6e87cfb7aae789a78e0215912abd77352c4bdec4` and schema blob `b612f36b10c50389d466af7b9b56b86e800e09d6`. Unchanged 0000/0001, journal/two snapshots, 14-table schema, and migration scripts reuse R03_DOCS_MIGRATION_RESULTS: fresh apply, old SQL upgrade, preservation, db:generate NOOP, D1 prepared chunks, and package metadata. R04 changed service legacy-seed compatibility; unchanged SQL cannot prove that service repair.

Hosting/build/lockfile retained the same Site `appgprj_6ac11cc258608191ba6f05fcd6e031fb`, logical DB, and outside-parent exact-tree checkout. SW and assets.html_handling none changed, requiring an R04 build/archive rather than R03 tar. App-local *.tsbuildinfo ignore fixed the external-checkout boundary; helper staging must still yield the exact reviewed tree. Reviewer made no release-only patch.

## Documentation and CI

README correctly limits db:migrate to --local, explaining production SQL/metadata through Site portable publication without remote DB IDs. Clean-machine Chromium installation is documented. CI keeps Node 22, handover directory/lockfile, format/lint/types/unit/browser install/dev and test:e2e:built; that script includes build and has no continue-on-error.

TEST_REPORT separates Rounds 1-4 and historical limits; old 82-pass evidence is not the newest suite. Cursor's 85 independent/26 unit/eight dev/one built/28 SW claims were author reports, not reviewer runs. Root was independently running commands/runtime.

The built spec genuinely waits for a controller, uses context.setOffline, reloads, checks historical bilingual public fallback/private cache exclusion, and rejects/refrains from replaying offline profile edits; it replaces R03 synthetic events. However, the then-spec only logged `/offline.html` status/Location rather than asserting direct 200. Root needed an actual Worker probe. Docs honestly retained physical-phone/public HTTPS/two-version gaps until separate evidence. Desktop Chromium does not prove phone installation.

AI/Devpost disclosed Codex and Cursor; unspecified product license versus vendor notices remained explicit and was not itself a technical GitHub blocker. Devpost draft still needed real URLs/video/names/release evidence. GitHub/site authorization did not authorize final Devpost submission or terms.

## Fixed historical screenshots

| Historical filename | Dimensions | Actual content |
| --- | --- | --- |
| 01-login-zh-1440.png | 1440x900 | Healthy translated sign-in |
| 02-student-next-lesson.png | 1440x1003 | Student home/next lesson |
| 03-teacher-editor.png | 1280x2486 | Filled teacher template; conflict check available, prior server error gone |
| 04-admin-zh-1440.png | 1440x900 | Translated admin overview replacing profile-only shot |
| 05-student-390.png | 390x1336 | Student mobile, install collapsed, one bottom navigation |
| 06-install-guide-390.png | 390x1604 | Expanded install guide; distinct bytes from 05 |
| 07-teacher-768.png | 768x1024 | English sign-in/loading, not claimed teacher home |
| 08-detail-390.png | 390x2546 | Teacher detail; synthetic teacher note belongs to authorized teacher view |

All eight hashes differed; seven healthy views already met the five-to-eight minimum. Screenshot 07 hash `021f82ab44f100b23a8a08bfaeead20001de4036d27e3feb31c7596f110fcd6b`. Re-shoot stable teacher home or correct its label/omit it. These 390 widths differed from R03's 392. Historical filenames do not describe current English-only assets.

## Installation copy

Historical i18n `:579/:639` told users to open the icon and then choose Open as Web App. Correct Apple order: Safari Share -> Add to Home Screen -> enable Open as Web App on the add screen when available -> Add -> open the icon. Update both then-supported locales; no new services/PWA expansion required. [Apple guide](https://support.apple.com/en-au/guide/iphone/iphea86e5236/ios). Reviewer read the source only, without a physical install or external writes.

## Root's separate subsequent execution

During report preparation root reported 26 unit/eight dev/one built passing, direct built `/offline.html` 200/no 307, actual controlled offline fallback, and failed offline save without replay. Root also verified real R03-to-R04 waiting-worker update: dirty profile disabled update, restored field enabled it, clicking waited for new controller/full reload, retained home/session, and removed banner. This superseded the project's older no-two-version evidence limit but did not become this reviewer's own execution. Public HTTPS/physical phones still remained unverified at that snapshot.
