# Screenshots

Captured from the running English-only Handover app in desktop Chromium on **2026-10-05**. The dev E2E run passed 13/13 and regenerated all eight PNGs. These are actual operating screens, not design mockups or physical-phone installation evidence. Width and height below are measured PNG dimensions.

| File | Measured PNG | What it shows |
| --- | --- | --- |
| `01-login-en-1440.png` | 1440×900 | English sign-in |
| `02-student-next-lesson.png` | 1440×1325 | Student home and next lesson |
| `03-teacher-editor.png` | 1280×2486 | Teacher handover form after the conflict check |
| `04-admin-en-1440.png` | 1440×1875 | English admin overview |
| `05-student-390.png` | 390×1631 | Student home, install guide collapsed |
| `06-install-guide-390.png` | 390×1927 | Same width, install guide open |
| `07-teacher-768.png` | 768×1024 | Teacher home at a tablet viewport |
| `08-detail-390.png` | 390×2546 | Teacher handover detail |

The student and tablet-teacher captures were visually checked for healthy signed-in workspaces. The narrow student guide is collapsed in 05 and intentionally expanded in 06. The previous sign-in and admin images were replaced with the English filenames above.

At 390 the browser checks compare document scroll width and client width; the recorded dev suite passed without horizontal page overflow. A desktop browser at 390 CSS pixels is not an iPhone or Android home screen and does not prove that Add to Home Screen launched Handover as a standalone app.
