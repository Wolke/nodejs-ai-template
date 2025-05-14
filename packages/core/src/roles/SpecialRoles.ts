import { Ability, Team, PhaseType, ActionResult, EventType } from '@werewolf/common';
import { Role } from '../Role';
import { Game } from '../Game';

/**
 * 預言家角色
 */
export class Seer extends Role {
  constructor() {
    // 預言家的查驗能力
    const abilities: Ability[] = [
      {
        id: 'check',
        name: '查驗',
        description: '每晚可以查驗一名玩家的身份',
        phase: PhaseType.NIGHT,
        targetType: 'other'
      }
    ];
    
    super(
      'seer',
      '預言家',
      Team.VILLAGER,
      abilities,
      '擁有特殊能力的村民，每晚可以查驗一名玩家的身份是否為狼人。'
    );
  }
  
  /**
   * 預言家的夜晚行動
   * 可以查驗一名玩家的陣營
   */
  async nightAction(game: Game, playerId: string, targetId?: string): Promise<ActionResult> {
    if (!targetId) {
      return {
        success: false,
        message: '預言家必須選擇一名目標查驗',
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
    
    // 判斷目標陣營
    const isWerewolf = target.role?.team === Team.WEREWOLF;
    
    // 創建查驗事件
    const event = this.createEvent(
      EventType.SEER_CHECK,
      game,
      playerId,
      targetId,
      { 
        action: 'check',
        result: isWerewolf ? 'werewolf' : 'villager' 
      }
    );
    
    return {
      success: true,
      message: `你查驗了 ${target.name}，結果顯示該玩家是${isWerewolf ? '狼人' : '好人'}`,
      events: [event],
      data: {
        target: targetId,
        isWerewolf
      }
    };
  }
  
  /**
   * 預言家的白天行動
   */
  async dayAction(game: Game, playerId: string): Promise<ActionResult> {
    return {
      success: true,
      message: '預言家在白天只能參與討論和投票',
      events: []
    };
  }
}

/**
 * 女巫角色
 */
export class Witch extends Role {
  private hasSaved: boolean = false;
  private hasPoisoned: boolean = false;
  
  constructor() {
    // 女巫的救藥和毒藥能力
    const abilities: Ability[] = [
      {
        id: 'save',
        name: '解藥',
        description: '可以救活一名當晚被狼人殺害的玩家，僅能使用一次',
        phase: PhaseType.NIGHT,
        usageLimit: 1,
        targetType: 'other'
      },
      {
        id: 'poison',
        name: '毒藥',
        description: '可以毒殺一名玩家，僅能使用一次',
        phase: PhaseType.NIGHT,
        usageLimit: 1,
        targetType: 'other'
      }
    ];
    
    super(
      'witch',
      '女巫',
      Team.VILLAGER,
      abilities,
      '擁有一瓶解藥和一瓶毒藥的神秘角色，每種藥只能使用一次。'
    );
  }
  
  /**
   * 女巫的夜晚行動
   * 可以使用解藥救人或使用毒藥毒人
   */
  async nightAction(game: Game, playerId: string, targetId?: string): Promise<ActionResult> {
    // 如果沒有目標且有藥可用，表示選擇不使用藥
    if (!targetId) {
      return {
        success: true,
        message: '你選擇了不使用任何藥',
        events: []
      };
    }
    
    // 獲取目標玩家
    const target = game.getPlayer(targetId);
    if (!target) {
      return {
        success: false,
        message: '選擇的目標不存在',
        events: []
      };
    }
    
    // 從遊戲狀態中獲取當晚狼人的獵殺目標
    const nightKillTarget = this.getNightKillTarget(game);
    
    // 判斷是使用解藥還是毒藥
    const action = targetId === nightKillTarget ? 'save' : 'poison';
    
    if (action === 'save') {
      // 使用解藥
      if (this.hasSaved) {
        return {
          success: false,
          message: '你已經使用過解藥',
          events: []
        };
      }
      
      // 創建使用解藥事件
      const event = this.createEvent(
        EventType.WITCH_SAVE,
        game,
        playerId,
        targetId,
        { action: 'save' }
      );
      
      this.hasSaved = true;
      
      return {
        success: true,
        message: `你使用解藥救活了 ${target.name}`,
        events: [event],
        data: { action }
      };
    } else {
      // 使用毒藥
      if (this.hasPoisoned) {
        return {
          success: false,
          message: '你已經使用過毒藥',
          events: []
        };
      }
      
      // 創建使用毒藥事件
      const event = this.createEvent(
        EventType.WITCH_POISON,
        game,
        playerId,
        targetId,
        { action: 'poison' }
      );
      
      this.hasPoisoned = true;
      
      return {
        success: true,
        message: `你使用毒藥毒死了 ${target.name}`,
        events: [event],
        data: { action }
      };
    }
  }
  
  /**
   * 女巫的白天行動
   */
  async dayAction(game: Game, playerId: string): Promise<ActionResult> {
    return {
      success: true,
      message: '女巫在白天只能參與討論和投票',
      events: []
    };
  }
  
  /**
   * 獲取當晚狼人獵殺的目標
   */
  private getNightKillTarget(game: Game): string | undefined {
    // 從遊戲歷史中尋找當前回合的狼人獵殺事件
    const werewolfEvents = game.history.filter(event => 
      event.round === game.round && 
      event.type === EventType.WEREWOLF_SELECT_TARGET
    );
    
    if (werewolfEvents.length > 0) {
      // 返回最後一個選擇的目標
      return werewolfEvents[werewolfEvents.length - 1].targetId;
    }
    
    return undefined;
  }
}

/**
 * 獵人角色
 */
export class Hunter extends Role {
  constructor() {
    // 獵人的開槍能力
    const abilities: Ability[] = [
      {
        id: 'shoot',
        name: '開槍',
        description: '死亡時可以帶走一名玩家',
        phase: PhaseType.DAY_DISCUSSION,
        targetType: 'other'
      }
    ];
    
    super(
      'hunter',
      '獵人',
      Team.VILLAGER,
      abilities,
      '擁有開槍能力的村民，死亡時可以開槍帶走一名玩家。'
    );
  }
  
  /**
   * 獵人的夜晚行動
   */
  async nightAction(game: Game, playerId: string): Promise<ActionResult> {
    return {
      success: true,
      message: '獵人在夜晚沒有特殊行動',
      events: []
    };
  }
  
  /**
   * 獵人的白天行動
   * 死亡時可以開槍帶走一名玩家
   */
  async dayAction(game: Game, playerId: string, targetId?: string): Promise<ActionResult> {
    const player = game.getPlayer(playerId);
    
    if (!player) {
      return {
        success: false,
        message: '玩家不存在',
        events: []
      };
    }
    
    // 檢查獵人是否已死亡
    if (player.alive) {
      return {
        success: false,
        message: '獵人需要死亡才能使用開槍能力',
        events: []
      };
    }
    
    if (!targetId) {
      return {
        success: false,
        message: '獵人必須選擇一名目標開槍',
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
    
    // 創建開槍事件
    const event = this.createEvent(
      EventType.HUNTER_SHOOT,
      game,
      playerId,
      targetId,
      { action: 'shoot' }
    );
    
    // 殺死目標
    target.kill('被獵人射殺');
    
    return {
      success: true,
      message: `獵人 ${player.name} 開槍射殺了 ${target.name}`,
      events: [event]
    };
  }
}

/**
 * 守衛角色
 */
export class Guard extends Role {
  private lastProtectedId: string | null = null;
  
  constructor() {
    // 守衛的保護能力
    const abilities: Ability[] = [
      {
        id: 'protect',
        name: '守護',
        description: '每晚可以守護一名玩家免受狼人襲擊，但不能連續兩晚守護同一個人',
        phase: PhaseType.NIGHT,
        targetType: 'other'
      }
    ];
    
    super(
      'guard',
      '守衛',
      Team.VILLAGER,
      abilities,
      '每晚可以守護一名玩家免受狼人襲擊，但不能連續兩晚守護同一個人。'
    );
  }
  
  /**
   * 守衛的夜晚行動
   * 可以保護一名玩家免受狼人襲擊
   */
  async nightAction(game: Game, playerId: string, targetId?: string): Promise<ActionResult> {
    if (!targetId) {
      return {
        success: true,
        message: '你選擇了不保護任何人',
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
    
    // 檢查是否與上一晚守護的玩家相同
    if (targetId === this.lastProtectedId) {
      return {
        success: false,
        message: '你不能連續兩晚守護同一個人',
        events: []
      };
    }
    
    // 創建保護事件
    const event = this.createEvent(
      EventType.GUARD_PROTECT,
      game,
      playerId,
      targetId,
      { action: 'protect' }
    );
    
    // 記錄這一晚保護的目標
    this.lastProtectedId = targetId;
    
    return {
      success: true,
      message: `你守護了 ${target.name}`,
      events: [event]
    };
  }
  
  /**
   * 守衛的白天行動
   */
  async dayAction(game: Game, playerId: string): Promise<ActionResult> {
    return {
      success: true,
      message: '守衛在白天只能參與討論和投票',
      events: []
    };
  }
}
