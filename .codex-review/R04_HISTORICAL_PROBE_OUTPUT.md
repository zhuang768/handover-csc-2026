# R04 executed genuine historical-upgrade probe output

Candidate: `6b7b7cd734e9af06785d7f854d75dc8f3a160c6f`; actual HEAD `7e76a4a1cdccec8b212a6ad7e0b674e425dbdfb8`; app tree `ebbe56dda33a1547d67f17367bc067fe7a6eb2ab`.

This translated historical record preserves actual diagnostics/counts from the stdin Node probe executed that round; it is not a new run of the subsequently saved script. Original command: `node --experimental-strip-types --input-type=module <<'NODE'`, using `node:test`, genuine R02 service/0000, a synchronous transactional SQLite D1 adapter, actual current 0001/R04 handler. Exit **1**, **3 tests: 1 pass/2 fail/0 skip/0 cancelled**, duration **140.757875 ms**.

## Complete legacy DB + ordinary account/custom URL: FAIL

An ordinary teacher registered through actual R02 APIs, received a valid own lesson, and created a Draft through the API. Its custom material deliberately used the same external URL with a different custom title, `is_demo=0`.

```json
{"ordinarySession":200,"counts":{"classes":3,"users":46,"lessons":121,"requests":8},"customURLPreserved":true,"knownSeedMaterials":[{"title":"Practice worksheet","url":"https://example.org/worksheet"}],"remainingKnownStubs":1}
```

Failing assertion:

```text
R03 required existing known demo stubs to be replaced with readable owned material; repairing only new seeds is insufficient
1 !== 0
```

Old/new ordinary `auth/me` both returned 200. All ordinary user fields and the session fingerprint matched, without printing passwords/hashes. The ordinary Draft row matched apart from additive `transition_token=null`; four main table counts matched. Failure concerned only the original material in known `demo-request-confirmed`.

## Genuine fault on first lesson INSERT: PASS

The first R02 demo request returned 500; a SQLite trigger counter proved failure on lesson INSERT 1. It left seeded=1, 3 classes/45 demo users/0 lessons/0 requests. After removing the trigger, ordinary registration succeeded and R02 `auth/me` returned 200. After actual 0001, the same session returned 200 on R04 with identical credentials/session.

```json
{"actualFaultHit":1,"beforeLessons":0,"ordinarySession":200,"after":{"classes":3,"users":46,"lessons":120,"requests":7},"completionMarker":"1"}
```

## Genuine fault on second lesson INSERT: FAIL

The first R02 demo request returned 500; the trigger counter proved failure on lesson INSERT 2. The first lesson was already committed. State: seeded=1, 3 classes/45 demo users/1 lesson/0 requests. After removing the trigger, ordinary registration and R02 `auth/me` succeeded. After actual 0001, R04 returned 200 with identical credentials/session.

```json
{"actualFaultHit":2,"beforeLessons":1,"ordinarySession":200,"after":{"classes":3,"users":46,"lessons":1,"requests":0},"completionMarker":"1"}
```

Failing assertion:

```text
A genuine interrupted R02 school must recover both demo school weeks, not be marked complete after one lesson
1 !== 120
```

## Rerun in the next round

The same three independent probes were saved as [historical-upgrade-probe.mts](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/.codex-review/historical-upgrade-probe.mts). After R05 implementation began, only script saving/type checking occurred; it was not rerun against the moving tree. The saved version awaited the next pinned candidate. It is separate from the 85-case suite and does not change its assertions/counts. After handback and clean product/CI source, run against the actual pinned app tree:

```sh
REVIEW_APP_TREE=<PINNED_CANDIDATE_HEAD:handover> node --experimental-strip-types --test .codex-review/historical-upgrade-probe.mts
```

The script checks starting/ending app tree and clean state, applies all current SQL migrations after historical 0000, and uses no crypto polyfill, running service, or persistent DB. Its `tsc --noEmit` exited 0 that round, proving saved-script types only, not an unexecuted passing run.
