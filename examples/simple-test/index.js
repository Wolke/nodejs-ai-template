#!/usr/bin/env node

console.log('正在測試狼人殺遊戲...');

// 由於我們遇到了一些界面不相容的問題，先進行簡單測試

// 1. 檢查所有內部套件能否正常載入
console.log('測試套件載入...');

try {
  const common = require('@werewolf/common');
  console.log('- @werewolf/common 載入成功');
  console.log('  可用類型:', Object.keys(common).join(', '));
  
  const core = require('@werewolf/core');
  console.log('- @werewolf/core 載入成功');
  console.log('  可用類型:', Object.keys(core).join(', '));
  
  const engine = require('@werewolf/engine');
  console.log('- @werewolf/engine 載入成功');
  console.log('  可用類型:', Object.keys(engine).join(', '));
  
  const gameFlow = require('@werewolf/game-flow');
  console.log('- @werewolf/game-flow 載入成功');
  console.log('  可用類型:', Object.keys(gameFlow).join(', '));
  
  const aiPlayers = require('@werewolf/ai-players');
  console.log('- @werewolf/ai-players 載入成功');
  console.log('  可用類型:', Object.keys(aiPlayers).join(', '));
  
  // 2. 測試創建簡單物件
  const { LoggerSystem } = common;
  const logger = new LoggerSystem('測試');
  logger.info('創建 logger 成功');
  
  const { GameConfig, Player } = core;
  
  // 測試創建遊戲配置
  const config = new GameConfig();
  logger.info('創建 GameConfig 成功:', config);
  
  // 測試創建玩家
  try {
    const player = new Player('player1', '測試玩家');
    logger.info('創建 Player 成功:', player.id, player.name);
  } catch (error) {
    logger.error('創建 Player 失敗:', error.message);
  }
  
  console.log('測試完成');
} catch (error) {
  console.error('測試失敗:', error);
}