# R04 backend re-review readiness and read-only GitHub lookup

Date: 2026-10-04, Asia/Taipei. Cursor was implementing R04. No API, product suite, browser, or service was run against the moving tree, and no product file changed. Only one reviewer-owned top-level case with an established preservation contract was added; all assertions behind the original 84 counts were retained. This is a translated historical record.

## Gaps in the existing upgrade cases

- The complete legacy DB case (line 925) checked a valid real session and users/lessons/requests counts. It recorded table snapshot differences without requiring original row values to remain. Rebuilding or overwriting the demo timetable/handovers with equal counts could pass.
- The partial legacy DB case (line 948) compared every real registrant user/credential/session value and required complete seed/relations. It did not first edit a demo profile, so it could miss repair resetting demo names/other fields.
- The existing real-data-preserving demo reset case covered explicit admin reset; it could not replace initialization-upgrade checks for established teacher/student data.

Section 1 of the R04 prompt explicitly required preserving accounts, ordinary registrations, sessions, edited lessons/handovers, and relations. The added case had an existing requirement basis and introduced no feature.

## The single new regression

[independent-api.test.mts:979](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/.codex-review/independent-api.test.mts:979): `R04 review: legacy readiness preserves edited demo arrangements and established teacher/student relations`.

One top-level case contains two sequential phases, with no additional child counts:

1. **Complete legacy DB:** use actual APIs to edit a demo teacher profile and move/submit/accept a real demo lesson, retaining edited handover/private notes/supplement. A same-class student creates a todo/view using actual APIs. Negative controls prove the timetable changed, the request is demo-owned, and the todo/receipt exists. Convert to R02 markers and nullable tokens, then trigger readiness with a valid real session.
2. **Partial legacy DB:** use a separate fixture, edit a demo profile through the API, register a real teacher, then recreate the established R02 failure state of 3 classes/45 demo users/0 lessons/0 requests. Require complete timetable/demo relations while classes/users/sessions fingerprints remain unchanged, including the edited demo profile and real credential/session.

The complete phase requires **every established non-meta row to retain its original values**, with no duplicate classes/users/lessons/requests. This catches equal-count overwrites/rebuilds, restoration to base_*, reset handovers/profiles, or lost todos/views/timeline/audit. Additive completion markers and reasonable migration audit are allowed; preservation does not prohibit every new row. Failure messages do not print row values, credential hashes, or session tokens.

The partial phase originally has no lessons, so it cannot invent an already moved lesson. It uses R02-supported profile editing/real registration to represent edited data, preserving valid negative controls.

## Fixed R03 verification actually executed

To avoid the moving service, export a disposable isolated copy with **`git archive f3fa696115a86f98995686b6bb934b90492133ab:handover`**, verify app tree **`911adb7043d89b7487b12b9bb3d06876457699a5`**, then copy the reviewer suite/adapter/harness. Process CWD, service, shared/time, and all SQL migrations come from that fixed copy. No moving product module was imported. The temporary copy was cleaned up afterward without checkout, stash, or changes to the original workspace.

Command in the copy:

```sh
node --experimental-strip-types --test .codex-review/reviewer-harness.test.mts .codex-review/independent-api.test.mts
```

**Actual exit 1: 85 counts, 82 pass/3 fail/0 skip/0 cancelled.** API 83 (34 top-level), harness 2. All original 82 passed. The two legacy cases and the one preservation addition remained legitimately red with 409 `INVALID_STATE`. The new case's profile/move/handover/supplement/todo/view setup all succeeded; failure occurred in R03 readiness, not an invalid fixture or denied permission.

Because fixed R03 failed in the complete phase, the partial edited-profile phase had not executed. It required a stable R04 repair and actual rerun; no pass was claimed.

Reviewer static types also ran:

```sh
node handover/node_modules/typescript/bin/tsc --noEmit --module ESNext --moduleResolution Bundler --target ES2022 --allowImportingTsExtensions --skipLibCheck --typeRoots handover/node_modules/@types --types node .codex-review/independent-api.test.mts .codex-review/review-d1.mts handover/node_modules/@cloudflare/workers-types/index.d.ts
```

Exit 0. This checked reviewer types only, not the moving product or R04 acceptance.

## Focused order after Cursor handback

1. Record frozen product SHA and app/CI trees; verify clean state before/after. Withdraw the verdict and use a newly pinned version if behavior code changes.
2. Run the three legacy cases (925/948/979): complete and partial schools must work, established data must survive, and complete schools must not duplicate. Use records/relations for compatibility, without forcing legitimately transitioned samples back to initial states or blindly promoting every `seeded=1`.
3. Run all **85** counts, retaining fresh-empty fault/retry, 8 parallel startups, failed-CAS events, stale submit, all R01 regressions, roles/privacy/sessions/reset; do not run legacy cases alone.
4. Compare adapter `appliedMigrations` with every `.sql`, journal, and snapshot. Use actual R04 inventory if migrations change. All files load automatically; no manual skip of 0001/new guards.
5. Root separately uses isolated actual Worker/D1 fresh startup and genuine complete/partial legacy upgrade smoke: valid sessions, edited teacher arrangements/handovers, student todos/receipts, persistence. Record Node SQLite and Worker evidence separately, without labeling either as remote acceptance.

## GitHub/remote: queries only, no writes

Lookup time: approximately 2026-10-04 01:18:27, Asia/Taipei. Actual evidence at that time:

| Command | Exit/result |
| --- | --- |
| `gh api user --jq '{login:.login,owned_private_repos:.owned_private_repos,public_repos:.public_repos}'` | 0; authenticated as `zhuang768`, public repos 62; private count null, not interpreted as 0 |
| `gh repo view zhuang768/handover-csc-2026 --json nameWithOwner,url,visibility,isPrivate,defaultBranchRef,createdAt,pushedAt` | 1; GraphQL could not resolve the repository |
| `gh api -i repos/zhuang768/handover-csc-2026` | 1; HTTP **404 Not Found**; response scopes included `repo`/`workflow`; no access token printed |
| `gh repo list zhuang768 --limit 100 --json name,nameWithOwner,isPrivate --jq '.[] \| select(.name == "handover-csc-2026")'` | 0; no matching repository |
| `git remote -v` | 0; no output or configured remote |
| `git config --get-regexp '^remote\..*\.(url\|pushurl)$'` | 1; no matching remote config |
| `git branch --show-current` / `git branch -vv` | `handover`, then b3753d7; no upstream tracking |

Exact REST/GraphQL/list queries under the owner session found **no target `zhuang768/handover-csc-2026` repository at that time**. This agent did not create it, set origin, push, commit, deploy, or change accounts. Recheck read-only before release; that 404 and missing remote were not completed-upload evidence.
