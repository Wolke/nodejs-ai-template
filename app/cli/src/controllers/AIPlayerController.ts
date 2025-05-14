import { Player, PlayerController, Role } from '@werewolf/core';
import { AIStrategy } from '@werewolf/ai-players';
import { LoggerSystem, TimerUtils } from '@werewolf/common';

// 設定Logger
const logger = LoggerSystem.getLogger('AIPlayerController');

export class AIPlayerController extends PlayerController {
  private strategy: AIStrategy;

  constructor(player: Player, strategy: AIStrategy) {
    super(player);
    this.strategy = strategy;
    this.strategy.setPlayer(player);
  }

  // 覆寫基礎方法
  async notifyRoleAssigned(role: Role): Promise<void> {
    logger.info(`AI ${this.player.name} 被分配到角色: ${role.name}`);
    this.strategy.setRole(role);
  }

  async notifyGameStart(): Promise<void> {
    logger.info(`AI ${this.player.name} 已準備好遊戲`);
  }

  async notifyGameOver(winningTeam: string): Promise<void> {
    const isWinner = this.player.role?.team === winningTeam;
    logger.info(`AI ${this.player.name} ${isWinner ? '贏得了遊戲' : '失敗了'}`);
  }

  async askForVote(alivePlayers: Player[]): Promise<string> {
    await TimerUtils.delay(1000); // 模擬思考時間
    const targetId = this.strategy.chooseVoteTarget(alivePlayers);
    const target = alivePlayers.find(p => p.id === targetId);
    logger.info(`AI ${this.player.name} 投票給了 ${target?.name || '無效目標'}`);
    return targetId;
  }

  async askForWerewolfKill(alivePlayers: Player[]): Promise<string> {
    await TimerUtils.delay(1500); // 模擬思考時間
    const targetId = this.strategy.chooseWerewolfKillTarget(alivePlayers);
    const target = alivePlayers.find(p => p.id === targetId);
    logger.info(`AI狼人 ${this.player.name} 選擇襲擊 ${target?.name || '無效目標'}`);
    return targetId;
  }

  async askForSeerCheck(alivePlayers: Player[]): Promise<string> {
    await TimerUtils.delay(1500); // 模擬思考時間
    const targetId = this.strategy.chooseSeerCheckTarget(alivePlayers);
    const target = alivePlayers.find(p => p.id === targetId);
    logger.info(`AI預言家 ${this.player.name} 選擇查驗 ${target?.name || '無效目標'}`);
    return targetId;
  }

  async askForWitchSave(dyingPlayer: Player): Promise<boolean> {
    await TimerUtils.delay(1500); // 模擬思考時間
    const shouldSave = this.strategy.shouldWitchSave(dyingPlayer);
    logger.info(`AI女巫 ${this.player.name} ${shouldSave ? '使用' : '不使用'}解藥救 ${dyingPlayer.name}`);
    return shouldSave;
  }

  async askForWitchPoison(alivePlayers: Player[]): Promise<string> {
    await TimerUtils.delay(1500); // 模擬思考時間
    const targetId = this.strategy.chooseWitchPoisonTarget(alivePlayers);
    
    if (!targetId) {
      logger.info(`AI女巫 ${this.player.name} 選擇不使用毒藥`);
      return '';
    }
    
    const target = alivePlayers.find(p => p.id === targetId);
    logger.info(`AI女巫 ${this.player.name} 使用毒藥毒死 ${target?.name || '無效目標'}`);
    return targetId;
  }

  async askForHunterShoot(alivePlayers: Player[]): Promise<string> {
    await TimerUtils.delay(1500); // 模擬思考時間
    const targetId = this.strategy.chooseHunterShootTarget(alivePlayers);
    const target = alivePlayers.find(p => p.id === targetId);
    logger.info(`AI獵人 ${this.player.name} 開槍射殺 ${target?.name || '無效目標'}`);
    return targetId;
  }

  async notifyDayStart(day: number): Promise<void> {
    this.strategy.onDayStart(day);
  }

  async notifyNightStart(day: number): Promise<void> {
    this.strategy.onNightStart(day);
  }

  async notifyPlayerDeath(player: Player, reason: string): Promise<void> {
    this.strategy.onPlayerDeath(player, reason);
  }

  async notifySeerResult(target: Player, isWerewolf: boolean): Promise<void> {
    this.strategy.onSeerResult(target, isWerewolf);
  }
  
  async askForDiscussion(): Promise<string> {
    await TimerUtils.delay(1000); // 模擬思考時間
    const message = this.strategy.generateDiscussionMessage();
    logger.info(`AI ${this.player.name} 說: "${message}"`);
    return message;
  }
}
