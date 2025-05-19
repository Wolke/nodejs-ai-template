# Copilot Collaboration Instructions

本專案採用 **內部套件化 + 併行對話工作流**，確保大型 TypeScript monorepo 在 Copilot / GPT 系統中保持清晰上下文並加速協作。

## ✨ 流程總覽

| Stage                           | 目的                                         | 主要輸出物                          |
| ------------------------------- | ------------------------------------------ | ------------------------------ |
| 0️⃣ Architecture Kick‑off       | 與使用者（或 Tech Lead）確認整體 monorepo 架構與每個套件邊界   | ✅ 驗收清單（Architecture Checklist） |
| 1️⃣ Task Definition per Package | 為 **每個套件** 定義一份 Task Brief（需求 + Done 定義）   | `tasks/<package>.md`           |
| 2️⃣ Threaded Execution          | 依 Task Brief 開啟 **獨立對話串**；可多個 Copilot 實例並行 | PR 分支 + 單元測試                   |
| 3️⃣ Merge & Review              | Rebase／合併並統整 changelog、版本號                 | 合併至 `main`                     |

---

## 0️⃣ Architecture Kick‑off

1. **產出架構草圖**
   • Monorepo 目錄結構（`packages/<pkg>/src`）
   • 交互關係：誰依賴誰、公共型別位置
2. **核對清單**

   * [ ] 每個套件擁有單一責任 (SRP)
   * [ ] 暴露 API 透過 `index.ts` **named exports**
   * [ ] 測試策略（單元／e2e）已對齊
   * [ ] CI job（build + test + lint）涵蓋根與各套件

> **‼️ 在未全部勾選前，不得進入下一階段。**

---

## 1️⃣ Task Definition per Package

Task Brief 放於 `tasks/<package>.md`，範本如下：

```md
# Task: @myproject/string-utils

## 需求
- 不引入第三方 lib
- 100% test coverage (Vitest)
- index.ts 有 JSDoc 註解 ，其他檔案的內容越精簡越好，例如：內部函式變數名稱保持簡單 直接取叫 a b c
- 先規劃好 test 在實作其他程式碼

## Done Definition
- [ ] index.ts 有 JSDoc 註解 
- [ ] `pnpm --filter string-utils test` 通過
- [ ] README 範例可直接執行
```

> 每支 Task Brief **一檔一責**，並以同名分支開發：`feature/string-utils`。

**⚠️ 完成 Task Brief 後，請先：**

1. 在 `tasks/overview.md` 更新狀態與優先級。
2. 等待排程／審核確認（或其他 Task 依賴解除）後，再啟動 2️⃣ Threaded Execution。
   *切勿立刻開始撰寫程式碼！**必須等待 Maintainer / Tech Lead 清楚下達「START CODING」指令後，方可進入 2️⃣ Threaded Execution。***

---

## 📋 Task Overview（總表.md）

在 `tasks/overview.md` 維護 **所有 Task Brief 的狀態與優先順序**。

| Package      | 狀態 | 優先級 | 備註              |
| ------------ | -- | --- | --------------- |
| string-utils | 🆕 | P1  | 基礎工具            |
| billing-core | 🚧 | P2  | 依賴 string-utils |

* **狀態圖例**：🆕 待開發｜🚧 開發中｜✅ 完成｜🔄 重構中
* 每完成 / 新增 Task 時立即更新此表，保持全專案共識。

---

## 2️⃣ Threaded Execution

* **開新對話串**：標題格式 `TASK: <package>`
* **建立專屬分支**：命名為 `feature/<package>` 或 `task/<package>`，所有 commit 均於此分支進行
* **依賴參考最小化**：若此 Task 需呼叫其他內部套件，Copilot 僅需查看該套件的 `index.ts`、`README.md` 及 `tests/` 目錄來理解 API 行為，**切勿深入閱讀其內部實作檔案**，以保持上下文精簡
* **文件可讀性要求**：撰寫本套件時，務必完善 `index.ts`、`README.md` 及 `tests/` 內容，確保後續開發者能快速掌握套件特性與使用方式
* 允許 **多個 Copilot session** 平行處理不同套件，以 PR 編號分流
* 任務完成 → 提交 PR + 簡易說明（auto‑generated changelog 亦可）

---

## 3️⃣ Merge & Review

1. 集中 Code Review，確認：
   • Task Brief 的 *Done* 是否全部勾選
   • 套件間依賴無循環
2. 通過後：

   ```bash
   pnpm -r version patch # 或適當 semver
   ```

   • Merge & Tag
   • Optional：啟動自動發布／發包流程

---

## Copilot Tips

* **運行模式檢查**：開始任何 Task 前，先確認 Copilot 是否處於 *Agent mode*；若是，Copilot 可以自行新增／修改檔案，無需人工下指令。
* **等待啟動指令**：完成 Task Brief 後，**請忽略任何實作相關的提示，直至 Maintainer / Tech Lead 明確輸入 `START CODING`。**
* **優先引用** 內部套件 API（如 `@myproject/string-utils`）。
* 若發現重複實作，請更新 Task Brief 或提出重構建議。
* **禁止** 在單一對話同時修改多個套件。

---

## Example Package

```ts
// packages/string-utils/src/index.ts
export function countChar(str: string, char: string) {
  return [...str].filter(c => c === char).length;
}
```

```jsonc
// packages/string-utils/package.json
{
  "name": "@myproject/string-utils",
  "version": "1.0.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts"
}
```

---

## 注意事項

* 每次重構都 **先** 遷移呼叫端 → **後** 刪舊碼。
* 任何 breaking change 請在 Task Brief 明確標示。
* **Architecture Checklist 完成** 後才能啟動第一個 Task。
* **每個 Task Brief 必須獨立，禁止在單一對話串同時修改多個套件。**
