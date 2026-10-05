# Handover — education and scheduling references

Research date:2026-10-03. Scope:Untis/WebUntis,Google Classroom,and Cal.com,using official public materials only. No account login,product-code edit,or Cursor operation occurred. The new design required approval of the integrated proposal. This is a historical research record translated on2026-10-05; its bilingual suggestions are superseded by the later English-only direction.

## Evidence levels

- **Documented:** official documentation explicitly supports the operations,organization,and state purposes below.
- **Pixel inspection pending:** official images/materials were found,but this agent's web tool returned image references only and CUA iab/Chrome were unavailable. Safari was in use by the user,so native interaction stopped. Unseen colors,type,shadows,motion,and breakpoints were not presented as measured facts.
- **Handover inference:** recommendations derive from teacher/student/admin tasks,not measured usability or performance of the reference products.

Root had a usable CUA browser and could strengthen evidence after actual inspection. This report does not claim complete product walkthroughs.

## 1. Untis/WebUntis — school week and changed lessons

Official sources:

- [Navigation and color scheme](https://help.untis.at/hc/en-150/articles/18231094538396-Navigation-and-Color-Scheme-in-the-New-Timetable-View)
- [Substitution display](https://help.untis.at/hc/en-150/articles/18231765445148-Display-of-Substitutions)
- [Daily/weekly overviews](https://help.untis.at/hc/en-150/articles/21175434824604-Daily-and-Weekly-Overviews-in-WebUntis)
- [Official attachment](https://help.untis.at/hc/article_attachments/22255697940764); root later identified it as a date picker,not a complete timetable.

**Documented organization:** current week and arrows above the grid; clicking the week opens the date picker. Class/teacher selection at upper left can move between resources. Controls choose changed lessons,exams,cancellations,and optional icons. Daily overviews compare classes,teachers,or rooms; weekly content/blank/dashed cells distinguish lessons,free periods,and holidays. [Navigation](https://help.untis.at/hc/en-150/articles/18231094538396-Navigation-and-Color-Scheme-in-the-New-Timetable-View),[overviews](https://help.untis.at/hc/en-150/articles/21175434824604-Daily-and-Weekly-Overviews-in-WebUntis)

**Documented state:** substitutions retain original/receiving teachers; a dashed frame marks the original teacher not teaching. A changed subject marks the original cancelled and the replacement changed. [Substitutions](https://help.untis.at/hc/en-150/articles/18231765445148-Display-of-Substitutions)

**Color/type/motion limits:** documents establish color/icons for lesson types,but this agent had not inspected image pixels or animated behavior. Specific palette,fonts,sizes,and motion were not verified and should not be copied as facts.

**Handover inferences:**

- Teacher: visible week,stable date/period/class/room order,and original→new teacher/arrangement reduce ambiguity.
- Student: only their class; icon,text,and border communicate state; prioritize when,where,and what to bring.
- Admin: resource overview leading to detail,rather than every teacher timetable on home.

**Do not transplant:** dense resource matrices are unsuitable for390px/student home. Unexplained dashed lines can confuse changed lessons,holidays,and drafts; retain distinct state names.

## 2. Google Classroom — content,materials,and audience

Official sources:

- [Current product page](https://edu.google.com/workspace-for-education/products/classroom/)
- [Teacher guide,updated2023-10](https://services.google.com/fh/files/misc/google_classroom_user_guide.pdf)
- [Details/materials,page11](https://services.google.com/fh/files/misc/google_classroom_user_guide.pdf#page=11)
- [Assign/schedule/draft,page13](https://services.google.com/fh/files/misc/google_classroom_user_guide.pdf#page=13)

**Documented organization:** enter Classwork to create assignments; title/instructions are separate from class/student audience,due date,topic,and material attachment actions. Assign now,schedule,and save draft are distinct; drafts return to Classwork for editing. This is2023guide evidence,not every2026interface detail. [Teacher guide](https://services.google.com/fh/files/misc/google_classroom_user_guide.pdf)

**Color/type/motion limits:** screenshot pixels were not inspected,so no specific current blue,font,or width was confirmed. Initial product media included an AI editor; it was not used as Handover's core form model. Animation was not tested.

**Handover inferences:**

- Teacher: separate course/audience,teaching,materials/reminders; independent material add/remove actions; clear save-draft versus submit with missing fields.
- Student: preparation,materials,assessment,and todos; omit teacher collaboration notes/admin audit.
- Admin: content/people/tracking views can inform organization,but filters remain date,class,teacher,status.

**Do not transplant:** large class covers/cards should not dominate a timetable. Grading,originality,and AI are outside redesign scope. Mobile forms need sequential access to all required fields/actions,not merely a squeezed desktop sidebar.

## 3. Cal.com — response queue,status filters,and week distribution

Official sources:

- [Bookings walkthrough,2025-02-19](https://cal.com/blog/a-complete-walkthrough-of-cal-com-s-booking-dashboard-its-key-features)
- [2026.2 calendar/detail update](https://cal.com/blog/calcom-v6-2)
- [2026.2 product image](https://framerusercontent.com/images/rzsoTgTN0p5A21efQ9JftAMKI.png?height=866&width=2048)
- [Cal Sans](https://cal.com/font)

**Documented organization:** left navigation opens Bookings. Upcoming,unconfirmed,recurring,past,and canceled groups appear above; Filters select people/events/dates. Unconfirmed requires the user's response,distinct from confirmed future Upcoming. [Walkthrough](https://cal.com/blog/a-complete-walkthrough-of-cal-com-s-booking-dashboard-its-key-features)

**Documented evolution:**2026.2added calendar browsing for weekly distribution/gaps,then enabled through Features; detail/history were still evolving. This does not establish every current account's default screen. [Update](https://cal.com/blog/calcom-v6-2)

**Color/type/motion limits:** this agent had not inspected product pixels. Cal Sans distinguishes headings,body,and small functional text,with Text optimized for14/16px,but that does not establish every computed Bookings font. No animation measurement. [Font source](https://cal.com/font)

**Handover inferences:**

- Teacher: Pending needing my response first; accepted/completed/cancelled separately. Rows show time,class,inviter,and summary before detail.
- Student: chronological confirmed-future information without approval controls.
- Admin: status grouping plus combined filters; lists find requests and timetables reveal conflicts.

**Do not transplant:** public appointment time selection is not fixed school periods. Round-robin,payments,and routing are not new scope. Tiny dense booking rows are inappropriate for the historically localized phone interface.

## Recommendations for the integrated proposal

These were proposals requiring approval,not measured Handover results:

1. Use WebUntis week/course context,Classroom content grouping,and Cal.com response queue,not a three-brand color collage.
2. Role-specific home: teacher lessons/response queue,student next lesson/todos,admin pending/conflicts,with consistent information and states.
3. Distinguish Draft,Pending,Accepted,Declined,Completed,Cancelled in the proposal; lesson Changed is separate. Implementation must map the proposed Accepted label to official API Confirmed,not create another state.
4. The historical proposal included long localized text,empty/error/loading/focus/disabled states,not only happy-path English.
5. Verify historical English/Traditional Chinese typography and date/period numerals. Manrope/Noto Sans TC was Handover's own proposed choice,not a font measured in the reference products. Current English-only scope removes Noto.
6.1440week+queue,768fewer columns with stable order,390day list/single-column form with optional local horizontal week scrolling. These were untested layout proposals.

Applied the [design-system skill](/Users/zhuangzijin/.agents/skills/design-system/SKILL.md) primitive/semantic/component and state-token principles,separating brand and status colors while reserving focus,busy,error,empty,and dark tokens. No code-generation script or CSS edit was performed in this research.
