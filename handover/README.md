# Handover

A school timetable change does not go out until the handover is complete.

Teachers record the lesson, the reason, and what the next adult needs. Students in that class see the public change and a preparation list. The school office sees what is still unconfirmed.

**Live app:** [handover-campus-2026.ziz81503.chatgpt.site](https://handover-campus-2026.ziz81503.chatgpt.site) · **Source:** [GitHub](https://github.com/zhuang768/handover-csc-2026) · **CI:** [earlier successful run](https://github.com/zhuang768/handover-csc-2026/actions/runs/37145231969) / [workflow runs](https://github.com/zhuang768/handover-csc-2026/actions). Public access is enabled. Version 3 passed the hosted offline check and a real browser update from version 1; see `TEST_REPORT.md` for scope and commands.

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
npm run build
npm run test:e2e
```

`npm test` runs the API suite against in-memory SQLite using the same SQL as D1. `npm run test:e2e` uses the existing Playwright dev dependency and a separate local D1 under `.wrangler/e2e-state`. Install the browser once with `npx playwright install --with-deps chromium` before that command on a clean machine.

`npm run db:migrate` applies SQL only to a **local** D1. `scripts/migrate-local-d1.mjs` always passes Wrangler `--local` and `wrangler.migrate.json`. It does not touch the Sites production database, and this repository does not contain a remote database id. A published Site applies the SQL and Drizzle metadata that are already inside the portable package, through the existing Site publish flow. Do not point this npm script at production.

The product itself is currently unlicensed. Manrope, Noto Sans TC, Lucide, and the Vinext starter keep their own notices in `CREDITS.md`.

## Layout

```text
browser → app/api → server/service.ts → D1 (DB)
                         ↑
                    drizzle/*.sql
```

- `server/service.ts` — session, authorization, conflicts, and the handover state machine
- `drizzle/` — schema migrations, including the transition token
- `components/handover/` — English / Traditional Chinese workspace
- `shared/types.ts` — API shapes

School dates use Asia/Taipei. See `DECISIONS.md` and `TEST_REPORT.md`.

## Known limitations

No outbound email. Recovery codes replace mail reset, and addresses are not verified. Day-before reminders are created on workspace load, not pushed in the background. The calendar file is a download, not a live subscription. Demo data is synthetic and shared between visitors; isolated demo sessions and school-approved account provisioning are future work. Physical iPhone/Android installation remains unverified; the successful hosted Chromium offline check is not a physical-device install result.
