# R02 independent regression preparation

During Cursor's repair work, only reviewer tests were added. No product API was run, and neither handover nor the D1 adapter was modified. This is a translated historical preparation record.

Four top-level groups were added, bringing the file to 26 groups, with two PATCH/submit start-order subcases.

1. **Student reason privacy:** use the API-supported `medical` category and a unique private reason marker. Confirm the teacher can read both fields, while raw student workspace/detail JSON excludes the marker and omits or empties reason and reasonCategory on the target request. No invented category rejected by validation was used.
2. **Supplement/comment privacy:** follow the published `{text}` API and DECISIONS rule that supplements/timeline comments are teacher-only. Add a timestamped private supplement and a private acceptance comment. First confirm the receiving teacher can read them; then verify student list/detail/ICS exclude the raw teacher marker. No unpublished visibility field or public-sharing requirement was invented. If the repaired contract adds required privacy classification, align with its actual fields before running.
3. **Draft PATCH/submit concurrency:** use an actual PATCH to empty Draft progress and confirm persistence, then restore a complete Draft. This proves the incomplete payload is a valid draft rather than a fake race stopped only by validation. Synchronize both requests before the first write. A final Pending must contain all seven complete sections; a final Draft must have no reservation or successful submitted event.
4. **Cancellation of a second move:** retain the same original/current teacher, first move a lesson and mark it Completed on a past date, then create and cancel a second move. If the API supports the second request, it must restore the date/period/room immediately before that request, retain the first Completed record, and not revert to the earliest base_*. No ambiguous ownership after teacher replacement or future-date completion was required. If the API explicitly returns 409 prohibiting another request on a Completed lesson, report unsupported/skipped transparently rather than alleging a restoration defect.

Only reviewer TypeScript `--noEmit` ran, exit 0. These new API cases were **not executed; no pass/fail claim was made**.

Command after product stabilization:

```sh
node --experimental-strip-types --test .codex-review/independent-api.test.mts
```
