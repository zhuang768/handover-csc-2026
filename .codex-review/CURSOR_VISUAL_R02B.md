# Handover — approved redesign alongside round 2 repairs

Historical implementation prompt, translated on 2026-10-05. Its bilingual/font requirements describe the approved direction at that time and are superseded for the current release by the later English-only instruction.

On 2026-10-04 the user directly selected “Adopt this direction and implement it (Recommended).” Continue in the same Cursor conversation/product without asking again. First finish CURSOR_REPAIR_R02's core functionality, security, and database repairs, then implement this redesign. Preserve those repairs; a polished sign-in page alone is insufficient. Stop all product edits at the end and hand back for independent Codex review. This user-added scope remains alongside original P0, data protection, and GitHub delivery.

Workspace: `/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon`; product: `handover/`; branch: `handover`. Codex will not edit product files concurrently. Read DESIGN_DIRECTION_PENDING, DESIGN_REFS_EDUCATION, ACCEPTANCE, and VISUAL_ACCEPTANCE when present. Do not alter independent tests/reports; product tests may gain real regressions.

## 1. Completed research and concrete adaptations

The user required research of five to eight cases, pros/cons, and confirmation before visual code. Eight references were researched and approved. Proceed without collecting the whole set again. Use official sources for specific library APIs/fonts. Record actual adaptations in DESIGN_NOTES/CREDITS.

1. WebUntis: https://help.untis.at/hc/en-150/articles/18231094538396-Navigation-and-Color-Scheme-in-the-New-Timetable-View . Adapt explicit week/class/teacher context, not dense enterprise matrices. Attachment22255697940764 is a date picker, not a full timetable.
2. Google Classroom teacher guide: https://services.google.com/fh/files/misc/google_classroom_user_guide.pdf . Adapt instructional content, materials, audience grouping, and draft/publish distinction. This organization reference does not establish the live2026 UI. Do not add gradebook, AI, or large class covers.
3. Cal.com: https://cal.com/blog/calcom-v6-2 . Adapt thin week rules, quiet event surfaces, narrow color edges, and explicit week. Root inspected https://framerusercontent.com/images/BgiY1AZCj7h3Bky4LKzFqxrLTl4.png as reference only. Do not copy the image/code or treat the article as evidence of every account's default UI.
4. Linear: https://linear.app/plan . Adapt aligned status/owner/date and focused detail, not near-black marketing or tiny dense text.
5. Todoist: https://www.todoist.com/task-management . Adapt warm space, Today/next action, and honest empty state; no brand red, testimonials, or illustrations.
6. Notion Calendar: https://www.notion.com/product/calendar . Adapt complementary desktop week/mobile day views, not competing colors or integrations.
7. shadcn: https://ui.shadcn.com/examples/dashboard . Adapt consistent controls, fields, menus, focus, and states; no sales-card template, Acme branding, sample counts, or entire example.
8. Material3: https://m3.material.io/styles/motion/overview/how-it-works . Adapt standard motion that explains state, not expressive overshoot, floating, or every-section fade-in.

Closest three: Todoist for student next action, Cal.com for week/periods, and Linear for detail/admin lists. Apply each to the actual view. Borrow techniques, not brand assets, screenshots, copy, illustrations, or unknown components.

## 2. Single concept and design system

A clear campus course handbook: carefully laid-out working pages, warm paper, forest-green actions, dark ink. Dates, periods, changes, and next action establish hierarchy. Use width contrast, thin rules, purposeful whitespace, and asymmetry instead of identical rounded cards.

Use primitive→semantic→component CSS tokens across all views. Consolidate old CSS rather than stacking overrides.

- Page #F6F4EF; surface #FFFFFF.
- Main text #202D2A; secondary #5F6B64.
- Action/completed #246B56 with white text. Pick readable darker hover/active colors, not faded opacity.
- Pending text/background #8A5A08/#FFF3D6.
- Declined/error text/background #A12F2F/#FFF0EC.
- Define border, focus, link, disabled, loading, selected, draft, and cancelled tokens. Status always has consistent icon and text, not only color.
- Candidate ratios: white/green6.34:1, ink/paper12.99:1, secondary/paper5.06:1, pending5.37:1, error6.39:1. These do not prove full-page AA. Verify actual computed light/dark/contrast states: ordinary text>=4.5:1 and necessary non-text/focus>=3:1. Any retained mode must actually work.

Historical typography: Manrope for English/numbers and Noto Sans TC for Traditional Chinese, with suitable fallback. Body16px/1.65–1.75 line height, page headings28–36px, sections20–24px, labels14px, weights400/500/600/700. Dates/periods use tabular numerals; localized paragraphs30–38 characters/line and English about65ch. Do not rely exclusively on Inter/Roboto/system or use inappropriate glyph forms. Use official Google Fonts sources,woff2,font-display:swap,and limited weights/subsets without a huge CJK preload. Fallback stays readable/stable; retain OFL for localized assets and no secrets. The later English-only update removes Noto and language-specific fallbacks.

