import { Role } from './Role';
import { PlayerAction } from '@werewolf/common';

/**
 * 玩家類別
 * 代表遊戲中的一個玩家實體
 */
export class Player {
  /**
   * 玩家ID
   */
  readonly id: string;
  
  /**
   * 玩家名稱
   */
  readonly name: string;
  
  /**
   * 玩家角色
   */
  private _role: Role | null = null;
  
  /**
   * 存活狀態
   */
  private _alive: boolean = true;
  
  /**
   * 玩家歷史行為
   */
  private _actions: PlayerAction[] = [];
  
  /**
   * 玩家屬性集合
   */
  private _attributes: Map<string, any> = new Map();
  
  /**
   * 玩家死亡原因
   */
  private _deathReason?: string;
  
  /**
   * 建立玩家實例
   * @param id 玩家ID
   * @param name 玩家名稱
   */
  constructor(id: string, name: string) {
    this.id = id;
    this.name = name;
  }
  
  /**
   * 獲取玩家角色
   */
  get role(): Role | null {
    return this._role;
  }
  
  /**
   * 設置玩家角色
   */
  set role(role: Role | null) {
    this._role = role;
  }
  
  /**
   * 獲取玩家存活狀態
   */
  get alive(): boolean {
    return this._alive;
  }
  
  /**
   * 獲取玩家歷史行為
   */
  get actions(): PlayerAction[] {
    return [...this._actions];
  }
  
  /**
   * 獲取玩家死亡原因
   */
  get deathReason(): string | undefined {
    return this._deathReason;
  }
  
  /**
   * 添加玩家行為
   * @param action 玩家行為
   */
  addAction(action: PlayerAction): void {
    this._actions.push(action);
  }
  
  /**
   * 殺死玩家
   * @param reason 死亡原因
   */
  kill(reason: string): void {
    if (!this._alive) return;
    
    this._alive = false;
    this._deathReason = reason;
  }
  
  /**
   * 復活玩家
   */
  revive(): void {
    if (this._alive) return;
    
    this._alive = true;
    this._deathReason = undefined;
  }
  
  /**
   * 設定玩家屬性
   * @param key 屬性名稱
   * @param value 屬性值
   */
  setAttribute(key: string, value: any): void {
    this._attributes.set(key, value);
  }
  
  /**
   * 獲取玩家屬性
   * @param key 屬性名稱
   * @returns 屬性值
   */
  getAttribute<T>(key: string): T | undefined {
    return this._attributes.get(key) as T | undefined;
  }
  
  /**
   * 檢查玩家是否具有特定屬性
   * @param key 屬性名稱
   * @returns 是否具有該屬性
   */
  hasAttribute(key: string): boolean {
    return this._attributes.has(key);
  }
  
  /**
   * 移除玩家屬性
   * @param key 屬性名稱
   */
  removeAttribute(key: string): void {
    this._attributes.delete(key);
  }
  
  /**
   * 獲取玩家所有屬性
   * @returns 屬性字典
   */
  getAttributes(): Record<string, any> {
    return Object.fromEntries(this._attributes);
  }
  
  /**
   * 清除玩家所有屬性
   */
  clearAttributes(): void {
    this._attributes.clear();
  }
}
