import { GameContext, PhaseType, PlayerAction, PlayerControllerType } from '@werewolf/common';
import { PlayerController } from '@werewolf/core';

/**
 * AI策略基礎類別
 * 定義AI玩家的行為策略基礎架構
 */
export abstract class AIStrategy {
  /**
   * 在夜晚階段決策
   * @param context 遊戲上下文
   * @param roleId 角色ID
   * @returns 玩家行動
   */
  abstract decideNightAction(context: GameContext, roleId: string): Promise<PlayerAction>;
  
  /**
   * 在白天討論階段決策
   * @param context 遊戲上下文
   * @param roleId 角色ID
   * @returns 玩家行動
   */
  abstract decideDayDiscussionAction(context: GameContext, roleId: string): Promise<PlayerAction>;
  
  /**
   * 在投票階段決策
   * @param context 遊戲上下文
   * @param roleId 角色ID
   * @returns 玩家行動
   */
  abstract decideVoteAction(context: GameContext, roleId: string): Promise<PlayerAction>;
}

/**
 * AI玩家控制器
 * 整合AI策略和玩家控制器
 */
export class AIPlayerController extends PlayerController {
  /**
   * AI策略
   */
  private strategy: AIStrategy;
  
  /**
   * 角色ID
   */
  private roleId: string;
  
  /**
   * 建立AI玩家控制器
   * @param playerId 玩家ID
   * @param strategy AI策略
   * @param type 控制器類型
   * @param roleId 角色ID
   */
  constructor(
    playerId: string,
    strategy: AIStrategy,
    type: PlayerControllerType.BASIC_AI | PlayerControllerType.LLM_AI,
    roleId: string
  ) {
    super(type, playerId);
    this.strategy = strategy;
    this.roleId = roleId;
  }
  
  /**
   * 獲取AI玩家的行動
   * @param context 遊戲上下文
   * @returns 玩家行動的Promise
   */
  async getAction(context: GameContext): Promise<PlayerAction> {
    // 根據遊戲階段選擇不同的決策方法
    switch (context.phase) {
      case PhaseType.NIGHT:
        return this.strategy.decideNightAction(context, this.roleId);
        
      case PhaseType.DAY_DISCUSSION:
        return this.strategy.decideDayDiscussionAction(context, this.roleId);
        
      case PhaseType.DAY_VOTE:
        return this.strategy.decideVoteAction(context, this.roleId);
        
      default:
        // 對於其他階段，返回一個空行動
        return {
          playerId: this.playerId,
          actionType: 'none'
        };
    }
  }
  
  /**
   * 設置角色ID
   * @param roleId 角色ID
   */
  setRoleId(roleId: string): void {
    this.roleId = roleId;
  }
}
