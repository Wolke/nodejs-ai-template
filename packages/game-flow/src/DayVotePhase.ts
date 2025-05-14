import { EventType, PhaseType } from '@werewolf/common';
import { Game, Player } from '@werewolf/core';
import { Phase, PhaseResult } from './Phase';
import { VotingSystem, VotingResult } from './VotingSystem';

/**
 * 白天投票階段類別
 * 處理遊戲的白天投票階段邏輯
 */
export class DayVotePhase extends Phase {
  /**
   * 投票系統
   */
  private votingSystem: VotingSystem;
  
  /**
   * 是否正在重新投票處理平局
   */
  private isRunoff: boolean = false;
  
  /**
   * 投票結果
   */
  private votingResult?: VotingResult;
  
  /**
   * 建立投票階段實例
   * @param timeLimit 時間限制（毫秒）
   */
  constructor(timeLimit: number) {
    super(PhaseType.DAY_VOTE, '白天投票階段', timeLimit);
    this.votingSystem = new VotingSystem('elimination', '放逐投票');
  }
  
  /**
   * 重置階段狀態
   */
  private reset(): void {
    this.votingSystem = new VotingSystem('elimination', '放逐投票');
    this.isRunoff = false;
    this.votingResult = undefined;
  }
  
  /**
   * 執行投票階段
   * @param game 遊戲實例
   * @returns 階段結果的 Promise
   */
  protected async executePhase(game: Game): Promise<PhaseResult> {
    // 重置階段狀態
    if (!this.isRunoff) {
      this.reset();
    }
    
    // 發布投票開始事件
    game.publishEvent({
      type: EventType.VOTE_START,
      round: game.round,
      phase: PhaseType.DAY_VOTE,
      timestamp: Date.now(),
      data: { isRunoff: this.isRunoff }
    });
    
    // 準備投票選項（存活的玩家）
    let options;
    if (this.isRunoff && this.votingResult) {
      // 在重新投票中，只使用之前得票相同的玩家
      options = this.votingResult.topOptions
        .filter(item => item.votes === this.votingResult!.topOptions[0].votes)
        .map(item => item.option);
    } else {
      // 正常投票，使用所有存活玩家
      options = game.getAlivePlayers().map(player => ({
        id: player.id,
        name: player.name
      }));
    }
    
    // 設置投票選項
    this.votingSystem.setOptions(options);
    
    // 設置合格投票者（所有存活玩家）
    const eligibleVoterIds = game.getAlivePlayers().map(player => player.id);
    this.votingSystem.setEligibleVoters(eligibleVoterIds);
    
    // 開始投票
    this.votingSystem.start();
    
    // 收集玩家投票
    await this.collectVotes(game);
    
    // 結束投票並獲取結果
    this.votingResult = this.votingSystem.end();
    
    // 處理投票結果
    return await this.handleVotingResult(game, this.votingResult);
  }
  
  /**
   * 收集玩家投票
   * @param game 遊戲實例
   */
  private async collectVotes(game: Game): Promise<void> {
    // 獲取存活玩家列表
    const alivePlayers = game.getAlivePlayers();
    
    // 在真實實現中，這裡應該有一個收集玩家投票的機制
    // 且考慮異步並發收集投票，而不是按順序
    // 這裡暫時用簡化的模擬方式實現
    
    for (const player of alivePlayers) {
      await this.collectPlayerVote(game, player);
      
      // 發布投票事件
      game.publishEvent({
        type: EventType.VOTE_CAST,
        round: game.round,
        phase: PhaseType.DAY_VOTE,
        timestamp: Date.now(),
        playerId: player.id,
        data: {
          completed: this.votingSystem.isComplete(),
          votesCount: this.votingSystem.getResult().totalVotes
        }
      });
    }
  }
  
  /**
   * 收集單個玩家的投票
   * @param game 遊戲實例
   * @param player 玩家
   */
  private async collectPlayerVote(game: Game, player: Player): Promise<void> {
    // 在真實實現中，這裡應該調用 PlayerController 獲取玩家投票
    // 暫時使用模擬的方式：玩家隨機投票給其他人
    
    const options = this.votingSystem.getResult().topOptions
      .map(item => item.option.id)
      .filter(id => id !== player.id); // 不能投給自己
    
    if (options.length > 0) {
      const targetId = options[Math.floor(Math.random() * options.length)];
      this.votingSystem.castVote(player.id, targetId);
    }
    
    // 暫時用 setTimeout 模擬投票延遲
    return new Promise(resolve => {
      setTimeout(resolve, 100);
    });
  }
  
  /**
   * 處理投票結果
   * @param game 遊戲實例
   * @param result 投票結果
   * @returns 階段結果的 Promise
   */
  private async handleVotingResult(game: Game, result: VotingResult): Promise<PhaseResult> {
    // 處理平票情況
    if (result.isTie && game.config.enableTiebreaker && !this.isRunoff) {
      // 進行重新投票
      this.isRunoff = true;
      
      return {
        success: true,
        nextPhase: PhaseType.DAY_VOTE, // 維持在投票階段
        message: '投票結果平局，進行重新投票',
        data: {
          votingResult: result,
          isRunoff: true
        }
      };
    }
    
    // 處理有明確結果的情況
    if (result.winner) {
      const targetPlayer = game.getPlayer(result.winner.id);
      
      if (targetPlayer && targetPlayer.alive) {
        // 執行放逐
        targetPlayer.kill('被村民投票放逐');
        
        // 發布玩家被放逐事件
        game.publishEvent({
          type: EventType.PLAYER_ELIMINATED,
          round: game.round,
          phase: PhaseType.DAY_VOTE,
          timestamp: Date.now(),
          targetId: targetPlayer.id,
          data: { 
            reason: '放逐',
            votes: result.voteMap[targetPlayer.id]?.length || 0
          }
        });
      }
    }
    
    // 檢查是否有勝利者
    // 這裡應該調用勝利檢查器
    const hasWinner = this.checkForWinner(game);
    
    // 返回階段結果
    return {
      success: true,
      nextPhase: hasWinner ? PhaseType.GAME_END : PhaseType.NIGHT,
      data: {
        votingResult: result,
        eliminated: result.winner?.id
      }
    };
  }
  
  /**
   * 檢查是否有勝利者
   * @param game 遊戲實例
   * @returns 是否有勝利者
   */
  private checkForWinner(game: Game): boolean {
    // 在真實實現中，應該由勝利條件檢查器處理
    // 暫時直接返回 false
    return false;
  }
  
  /**
   * 處理階段超時
   * @param game 遊戲實例
   * @returns 階段結果的 Promise
   */
  protected async handleTimeout(game: Game): Promise<PhaseResult> {
    // 處理尚未投票的玩家（視為棄權）
    for (const player of game.getAlivePlayers()) {
      if (!this.votingSystem.hasVoted(player.id)) {
        // 隨機投票
        const options = this.votingSystem.getResult().topOptions
          .map(item => item.option.id)
          .filter(id => id !== player.id);
        
        if (options.length > 0) {
          const targetId = options[Math.floor(Math.random() * options.length)];
          this.votingSystem.castVote(player.id, targetId);
        }
      }
    }
    
    // 結束投票並獲取結果
    this.votingResult = this.votingSystem.end();
    
    // 處理投票結果
    const result = await this.handleVotingResult(game, this.votingResult);
    
    // 添加超時標記
    if (result.data) {
      result.data.timeout = true;
    } else {
      result.data = { timeout: true };
    }
    
    return result;
  }
}
