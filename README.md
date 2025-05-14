# 狼人殺遊戲架構設計

這個專案是一個狼人殺遊戲，支援文字命令介面和網頁介面（後續實作），並整合了不同類型的 AI 玩家，包括基本 AI 策略和 LLM 整合。

## 套件結構

### 1. 核心套件 (packages/)

#### `@werewolf/core`
**單一責任**: 核心遊戲資料結構與狀態管理
- 玩家模型 (Player)
- 角色定義 (Role)
- 遊戲狀態 (GameState)
- 事件系統 (EventSystem)
- 遊戲設定 (GameConfig)

#### `@werewolf/game-flow`
**單一責任**: 遊戲流程與回合控制
- 遊戲階段管理 (PhaseManager)
- 夜晚階段控制 (NightPhase)
- 白天階段控制 (DayPhase)
- 投票系統 (VotingSystem)
- 勝利條件檢查 (VictoryChecker)

#### `@werewolf/ai-players`
**單一責任**: AI玩家策略實作
- 基本策略AI (BasicAIStrategy)
- LLM整合策略 (LLMStrategy)
- AI動作產生器 (AIActionGenerator)
- Prompt模板管理 (PromptTemplateManager)
- 多平台LLM介面 (LLMProviderInterface)

#### `@werewolf/common`
**單一責任**: 通用工具與輔助函式
- 隨機工具 (RandomUtils)
- 日誌系統 (LoggerSystem)
- 類型定義 (TypeDefinitions)
- 時間控制工具 (TimerUtils)

### 2. 應用程式 (app/)

#### `app/cli`
**單一責任**: 命令列介面
- 命令列互動 (CLI)
- 輸入處理 (InputHandler)
- 文字輸出渲染 (OutputRenderer)
- 設定管理 (ConfigManager)

#### `app/web` (後續實作)
**單一責任**: 網頁介面
- 前端UI (React)
- API介面 (RESTful)
- 即時通訊 (WebSocket)
- 狀態管理 (Redux/Context)

## 關鍵模組與類別設計

### 核心類別

#### `Player` (玩家)
```
- id: string
- name: string
- role: Role
- alive: boolean
- actions: PlayerAction[]
- attributes: Map<string, any>
```

#### `Role` (角色)
```
- id: string
- name: string
- team: Team (VILLAGER | WEREWOLF | THIRD_PARTY)
- abilities: Ability[]
- nightAction: (game: Game) => Promise<ActionResult>
- dayAction: (game: Game) => Promise<ActionResult>
```

#### `Game` (遊戲)
```
- id: string
- players: Player[]
- currentPhase: Phase
- round: number
- history: GameEvent[]
- config: GameConfig
```

#### `PlayerController` (玩家控制器)
```
- type: HUMAN | BASIC_AI | LLM_AI | PROMPT_MANUAL
- getAction(context: GameContext): Promise<Action>
```

## 遊戲邏輯流程

1. **遊戲初始化**
   - 設定玩家數量和角色配置
   - 分配角色給玩家
   - 初始化遊戲狀態

2. **回合循環**
   - **夜晚階段**
     - 狼人選擇獵殺目標
     - 特殊角色依序執行夜間技能 (預言家查驗、女巫救人/毒人等)
     - 結算夜晚結果
   
   - **白天階段**
     - 公布夜晚死亡資訊
     - 玩家討論
     - 投票放逐
     - 檢查勝利條件

3. **遊戲結束**
   - 好人陣營勝利 (所有狼人出局)
   - 狼人陣營勝利 (狼人數量 >= 好人數量)
   - 特殊勝利條件 (如神職或第三方勝利)

## AI整合方案

### 1. 基本AI策略
- 基於規則和概率的簡單決策
- 支援不同角色的基本策略模式
- 可設置難度級別

### 2. LLM整合
- 支援OpenAI、Claude等多種LLM API
- 可設定角色風格和決策風格
- 記憶遊戲歷史記錄並分析
- 根據角色身份調整策略

### 3. 手動Prompt模式
- 產生視覺化的Prompt模板
- 提供複製功能
- 支援回填AI回應

## 資料流

1. `GameEngine` 初始化並管理遊戲狀態
2. `PhaseManager` 控制遊戲階段
3. 每個玩家的 `PlayerController` 處理動作輸入
4. `EventSystem` 處理和廣播遊戲事件
5. UI層 (CLI或Web) 顯示遊戲狀態並收集輸入

## 介面與套件互動

應用程式的介面層 (CLI/Web) 僅依賴核心套件，而不是直接訪問其內部實作。這確保了業務邏輯的一致性和可測試性。

## 開發規劃

1. 首先實作核心套件 (`@werewolf/core`, `@werewolf/game-flow`)
2. 實作命令列介面 (`app/cli`)，確認遊戲邏輯是否正確
3. 實作基本AI玩家
4. 整合LLM API
5. 最後開發網頁版介面 (`app/web`)
