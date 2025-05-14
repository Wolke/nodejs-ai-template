/**
 * 時間控制工具類別
 * 提供遊戲中需要的時間控制相關功能
 */
export class TimerUtils {
  /**
   * 等待指定時間
   * @param ms 毫秒數
   * @returns Promise
   */
  static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 建立一個可取消的延遲
   * @param ms 毫秒數
   * @returns 包含 promise 和取消函式的物件
   */
  static createCancellableDelay(ms: number): { 
    promise: Promise<void>; 
    cancel: () => void 
  } {
    let timeoutId: NodeJS.Timeout;
    let resolve: () => void;
    
    const promise = new Promise<void>(res => {
      resolve = res;
      timeoutId = setTimeout(res, ms);
    });
    
    return {
      promise,
      cancel: () => {
        clearTimeout(timeoutId);
        resolve();
      }
    };
  }

  /**
   * 建立具有逾時的 Promise
   * @param promise 原始 Promise
   * @param ms 毫秒數
   * @param errorMessage 逾時錯誤訊息
   * @returns 新的 Promise
   */
  static withTimeout<T>(
    promise: Promise<T>, 
    ms: number, 
    errorMessage: string = 'Operation timed out'
  ): Promise<T> {
    const timeout = new Promise<T>((_, reject) => {
      const timeoutId = setTimeout(() => {
        clearTimeout(timeoutId);
        reject(new Error(errorMessage));
      }, ms);
    });
    
    return Promise.race([promise, timeout]);
  }

  /**
   * 格式化時間為易讀字串
   * @param ms 毫秒數
   * @returns 格式化的時間字串
   */
  static formatTime(ms: number): string {
    if (ms < 1000) {
      return `${ms}ms`;
    } else if (ms < 60000) {
      return `${(ms / 1000).toFixed(1)}s`;
    } else {
      const minutes = Math.floor(ms / 60000);
      const seconds = ((ms % 60000) / 1000).toFixed(0);
      return `${minutes}m ${seconds}s`;
    }
  }

  /**
   * 建立簡單計時器
   * @returns 計時器物件
   */
  static createTimer(): {
    start: () => void;
    stop: () => number;
    reset: () => void;
  } {
    let startTime: number = 0;
    
    return {
      start: () => {
        startTime = Date.now();
      },
      stop: () => {
        const elapsed = Date.now() - startTime;
        startTime = 0;
        return elapsed;
      },
      reset: () => {
        startTime = 0;
      }
    };
  }
}
