import { PhaseType } from '@werewolf/common';
import { Game } from '@werewolf/core';
import { Phase, PhaseResult } from './Phase';
import { NightPhase } from './NightPhase';
import { DayDiscussionPhase } from './DayDiscussionPhase';
import { DayVotePhase } from './DayVotePhase';
import { VictoryChecker } from './VictoryChecker';

/**
 * 階段管理器類別
 * 管理遊戲中的各個階段
 */
export class PhaseManager {
  /**
   * 遊戲實例
   */
  private game: Game;
  
  /**
   * 階段映射
   */
  private phases: Map<PhaseType, Phase> = new Map();
  
  /**
   * 當前階段
   */
  private currentPhase?: Phase;
  
  /**
   * 勝利檢查器
   */
  private victoryChecker: VictoryChecker;
  
  /**
   * 是否正在執行階段
   */
  private isExecutingPhase: boolean = false;
  
  /**
   * 是否暫停
   */
  private isPaused: boolean = false;
  
  /**
   * 建立階段管理器
   * @param game 遊戲實例
   */
  constructor(game: Game) {
    this.game = game;
    this.victoryChecker = new VictoryChecker();
    
    // 註冊各個階段
    this.registerPhases();
  }
  
  /**
   * 註冊遊戲階段
   */
  private registerPhases(): void {
    // 註冊夜晚階段
    this.registerPhase(new NightPhase(this.game.config.nightPhaseTimeLimit));
    
    // 註冊白天討論階段
    this.registerPhase(new DayDiscussionPhase(this.game.config.discussionPhaseTimeLimit));
    
    // 註冊投票階段
    this.registerPhase(new DayVotePhase(this.game.config.votePhaseTimeLimit));
  }
  
  /**
   * 註冊階段
   * @param phase 階段實例
   */
  registerPhase(phase: Phase): void {
    this.phases.set(phase.type, phase);
  }
  
  /**
   * 獲取階段實例
   * @param type 階段類型
   * @returns 階段實例
   */
  getPhase(type: PhaseType): Phase | undefined {
    return this.phases.get(type);
  }
  
  /**
   * 開始遊戲流程
   */
  async start(): Promise<void> {
    // 初始化遊戲狀態
    this.game.state.round = 0;
    
    // 啟動第一個回合
    await this.startNewRound();
  }
  
  /**
   * 開始新回合
   */
  async startNewRound(): Promise<void> {
    // 增加回合數
    this.game.state.round++;
    
    // 轉換到夜晚階段
    await this.transitionTo(PhaseType.NIGHT);
  }
  
  /**
   * 轉換到指定階段
   * @param phaseType 階段類型
   */
  async transitionTo(phaseType: PhaseType): Promise<void> {
    // 檢查遊戲是否已結束
    if (this.game.state.isGameOver) {
      return;
    }
    
    // 檢查是否暫停
    if (this.isPaused) {
      return;
    }
    
    // 檢查是否存在目標階段
    const nextPhase = this.phases.get(phaseType);
    if (!nextPhase) {
      throw new Error(`找不到階段: ${phaseType}`);
    }
    
    // 檢查是否正在執行階段
    if (this.isExecutingPhase) {
      throw new Error('正在執行階段，無法轉換');
    }
    
    // 更新當前階段
    this.currentPhase = nextPhase;
    
    // 更新遊戲階段狀態
    this.game.state.startPhase(phaseType);
    
    // 執行階段
    await this.executeCurrentPhase();
  }
  
  /**
   * 執行當前階段
   */
  private async executeCurrentPhase(): Promise<void> {
    if (!this.currentPhase || this.isExecutingPhase || this.isPaused) {
      return;
    }
    
    this.isExecutingPhase = true;
    
    try {
      // 執行階段
      const result = await this.currentPhase.execute(this.game);
      
      // 處理階段結果
      await this.handlePhaseResult(result);
    } catch (error) {
      console.error('執行階段時發生錯誤:', error);
    } finally {
      this.isExecutingPhase = false;
    }
  }
  
  /**
   * 處理階段結果
   * @param result 階段結果
   */
  private async handlePhaseResult(result: PhaseResult): Promise<void> {
    // 檢查遊戲是否結束
    const victoryResult = this.victoryChecker.checkVictory(this.game);
    
    if (victoryResult.hasWinner) {
      // 處理勝利情況
      this.victoryChecker.handleVictory(this.game, victoryResult);
      return;
    }
    
    // 根據階段結果處理下一步
    if (result.nextPhase === PhaseType.NIGHT && this.game.state.currentPhase !== PhaseType.NIGHT) {
      // 開始新的回合（從夜晚開始）
      await this.startNewRound();
    } else {
      // 轉換到下一個階段
      await this.transitionTo(result.nextPhase);
    }
  }
  
  /**
   * 暫停遊戲流程
   */
  pause(): void {
    this.isPaused = true;
  }
  
  /**
   * 恢復遊戲流程
   */
  resume(): void {
    if (!this.isPaused) {
      return;
    }
    
    this.isPaused = false;
    
    // 如果當前有階段且未在執行，則繼續執行
    if (this.currentPhase && !this.isExecutingPhase) {
      this.executeCurrentPhase();
    }
  }
}
