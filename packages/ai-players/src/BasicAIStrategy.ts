import { GameContext, PhaseType, PlayerAction, RandomUtils } from '@werewolf/common';
import { AIStrategy } from './AIStrategy';

/**
 * 基本AI策略類別
 * 提供簡單的基於規則和隨機性的AI決策
 */
export class BasicAIStrategy extends AIStrategy {
  /**
   * 難度級別 (0-1之間，值越大，決策越智能)
   */
  private difficulty: number = 0.5;
  
  /**
   * 建立基本AI策略
   * @param difficulty 難度級別 (0-1)
   */
  constructor(difficulty: number = 0.5) {
    super();
    
    // 限制難度在合理範圍內
    this.difficulty = Math.max(0, Math.min(1, difficulty));
  }
  
  /**
   * 在夜晚階段決策
   * @param context 遊戲上下文
   * @param roleId 角色ID
   * @returns 玩家行動
   */
  async decideNightAction(context: GameContext, roleId: string): Promise<PlayerAction> {
    switch (roleId) {
      case 'werewolf':
        return this.decideWerewolfTarget(context);
        
      case 'seer':
        return this.decideSeerTarget(context);
        
      case 'witch':
        return this.decideWitchAction(context);
        
      case 'guard':
        return this.decideGuardTarget(context);
        
      default:
        // 對於其他角色，返回空行動
        return { 
          playerId: context.playerId,
          actionType: 'none'
        };
    }
  }
  
  /**
   * 在白天討論階段決策
   * @param context 遊戲上下文
   * @param roleId 角色ID
   * @returns 玩家行動
   */
  async decideDayDiscussionAction(context: GameContext, roleId: string): Promise<PlayerAction> {
    // 在真實實現中，AI可以生成談話內容或決定發言策略
    // 目前簡單返回空行動
    return {
      playerId: context.playerId,
      actionType: 'speech',
      data: {
        content: this.generateSpeech(context, roleId)
      }
    };
  }
  
  /**
   * 在投票階段決策
   * @param context 遊戲上下文
   * @param roleId 角色ID
   * @returns 玩家行動
   */
  async decideVoteAction(context: GameContext, roleId: string): Promise<PlayerAction> {
    // 獲取可投票的目標（排除自己和死亡玩家）
    const voteCandidates = context.alivePlayers.filter(id => id !== context.playerId);
    
    if (voteCandidates.length === 0) {
      return {
        playerId: context.playerId,
        actionType: 'vote',
        targetId: 'abstain' // 沒有可投票目標，棄權
      };
    }
    
    // 根據不同角色使用不同的投票策略
    let targetId: string;
    
    if (roleId === 'werewolf') {
      // 狼人會避免投票給其他狼人
      targetId = this.decideWerewolfVoteTarget(context, voteCandidates);
    } else {
      // 其他角色使用一般的投票邏輯
      targetId = this.decideGeneralVoteTarget(context, voteCandidates, roleId);
    }
    
    return {
      playerId: context.playerId,
      actionType: 'vote',
      targetId
    };
  }
  
  /**
   * 決定狼人的獵殺目標
   */
  private decideWerewolfTarget(context: GameContext): PlayerAction {
    // 排除死亡玩家和狼人自己
    const possibleTargets = context.alivePlayers.filter(id => {
      // 從上下文中排除已知的狼人
      const knownWerewolves = context.knownInfo?.werewolves || [];
      return !knownWerewolves.includes(id);
    });
    
    if (possibleTargets.length === 0) {
      return {
        playerId: context.playerId,
        actionType: 'night_kill',
        targetId: undefined
      };
    }
    
    // 如果難度較高，嘗試殺死已知的關鍵角色
    if (RandomUtils.chance(this.difficulty) && context.knownInfo) {
      // 優先殺死預言家、女巫等關鍵角色
      const knownSeer = context.knownInfo?.seer;
      const knownWitch = context.knownInfo?.witch;
      
      // 如果知道預言家，且預言家還活著，直接選擇預言家
      if (knownSeer && possibleTargets.includes(knownSeer)) {
        return {
          playerId: context.playerId,
          actionType: 'night_kill',
          targetId: knownSeer
        };
      }
      
      // 如果知道女巫，且女巫還活著，直接選擇女巫
      if (knownWitch && possibleTargets.includes(knownWitch)) {
        return {
          playerId: context.playerId,
          actionType: 'night_kill',
          targetId: knownWitch
        };
      }
    }
    
    // 隨機選擇一個目標
    const targetId = RandomUtils.pickOne(possibleTargets);
    
    return {
      playerId: context.playerId,
      actionType: 'night_kill',
      targetId
    };
  }
  
