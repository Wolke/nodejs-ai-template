/**
 * 日誌等級枚舉
 */
export enum LogLevel {
  DEBUG,
  INFO,
  WARN,
  ERROR
}

/**
 * 日誌記錄器介面
 */
export interface Logger {
  debug(message: string, ...data: any[]): void;
  info(message: string, ...data: any[]): void;
  warn(message: string, ...data: any[]): void;
  error(message: string, ...data: any[]): void;
}

/**
 * 日誌系統類別
 * 提供遊戲中的日誌記錄功能
 */
export class LoggerSystem implements Logger {
  private readonly name: string;
  private level: LogLevel;
  private static defaultLevel: LogLevel = LogLevel.INFO;
  
  /**
   * 建立日誌系統實例
   * @param name 日誌名稱
   * @param level 日誌等級
   */
  constructor(name: string, level?: LogLevel) {
    this.name = name;
    this.level = level ?? LoggerSystem.defaultLevel;
  }

  /**
   * 設定全域預設日誌等級
   * @param level 日誌等級
   */
  static setDefaultLevel(level: LogLevel): void {
    LoggerSystem.defaultLevel = level;
  }

  /**
   * 設定此日誌實例的等級
   * @param level 日誌等級
   */
  setLevel(level: LogLevel): void {
    this.level = level;
  }

  /**
   * 記錄除錯訊息
   * @param message 訊息
   * @param data 額外資料
   */
  debug(message: string, ...data: any[]): void {
    if (this.level <= LogLevel.DEBUG) {
      console.debug(`[${this.timestamp()}] [DEBUG] [${this.name}]`, message, ...data);
    }
  }

  /**
   * 記錄資訊訊息
   * @param message 訊息
   * @param data 額外資料
   */
  info(message: string, ...data: any[]): void {
    if (this.level <= LogLevel.INFO) {
      console.info(`[${this.timestamp()}] [INFO] [${this.name}]`, message, ...data);
    }
  }

  /**
   * 記錄警告訊息
   * @param message 訊息
   * @param data 額外資料
   */
  warn(message: string, ...data: any[]): void {
    if (this.level <= LogLevel.WARN) {
      console.warn(`[${this.timestamp()}] [WARN] [${this.name}]`, message, ...data);
    }
  }

  /**
   * 記錄錯誤訊息
   * @param message 訊息
   * @param data 額外資料
   */
  error(message: string, ...data: any[]): void {
    if (this.level <= LogLevel.ERROR) {
      console.error(`[${this.timestamp()}] [ERROR] [${this.name}]`, message, ...data);
    }
  }

  /**
   * 產生時間戳記
   * @returns 格式化時間字串
   */
  private timestamp(): string {
    const now = new Date();
    return `${now.toISOString()}`;
  }
}
