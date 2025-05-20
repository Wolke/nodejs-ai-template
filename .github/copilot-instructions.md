# Copilot Collaboration Instructions

本專案採用 **內部套件化 ＋ 併行對話工作流**，並以「**統一技術規格** ＋ **Prototype‑first**」兩大策略，確保大型 TypeScript monorepo 在 Copilot／GPT 系統中既能平行開發，又能最終無痛整合。

---
## ✨ 流程總覽

| Stage | 目的 | 主要輸出物 |
| --- | --- | --- |
| 0️⃣ Architecture Kick‑off | 確認 monorepo 架構與各套件邊界 | ✅ Architecture Checklist |
| 0️⃣＋ Global Coding Guideline | **一次性** 定義全案技術規格 | `docs/coding‑guideline.md` ＋ 標準 config 檔 |
| 0️⃣＋ Quick Prototype Demo | <200 行可執行 demo；未完成套件用 stub/mock | `demo/` 原型程式 ＋ e2e 腳本 |
| 1️⃣ Task Definition per Package | 撰寫 Task Brief | `tasks/<package>.md` |
| 2️⃣ Threaded Execution | 各 Task 串並行開發 | PR 分支 ＋ 單元測試 |
| 3️⃣ Merge & Review | 整合、版本、發佈 | 合併至 `main` |

> **‼️ 三份 0️⃣ 輸出物**（Architecture、Guideline、Prototype）**全數通過審核後**，才可進入 1️⃣ Task Definition。

---
## 0️⃣ Architecture Kick‑off

1. **產出架構草圖**
   • Monorepo 目錄結構（`packages/<pkg>/src`）
   • 交互關係：誰依賴誰、公共型別位置
2. **核對清單**

   * [ ] 每套件具單一責任 (SRP)
   * [ ] 對外 API 皆自 `index.ts` **named exports**
   * [ ] 測試策略（單元／e2e）對齊
   * [ ] CI job （build＋test＋lint）涵蓋根與各套件

Checklist 未全滿足不得進入下一步。

---
## 0️⃣＋ Global Coding Guideline

所有套件必須遵守以下統一規格；例外需在 Task Brief 中聲明並經 Tech Lead 核准。

| 分類 | 規格 |
| --- | --- |
| Module Format | **ESM** (`"type": "module"`)，CJS 僅由 tsup 於 dist 層輸出 |
| 編譯器 | `tsup`（esbuild）輸出 `dist/` |
| TS Target | `ES2022`；各套件 `extends` root `tsconfig.base.json` |
| 單元測試 | `Vitest` coverage ≥ 90% |
| E2E 測試 | `zx` 或 `Playwright` 視需求 |
| Lint & Format | `eslint@airbnb` ＋ `prettier`（root 設定） |
| 發佈流程 | `changesets` 自動產生版本＆changelog，公開包採 npm 2FA |
| Git Hook | `lefthook` 統一 pre‑commit（lint＋test） |
| Script 唯一命名 | `dev`／`build`／`test`／`lint`／`release` |
| 路徑別名 | `@/` 指向根 `src/`（tsconfig paths ＋ esbuild alias） |

規格文件位於 `docs/coding‑guideline.md`，並由 CI 檢查各套件遵循。

---
## 0️⃣＋ Quick Prototype Demo

在正式拆分套件前，**先完成最小可運行 demo**，驗證端到端流程。

🎯 **目標**
- 行數 ≤ 200（含空白／註解）
- CLI 或簡易 HTTP 端點可觀察輸出
- 未實作功能以 stub/mock 取代並標註 `TODO:`

📂 **範例結構**
```
/demo
  ├─ main.ts        # 入口
  ├─ stubs/         # 假資料
  └─ e2e.test.ts    # 端到端測試
```

✅ **驗收**
1. `pnpm demo`／`pnpm test -r demo` 必須成功。
2. 維護者標記 `DEMO APPROVED` 後，才能依 Prototype 拆套件。

---
## 1️⃣ Task Definition per Package

Task Brief 範本：
```md
# Task: @myproject/string-utils

## 需求
- 不引入第三方 lib
- 100% coverage (Vitest)
- index.ts 有 JSDoc
- 先寫 test 再實作

## Done Definition
- [ ] index.ts 有 JSDoc
- [ ] `pnpm --filter string-utils test` 通過
- [ ] README 範例可執行
```

完成 Task Brief → 更新 `tasks/overview.md` → **待** Maintainer 發 `START CODING` 指令 → 進入 2️⃣ Threaded Execution。

---
## 📋 Task Overview

| Package | 狀態 | 優先級 | 備註 |
| --- | --- | --- | --- |
| string-utils | 🆕 | P1 | 基礎工具 |
| billing-core | 🚧 | P2 | 依賴 string-utils |

🆕 待開發｜🚧 開發中｜✅ 完成｜🔄 重構中

---
## 2️⃣ Threaded Execution

* 對話串：`TASK: <package>`
* 分支：`feature/<package>`／`task/<package>`
* 依賴最小化：僅讀 `index.ts`、`README.md`、`tests/`，**勿深入實作**
* 文件：必填 `index.ts`、`README.md`、`tests/`
* 多 Copilot session 可並行
* 完成 → PR ＋ changelog

---
## 3️⃣ Merge & Review

1. 檢查 Task Brief Done、依賴循環、Coding Guideline
2. 通過後：
```bash
pnpm -r version patch
```
   Merge & Tag → Optional 自動發佈

---
## Copilot Tips

* 確認 Copilot *Agent mode*
* 等 `START CODING` 指令
* 優先用內部包 API
* 發現重複請提 PR／更新 Brief
* **禁止** 同對話改多套件

---
## Example Package
```ts
export function countChar(str: string, char: string) {
  return [...str].filter(c => c === char).length;
}
```
```jsonc
{
  "name": "@myproject/string-utils",
  "version": "1.0.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "type": "module"
}
```

---
## 注意事項

* breaking change 必在 Brief 明示
* 先遷移呼叫端，再刪舊碼
* **三份 0️⃣ 輸出物** 完成後才啟動首個 Task
* 每 Task Brief 獨立；單對話不可改多套件
