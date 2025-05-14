import { PhaseType, TimerUtils } from '@werewolf/common';
import { Game } from '@werewolf/core';

/**
 * 階段執行結果介面
 */
export interface PhaseResult {
  success: boolean;
  nextPhase: PhaseType;
  message?: string;
  data?: Record<string, any>;
}

/**
 * 遊戲階段抽象類別
 * 作為所有遊戲階段的基礎類別
 */
export abstract class Phase {
  /**
   * 階段類型
   */
  readonly type: PhaseType;
  
  /**
   * 階段名稱
   */
  readonly name: string;
  
  /**
   * 時間限制（毫秒）
   */
  timeLimit: number;
  
  /**
   * 階段是否正在執行
   */
  protected _isRunning: boolean = false;
  
  /**
   * 階段是否已完成
   */
  protected _isCompleted: boolean = false;
  
  /**
   * 建立階段實例
   * @param type 階段類型
   * @param name 階段名稱
   * @param timeLimit 時間限制（毫秒）
   */
  constructor(type: PhaseType, name: string, timeLimit: number) {
    this.type = type;
    this.name = name;
    this.timeLimit = timeLimit;
  }
  
  /**
   * 階段是否正在執行
   */
  get isRunning(): boolean {
    return this._isRunning;
  }
  
  /**
   * 階段是否已完成
   */
  get isCompleted(): boolean {
    return this._isCompleted;
  }
  
  /**
   * 執行階段
   * @param game 遊戲實例
   * @returns 階段執行結果的 Promise
   */
  async execute(game: Game): Promise<PhaseResult> {
    if (this._isRunning) {
      throw new Error('階段正在執行中');
    }
    
    this._isRunning = true;
    this._isCompleted = false;
    
    let result: PhaseResult = {
      success: false,
      nextPhase: this.type
    };
    
    try {
      // 設定階段超時
      const { promise: timeoutPromise, cancel: cancelTimeout } = TimerUtils.createCancellableDelay(this.timeLimit);
      
      // 同時執行階段邏輯和設定超時
      const racePromise = Promise.race([
        this.executePhase(game),
        timeoutPromise.then(() => this.handleTimeout(game))
      ]);
      
      result = await racePromise;
      
      // 取消已設定的超時
      cancelTimeout();
    } catch (error) {
      console.error(`執行階段 ${this.name} 時發生錯誤:`, error);
      result = {
        success: false,
        nextPhase: this.type, // 維持在相同階段
        message: `階段執行錯誤: ${error instanceof Error ? error.message : String(error)}`
      };
    } finally {
      this._isRunning = false;
      this._isCompleted = result?.success ?? false;
    }
    
    return result;
  }
  
  /**
   * 執行階段的實際邏輯（由子類別實作）
   * @param game 遊戲實例
   * @returns 階段結果的 Promise
   */
  protected abstract executePhase(game: Game): Promise<PhaseResult>;
  
  /**
   * 處理階段超時
   * @param game 遊戲實例
   * @returns 階段結果的 Promise
   */
  protected abstract handleTimeout(game: Game): Promise<PhaseResult>;
}
