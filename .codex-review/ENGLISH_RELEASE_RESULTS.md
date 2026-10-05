# English-only delivery, 2026-10-05

Handover's maintained source, interface, templates, notifications, error messages, offline assets, screenshots, product documents, and historical review records are now English. The language switch and obsolete CJK font/subset license were removed. Existing display preferences migrate to English while preserving theme, large text, contrast, and simple view. Unreadable/malformed preferences and denied storage writes no longer prevent the app from opening. No authentication, schema, account, or saved user content was rewritten.

## Executed validation

| Check | Actual result |
| --- | --- |
| Formatting, lint, types, Worker/client build | Exit 0 |
| Product unit suite | 34 passed, zero failures/skips |
| Development browser suite | 13 passed; actual phone/tablet/desktop role layouts, legacy preference migration, three storage-failure cases |
| Built browser suite | Six passed in 6.7s; real offline fallback and five pending-write/update cases |
| Pinned SW behavior | 28 passed, zero failures, source `feb92076a9998de50e68d2fb7c1163f246d9699a`, `/offline.htm` contract |
| English source guard | 224 maintained text files passed before adding this report; final count is emitted by the command/CI |
| Source-guard controls | English accepted; extensionless Han and invalid UTF-8 rejected in an isolated temporary repository |
| Hosted English offline browser test | Version 5: 1/1 passed in 20.0s, real controller/cache/offline navigation/no false save or replay |
| Strict HTTPS resource probe | Version 5 passed direct public assets/MIME/no redirects and anonymous private API rejection |
| Native existing browser | Legacy translated student workspace became English; explicit waiting-SW update retained the session and removed the banner |
| Independent source review | No concrete blocker; original English dictionary preserved, SW safety guards unchanged, migration/storage failures and scanner examined read-only |

Eight actual English screenshots were regenerated and inspected; dimensions are in `handover/docs/screenshots/README.md`. Physical iPhone/Android installation remains unverified. Historical source reviews describe their original candidates and are not represented as new runtime runs. English-only checks inspect maintained project files, not database contents or Git history.

## Final source and publication provenance

- Accepted parent: `2bb18840eaf3d7ded094cc6d23403043e68b5ec5`.
- Accepted app tree: `f710cdda3dabb8855a591f9f7635c44f3ded4548`.
- Sites source: `feb71a9b472c7e279f0917fa7b5d5fd0eb8d33c9`; release tree matches the accepted app tree exactly.
- Archive SHA-256: `311256117ff802664994b13699f1954b6c256b74eb0a767546efdc6146f59c80`.
- Archive verifier passed eight public files and five migration files byte for byte, with correct Site/DB/Worker and clean release source.
- Project: `appgprj_6ac11cc258608191ba6f05fcd6e031fb`, existing public audience, environment revision 1 retained.
- Final saved version 6: `appgprj_6ac11cc258608191ba6f05fcd6e031fb~appgver_99f8c360fed48191b527af36dbe3423d`.
- Final deployment: `appgdep_6ac3218fa29081919d300a1d4858ef56`, succeeded.
- [Public app](https://handover-campus-2026.ziz81503.chatgpt.site/).

Version 6 adds only the broader source check and the actual verification record to version 5's app source. Runtime code and all PWA public asset bytes are unchanged, so version 5's hosted browser/SW evidence remains applicable; final HTTPS resources are checked again. Root reviewer-only translation/provenance commits do not alter the accepted app tree. GitHub PR/main CI results are verified separately before completion, using their actual run states rather than an assumed successful push.