  /**
   * 決定預言家的查驗目標
   */
  private decideSeerTarget(context: GameContext): PlayerAction {
    // 排除死亡玩家和自己
    const possibleTargets = context.alivePlayers.filter(id => id !== context.playerId);
    
    if (possibleTargets.length === 0) {
      return {
        playerId: context.playerId,
        actionType: 'check',
        targetId: undefined
      };
    }
    
    // 從已查驗過的玩家中排除
    const checkedPlayers = context.knownInfo?.checkedPlayers || [];
    const uncheckedTargets = possibleTargets.filter(id => !checkedPlayers.includes(id));
    
    // 如果還有未查驗的玩家，從中選擇
    if (uncheckedTargets.length > 0) {
      const targetId = RandomUtils.pickOne(uncheckedTargets);
      
      return {
        playerId: context.playerId,
        actionType: 'check',
        targetId
      };
    }
    
    // 如果所有玩家都查驗過，隨機選擇一個
    const targetId = RandomUtils.pickOne(possibleTargets);
    
    return {
      playerId: context.playerId,
      actionType: 'check',
      targetId
    };
  }
  
  /**
   * 決定女巫的行動
   */
  private decideWitchAction(context: GameContext): PlayerAction {
    // 獲取女巫的藥水狀態
    const hasSaved = context.knownInfo?.witchHasSaved || false;
    const hasPoisoned = context.knownInfo?.witchHasPoisoned || false;
    
    // 獲取當晚的死亡目標
    const nightDeathTarget = context.knownInfo?.nightDeathTarget;
    
    // 決定是否使用解藥
    if (!hasSaved && nightDeathTarget && RandomUtils.chance(0.8)) {
      return {
        playerId: context.playerId,
        actionType: 'save',
        targetId: nightDeathTarget
      };
    }
    
    // 決定是否使用毒藥
    if (!hasPoisoned && RandomUtils.chance(0.4)) {
      // 排除死亡玩家和自己
      const possibleTargets = context.alivePlayers.filter(id => id !== context.playerId);
      
      if (possibleTargets.length > 0) {
        // 嘗試毒殺可疑的玩家
        // 在真實實現中，可以基於更複雜的邏輯選擇目標
        const targetId = RandomUtils.pickOne(possibleTargets);
        
        return {
          playerId: context.playerId,
          actionType: 'poison',
          targetId
        };
      }
    }
    
    // 如果決定不使用任何藥或沒有可用的藥，返回空行動
    return {
      playerId: context.playerId,
      actionType: 'none'
    };
  }
  
