import { Role } from '../Role';
import { Villager, Werewolf } from './BasicRoles';
import { Seer, Witch, Hunter, Guard } from './SpecialRoles';

/**
 * 角色工廠類別
 * 負責建立各種角色實例
 */
export class RoleFactory {
  /**
   * 根據角色ID建立對應的角色
   * @param roleId 角色ID
   * @returns 角色實例的Promise
   */
  static async createRole(roleId: string): Promise<Role> {
    switch (roleId) {
      case 'villager':
        return new Villager();
        
      case 'werewolf':
        return new Werewolf();
        
      case 'seer':
        return new Seer();
        
      case 'witch':
        return new Witch();
        
      case 'hunter':
        return new Hunter();
        
      case 'guard':
        return new Guard();
        
      // 可以添加更多角色
      
      default:
        throw new Error(`未知的角色ID: ${roleId}`);
    }
  }
  
  /**
   * 獲取所有可用角色列表
   * @returns 角色資訊列表
   */
  static getAllRoles(): Array<{id: string, name: string}> {
    return [
      { id: 'villager', name: '村民' },
      { id: 'werewolf', name: '狼人' },
      { id: 'seer', name: '預言家' },
      { id: 'witch', name: '女巫' },
      { id: 'hunter', name: '獵人' },
      { id: 'guard', name: '守衛' }
      // 可以添加更多角色
    ];
  }
  
  /**
   * 取得標準遊戲配置
   * 根據玩家數量返回建議的角色配置
   * @param playerCount 玩家數量
   * @returns 角色配置
   */
  static getStandardSetup(playerCount: number): Array<{roleId: string, count: number}> {
    switch (playerCount) {
      case 6:
        return [
          { roleId: 'villager', count: 2 },
          { roleId: 'werewolf', count: 2 },
          { roleId: 'seer', count: 1 },
          { roleId: 'witch', count: 1 }
        ];
        
      case 7:
        return [
          { roleId: 'villager', count: 2 },
          { roleId: 'werewolf', count: 2 },
          { roleId: 'seer', count: 1 },
          { roleId: 'witch', count: 1 },
          { roleId: 'hunter', count: 1 }
        ];
        
      case 8:
        return [
          { roleId: 'villager', count: 3 },
          { roleId: 'werewolf', count: 2 },
          { roleId: 'seer', count: 1 },
          { roleId: 'witch', count: 1 },
          { roleId: 'hunter', count: 1 }
        ];
        
      case 9:
        return [
          { roleId: 'villager', count: 3 },
          { roleId: 'werewolf', count: 3 },
          { roleId: 'seer', count: 1 },
          { roleId: 'witch', count: 1 },
          { roleId: 'hunter', count: 1 }
        ];
        
      case 10:
        return [
          { roleId: 'villager', count: 3 },
          { roleId: 'werewolf', count: 3 },
          { roleId: 'seer', count: 1 },
          { roleId: 'witch', count: 1 },
          { roleId: 'hunter', count: 1 },
          { roleId: 'guard', count: 1 }
        ];
        
      default:
        // 如果玩家數量不在預設範圍內，返回一個基本配置
        if (playerCount < 6) {
          return [
            { roleId: 'villager', count: Math.max(1, playerCount - 2) },
            { roleId: 'werewolf', count: 1 },
            { roleId: 'seer', count: 1 }
          ];
        } else {
          // 對於更多玩家，使用一個通用比例
          const werewolfCount = Math.floor(playerCount / 3);
          const specialRolesCount = Math.min(4, Math.floor(playerCount / 2));
          const villagerCount = playerCount - werewolfCount - specialRolesCount;
          
          const config = [
            { roleId: 'villager', count: villagerCount },
            { roleId: 'werewolf', count: werewolfCount }
          ];
          
          // 添加特殊角色
          const specialRoles = ['seer', 'witch', 'hunter', 'guard'];
          for (let i = 0; i < specialRolesCount; i++) {
            config.push({ roleId: specialRoles[i], count: 1 });
          }
          
          return config;
        }
    }
  }
}
