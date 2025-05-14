#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import figlet from 'figlet';
import { startGame } from './commands/start';

// 創建 CLI 程式
const program = new Command();

// 顯示標題
console.log(
  chalk.red(
    figlet.textSync('狼人殺', { horizontalLayout: 'full' })
  )
);

// 設定版本和描述
program
  .version('1.0.0')
  .description('狼人殺遊戲命令列介面');

// 註冊命令
program
  .command('start')
  .description('開始一場新的狼人殺遊戲')
  .option('-p, --players <number>', '玩家數量', '6')
  .option('-w, --werewolves <number>', '狼人數量', '2')
  .option('-a, --ai <number>', 'AI玩家數量', '0')
  .action(startGame);

// 如果沒有傳入任何參數，顯示說明
if (process.argv.length === 2) {
  program.outputHelp();
}

// 解析命令列參數
program.parse(process.argv);
