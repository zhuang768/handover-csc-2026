# Handover

A school timetable change does not go out until the handover is complete.

Teachers record the lesson, the reason, and what the next adult needs. Students in that class see the public change and a preparation list. The school office sees what is still unconfirmed.

Requires Node.js `>=22.13.0`. Copy `.env.example` if you want to override the public demo invitation or `DEMO_MODE`. Local and production both use the D1 binding `DB`. `npm run dev` applies `drizzle/` to `.wrangler/state` before the app starts, then seeds an empty school on the first demo sign-in. Run `npm run db:migrate` again and it should report that nothing new needs applying. Do not delete a shared `.wrangler` directory that already has data.

```bash
cd handover
npm ci
npm run dev
```

Open the printed local URL. Handover is a web app: use the address, then add it to the home screen. On iPhone or iPad, open it in Safari, tap Share, then Add to Home Screen, and open the icon. On Android Chrome, use the browser menu and choose Install app or Add to Home screen. A desktop browser can install it only when the browser offers that action. Timetable changes, sign-in, and sending a handover need a network connection. If the page is offline, nothing is submitted. When a new version is ready, reload it after closing any open draft.

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

`npm test` runs the API suite against in-memory SQLite using the same SQL as D1. `npm run test:e2e` installs nothing extra; it uses the existing Playwright dev dependency and a separate local D1 under `.wrangler/e2e-state`. Before a production Worker, run `npm run db:migrate` against that environment’s D1. This repository has not been deployed from this round.

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

No outbound email. Recovery codes replace mail reset, and addresses are not verified. Day-before reminders are created on workspace load, not pushed in the background. This checkout has not been published; do not treat a future hostname as live. The calendar file is a download, not a live subscription.
