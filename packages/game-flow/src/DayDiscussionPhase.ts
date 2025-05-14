import { EventType, PhaseType } from '@werewolf/common';
import { Game } from '@werewolf/core';
import { Phase, PhaseResult } from './Phase';

/**
 * 玩家發言狀態
 */
interface SpeechState {
  playerId: string;
  hasSpeech: boolean;
  speechStartTime?: number;
  speechEndTime?: number;
}

/**
 * 白天討論階段類別
 * 處理遊戲的白天討論階段邏輯
 */
export class DayDiscussionPhase extends Phase {
  /**
   * 當前發言的玩家索引
   */
  private currentSpeakerIndex: number = -1;
  
  /**
   * 玩家發言狀態列表
   */
  private speechStates: SpeechState[] = [];
  
  /**
   * 討論是否結束
   */
  private discussionEnded: boolean = false;
  
  /**
   * 建立白天討論階段實例
   * @param timeLimit 時間限制（毫秒）
   */
  constructor(timeLimit: number) {
    super(PhaseType.DAY_DISCUSSION, '白天討論階段', timeLimit);
  }
  
  /**
   * 重置階段狀態
   */
  private reset(): void {
    this.currentSpeakerIndex = -1;
    this.speechStates = [];
    this.discussionEnded = false;
  }
  
  /**
   * 執行白天討論階段
   * @param game 遊戲實例
   * @returns 階段結果的 Promise
   */
  protected async executePhase(game: Game): Promise<PhaseResult> {
    // 重置階段狀態
    this.reset();
    
    // 發布白天開始事件
    game.publishEvent({
      type: EventType.DAY_START,
      round: game.round,
      phase: PhaseType.DAY_DISCUSSION,
      timestamp: Date.now()
    });
    
    // 準備存活玩家發言順序
    const alivePlayers = game.getAlivePlayers();
    this.speechStates = alivePlayers.map(player => ({
      playerId: player.id,
      hasSpeech: false
    }));
    
    // 逐一讓玩家發言
    for (let i = 0; i < this.speechStates.length; i++) {
      this.currentSpeakerIndex = i;
      const speechState = this.speechStates[i];
      
      // 如果討論已結束，中斷發言流程
      if (this.discussionEnded) {
        break;
      }
      
      // 開始玩家發言
      const player = game.getPlayer(speechState.playerId);
      if (!player) continue;
      
      speechState.speechStartTime = Date.now();
      
      // 等待玩家發言完成
      // 在真實實現中，這裡應該有一個等待玩家發言的機制
      // 並且提供跳過、打斷等功能
      await this.waitForPlayerSpeech(game, player.id);
      
      speechState.speechEndTime = Date.now();
      speechState.hasSpeech = true;
    }
    
    // 返回階段結果
    return {
      success: true,
      nextPhase: PhaseType.DAY_VOTE,
      data: {
        speechStats: this.getSpeechStats()
      }
    };
  }
  
  /**
   * 等待玩家發言
   * @param game 遊戲實例
   * @param playerId 玩家ID
   */
  private async waitForPlayerSpeech(game: Game, playerId: string): Promise<void> {
    const player = game.getPlayer(playerId);
    if (!player) return;
    
    const speechTimeLimit = game.config.speechTimePerPlayer;
    
    // 這裡應該有一個真實的等待機制
    // 暫時用 setTimeout 模擬
    return new Promise(resolve => {
      setTimeout(resolve, Math.min(speechTimeLimit, 1000)); // 暫時用 1 秒模擬
    });
  }
  
  /**
   * 跳過當前發言玩家
   */
  public skipCurrentSpeaker(): void {
    if (this.currentSpeakerIndex < 0 || this.currentSpeakerIndex >= this.speechStates.length) {
      return;
    }
    
    const speechState = this.speechStates[this.currentSpeakerIndex];
    speechState.speechEndTime = Date.now();
    speechState.hasSpeech = true;
  }
  
  /**
   * 提前結束討論階段
   */
  public endDiscussion(): void {
    this.discussionEnded = true;
  }
  
  /**
   * 獲取發言統計資料
   * @returns 發言統計
   */
  private getSpeechStats(): Record<string, { duration?: number }> {
    const stats: Record<string, { duration?: number }> = {};
    
    for (const state of this.speechStates) {
      if (state.speechStartTime && state.speechEndTime) {
        stats[state.playerId] = {
          duration: state.speechEndTime - state.speechStartTime
        };
      } else {
        stats[state.playerId] = {};
      }
    }
    
    return stats;
  }
  
  /**
   * 處理階段超時
   * @param game 遊戲實例
   * @returns 階段結果的 Promise
   */
  protected async handleTimeout(game: Game): Promise<PhaseResult> {
    // 強制結束當前玩家發言
    this.skipCurrentSpeaker();
    
    // 標記討論結束
    this.discussionEnded = true;
    
    // 返回階段結果
    return {
      success: true,
      nextPhase: PhaseType.DAY_VOTE,
      message: '討論階段已超時結束',
      data: {
        speechStats: this.getSpeechStats(),
        timeout: true
      }
    };
  }
}
