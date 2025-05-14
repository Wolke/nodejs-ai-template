import { EventType, PhaseType, PlayerAction } from '@werewolf/common';
import { Game, Player } from '@werewolf/core';
import { Phase, PhaseResult } from './Phase';

/**
 * 夜晚階段類別
 * 處理遊戲的夜晚階段邏輯
 */
export class NightPhase extends Phase {
  /**
   * 夜晚行動順序
   * 定義不同角色在夜晚行動的順序
   */
  private readonly actionOrder: string[] = [
    'werewolf', // 狼人先行動
    'seer',     // 預言家
    'witch',    // 女巫
    'guard',    // 守衛
    'hunter'    // 獵人
    // 可添加更多角色
  ];
  
  /**
   * 已完成行動的玩家ID
   */
  private completedActions: Set<string> = new Set();
  
  /**
   * 夜晚行動結果
   */
  private actionResults: Record<string, any> = {};
  
  /**
   * 建立夜晚階段實例
   * @param timeLimit 時間限制（毫秒）
   */
  constructor(timeLimit: number) {
    super(PhaseType.NIGHT, '夜晚階段', timeLimit);
  }
  
  /**
   * 重置階段狀態
   */
  private reset(): void {
    this.completedActions.clear();
    this.actionResults = {};
  }
  
  /**
   * 執行夜晚階段
   * @param game 遊戲實例
   * @returns 階段結果的 Promise
   */
  protected async executePhase(game: Game): Promise<PhaseResult> {
    // 重置階段狀態
    this.reset();
    
    // 發布夜晚開始事件
    game.publishEvent({
      type: EventType.NIGHT_START,
      round: game.round,
      phase: PhaseType.NIGHT,
      timestamp: Date.now()
    });
    
    // 按照角色順序執行夜晚行動
    for (const roleId of this.actionOrder) {
      await this.processRoleActions(game, roleId);
    }
    
    // 結算夜晚階段結果
    const deaths = this.resolveNightResults(game);
    
    // 發布夜晚結束事件
    game.publishEvent({
      type: EventType.NIGHT_END,
      round: game.round,
      phase: PhaseType.NIGHT,
      timestamp: Date.now(),
      data: { deaths }
    });
    
    // 返回階段結果
    return {
      success: true,
      nextPhase: PhaseType.DAY_DISCUSSION,
      data: { deaths }
    };
  }
  
  /**
   * 處理指定角色的夜晚行動
   * @param game 遊戲實例
   * @param roleId 角色ID
   */
  private async processRoleActions(game: Game, roleId: string): Promise<void> {
    // 找出擁有該角色的所有存活玩家
    const rolePlayers = game.players.filter(player => 
      player.alive && 
      player.role?.id === roleId
    );
    
    // 如果沒有該角色的玩家，則跳過
    if (rolePlayers.length === 0) {
      return;
    }
    
    // 狼人團隊需要一起行動
    if (roleId === 'werewolf') {
      await this.processWerewolfActions(game, rolePlayers);
    } else {
      // 其他角色各自獨立行動
      for (const player of rolePlayers) {
        await this.processPlayerNightAction(game, player);
      }
    }
  }
  
  /**
   * 處理狼人團隊的夜晚行動
   * @param game 遊戲實例
   * @param werewolves 狼人玩家列表
   */
  private async processWerewolfActions(game: Game, werewolves: Player[]): Promise<void> {
    // 狼人需要共同選擇一個獵殺目標
    // 這裡需要實現狼人團隊的投票機制
    // 暫時使用第一個狼人的選擇作為團隊決定
    
    const alpha = werewolves[0]; // 假設第一個狼人是狼王
    
    if (!alpha) {
      return; // 沒有狼人，直接返回
    }
    
    // 獲取狼王的行動
    const action = await this.getPlayerNightAction(game, alpha);
    
    if (!action || !action.targetId) {
      return; // 沒有選擇目標，直接返回
    }
    
    // 保存獵殺目標
    this.actionResults['werewolf_kill'] = {
      targetId: action.targetId,
      executorId: alpha.id
    };
    
    // 標記所有狼人為已完成行動
    werewolves.forEach(wolf => {
      this.completedActions.add(wolf.id);
    });
  }
  
  /**
   * 處理玩家的夜晚行動
   * @param game 遊戲實例
   * @param player 玩家實例
   */
  private async processPlayerNightAction(game: Game, player: Player): Promise<void> {
    // 如果玩家已經完成行動，則跳過
    if (this.completedActions.has(player.id)) {
      return;
    }
    
    // 獲取玩家的夜晚行動
    const action = await this.getPlayerNightAction(game, player);
    
    if (!action) {
      return; // 沒有行動，直接返回
    }
    
    // 執行角色的夜晚行動
    const role = player.role;
    if (role && typeof role.nightAction === 'function') {
      const result = await role.nightAction(game, player.id, action.targetId);
      
      // 保存行動結果
      this.actionResults[`${role.id}_${player.id}`] = {
        success: result.success,
        targetId: action.targetId,
        executorId: player.id,
        events: result.events,
        data: result.data
      };
    }
    
    // 標記玩家為已完成行動
    this.completedActions.add(player.id);
  }
  
