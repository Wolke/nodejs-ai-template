import { EventType, GameEvent } from '@werewolf/common';

/**
 * 事件監聽器類型
 */
type EventListener = (event: GameEvent) => void;

/**
 * 事件系統類別
 * 處理遊戲內的事件發布和訂閱
 */
export class EventSystem {
  private listeners: Map<string, EventListener[]> = new Map();
  
  /**
   * 訂閱事件
   * @param eventType 事件類型
   * @param listener 監聽器函式
   * @returns 取消訂閱的函式
   */
  subscribe(eventType: EventType, listener: EventListener): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    
    this.listeners.get(eventType)!.push(listener);
    
    // 返回取消訂閱的函式
    return () => {
      const listeners = this.listeners.get(eventType);
      if (!listeners) return;
      
      const index = listeners.indexOf(listener);
      if (index !== -1) {
        listeners.splice(index, 1);
      }
    };
  }
  
  /**
   * 訂閱所有事件
   * @param listener 監聽器函式
   * @returns 取消訂閱的函式
   */
  subscribeAll(listener: EventListener): () => void {
    const unsubscribers: Array<() => void> = [];
    
    // 為每種事件類型建立訂閱
    Object.values(EventType).forEach(eventType => {
      if (typeof eventType === 'string') {
        unsubscribers.push(this.subscribe(eventType as EventType, listener));
      }
    });
    
    // 返回取消所有訂閱的函式
    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }
  
  /**
   * 發布事件
   * @param event 遊戲事件
   */
  publish(event: GameEvent): void {
    const listeners = this.listeners.get(event.type);
    
    if (listeners) {
      // 通知所有相關監聽器
      listeners.forEach(listener => {
        try {
          listener(event);
        } catch (error) {
          console.error('Error in event listener:', error);
        }
      });
    }
  }
  
  /**
   * 清除所有監聽器
   */
  clear(): void {
    this.listeners.clear();
  }
  
  /**
   * 移除特定事件類型的所有監聽器
   * @param eventType 事件類型
   */
  removeAllListeners(eventType: EventType): void {
    this.listeners.delete(eventType);
  }
}
