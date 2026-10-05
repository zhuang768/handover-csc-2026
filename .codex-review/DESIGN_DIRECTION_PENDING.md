# Handover — historical design proposal and approval

Historical record, translated into English on2026-10-05. The original proposal awaited confirmation and was then approved on2026-10-04. Its bilingual typography is historical; the later English-only instruction supersedes that language scope.

User steering on2026-10-03: research five to eight relevant examples before new visual code,present concept/colors/type/motion,and await confirmation. Autonomous review/repair/GitHub work remained active while Cursor round2 bugfixes continued. Do not implement/send the redesign before approval or an explicit instruction to proceed. This pause came directly from the user,not a skill. No visual product code was authored in this proposal.

## Eight references

1. [WebUntis official help](https://help.untis.at/): explicit week and class/teacher context. Root viewed date-picker attachment22255697940764,not a full timetable. Avoid enterprise settings density; the education report has exact sources.
2. [Google Classroom teacher guide](https://services.google.com/fh/files/misc/google_classroom_user_guide.pdf): organized instructions,attachments,assignment settings,draft versus assign,and student todos. Adapt sectioned public/student and private/teacher content. No out-of-scope gradebook/AI. This is a reference document,not current pixel-perfect UI; root PDF pixel rendering was unavailable.
3. [Cal.com calendar](https://cal.com/blog/calcom-v6-2): root viewed linked BgiY1AZCj7h3Bky4LKzFqxrLTl4.png. Thin grid,prominent week picker,quiet event surfaces,narrow edge,and today marker. Adapt school dates/periods,not arbitrary meetings or brand assets.
4. [Linear planning](https://linear.app/plan): root inspected grouped properties,aligned status/owner/date,calm type,and subtle rules. Adapt metadata/detail focus,not near-black marketing or tiny developer text.
5. [Todoist](https://www.todoist.com/task-management): root inspected Today,next action,warm neutral space,muted navigation,and calm empty state. Adapt student Today/This Week and real todos,no testimonials,illustrations,or brand red.
6. [Notion Calendar](https://www.notion.com/product/calendar): root viewed desktop week/mobile agenda,restrained rules,and clear events. Adapt complementary responsive structures,not competing pastels or integrations.
7. [shadcn dashboard](https://ui.shadcn.com/examples/dashboard): root inspected neutral controls,table density,and consistency. Adapt accessible fields/menus/focus/error; no sales metrics,Acme,sample counts,or whole template.
8. [Material3 motion](https://m3.material.io/styles/motion/overview/how-it-works): root read standard/expressive schemes. Minimal standard bounce fits work. Use purposeful panel/status/todo feedback,no overshoot,repeated reveals,or perpetual motion. Custom durations are project choices,not official tokens.

## Recommended concept

A clear campus course handbook: a calm working document with warm paper,forest-green actions,dark ink,precise dates/periods,sparse rules,and editorial hierarchy. Familiar to teachers and quick on student phones. Actual data/next action establish hierarchy. No stock photos,fabricated metrics,testimonials,purple-blue gradients,glass,neon,or three identical feature cards.

Closest three: Todoist for student next action,Cal.com for week/periods,and Linear for metadata/status/detail. Translate techniques into actual Handover views after approval; do not copy assets/code/brands.

## Tokens and rationale

Use primitive→semantic→component variables across exposed light/dark/high-contrast modes. Green denotes action/ready,amber pending,red returned/conflict. Icons and text accompany color. Prefer rules between content over shadowed cards everywhere.

| Purpose | Value | Candidate text-pair contrast |
| --- | --- | --- |
| Paper | #F6F4EF | Ink12.99:1 |
| Surface | #FFFFFF | Verify every state at implementation |
| Action | #246B56 | White6.34:1; green/paper5.77:1 |
| Main ink | #202D2A | Paper12.99:1 |
| Secondary text | #5F6B64 | Paper5.06:1 |
| Pending text/surface | #8A5A08/#FFF3D6 |5.37:1 |
| Error/returned text/surface | #A12F2F/#FFF0EC |6.39:1 |

Computed using WCAG relative luminance; not a full-AA claim. Field boundaries,focus,and necessary non-text need separate>=3:1 checks; verify actual rendered combinations. Meaning is not color alone.

Historical type proposal: Manrope English plus Noto Sans TC Traditional Chinese. Body16px,line1.65–1.75; English about65ch,localized paragraphs30–38characters. Page28–36px,section20–24px,label14px; weights400/500/600/700. Tabular date/period numbers. Google Fonts woff2,font-display:swap,progressive fallback,and limited subsets/weights without giant CJK preload. Verify actual assets after approval. The later English-only change removes the localized font.

## Concrete view changes

- Student: date/day,next actual lesson/changed teacher/time,and persisted preparation tasks; This Week secondary. Compact44px phone navigation/safe areas,no oversized sidebar/clipped text. Honest weekend empty and separate next-school-day context.
- Teacher: timetable plus narrower queue; sectioned Teaching/Materials/Student/Teacher Private; live missing count. Sticky actions only if they preserve fields/focus. Backend gates unchanged.
- Admin: full-width combined filters,genuine weekly counts,and actionable risks. Desktop detail pane/mobile full page with Back/focus,legal states,and privacy preserved.
- Sign-in: asymmetric working document,concise promise,original week/handover SVG,and four real demo buttons grouped by role. No borrowed assets or pseudo-statistics.

Project motion: CSS transform/opacity140–220ms for purposeful panel changes and API-confirmed todo/save feedback. Accessible success/failure,and calm/static loading. Reduced motion removes movement. No bounce/scroll hijacking or heavyweight motion dependency. Specify hover/focus/active/disabled/loading/error/empty states.

## License research

- [Manrope OFL1.1](https://github.com/google/fonts/blob/main/ofl/manrope/OFL.txt)
- [Noto Sans CJK OFL1.1](https://github.com/notofonts/noto-cjk/blob/main/Sans/LICENSE),historical asset.
- [Lucide ISC with Feather-derived MIT portions](https://github.com/lucide-icons/lucide/blob/main/LICENSE),one installed icon set with notices.
- [shadcn MIT](https://github.com/shadcn-ui/ui/blob/main/LICENSE.md),retain vendor credits.

Product images/logos/copy are view-only references,not redistribution assets. Handover SVG branding is original. Credit does not imply endorsement. Do not copy Cal.com source assuming MIT.

## Approval record

APPROVED on2026-10-04 Asia/Taipei. The user selected “Adopt this direction and implement it (Recommended).” CURSOR_VISUAL_R02B provided implementation instructions for the same Cursor conversation after functional/security repairs. Independent functional/visual acceptance,CI,GitHub,and public delivery remained required. Approval was the direct response,not elapsed waiting.
