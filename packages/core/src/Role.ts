import { Team, Ability, ActionResult, PhaseType, GameEvent, EventType } from '@werewolf/common';

/**
 * 角色基礎類別
 * 定義遊戲中所有角色的基本屬性和功能
 */
export abstract class Role {
  /**
   * 角色唯一識別碼
   */
  readonly id: string;
  
  /**
   * 角色名稱
   */
  readonly name: string;
  
  /**
   * 角色所屬團隊
   */
  readonly team: Team;
  
  /**
   * 角色能力清單
   */
  readonly abilities: Ability[];
  
  /**
   * 角色描述
   */
  readonly description: string;
  
  /**
   * 建立角色實例
   * @param id 角色ID
   * @param name 角色名稱
   * @param team 所屬團隊
   * @param abilities 能力清單
   * @param description 角色描述
   */
  constructor(
    id: string,
    name: string,
    team: Team,
    abilities: Ability[],
    description: string
  ) {
    this.id = id;
    this.name = name;
    this.team = team;
    this.abilities = abilities;
    this.description = description;
  }
  
  /**
   * 夜晚行動實作
   * @param game 遊戲實例
   * @param playerId 玩家ID
   * @param targetId 目標ID
   */
  abstract nightAction(
    game: any, 
    playerId: string, 
    targetId?: string
  ): Promise<ActionResult>;
  
  /**
   * 白天行動實作
   * @param game 遊戲實例
   * @param playerId 玩家ID
   * @param targetId 目標ID
   */
  abstract dayAction(
    game: any, 
    playerId: string, 
    targetId?: string
  ): Promise<ActionResult>;
  
  /**
   * 檢查角色是否有指定能力
   * @param abilityId 能力ID
   * @returns 是否擁有該能力
   */
  hasAbility(abilityId: string): boolean {
    return this.abilities.some(ability => ability.id === abilityId);
  }
  
  /**
   * 找出指定階段可用的能力
   * @param phase 遊戲階段
   * @returns 可用的能力陣列
   */
  getAbilitiesForPhase(phase: PhaseType): Ability[] {
    return this.abilities.filter(ability => ability.phase === phase);
  }
  
  /**
   * 創建遊戲事件
   * @param type 事件類型
   * @param game 遊戲實例或含有必要遊戲狀態的物件
   * @param playerId 玩家ID
   * @param targetId 目標ID
   * @param data 事件資料
   * @returns 遊戲事件物件
   */
  protected createEvent(
    type: EventType,
    game: { round: number; currentPhase: PhaseType },
    playerId: string,
    targetId?: string,
    data?: Record<string, any>
  ): GameEvent {
    return {
      type,
      round: game.round,
      phase: game.currentPhase,
      timestamp: Date.now(),
      playerId,
      targetId,
      data
    };
  }
}
