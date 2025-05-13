# nodejs-ai-template

## 專案架構：內部套件化策略

本專案採用「內部套件化（internal packages）」策略，將穩定的程式碼封裝為內部套件，以減少 Copilot / GPT 模型在大型 TypeScript 專案中產生幻覺或重複程式碼的風險。

### 為什麼使用內部套件化？

當專案程式碼量增大，LLM 可能無法記住所有上下文，導致：
- 忘記已有功能而重寫
- 重複產生類似程式碼
- 誤用函式或物件結構

### 套件化策略流程

#### 1. 將穩定邏輯抽出成內部套件
- 路徑格式：`packages/<package-name>/`
- 每個套件需具備以下結構：
  ```bash
  packages/
    your-package/
      src/
        index.ts
        ...other files
      package.json
      tsconfig.json
  ```

#### 2. 註明每個套件的單一責任
例如：
- `string-utils`：字串處理邏輯
- `billing-core`：費用計算核心邏輯

#### 3. 在主專案中使用套件
- 使用 `pnpm` 的 monorepo 管理方式
- 使用 `import { xxx } from '@your-scope/your-package'` 匯入套件功能
- 每個套件的 `package.json` 中要設好 `"name": "@your-scope/your-package"`

#### 4. 寫好暴露點 `index.ts`
讓 Copilot 可以清楚知道此套件有哪些對外功能。

### 範例

#### 套件 `string-utils`

**packages/string-utils/src/index.ts**
```ts
export function countChar(str: string, char: string): number {
  return [...str].filter(c => c === char).length;
}
```

**packages/string-utils/package.json**
```json
{
  "name": "@myproject/string-utils",
  "version": "1.0.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts"
}
```

#### 主程式使用
```ts
import { countChar } from '@myproject/string-utils';

const count = countChar('hello world', 'l'); // 3
```

### 注意事項
- 若有多層資料結構或共用邏輯，建議以 README 說明每個套件的使用情境與限制。
- 一次只專注在一個套件的開發，避免同時修改多個套件導致上下文混亂。
- 使用內部套件可大幅減少重複程式碼產生，提高專案維護性。
