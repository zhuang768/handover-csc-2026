# R04 root independent validation

Reviewed product: `6b7b7cd734e9af06785d7f854d75dc8f3a160c6f`; app tree `ebbe56dda33a1547d67f17367bc067fe7a6eb2ab`. Cursor was idle and product source was clean before validation. Reviewer output remains separate.

- `format:check`, lint, typecheck, 26 product tests and build: all exit 0.
- Existing development E2E: 8 passed, 0 failed (15.5s). Covers measured 390/768/1440 widths, real next-lesson association, conflict failure/retry, phone navigation across roles, simple-view account switch, detail input isolation and 401 shell reset. This does not claim every form was manually exercised on every viewport.
- Existing built Worker E2E: 1 passed, 0 failed (3.2s). `/offline.html` direct status 200, no Location/redirect fallback. Actual service-worker-controlled full reload with the browser offline shows the public bilingual offline page; attempted profile save while offline fails and is not persisted after reconnect. Project test inspects private API cache exclusions. This is desktop Chromium evidence, not a physical phone install.
- Fresh isolated D1 at `.codex-review/worker-state/r04`: both migrations exit 0; built Worker runs on reviewer-owned port 8789. Three-role real-session smoke passes, student class/private-note filtering passes, logout invalidates the cookie. No shared or production database was reset.
- Native Cua in-app browser, tab 5, built Worker: Chinese student home/profile rendered successfully. An existing service-worker version from the R03 review produced a genuine R04 update banner. Entering `Mina 7A update draft` in profile removed the update button, showed the unfinished-edit warning, and preserved the field. Restoring the original name restored the update button. Clicking it caused actual full reload to the home screen, retained the student session, and removed the update banner. This validates the normal two-version update flow and profile dirty guard; it does not prove rare worker-registration failures or every editor's update guard.
- Maskable icon was visually inspected earlier: forest-green full canvas with an original white paper/three-line symbol and generous safe margin.

Reviewer E2E changed only screenshot outputs `02-student-next-lesson.png` and `08-detail-390.png`. Both were copied to ignored `.codex-review/artifacts/r04-root-e2e/` and restored to their exact reviewed Git blobs. Product source has not been edited by the reviewer.

An HTTPS-only production HTTP probe correctly refused the local HTTP URL; that command was an invocation mismatch, not a product defect. Run it against the actual public deployment URL when available. No HTTPS publication, physical iOS/Android installation, or GitHub CI success is claimed here.

Remaining review findings are consolidated in the API/frontend/docs reports before the next repair or release decision. GitHub/public delivery is still pending.
