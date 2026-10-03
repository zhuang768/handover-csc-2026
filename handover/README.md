# Handover

A school timetable change does not go out until the handover is complete.

Teachers record the lesson, the reason, and what the next adult needs. Students in that class see the public change and a preparation list. The school office sees what is still unconfirmed.

## Try it

```bash
cd handover
npm ci
npm run dev
```

Open the printed local URL. On the sign-in screen:

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
```

`npm test` runs the API suite against in-memory SQLite using the same SQL as D1.

## Layout

- `server/service.ts` — session, authorization, conflicts, and the handover state machine
- `drizzle/0000_init.sql` — schema
- `components/handover/` — English / Traditional Chinese workspace
- `shared/types.ts` — API shapes

School dates use Asia/Taipei. See `DECISIONS.md` and `TEST_REPORT.md`.

## Known limitations

No outbound email. Recovery codes replace mail reset, and addresses are not verified. Day-before reminders are created on workspace load, not pushed in the background. This checkout has not been published; do not treat a future hostname as live. The calendar file is a download, not a live subscription.
