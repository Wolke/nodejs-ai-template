import { GameContext, PlayerAction, PlayerControllerType } from '@werewolf/common';

/**
 * 玩家控制器類別
 * 處理不同類型玩家的輸入和動作決策
 */
export abstract class PlayerController {
  /**
   * 控制器類型
   */
  readonly type: PlayerControllerType;
  
  /**
   * 玩家ID
   */
  readonly playerId: string;
  
  /**
   * 建立玩家控制器
   * @param type 控制器類型
   * @param playerId 玩家ID
   */
  constructor(type: PlayerControllerType, playerId: string) {
    this.type = type;
    this.playerId = playerId;
  }
  
  /**
   * 獲取玩家動作的抽象方法
   * @param context 遊戲上下文
   * @returns 玩家動作的 Promise
   */
  abstract getAction(context: GameContext): Promise<PlayerAction>;
}

/**
 * 人類玩家控制器
 * 處理實際玩家的輸入
 */
export class HumanController extends PlayerController {
  private inputHandler: (context: GameContext) => Promise<PlayerAction>;
  
  /**
   * 建立人類玩家控制器
   * @param playerId 玩家ID
   * @param inputHandler 輸入處理函式
   */
  constructor(
    playerId: string,
    inputHandler: (context: GameContext) => Promise<PlayerAction>
  ) {
    super(PlayerControllerType.HUMAN, playerId);
    this.inputHandler = inputHandler;
  }
  
  /**
   * 獲取人類玩家的動作
   * @param context 遊戲上下文
   * @returns 玩家動作的 Promise
   */
  async getAction(context: GameContext): Promise<PlayerAction> {
    return this.inputHandler(context);
  }
}
