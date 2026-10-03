# Cursor supplemental prompt — round 01

補充原本 Handover 任務：使用者已要求 Codex 持續獨立驗收你的成果、直接把缺陷修正 Prompt 送回這個 Cursor chat，並包含 GitHub 上傳。這是協作補充，不是更換任務；請繼續原實作，保留既有資料。

請讀取 /Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/.codex-review/ACCEPTANCE.md，將它與原 Prompt 一起作為驗收清單。Codex 擁有 .codex-review/ACCEPTANCE.md 及其 review 報告，請勿自行把該清單標為通過。

請實際探索可用 Skills（.cursor/skills、.agents/skills、~/.cursor/skills、~/.agents/skills、~/.codex/skills 與工具目錄），在當前工作相關時讀 SKILL.md 並使用。優先 professional-project-starter、design-system/ui-styling/ui-ux-pro-max、workers-best-practices/security-best-practices、tdd/diagnosing-bugs、playwright/agent-browser、ai-debt-detector 及適合現有部署平台的技能。紀錄採用了哪些技能、產生了什麼成果，勿只是列名字；不存在的工具不可假裝使用。無關的技能不需硬套。

使用者已授權 GitHub 上傳。先完成本機驗收與 secrets 檢查，讓 Codex 獨立驗收後再推送最終成果；保留 focused branch，不 force-push、不刪無關修改。你可以先準備 repo/branch/CI。不要停止在只完成骨架、或以 Known Limitations 掩蓋 P0 缺項。

每輪你完成穩定、可供驗收的成果或遇到外部阻礙時，請建立／更新：
/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/.codex-review/CURSOR_STATUS.json

格式為 JSON：
{
  "status": "ready_for_review 或 blocked",
  "round": 1,
  "updatedAt": "ISO 時間",
  "projectPath": "實際專案絕對路徑",
  "gitHead": "若有 Git 的當前完整 SHA，否則 null",
  "completedRequirements": ["你認為已完成的驗收 ID"],
  "checks": [{"command":"實際執行命令","exitCode":0,"summary":"實際結果"}],
  "publicUrl": null,
  "githubUrl": null,
  "knownLimitations": [],
  "blockers": []
}

開始下一輪實作時改 status 為 working。GitHub 與網址只能填真實且可用的結果；不可把預期 URL 當部署完成。你填的結果只是交接資訊，Codex 仍會自己跑測試與看程式碼。最後在 chat 清楚說本輪可驗收，讓我們能判斷你是否停止修改。

遇到可自行解決的失敗就繼續修正。需要帳號登入、付款、同意條款或無法取得的憑證才列出具體 blocker，並先完成其他獨立工作。不能替使用者按 Devpost 最終提交。
