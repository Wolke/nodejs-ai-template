/**
 * 角色配置介面
 */
export interface RoleConfig {
  roleId: string;
  count: number;
}

/**
 * 遊戲配置類別
 * 定義遊戲的各種設定參數
 */
export class GameConfig {
  /**
   * 最少遊戲玩家數量
   */
  minPlayers: number = 6;
  
  /**
   * 最大遊戲玩家數量
   */
  maxPlayers: number = 18;
  
  /**
   * 角色配置
   */
  roleConfig: RoleConfig[] = [];
  
  /**
   * 是否隨機分配角色
   */
  randomRoles: boolean = true;
  
  /**
   * 夜晚階段時間限制（毫秒）
   */
  nightPhaseTimeLimit: number = 60000;
  
  /**
   * 討論階段時間限制（毫秒）
   */
  discussionPhaseTimeLimit: number = 120000;
  
  /**
   * 投票階段時間限制（毫秒）
   */
  votePhaseTimeLimit: number = 30000;
  
  /**
   * 每輪發言時間限制（毫秒）
   */
  speechTimePerPlayer: number = 30000;
  
  /**
   * 是否允許死亡玩家旁觀
   */
  allowSpectators: boolean = true;
  
  /**
   * 第一夜是否有可能死亡
   */
  allowFirstNightDeath: boolean = false;
  
  /**
   * 是否啟用平票重新投票
   */
  enableTiebreaker: boolean = true;
  
  /**
   * 死亡玩家是否顯示角色
   */
  revealRoleOnDeath: boolean = true;
  
  /**
   * AI玩家決策延遲（毫秒）
   */
  aiDecisionDelay: number = 1000;
  
  /**
   * 遊戲模式
   * - normal: 標準模式
   * - chaos: 混沌模式（角色能力有隨機變化）
   * - hidden: 隱藏模式（角色分配不公開）
   */
  gameMode: 'normal' | 'chaos' | 'hidden' = 'normal';
  
  /**
   * 建立遊戲配置
   * @param config 配置參數
   */
  constructor(config: Partial<GameConfig> = {}) {
    Object.assign(this, config);
  }
  
  /**
   * 驗證配置是否有效
   * @throws 如果配置無效則拋出錯誤
   */
  validate(): void {
    // 檢查玩家數量範圍
    if (this.minPlayers <= 0) {
      throw new Error('最少玩家數量必須大於零');
    }
    
    if (this.maxPlayers < this.minPlayers) {
      throw new Error('最大玩家數不能小於最少玩家數');
    }
    
    // 檢查角色配置
    if (this.roleConfig.length === 0) {
      throw new Error('必須設定至少一個角色配置');
    }
    
    // 計算總角色數量
    const totalRoles = this.roleConfig.reduce((sum, config) => sum + config.count, 0);
    
    // 確保總角色數量在允許範圍內
    if (totalRoles < this.minPlayers || totalRoles > this.maxPlayers) {
      throw new Error(`角色總數 (${totalRoles}) 必須在 ${this.minPlayers} 至 ${this.maxPlayers} 之間`);
    }
  }
  
  /**
   * 取得該配置所需的總玩家數量
   * @returns 總玩家數量
   */
  getTotalPlayers(): number {
    return this.roleConfig.reduce((sum, config) => sum + config.count, 0);
  }
}