  /**
   * 決定守衛的守護目標
   */
  private decideGuardTarget(context: GameContext): PlayerAction {
    // 排除死亡玩家
    const possibleTargets = context.alivePlayers;
    
    // 獲取上一次守護的目標
    const lastProtectedId = context.knownInfo?.lastProtectedId;
    
    // 排除上一次守護的目標
    const validTargets = possibleTargets.filter(id => id !== lastProtectedId);
    
    if (validTargets.length === 0) {
      return {
        playerId: context.playerId,
        actionType: 'protect',
        targetId: undefined // 不護人
      };
    }
    
    // 如果難度較高，嘗試保護重要角色
    if (RandomUtils.chance(this.difficulty) && context.knownInfo) {
      // 優先保護預言家、女巫等關鍵角色
      const knownSeer = context.knownInfo?.seer;
      const knownWitch = context.knownInfo?.witch;
      
      // 如果知道預言家，優先保護預言家
      if (knownSeer && validTargets.includes(knownSeer)) {
        return {
          playerId: context.playerId,
          actionType: 'protect',
          targetId: knownSeer
        };
      }
      
      // 如果知道女巫，考慮保護女巫
      if (knownWitch && validTargets.includes(knownWitch)) {
        return {
          playerId: context.playerId,
          actionType: 'protect',
          targetId: knownWitch
        };
      }
    }
    
    // 隨機選擇一個目標
    const targetId = RandomUtils.pickOne(validTargets);
    
    return {
      playerId: context.playerId,
      actionType: 'protect',
      targetId
    };
  }
  
  /**
   * 決定狼人的投票目標
   */
  private decideWerewolfVoteTarget(context: GameContext, candidates: string[]): string {
    // 獲取已知的狼人
    const knownWerewolves = context.knownInfo?.werewolves || [];
    
    // 排除其他狼人
    const nonWerewolfCandidates = candidates.filter(id => !knownWerewolves.includes(id));
    
    if (nonWerewolfCandidates.length === 0) {
      // 如果沒有非狼人目標，隨機選擇一個
      return RandomUtils.pickOne(candidates);
    }
    
    // 如果難度較高，嘗試投票給對狼人有威脅的玩家
    if (RandomUtils.chance(this.difficulty) && context.knownInfo) {
      // 優先投票預言家、女巫等關鍵角色
      const knownSeer = context.knownInfo?.seer;
      const knownWitch = context.knownInfo?.witch;
      
      // 如果知道預言家，且預言家還活著，直接選擇預言家
      if (knownSeer && nonWerewolfCandidates.includes(knownSeer)) {
        return knownSeer;
      }
      
      // 如果知道女巫，且女巫還活著，直接選擇女巫
      if (knownWitch && nonWerewolfCandidates.includes(knownWitch)) {
        return knownWitch;
      }
    }
    
    // 隨機選擇一個非狼人目標
    return RandomUtils.pickOne(nonWerewolfCandidates);
  }
  
  /**
   * 決定一般角色的投票目標
   */
  private decideGeneralVoteTarget(context: GameContext, candidates: string[], roleId: string): string {
    // 獲取可疑玩家列表
    const suspiciousPlayers = context.knownInfo?.suspiciousPlayers || [];
    
    // 如果難度較高，嘗試投票給可疑的玩家
    if (RandomUtils.chance(this.difficulty) && suspiciousPlayers.length > 0) {
      // 尋找既可疑又在候選人中的玩家
      const validSuspects = candidates.filter(id => suspiciousPlayers.includes(id));
      
      if (validSuspects.length > 0) {
        return RandomUtils.pickOne(validSuspects);
      }
    }
    
    // 如果是預言家，且知道有狼人
    if (roleId === 'seer' && context.knownInfo?.foundWerewolves) {
      const werewolves = context.knownInfo.foundWerewolves || [];
      const aliveWerewolves = werewolves.filter((id: string) => candidates.includes(id));
      
      if (aliveWerewolves.length > 0) {
        return RandomUtils.pickOne(aliveWerewolves);
      }
    }
    
    // 如果沒有其他特殊邏輯，隨機選擇一個目標
    return RandomUtils.pickOne(candidates);
  }
  
  /**
   * 生成AI的發言內容
   */
  private generateSpeech(context: GameContext, roleId: string): string {
    // 依據角色和情境生成不同的發言
    switch (roleId) {
      case 'werewolf':
        return this.generateWerewolfSpeech(context);
        
      case 'seer':
        return this.generateSeerSpeech(context);
        
      case 'witch':
        return this.generateWitchSpeech(context);
        
      case 'hunter':
        return this.generateHunterSpeech(context);
        
      case 'guard':
        return this.generateGuardSpeech(context);
        
      case 'villager':
      default:
        return this.generateVillagerSpeech(context);
    }
  }
  
