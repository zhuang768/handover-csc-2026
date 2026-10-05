# Design notes

Direction approved 2026-10-04: a campus course handbook. Warm paper `#F6F4EF`, white surfaces, ink `#202D2A`, and one green action color `#246B56`. Dates, periods, and the next step carry the hierarchy. This is a workspace, not a landing page.

## What was borrowed

Eight public references were already reviewed. Three shaped the screens:

- Todoist: the student home leads with today and the next lesson, then the rest of the week. Empty Saturday stays empty.
- Cal.com: the week is a thin grid. A changed lesson uses a narrow amber edge plus an icon and the word “Changed”.
- Linear: the handover detail and the admin filters stay aligned (date, class, teacher, status, search) and the detail is the focus.

Also used, more lightly: WebUntis for week and class/teacher location, Google Classroom for separating draft from published teaching notes, Notion Calendar for a phone day list beside the desktop week, shadcn for consistent fields and focus, Material 3 for short state motion (about 180ms, transform/opacity only). Nothing was copied from those products: no logos, screenshots, marketing lines, or template dashboards.

## Tokens and type

`components/handover/handover.css` uses primitive values, then semantic names (`--ink`, `--paper`, `--cobalt` still means the action green so older rules keep working), then component rules for buttons, lessons, and badges. Dark mode and high contrast change those tokens. Disabled buttons use a solid fill and darker label, not faded opacity.

Manrope (Latin, variable, self-hosted) is used for the English interface and numbers, with a standard sans-serif fallback and `font-display: swap`. The English-only update removes the previous language-specific font and fallback rules. Dates and periods use tabular numbers.

## Motion

Hover, press, and focus are the only motion. `prefers-reduced-motion: reduce` drops the transform. Success copy appears after the API returns.

## What this is not

Impact numbers count arranged changes. They do not claim learning gains. Demo data is labeled as a demo. There is no stock illustration and no extra analytics.
