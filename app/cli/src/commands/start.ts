import chalk from 'chalk';
import inquirer from 'inquirer';
import { GameEngine } from '@werewolf/engine';
import { RoleFactory, GameConfig, Player } from '@werewolf/core';
import { BasicAIStrategy } from '@werewolf/ai-players';
import { CLIPlayerController } from '../controllers/CLIPlayerController';
import { AIPlayerController } from '../controllers/AIPlayerController';
import { LoggerSystem } from '@werewolf/common';

// 設定Logger
const logger = new LoggerSystem('CLI');

export async function startGame(options: { players: string; werewolves: string; ai: string }) {
  try {
    // 解析參數
    const totalPlayers = parseInt(options.players, 10);
    const werewolfCount = parseInt(options.werewolves, 10);
    const aiPlayerCount = parseInt(options.ai, 10);
    const humanPlayerCount = totalPlayers - aiPlayerCount;

    if (totalPlayers < 4) {
      logger.error('遊戲至少需要4位玩家');
      return;
    }

    if (werewolfCount < 1 || werewolfCount >= totalPlayers / 2) {
      logger.error('狼人數量必須至少為1位，且不能超過總玩家數的一半');
      return;
    }

    if (aiPlayerCount < 0 || aiPlayerCount > totalPlayers) {
      logger.error('AI玩家數量必須在0和總玩家數之間');
      return;
    }

    logger.info(chalk.green(`開始設置遊戲：${totalPlayers}名玩家，${werewolfCount}名狼人，${aiPlayerCount}名AI玩家`));

    // 建立玩家
    const players = await createPlayers(humanPlayerCount, aiPlayerCount);
    
    // 建立遊戲設定
    const gameConfig = new GameConfig({
      playerCount: totalPlayers,
      werewolfCount,
      hasWitch: true,
      hasSeer: true,
      hasHunter: totalPlayers > 6,
    });

    // 角色工廠函式
    const roleFactory = async (roleId: string) => {
      return RoleFactory.createRole(roleId);
    };

    // 初始化遊戲引擎
    const gameEngine = new GameEngine(gameConfig, roleFactory);

    // 加入玩家
    players.forEach(player => {
      const controller = player.controller;
      gameEngine.addPlayer(player.id, controller);
    });

    // 開始遊戲
    logger.info(chalk.blueBright('開始遊戲...'));
    await gameEngine.start();

    // 遊戲結束
    const gameResult = gameEngine.getGameResult();
    if (gameResult && gameResult.winner) {
      logger.info(chalk.yellowBright(`遊戲結束！${gameResult.winner}獲勝了！`));
    } else {
      logger.info(chalk.yellowBright('遊戲結束！沒有獲勝者。'));
    }

  } catch (error) {
    logger.error('遊戲執行錯誤:', error);
  }
}

// 建立玩家（包括真人和AI）
async function createPlayers(humanCount: number, aiCount: number): Promise<Player[]> {
  const players: Player[] = [];
  
  // 創建人類玩家
  for (let i = 0; i < humanCount; i++) {
    const answers = await inquirer.prompt([
      {
        name: 'name',
        type: 'input',
        message: `請輸入玩家 ${i + 1} 的名稱:`,
        default: `玩家${i + 1}`,
        validate: (value) => value.trim() !== '' ? true : '請輸入有效的名稱',
      }
    ]);
    
    const playerId = `player-${i + 1}`;
    const player = new Player(playerId, answers.name);
    const controller = new CLIPlayerController(player);
    player.controller = controller;
    players.push(player);
  }
  
  // 創建AI玩家
  for (let i = 0; i < aiCount; i++) {
    const playerId = `ai-${i + 1}`;
    const player = new Player(playerId, `AI-${i + 1}`);
    const aiStrategy = new BasicAIStrategy();
    const controller = new AIPlayerController(player, aiStrategy);
    player.controller = controller;
    players.push(player);
  }
  
  return players;
}