  /**
   * 生成狼人的發言
   */
  private generateWerewolfSpeech(context: GameContext): string {
    const speeches = [
      '我是一個普通村民，昨晚沒有聽到任何異常聲音。',
      '我覺得我們應該集中精力找出狼人，不要互相猜疑。',
      '我懷疑有人在說謊，因為他的發言前後矛盾。',
      '我相信預言家應該已經查到一些線索了，可以站出來分享嗎？',
      '昨晚死的人可能是被女巫毒死的，不一定是被狼人殺的。'
    ];
    
    return RandomUtils.pickOne(speeches);
  }
  
  /**
   * 生成預言家的發言
   */
  private generateSeerSpeech(context: GameContext): string {
    // 如果已經知道某個人是狼人，且難度較高，可能會公開身份
    if (context.knownInfo?.foundWerewolves && this.difficulty > 0.7) {
      const werewolves = context.knownInfo.foundWerewolves || [];
      if (werewolves.length > 0) {
        return `我是預言家，我查驗過玩家${werewolves[0]}，他是狼人。`;
      }
    }
    
    const speeches = [
      '昨晚死的人是個很重要的角色，我們要小心選擇投票對象。',
      '我觀察了一下大家的發言，覺得有人行為很可疑。',
      '大家注意一下發言的邏輯，狼人通常會自相矛盾或轉移話題。',
      '我認為我們應該相信自己的直覺，誰的發言讓你感到不自然？',
      '我有一些想法，但現在還不確定，需要再觀察一下。'
    ];
    
    return RandomUtils.pickOne(speeches);
  }
  
  /**
   * 生成女巫的發言
   */
  private generateWitchSpeech(context: GameContext): string {
    const speeches = [
      '昨晚的死亡很奇怪，我覺得值得考慮一下。',
      '我們應該集中討論昨天投票出局的玩家是什麼身份。',
      '大家應該仔細思考每個人的發言，不要輕易被誤導。',
      '我認為我們應該給每個人一個辯解的機會，然後再做決定。',
      '有人能分享一下他對目前局勢的看法嗎？我想聽聽不同的意見。'
    ];
    
    return RandomUtils.pickOne(speeches);
  }
  
  /**
   * 生成獵人的發言
   */
  private generateHunterSpeech(context: GameContext): string {
    const speeches = [
      '如果我死了，我會很謹慎地選擇我的目標，所以狼人最好小心一點。',
      '我認為我們村民應該更加團結，不要輕易懷疑彼此。',
      '我對一些玩家有懷疑，但我需要更多的證據。',
      '昨晚的死亡似乎有特定的目標性，狼人可能在針對重要角色。',
      '我們應該仔細分析每個人的投票歷史，可能會發現一些線索。'
    ];
    
    return RandomUtils.pickOne(speeches);
  }
  
  /**
   * 生成守衛的發言
   */
  private generateGuardSpeech(context: GameContext): string {
    const speeches = [
      '我們需要保護關鍵角色，不要讓他們太早暴露身份。',
      '有時候保持沉默比說太多話更安全。',
      '我認為有些人的投票行為很奇怪，值得懷疑。',
      '大家應該注意那些總是最後投票的人，他們可能是在觀察形勢。',
      '我們不應該輕易相信任何人的身份宣告，除非有確切的證據。'
    ];
    
    return RandomUtils.pickOne(speeches);
  }
  
  /**
   * 生成普通村民的發言
   */
  private generateVillagerSpeech(context: GameContext): string {
    const speeches = [
      '我是一個普通的村民，我會盡力幫助大家找出狼人。',
      '我認為我們應該關注那些發言很少或者總是跟風的人。',
      '昨天的投票結果很奇怪，我覺得有人在刻意引導我們。',
      '如果有預言家，希望能給我們一些線索。',
      '我覺得我們應該更加謹慎地投票，不要被情緒左右。'
    ];
    
    return RandomUtils.pickOne(speeches);
  }
}