  /**
   * 獲取玩家的夜晚行動
   * @param game 遊戲實例
   * @param player 玩家實例
   * @returns 玩家行動的 Promise
   */
  private async getPlayerNightAction(game: Game, player: Player): Promise<PlayerAction | null> {
    // 這裡應該呼叫 PlayerController 來獲取玩家行動
    // 但目前還沒有完整實現，先返回 null
    // 後續需要修改為真實的玩家行動獲取邏輯
    return null;
  }
  
  /**
   * 結算夜晚結果
   * @param game 遊戲實例
   * @returns 死亡的玩家ID列表
   */
  private resolveNightResults(game: Game): string[] {
    // 處理狼人的獵殺
    const werewolfKill = this.actionResults['werewolf_kill'];
    const deaths: string[] = [];
    
    if (werewolfKill && werewolfKill.targetId) {
      const targetPlayer = game.getPlayer(werewolfKill.targetId);
      
      if (targetPlayer && targetPlayer.alive) {
        // 檢查是否有女巫救人或守衛保護
        const isSaved = this.checkIfPlayerSaved(werewolfKill.targetId);
        const isProtected = this.checkIfPlayerProtected(game, werewolfKill.targetId);
        
        if (!isSaved && !isProtected) {
          // 玩家被殺死
          targetPlayer.kill('被狼人殺害');
          deaths.push(targetPlayer.id);
          
          // 發布玩家死亡事件
          game.publishEvent({
            type: EventType.PLAYER_KILLED,
            round: game.round,
            phase: PhaseType.NIGHT,
            timestamp: Date.now(),
            playerId: werewolfKill.executorId,
            targetId: targetPlayer.id,
            data: { reason: '狼人殺害' }
          });
        }
      }
    }
    
    // 處理女巫的毒藥
    const witchPoisonResult = this.getWitchPoisonResult();
    
    if (witchPoisonResult && witchPoisonResult.targetId) {
      const targetPlayer = game.getPlayer(witchPoisonResult.targetId);
      
      if (targetPlayer && targetPlayer.alive) {
        // 玩家被毒死
        targetPlayer.kill('被女巫毒死');
        deaths.push(targetPlayer.id);
        
        // 發布玩家被毒死事件
        game.publishEvent({
          type: EventType.PLAYER_POISONED,
          round: game.round,
          phase: PhaseType.NIGHT,
          timestamp: Date.now(),
          playerId: witchPoisonResult.executorId,
          targetId: targetPlayer.id,
          data: { reason: '女巫毒藥' }
        });
      }
    }
    
    // 處理其他可能導致死亡的特殊角色行動
    // ...
    
    return deaths;
  }
  
  /**
   * 檢查玩家是否被守衛保護
   * @param game 遊戲實例
   * @param playerId 玩家ID
   * @returns 是否被保護
   */
  private checkIfPlayerProtected(game: Game, playerId: string): boolean {
    // 檢查所有守衛行動
    for (const [key, result] of Object.entries(this.actionResults)) {
      if (key.startsWith('guard_') && result.success && result.targetId === playerId) {
        return true;
      }
    }
    return false;
  }
  
  /**
   * 檢查玩家是否被女巫救活
   * @param playerId 玩家ID
   * @returns 是否被救活
   */
  private checkIfPlayerSaved(playerId: string): boolean {
    // 檢查所有女巫救人行動
    for (const [key, result] of Object.entries(this.actionResults)) {
      if (key.startsWith('witch_') && 
          result.success && 
          result.targetId === playerId && 
          result.data && 
          result.data.action === 'save') {
        return true;
      }
    }
    return false;
  }
  
  /**
   * 獲取女巫的毒藥結果
   * @returns 毒藥結果或undefined
   */
  private getWitchPoisonResult(): { executorId: string, targetId: string } | undefined {
    for (const [key, result] of Object.entries(this.actionResults)) {
      if (key.startsWith('witch_') && 
          result.success && 
          result.data && 
          result.data.action === 'poison') {
        return {
          executorId: result.executorId,
          targetId: result.targetId
        };
      }
    }
    return undefined;
  }
  
  /**
   * 處理階段超時
   * @param game 遊戲實例
   * @returns 階段結果的 Promise
   */
  protected async handleTimeout(game: Game): Promise<PhaseResult> {
    // 如果有玩家還沒有行動，則強制結束他們的行動
    const alivePlayers = game.getAlivePlayers();
    
    for (const player of alivePlayers) {
      if (!this.completedActions.has(player.id) && player.role) {
        // 標記為已完成
        this.completedActions.add(player.id);
        
        // 記錄逾時日誌
        console.log(`玩家 ${player.name}(${player.id}) 在夜晚階段超時未行動`);
      }
    }
    
    // 結算夜晚階段結果
    const deaths = this.resolveNightResults(game);
    
    // 發布夜晚結束事件
    game.publishEvent({
      type: EventType.NIGHT_END,
      round: game.round,
      phase: PhaseType.NIGHT,
      timestamp: Date.now(),
      data: { 
        deaths,
        timeout: true
      }
    });
    
    // 返回階段結果
    return {
      success: true,
      nextPhase: PhaseType.DAY_DISCUSSION,
      message: '夜晚階段已超時結束',
      data: { 
        deaths,
        timeout: true
      }
    };
  }
}
