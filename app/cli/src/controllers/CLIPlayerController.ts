import chalk from 'chalk';
import inquirer from 'inquirer';
import { Player, PlayerController, Role } from '@werewolf/core';
import { LoggerSystem, GameContext, PlayerAction, PlayerControllerType } from '@werewolf/common';

// 設定Logger
const logger = new LoggerSystem('CLIPlayerController');

export class CLIPlayerController extends PlayerController {
  constructor(player: Player) {
    super(PlayerControllerType.HUMAN, player.id);
    this.player = player;
  }

  // 額外儲存玩家參考
  private player: Player;

  // 實現抽象方法
  async getAction(context: GameContext): Promise<PlayerAction> {
    // 根據上下文情況選擇適當的動作
    const phase = context.currentPhase;
    switch (phase) {
      case 'night':
        return this.handleNightAction(context);
      case 'day-discussion':
        return this.handleDayDiscussionAction(context);
      case 'day-vote':
        return this.handleVoteAction(context);
      default:
        return { type: 'none', targetId: '' };
    }
  }

  private async handleNightAction(context: GameContext): Promise<PlayerAction> {
    const role = this.player.role?.id || '';
    
    switch (role) {
      case 'werewolf':
        const killTargetId = await this.askForWerewolfKill(context.alivePlayers);
        return { type: 'kill', targetId: killTargetId };
      case 'seer':
        const checkTargetId = await this.askForSeerCheck(context.alivePlayers);
        return { type: 'check', targetId: checkTargetId };
      case 'witch':
        // 女巫可以選擇救人或毒人
        if (context.dyingPlayerId) {
          const shouldSave = await this.askForWitchSave(context.dyingPlayer);
          if (shouldSave) {
            return { type: 'save', targetId: context.dyingPlayerId };
          }
        }
        const poisonTargetId = await this.askForWitchPoison(context.alivePlayers);
        if (poisonTargetId) {
          return { type: 'poison', targetId: poisonTargetId };
        }
        return { type: 'none', targetId: '' };
      default:
        return { type: 'none', targetId: '' };
    }
  }

  private async handleDayDiscussionAction(context: GameContext): Promise<PlayerAction> {
    const message = await this.askForDiscussion();
    return { type: 'speak', targetId: '', content: message };
  }

  private async handleVoteAction(context: GameContext): Promise<PlayerAction> {
    const targetId = await this.askForVote(context.alivePlayers);
    return { type: 'vote', targetId };
  }
  
  // 以下是具體的互動方法
  async notifyRoleAssigned(role: Role): Promise<void> {
    console.log(chalk.green(`\n${this.player.name}, 你的角色是: ${chalk.bold(role.name)}`));
    console.log(chalk.gray(`角色描述: ${role.description}`));

    await inquirer.prompt([
      {
        name: 'confirm',
        type: 'confirm',
        message: '按 Enter 繼續',
        default: true
      }
    ]);
  }

  async notifyGameStart(): Promise<void> {
    console.log(chalk.cyan(`\n${this.player.name}, 遊戲開始了！`));
  }

  async notifyGameOver(winningTeam: string): Promise<void> {
    const isWinner = this.player.role?.team === winningTeam;
    
    if (isWinner) {
      console.log(chalk.green(`\n${this.player.name}, 恭喜你獲勝了！你的陣營 ${winningTeam} 贏得了遊戲。`));
    } else {
      console.log(chalk.red(`\n${this.player.name}, 你的陣營失敗了。${winningTeam} 陣營獲勝。`));
    }
  }

  async askForTargetSelection(alivePlayers: Player[], action: string): Promise<string> {
    const playerChoices = alivePlayers
      .filter(p => p.id !== this.player.id) // 排除自己
      .map(p => ({
        name: p.name,
        value: p.id
      }));

    // 如果沒有可選擇的目標
    if (playerChoices.length === 0) {
      logger.info('沒有可選擇的目標');
      return '';
    }

    const prompt = {
      type: 'list',
      name: 'target',
      message: `請選擇一位玩家${action}:`,
      choices: playerChoices
    };

    const answer = await inquirer.prompt([prompt]);
    return answer.target;
  }

  async askForVote(alivePlayers: Player[]): Promise<string> {
    return this.askForTargetSelection(alivePlayers, '投票處決');
  }

  async askForWerewolfKill(alivePlayers: Player[]): Promise<string> {
    return this.askForTargetSelection(alivePlayers, '襲擊');
  }

  async askForSeerCheck(alivePlayers: Player[]): Promise<string> {
    return this.askForTargetSelection(alivePlayers, '查驗');
  }

  async askForWitchSave(dyingPlayer: Player): Promise<boolean> {
    const answer = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'save',
        message: `${dyingPlayer.name} 即將死亡，要使用解藥救他嗎？`,
        default: false
      }
    ]);
    
    return answer.save;
  }

  async askForWitchPoison(alivePlayers: Player[]): Promise<string> {
    const choices = alivePlayers
      .filter(p => p.id !== this.player.id)
      .map(p => ({
        name: p.name,
        value: p.id
      }));

    choices.push({
      name: '不使用毒藥',
      value: ''
    });

    const answer = await inquirer.prompt([
      {
        type: 'list',
        name: 'target',
        message: '請選擇一位玩家使用毒藥:',
        choices
      }
    ]);

    return answer.target;
  }

  async askForHunterShoot(alivePlayers: Player[]): Promise<string> {
    console.log(chalk.red('\n獵人技能啟動！你可以在臨死前帶走一個人...'));
    return this.askForTargetSelection(alivePlayers, '射殺');
  }

  async notifyDayStart(day: number): Promise<void> {
    console.log(chalk.yellow(`\n===== 第 ${day} 天白天階段 =====`));
  }

  async notifyNightStart(day: number): Promise<void> {
    console.log(chalk.blue(`\n===== 第 ${day} 天夜晚階段 =====`));
  }

  async notifyPlayerDeath(player: Player, reason: string): Promise<void> {
    if (player.id === this.player.id) {
      console.log(chalk.red(`\n你已經死亡！死亡原因: ${reason}`));
    } else {
      console.log(chalk.gray(`${player.name} 已死亡，死亡原因: ${reason}`));
    }
  }

  async notifySeerResult(target: Player, isWerewolf: boolean): Promise<void> {
    const result = isWerewolf ? chalk.red('狼人') : chalk.green('好人');
    console.log(`\n你查驗的結果: ${target.name} 是 ${result}`);
  }
  
  async askForDiscussion(): Promise<string> {
    const answer = await inquirer.prompt([
      {
        type: 'input',
        name: 'message',
        message: `${this.player.name}, 請發表你的言論 (按 Enter 結束發言):`
      }
    ]);
    
    return answer.message;
  }
}
