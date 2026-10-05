# Cursor supplemental prompt — round 01

Historical collaboration prompt, translated into English on 2026-10-05. It records the authorization and workflow at that time, rather than issuing a new external action.

Supplement to the original Handover task: the user asked Codex to continue independent acceptance, send concrete repair prompts back to this Cursor conversation, and include GitHub upload. This supplements rather than replaces the task. Continue implementation and preserve existing data.

Read `/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/.codex-review/ACCEPTANCE.md` alongside the original prompt. Codex owns the acceptance checklist and review reports; do not mark its checklist passed yourself.

Explore actual available skills in `.cursor/skills`, `.agents/skills`, `~/.cursor/skills`, `~/.agents/skills`, `~/.codex/skills`, and tool directories. Read and apply relevant SKILL.md files. Candidate skills include professional-project-starter, design-system/ui-styling/ui-ux-pro-max, workers/security best practices, tdd/diagnosing-bugs, playwright/agent-browser, ai-debt-detector, and the existing deployment platform's guidance. Record concrete use and outcomes, not only names. Do not pretend an unavailable tool was used or force irrelevant skills into the task.

GitHub upload was user-authorized. Complete local acceptance and secret checks, then let Codex independently review before pushing the final result. Keep a focused branch; no force-push or deletion of unrelated changes. Repository, branch, and CI preparation may proceed. Do not stop at a skeleton or conceal missing P0 behavior as a known limitation.

For each stable handback or genuine external blocker, create/update:
`/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/.codex-review/CURSOR_STATUS.json`.

Example JSON fields:

```json
{
  "status": "ready_for_review or blocked",
  "round": 1,
  "updatedAt": "ISO timestamp",
  "projectPath": "actual absolute project path",
  "gitHead": "current full Git SHA, or null when unavailable",
  "completedRequirements": ["acceptance IDs believed complete"],
  "checks": [{"command":"actual command","exitCode":0,"summary":"actual result"}],
  "publicUrl": null,
  "githubUrl": null,
  "knownLimitations": [],
  "blockers": []
}
```

Set status to working when the next implementation round starts. URLs must be real and usable; an expected hostname does not establish deployment. Status is handoff information, not independent validation: Codex still inspects source and runs checks. Clearly say when the stable result is ready and editing has stopped.

Continue fixing locally solvable failures. Report specific blockers only when required login, payment, terms, or unavailable credentials prevent progress, and finish unrelated work first. Do not perform the user's final Devpost submission.
