import { PhaseType, GameEvent, EventType, Team } from '@werewolf/common';
import { Player } from './Player';
import { GameConfig } from './GameConfig';
import { EventSystem } from './EventSystem';
import { RandomUtils } from '@werewolf/common';

/**
 * 遊戲狀態類別
 * 維護遊戲的當前狀態資訊
 */
export class GameState {
  /**
   * 遊戲狀態是否初始化完成
   */
  initialized: boolean = false;
  
  /**
   * 目前遊戲回合數
   */
  round: number = 0;
  
  /**
   * 目前遊戲階段
   */
  currentPhase: PhaseType = PhaseType.SETUP;
  
  /**
   * 目前階段開始時間
   */
  phaseStartTime: number = 0;
  
  /**
   * 遊戲是否結束
   */
  isGameOver: boolean = false;
  
  /**
   * 獲勝的團隊
   */
  winningTeam?: Team;
  
  /**
   * 階段特定資料
   */
  phaseData: Record<string, any> = {};
  
  /**
   * 清除階段資料
   */
  clearPhaseData(): void {
    this.phaseData = {};
  }
  
  /**
   * 開始新階段
   * @param phase 階段類型
   */
  startPhase(phase: PhaseType): void {
    this.currentPhase = phase;
    this.phaseStartTime = Date.now();
    this.clearPhaseData();
  }
}

/**
 * 遊戲類別
 * 管理遊戲的整體狀態和邏輯
 */
export class Game {
  /**
   * 遊戲唯一ID
   */
  readonly id: string;
  
  /**
   * 遊戲設定
   */
  readonly config: GameConfig;
  
  /**
   * 玩家列表
   */
  private _players: Player[] = [];
  
  /**
   * 遊戲事件歷史
   */
  private _history: GameEvent[] = [];
  
  /**
   * 事件系統
   */
  readonly events: EventSystem;
  
  /**
   * 遊戲狀態
   */
  readonly state: GameState;
  
  /**
   * 建立遊戲實例
   * @param id 遊戲ID
   * @param config 遊戲設定
   */
  constructor(id: string, config: GameConfig) {
    this.id = id;
    this.config = config;
    this.events = new EventSystem();
    this.state = new GameState();
    
    // 驗證遊戲設定
    this.config.validate();
    
    // 監聽所有事件並記錄到歷史中
    this.events.subscribeAll((event) => {
      this._history.push(event);
    });
  }
  
  /**
   * 獲取當前回合數
   */
  get round(): number {
    return this.state.round;
  }
  
  /**
   * 獲取當前遊戲階段
   */
  get currentPhase(): PhaseType {
    return this.state.currentPhase;
  }
  
  /**
   * 獲取玩家列表
   */
  get players(): Player[] {
    return [...this._players];
  }
  
  /**
   * 獲取事件歷史
   */
  get history(): GameEvent[] {
    return [...this._history];
  }
  
  /**
   * 添加玩家
   * @param player 玩家實例
   */
  addPlayer(player: Player): void {
    if (this.state.initialized) {
      throw new Error('遊戲已初始化，無法再添加玩家');
    }
    
    if (this._players.some(p => p.id === player.id)) {
      throw new Error(`已存在ID為 ${player.id} 的玩家`);
    }
    
    this._players.push(player);
  }
  
  /**
   * 獲取指定ID的玩家
   * @param playerId 玩家ID
   * @returns 玩家實例或undefined
   */
  getPlayer(playerId: string): Player | undefined {
    return this._players.find(player => player.id === playerId);
  }
  
  /**
   * 獲取所有存活玩家
   * @returns 存活玩家列表
   */
  getAlivePlayers(): Player[] {
    return this._players.filter(player => player.alive);
  }
  
  /**
   * 獲取特定團隊的存活玩家數量
   * @param team 團隊類型
   * @returns 存活玩家數量
   */
  getAliveTeamCount(team: Team): number {
    return this._players.filter(
      player => player.alive && player.role?.team === team
    ).length;
  }
  
  /**
   * 發布遊戲事件
   * @param event 遊戲事件
   */
  publishEvent(event: GameEvent): void {
    this.events.publish(event);
  }
  
  /**
   * 開始新的遊戲回合
   */
  startNewRound(): void {
    this.state.round++;
    
    // 發布回合開始事件
    this.publishEvent({
      type: EventType.NIGHT_START,
      round: this.state.round,
      phase: PhaseType.NIGHT,
      timestamp: Date.now()
    });
    
    // 設定當前階段為夜晚
    this.state.startPhase(PhaseType.NIGHT);
  }
  
  /**
   * 隨機分配角色給玩家
   * @param roleFactory 角色工廠函式
   */
  async assignRoles(roleFactory: (roleId: string) => Promise<any>): Promise<void> {
    if (this._players.length < this.config.minPlayers) {
      throw new Error(`至少需要 ${this.config.minPlayers} 名玩家才能開始遊戲`);
    }
    
    const roleList: string[] = [];
    
    // 根據配置生成角色清單
    for (const roleConfig of this.config.roleConfig) {
      for (let i = 0; i < roleConfig.count; i++) {
        roleList.push(roleConfig.roleId);
      }
    }
    
    if (roleList.length !== this._players.length) {
      throw new Error(`角色數量 (${roleList.length}) 與玩家數量 (${this._players.length}) 不符`);
    }
    
    // 隨機打亂角色順序
    const shuffledRoles = RandomUtils.shuffle(roleList);
    
    // 為每個玩家分配角色
    for (let i = 0; i < this._players.length; i++) {
      const roleId = shuffledRoles[i];
      const role = await roleFactory(roleId);
      this._players[i].role = role;
    }
    
    this.state.initialized = true;
    
    // 發布遊戲開始事件
    this.publishEvent({
      type: EventType.GAME_START,
      round: 0,
      phase: PhaseType.SETUP,
      timestamp: Date.now()
    });
  }
}
