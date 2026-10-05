# Handover

A school timetable change does not go out until the handover is complete.

Teachers record the lesson, the reason, and what the next adult needs. Students in that class see the public change and a preparation list. The school office sees what is still unconfirmed.

**Live app:** [handover-campus-2026.ziz81503.workers.dev](https://handover-campus-2026.ziz81503.workers.dev/) · **Source:** [GitHub](https://github.com/zhuang768/handover-csc-2026) · **CI:** [earlier successful run](https://github.com/zhuang768/handover-csc-2026/actions/runs/37145231969) / [workflow runs](https://github.com/zhuang768/handover-csc-2026/actions).

Cloudflare Workers is the primary live address and uses its own Cloudflare D1 database. The [original Sites app](https://handover-campus-2026.ziz81503.chatgpt.site/) and its data remain available; no data was moved between the databases. Sign in again on the Cloudflare address. Existing Sites accounts, requests, and sessions do not transfer to the new origin or database. Use the four demo sign-in buttons to explore the new app.

`TEST_REPORT.md` retains the actual historical Sites checks: version 3 passed hosted offline and a real version 1 → 3 update; the later English-only version 5 passed its hosted offline and resource checks. Those records do not claim Cloudflare production verification. Check the linked workflow for current CI results rather than treating the earlier run as a new deployment result.

The current Cloudflare release has its own verification: 34 unit tests and six built-browser cases using the actual Cloudflare configuration passed. On the live HTTPS origin, a real four-session request workflow passed decline, revision, confirmation, and cancellation, including student privacy, preparation persistence, timetable restoration, and logout replay rejection. HTTPS resource checks and a controlled Chromium offline reload also passed. See [the Cloudflare test record](TEST_REPORT.md#cloudflare-deployment-2026-10-05). These results do not claim physical-phone installation or a new remote CI pass.

Requires Node.js `>=22.13.0`. Copy `.env.example` if you want to override the public demo invitation or `DEMO_MODE`. Local and production both use the D1 binding `DB`. `npm run dev` applies `drizzle/` to `.wrangler/state` before the app starts, then seeds an empty school on the first demo sign-in. Run `npm run db:migrate` again and it should report that nothing new needs applying. Do not delete a shared `.wrangler` directory that already has data.

```bash
cd handover
npm ci
npm run dev
```

Open the printed local URL, or use the live HTTPS address above. Handover is a web app: use the address, then add it to the home screen. On iPhone or iPad, open it in Safari, tap Share, then Add to Home Screen, enable Open as Web App on that add screen when available, tap Add, and open the icon. On Android Chrome, use the browser menu and choose Install app or Add to Home screen. A desktop browser can install it only when the browser offers that action. Physical-phone installation has not been tested. Timetable changes, sign-in, and sending a handover need a network connection. An offline save is not a successful submission. Version reload waits until open drafts, unsaved edits, and pending writes are finished.

In about 30 seconds: sign in as the student, open the next lesson, then the original teacher, the covering teacher, and the school admin. On the sign-in screen:

1. **Student** sees Class 7A.
2. **Original teacher** is Maya Chen. She can draft a handover; the server rejects it until every section is filled.
3. **Covering teacher** is Jonah Park. He accepts or returns the request.
4. **Administrator** is Avery Lin. Demo reset asks you to type `RESET DEMO` and does not delete a real registration.

Teacher self-registration needs the public demo invitation `HANDOVER-2026`. There is no email reset: save the recovery code shown once at registration. Admin cannot self-register.

## Checks

```bash
npm test
npm run typecheck
npm run lint
npm run format:check
npm run check:english
npm run build
npm run test:e2e
```

`npm run check:english` rejects Han characters in maintained Git text, including project and reviewer documentation. It does not replace functional or browser tests.

`npm test` runs the API suite against in-memory SQLite using the same SQL as D1. `npm run test:e2e` uses the existing Playwright dev dependency and a separate local D1 under `.wrangler/e2e-state`. Install the browser once with `npx playwright install --with-deps chromium` before that command on a clean machine.

`npm run db:migrate` applies SQL only to a **local** D1. `scripts/migrate-local-d1.mjs` always passes Wrangler `--local` and `wrangler.migrate.json`. It does not touch either hosted database. The repository now contains the real remote Cloudflare account and D1 identifiers in `wrangler.cloudflare.jsonc`; these public identifiers are configuration, not credentials. A published Site uses its separate existing publish flow and database. Do not point the local migration script at production.

## Cloudflare deployment and local verification

Run these commands from `handover/` using the existing Wrangler OAuth sign-in. `npx wrangler whoami` checks the signed-in account; use `npx wrangler login` only if OAuth sign-in is needed. Do not put OAuth tokens, API tokens, or session cookies in source files or documentation.

```bash
npx wrangler whoami
npm run cloudflare:check
npm run test:e2e:cloudflare
```

`cloudflare:check` builds and performs a Wrangler deployment dry run. `test:e2e:cloudflare` builds and runs the authored built-browser cases against the Cloudflare configuration on local port 8790, with a separate local D1 under `.wrangler/cloudflare-e2e`. It does not test the public HTTPS address or change either remote database. These are reproducible commands, not claims that a new CI or production check has passed.

When intentionally applying remote migrations or publishing the Cloudflare app:

```bash
npm run cloudflare:migrate
npm run cloudflare:deploy
```

`cloudflare:migrate` applies `drizzle/` migrations to the remote D1 selected by `wrangler.cloudflare.jsonc`. `cloudflare:deploy` builds, applies those remote migrations, then deploys the Worker and assets. It does not deploy the original Sites app or move its data. Remote migration and deployment are separate from local-only `db:migrate`.

The explicit configuration uses the `DB` binding, the actual remote database ID, and compatibility date `2026-05-15`. That date is the validated date supported by the current Wrangler/workerd toolchain; it is not the publication date. The account/database IDs are public metadata and do not grant access without authentication.

The product itself is currently unlicensed. Manrope, Lucide, and the Vinext starter keep their own notices in `CREDITS.md`.

## Layout

```text
browser → app/api → server/service.ts → D1 (DB)
                         ↑
                    drizzle/*.sql
```

- `server/service.ts` — session, authorization, conflicts, and the handover state machine
- `drizzle/` — schema migrations, including the transition token
- `components/handover/` — English workspace
- `shared/types.ts` — API shapes

School dates use Asia/Taipei. See `DECISIONS.md` and `TEST_REPORT.md`.

## Known limitations

No outbound email. Recovery codes replace mail reset, and addresses are not verified. Day-before reminders are created on workspace load, not pushed in the background. The calendar file is a download, not a live subscription. Demo data is synthetic and shared between visitors; isolated demo sessions and school-approved account provisioning are future work. Physical iPhone/Android installation remains unverified; the successful hosted Chromium offline check is not a physical-device install result.
