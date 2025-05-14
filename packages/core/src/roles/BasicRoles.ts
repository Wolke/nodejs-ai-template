import { Ability, Team, PhaseType, ActionResult, EventType } from '@werewolf/common';
import { Role } from '../Role';
import { Game } from '../Game';

/**
 * 村民角色
 */
export class Villager extends Role {
  constructor() {
    // 村民沒有特殊能力
    const abilities: Ability[] = [];
    
    super(
      'villager',
      '村民',
      Team.VILLAGER,
      abilities,
      '普通村民，沒有特殊能力，靠投票放逐狼人獲勝。'
    );
  }
  
  /**
   * 村民的夜晚行動
   * 村民在夜晚沒有特殊行動
   */
  async nightAction(game: Game, playerId: string): Promise<ActionResult> {
    return {
      success: true,
      message: '村民在夜晚沒有特殊行動',
      events: []
    };
  }
  
  /**
   * 村民的白天行動
   * 村民在白天只能參與討論和投票
   */
  async dayAction(game: Game, playerId: string): Promise<ActionResult> {
    return {
      success: true,
      message: '村民在白天只能參與討論和投票',
      events: []
    };
  }
}

/**
 * 狼人角色
 */
export class Werewolf extends Role {
  constructor() {
    // 狼人的夜晚獵殺能力
    const abilities: Ability[] = [
      {
        id: 'night_kill',
        name: '夜殺',
        description: '每晚和其他狼人一起選擇一名玩家獵殺',
        phase: PhaseType.NIGHT,
        targetType: 'other'
      }
    ];
    
    super(
      'werewolf',
      '狼人',
      Team.WEREWOLF,
      abilities,
      '每晚與狼人同伴共同選擇一名玩家獵殺，隱藏身份並淘汰所有村民或使狼人數等同於好人時獲勝。'
    );
  }
  
  /**
   * 狼人的夜晚行動
   * 狼人在夜晚可以獵殺一名玩家
   */
  async nightAction(game: Game, playerId: string, targetId?: string): Promise<ActionResult> {
    if (!targetId) {
      return {
        success: false,
        message: '狼人必須選擇一名目標獵殺',
        events: []
      };
    }
    
    const target = game.getPlayer(targetId);
    if (!target) {
      return {
        success: false,
        message: '選擇的目標不存在',
        events: []
      };
    }
    
    if (!target.alive) {
      return {
        success: false,
        message: '選擇的目標已經死亡',
        events: []
      };
    }
    
    // 狼人不能殺死另一個狼人
    if (target.role?.team === Team.WEREWOLF) {
      return {
        success: false,
        message: '狼人不能選擇另一個狼人作為目標',
        events: []
      };
    }
    
    // 創建獵殺事件
    const event = this.createEvent(
      EventType.WEREWOLF_SELECT_TARGET,
      game,
      playerId,
      targetId,
      { action: 'night_kill' }
    );
    
    return {
      success: true,
      message: `已選擇 ${target.name} 作為今晚的獵殺目標`,
      events: [event]
    };
  }
  
  /**
   * 狼人的白天行動
   * 狼人在白天僅能參與討論和投票
   */
  async dayAction(game: Game, playerId: string): Promise<ActionResult> {
    return {
      success: true,
      message: '狼人在白天只能參與討論和投票',
      events: []
    };
  }
}
