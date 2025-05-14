/**
 * 遊戲團隊枚舉
 */
export enum Team {
  VILLAGER = 'villager',
  WEREWOLF = 'werewolf',
  THIRD_PARTY = 'third_party',
}

/**
 * 玩家控制器類型枚舉
 */
export enum PlayerControllerType {
  HUMAN = 'human',
  BASIC_AI = 'basic_ai',
  LLM_AI = 'llm_ai',
  PROMPT_MANUAL = 'prompt_manual',
}

/**
 * 遊戲階段枚舉
 */
export enum PhaseType {
  SETUP = 'setup',
  NIGHT = 'night',
  DAY_DISCUSSION = 'day_discussion',
  DAY_VOTE = 'day_vote',
  GAME_END = 'game_end',
}

/**
 * 遊戲事件類型枚舉
 */
export enum EventType {
  GAME_START = 'game_start',
  NIGHT_START = 'night_start',
  NIGHT_END = 'night_end',
  PLAYER_KILLED = 'player_killed',
  PLAYER_SAVED = 'player_saved',
  PLAYER_POISONED = 'player_poisoned',
  DAY_START = 'day_start',
  VOTE_START = 'vote_start',
  VOTE_CAST = 'vote_cast',
  PLAYER_ELIMINATED = 'player_eliminated',
  GAME_END = 'game_end',
  // 狼人角色相關事件
  WEREWOLF_SELECT_TARGET = 'werewolf_select_target',
  // 預言家角色相關事件
  SEER_CHECK = 'seer_check',
  // 女巫角色相關事件
  WITCH_SAVE = 'witch_save',
  WITCH_POISON = 'witch_poison',
  // 獵人角色相關事件
  HUNTER_SHOOT = 'hunter_shoot',
  // 守衛角色相關事件
  GUARD_PROTECT = 'guard_protect',
}

/**
 * 遊戲事件介面
 */
export interface GameEvent {
  type: EventType;
  round: number;
  phase: PhaseType;
  timestamp: number;
  playerId?: string;
  targetId?: string;
  data?: Record<string, any>;
}

/**
 * 動作結果介面
 */
export interface ActionResult {
  success: boolean;
  message: string;
  events: GameEvent[];
  data?: Record<string, any>;
}

/**
 * 玩家動作介面
 */
export interface PlayerAction {
  playerId: string;
  actionType: string;
  targetId?: string;
  data?: Record<string, any>;
}

/**
 * 遊戲上下文介面
 */
export interface GameContext {
  playerId: string;
  phase: PhaseType;
  round: number;
  alivePlayers: string[];
  knownInfo: Record<string, any>;
  history: GameEvent[];
}

/**
 * 角色能力介面
 */
export interface Ability {
  id: string;
  name: string;
  description: string;
  phase: PhaseType;
  usageLimit?: number;
  targetType: 'self' | 'other' | 'multiple' | 'none';
}
