import { EventType, PhaseType, Team } from '@werewolf/common';
import { Game } from '@werewolf/core';

/**
 * 勝利結果介面
 */
export interface VictoryResult {
  hasWinner: boolean;
  winningTeam?: Team;
  specialVictory?: string;
  reason?: string;
}

/**
 * 勝利條件檢查類別
 * 檢查遊戲中的各種勝利條件
 */
export class VictoryChecker {
  /**
   * 檢查遊戲是否有勝利者
   * @param game 遊戲實例
   * @returns 勝利結果
   */
  checkVictory(game: Game): VictoryResult {
    // 檢查狼人勝利條件
    const werewolfVictory = this.checkWerewolfVictory(game);
    if (werewolfVictory.hasWinner) {
      return werewolfVictory;
    }
    
    // 檢查好人勝利條件
    const villagerVictory = this.checkVillagerVictory(game);
    if (villagerVictory.hasWinner) {
      return villagerVictory;
    }
    
    // 檢查第三方勝利條件
    const thirdPartyVictory = this.checkThirdPartyVictory(game);
    if (thirdPartyVictory.hasWinner) {
      return thirdPartyVictory;
    }
    
    // 如果沒有勝利者，返回無勝利結果
    return { hasWinner: false };
  }
  
  /**
   * 檢查狼人陣營勝利條件
   * @param game 遊戲實例
   * @returns 勝利結果
   */
  private checkWerewolfVictory(game: Game): VictoryResult {
    // 獲取存活的狼人數和好人數
    const aliveWerewolves = game.getAliveTeamCount(Team.WEREWOLF);
    const aliveVillagers = game.getAliveTeamCount(Team.VILLAGER);
    
    // 狼人勝利條件：狼人數量大於等於好人數量
    if (aliveWerewolves >= aliveVillagers && aliveWerewolves > 0) {
      return {
        hasWinner: true,
        winningTeam: Team.WEREWOLF,
        reason: '狼人數量已經大於或等於好人數量'
      };
    }
    
    // 無勝利者
    return { hasWinner: false };
  }
  
  /**
   * 檢查好人陣營勝利條件
   * @param game 遊戲實例
   * @returns 勝利結果
   */
  private checkVillagerVictory(game: Game): VictoryResult {
    // 獲取存活的狼人數
    const aliveWerewolves = game.getAliveTeamCount(Team.WEREWOLF);
    const aliveVillagers = game.getAliveTeamCount(Team.VILLAGER);
    
    // 好人勝利條件：所有狼人都已死亡且至少有一個好人存活
    if (aliveWerewolves === 0 && aliveVillagers > 0) {
      return {
        hasWinner: true,
        winningTeam: Team.VILLAGER,
        reason: '所有狼人都已經被清除'
      };
    }
    
    // 無勝利者
    return { hasWinner: false };
  }
  
  /**
   * 檢查第三方勝利條件
   * @param game 遊戲實例
   * @returns 勝利結果
   */
  private checkThirdPartyVictory(game: Game): VictoryResult {
    // 這裡應該實現各種第三方角色的特殊勝利條件
    // 例如：獵魔人、狐狸精等
    
    // 先檢查是否有活著的第三方
    const aliveThirdParty = game.getAliveTeamCount(Team.THIRD_PARTY);
    
    if (aliveThirdParty === 0) {
      return { hasWinner: false };
    }
    
    // 暫時沒有具體的第三方勝利邏輯，返回無勝利者
    return { hasWinner: false };
  }
  
  /**
   * 處理勝利結果
   * @param game 遊戲實例
   * @param result 勝利結果
   */
  handleVictory(game: Game, result: VictoryResult): void {
    if (!result.hasWinner) {
      return;
    }
    
    // 更新遊戲狀態
    game.state.isGameOver = true;
    game.state.winningTeam = result.winningTeam;
    
    // 發布遊戲結束事件
    game.publishEvent({
      type: EventType.GAME_END,
      round: game.round,
      phase: PhaseType.GAME_END,
      timestamp: Date.now(),
      data: {
        winningTeam: result.winningTeam,
        specialVictory: result.specialVictory,
        reason: result.reason
      }
    });
  }
}