## 3. Actual layouts for every role and sign-in

Inspect app.tsx/CSS first. Keep React19/Vinext/Cloudflare/D1 and reuse or clearly split components. No framework/API rewrite or new data service.

- **Sign-in:** asymmetric text/working-document graphic, original SVG explaining week/handovers with appropriate accessibility. Historical default English plus language choice; suggested promise “Change the timetable. Keep the lesson ready.” The original localized alternative had the same meaning. Login/register/recovery are functional. Group four genuine demo accounts by role, not three marketing cards.
- **Student:** date/today then actual next lesson and changed teacher/time/room/preparation. Todos are real persisted user data, not fabricated or limited to exactly three by hiding more. Today is primary and This Week secondary. Honest weekend empty/next-school-day context. At390px use a single-column day view and compact reachable navigation, not a giant sidebar. Optional week view must not cause whole-page overflow.
- **Teacher:** main week grid plus narrower response queue; consistent date/period/class/subject/place order. Show original→new arrangement and changes with icon/text/color. Group schedule,teaching,materials,student reminders,and private notes. Preserve seven requirements,live gate,and conflicts. Clear status/missing count; draft and submit separate. Sticky actions cannot cover fields/focus.
- **Admin:** combined date/class/teacher/status/search list,small genuine weekly counts,and actionable risks. Desktop detail focus/mobile single-column detail with Back. No multiple equal-width fake KPI cards.
- **Detail/notifications/settings:** same tokens/type/states. Cross-week notifications still GET actual detail; redesign cannot weaken role fields. Historically complete system localization for timelines/errors/empty states; teacher input stays original. Labels,hints,errors,and focus order remain clear.

Use installed lucide-react consistently in size/stroke. Original graphics instead of gray placeholders,stock imagery,or emoji. Label synthetic data. No fake reviews,logos,learning gains,or placeholder worksheets.

## 4. Interaction,accessibility,responsiveness,and performance

- Every visible control has applicable hover/focus-visible/active/disabled/busy/error/empty behavior. Do not disguise information as buttons. Targets at least44px,including table icon buttons.
- CSS transform/opacity roughly140–220ms for panel/date/save/todo state; confirm persistence before completion feedback. No purposeless first-screen/all-card fades,scroll hijacking,infinite bounce,neon,glass,or purple-blue gradients.
- Reduced motion removes/minimizes movement but preserves clear busy feedback. Do not add ineffective switches or GSAP/Three/Lottie merely to use a skill.
- Semantic main/nav/header/form/headings; connected label/hint/error; appropriate aria-live; keyboard and returned detail focus; needed Escape/Tab behavior. Decorative SVG aria-hidden. No ARIA misuse or inescapable traps.
- Actual390/768/1440 in both historical languages,long names/material titles/URLs,weekend empty,load failures,conflicts,disabled,cancelled,and private data. No page overflow/clipping or sticky-covered focus.
- Limit font/JavaScript weight; load role data as needed and preserve security/caching. No production dependency,analytics,email,auth,or paid AI service. Explain a genuinely necessary addition in HANDOFF for Codex review.

## 5. Suitable skills,licenses,and handback

Find skills under `/Users/zhuangzijin/.agents/skills` and `/Users/zhuangzijin/.codex/skills`; read appropriate SKILL.md and actually apply it. Relevant design/redesign/design-system/ui-styling/React/AI-debt/Playwright work complements R02 security/workers repair. No landing-only skill on a dashboard. Fake metrics,random stock,external Gemini/key setup,plugin/model/account/system changes are outside scope.

Verified license references:

- Manrope OFL1.1: https://github.com/google/fonts/blob/main/ofl/manrope/OFL.txt
- Noto Sans CJK OFL1.1: https://github.com/notofonts/noto-cjk/blob/main/Sans/LICENSE
- Lucide ISC with Feather-derived MIT portions: https://github.com/lucide-icons/lucide/blob/main/LICENSE
- shadcn MIT: https://github.com/shadcn-ui/ui/blob/main/LICENSE.md

Retain notices and starter attribution. Do not call all Lucide MIT or assume Cal.com source is MIT. A design reference is not redistribution permission.

Run existing format/lint/typecheck/API/independent tests/build and meaningful interaction regressions rather than mirrored DOM-class tests. Verify real three-role positive/negative workflows,four demos,390/768/1440,both historical languages,keyboard,reduced motion,and contrast. Record what actually ran; unavailable browsers remain limits,not fabricated screenshots.

Review repetitive equal-width icon cards,hollow copy,fake counts,excess rounded shadows,and purposeless motion. DESIGN_NOTES records eight references,three actual adaptations,color/type/motion rationale,licenses,and adjustable tokens. HANDOFF records actual skills,file changes,evidence,and limits,with5–8 real captures.

Integrate R02 repairs/redesign,keep branch,commit reviewable source,stop product edits,set CURSOR_STATUS round2 ready_for_review,and clearly hand back. Do not push unaccepted source or create a Site; Codex handles authorized GitHub/existing-Sites delivery after independent acceptance.
