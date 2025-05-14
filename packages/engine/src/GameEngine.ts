import { RandomUtils, EventType, PlayerControllerType } from '@werewolf/common';
import { Game, GameConfig, Player, PlayerController, Role } from '@werewolf/core';
import { PhaseManager } from '@werewolf/game-flow';

/**
 * 遊戲引擎類別
 * 整合核心功能與遊戲流程
 */
export class GameEngine {
  /**
   * 遊戲實例
   */
  private game: Game;
  
  /**
   * 階段管理器
   */
  private phaseManager: PhaseManager;
  
  /**
   * 玩家控制器映射
   * 玩家ID -> 控制器
   */
  private playerControllers: Map<string, PlayerController> = new Map();
  
  /**
   * 角色工廠函式
   */
  private roleFactory: (roleId: string) => Promise<Role>;
  
  /**
   * 建立遊戲引擎
   * @param config 遊戲配置
   * @param roleFactory 角色工廠函式
   */
  constructor(config: GameConfig, roleFactory: (roleId: string) => Promise<Role>) {
    // 建立遊戲實例
    this.game = new Game(RandomUtils.generateId('game_'), config);
    
    // 建立階段管理器
    this.phaseManager = new PhaseManager(this.game);
    
    // 保存角色工廠
    this.roleFactory = roleFactory;
    
    // 監聽遊戲事件
    this.setupEventListeners();
  }
  
  /**
   * 設置事件監聽
   */
  private setupEventListeners(): void {
    // 監聽遊戲結束事件
    this.game.events.subscribe(EventType.GAME_END, (event) => {
      console.log('遊戲結束!', event.data);
    });
    
    // 可以添加更多事件監聽...
  }
  
  /**
   * 添加玩家
   * @param name 玩家名稱
   * @param controller 玩家控制器
   * @returns 玩家ID
   */
  addPlayer(name: string, controller: PlayerController): string {
    if (this.game.state.initialized) {
      throw new Error('遊戲已初始化，無法添加玩家');
    }
    
    // 建立玩家
    const playerId = RandomUtils.generateId('player_');
    const player = new Player(playerId, name);
    
    // 添加到遊戲
    this.game.addPlayer(player);
    
    // 保存控制器
    this.playerControllers.set(playerId, controller);
    
    return playerId;
  }
  
  /**
   * 添加AI玩家
   * @param name 玩家名稱
   * @param type AI類型
   * @returns 玩家ID
   */
  addAIPlayer(name: string, type: PlayerControllerType.BASIC_AI | PlayerControllerType.LLM_AI): string {
    // 需要實現不同類型的AI控制器
    // 暫時返回空，等待AI控制器實現
    return '';
  }
  
  /**
   * 獲取玩家控制器
   * @param playerId 玩家ID
   * @returns 控制器或undefined
   */
  getPlayerController(playerId: string): PlayerController | undefined {
    return this.playerControllers.get(playerId);
  }
  
  /**
   * 初始化遊戲
   */
  async initialize(): Promise<void> {
    // 驗證玩家數量
    if (this.game.players.length < this.game.config.minPlayers) {
      throw new Error(`至少需要 ${this.game.config.minPlayers} 名玩家`);
    }
    
    // 分配角色
    await this.game.assignRoles(this.roleFactory);
  }
  
  /**
   * 啟動遊戲
   */
  async start(): Promise<void> {
    if (!this.game.state.initialized) {
      throw new Error('遊戲尚未初始化');
    }
    
    // 啟動遊戲流程
    await this.phaseManager.start();
  }
  
  /**
   * 暫停遊戲
   */
  pause(): void {
    this.phaseManager.pause();
  }
  
  /**
   * 恢複遊戲
   */
  resume(): void {
    this.phaseManager.resume();
  }
  
  /**
   * 獲取遊戲實例
   * @returns 遊戲實例
   */
  getGame(): Game {
    return this.game;
  }
}
