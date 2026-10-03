# Handover design direction — awaiting user confirmation

User steering2026-10-03: research5–8appropriate references before any new visual code, present concept/colors/type/motion and await confirmation. Original autonomous review/repair/GitHub goal remains active. Cursor round2 bugfixes continue; do not send/implement a visual redesign until this direction is approved or user says直接做. This pause comes from user's explicit workflow, not a skill requirement. No product visual code authored here.

## Eight references

1. [WebUntis timetable official help](https://help.untis.at/): school/date/class/teacher context and week selection. Root viewed official date picker attachment22255697940764; that is a date picker, not the full timetable. Use explicit current week and role context; avoid reproducing enterprise settings density. Education research report supplies exact article sources.
2. [Google Classroom teacher guide](https://services.google.com/fh/files/misc/google_classroom_user_guide.pdf): structured instructions, attachments and assignment settings; draft vs assign; personal student to-do. Use sectioned handover with student/public vs teacher/private distinction. Avoid importing gradebook/AI panels outside scope. Guide is a reference document, not a claim of the current pixel-perfect UI; PDF pixel rendering unavailable in root browser.
3. [Cal.com bookings calendar](https://cal.com/blog/calcom-v6-2): root visually viewed calendar image linked in official article (BgiY1AZCj7h3Bky4LKzFqxrLTl4.png). Quiet thin grid, prominent week picker, subdued event surfaces with narrow color edge, explicit current-day marker. Adapt for dates×school periods, not arbitrary meeting duration or brand font/logo.
4. [Linear planning](https://linear.app/plan): root inspected product example—grouped properties, status/owner/date in compact aligned rows, calm typography and understated dividers. Use consistent metadata and a focused request detail pane; avoid copying near-black marketing surfaces/tiny dense developer text.
5. [Todoist task management](https://www.todoist.com/task-management): root inspected Today demonstration—task/next-step focus, warm neutral space, muted navigation and calm completed empty state. Use studentToday/ThisWeek + real persisted preparation tasks; no copied testimonials/illustrations/brand red.
6. [Notion Calendar](https://www.notion.com/product/calendar): root viewed desktop week grid/mobile agenda side by side, restrained separators and clear event blocks. Borrow desktopweek/mobileday responsive structure; avoid pastelpainter over many competing categories or adding external calendar connections.
7. [shadcn dashboard](https://ui.shadcn.com/examples/dashboard): root inspected neutral controls/table density and component consistency. Borrow accessible fields/menus/focus/error behavior and existing project components; do not copy generic salesmetrics/cards, sampleAcme/numbers, or whole template.
8. [Material3 motion physics](https://m3.material.io/styles/motion/overview/how-it-works): root read fully rendered official standard/expressive schemes. Standard minimal bounce suits utilitarian work. Adapt purposeful panel/status/checklist feedback; no flamboyantovershoot, repeated scrollreveals or perpetual animation. Do not claim custom CSS durations are officialtokens.

## Recommended concept

「清楚的校園課務手冊」— a calm working document, warm off-white paper, forest-green actions, dark ink, precise dates/periods, sparse rules and editorial hierarchy. Familiar to a teacher, quick on a student's phone. Real data and nextaction establish hierarchy; no stockphoto, fabricatedmetrics, testimonials, purplebluegradient/glass/neon or threeequalfeaturecards.

Closest three: Todoist(nextaction/studenttasks), Cal.com(weekgrid/clearperiodblocks), Linear(metadata/status/detail workflow). Each translated into actual Handover views after approval, not copiedassets/code/brand.

## Tokens and rationale

All primitive→semantic→component variables, consistent light/dark/highcontrast when exposed. Primary green signals action/ready; amber pending; red returned/conflict; icons+text always accompany statuscolor. A single main accent and restrainedsemanticcolors; separators separate content rather than shadowedcards everywhere.

| Purpose | Value | Text pairing computed contrast |
|---|---|---|
| pagepaper | #F6F4EF | ink12.99:1 |
| work surface | #FFFFFF | validate allstatepairs at implementation |
| primaryaction | #246B56 | white6.34:1; green onpaper5.77:1 |
| mainink | #202D2A | paper12.99:1 |
| secondarytext | #5F6B64 | paper5.06:1 |
| pendingtext/surface | #8A5A08/#FFF3D6 |5.37:1 |
| error/returnedtext/surface | #A12F2F/#FFF0EC |6.39:1 |

Ratios computed usingWCAGrelative luminance, not a blanketAA claim. Fieldbounds/focus/non-text require separate≥3:1 check, and actual renderedcombinations must be verified. Statusmeaning not solelycolor.

Manrope English + Noto Sans TC Traditional Chinese. Body16px,line1.65–1.75; English max~65ch, Chinese paragraphs~30–38characters. Pageheaders28–36px, section20–24px, labels14px, fourweights400/500/600/700. Dates/periods use tabularnumbers. DistinctiveEnglishgeometrictype with readableTraditionalChinese; no solelysystem/Inter. GoogleFontswoff2 with font-display:swap and progressivefallback; limitrequestedweights/subsets, no giantpreloadedCJKfile. Only actualverifiedfontassets after approval.

## Concrete view changes

- Student: day/date header, one nextlesson and its actualchanged teacher/time, visiblethree preparationtasks; ThisWeek secondary. Onmobile no fullsidebar beforecontent;44pxmincontrols, safeareabottomnav, unclippedlongtext. Weekendempty honest, nextschoolday context separate.
- Teacher: main timetable with slimmer actionqueue; newhandover sectioned Teaching/Materials/Student/TeacherPrivate; live requiredcounter and missingfields; sticky actionbar only if it doesn't obscurefields. Existingservergates unchanged, no UI fakevalidation.
- Admin: fullwidthlist with explicitcombinedfilters, small realweeklycounts strip andactionableriskrows. Requestdetail mobilefullpage/desktoppane with focus/back, legalstateandprivatefields unchanged.
- Login: asymmetrical workingdocument layout, concise actualcorepromise and originalSVG of week/handovers; real4demobuttons groupedbyrole. No borrowedlogos/images/pseudostats.

Motion: CSS transform/opacity140–220ms as a project choice; panel transition showswhere detailopened; successfulcheckboxfeedback onlyafterpersistedAPI; saved/failed annunciationaccessible; static skeleton or calm indicator forloading. prefers-reduced-motion removesmovement; no infinitebounce/scrollhijack. Existingstack needs no heavyweightnewmotiondependency for theseinteractions. Allhover/focus/active/disabled/loading/error/emptystates specified.

## Resource licenses verified

- [Manrope OFL1.1](https://github.com/google/fonts/blob/main/ofl/manrope/OFL.txt)
- [Noto Sans CJK OFL1.1](https://github.com/notofonts/noto-cjk/blob/main/Sans/LICENSE)
- [Lucide ISC with Feather-derived MIT portion](https://github.com/lucide-icons/lucide/blob/main/LICENSE), use alreadyinstalledsingleiconset, preserve relevantnotice.
- [shadcn MIT](https://github.com/shadcn-ui/ui/blob/main/LICENSE.md), preserve existingvendorcredits.

Referenceproductimages/logos/copy are viewedonly, not redistributableassets. HandoverSVGbrandgraphics areoriginal. Resourcecredit does not imply brandendorsement. Do notcopyCal.comsource assumingMIT.

## Approval state

APPROVED on 2026-10-04 Asia/Taipei. The user answered「採用這個方向，直接實作（推薦）」to the direction question. CURSOR_VISUAL_R02B.md is the concrete implementation instruction for the same Cursor chat, after its current functional/security repairs. Independent functional tests, visual acceptance, CI, GitHub and public delivery remain required. Approval is the user's direct response, not elapsed waiting.
