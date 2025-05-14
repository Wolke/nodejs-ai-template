/**
 * 隨機工具類別
 * 提供遊戲中需要的各種隨機功能
 */
export class RandomUtils {
  /**
   * 從陣列中隨機選擇一個元素
   * @param array 要選擇的陣列
   * @returns 隨機選擇的元素
   */
  static pickOne<T>(array: T[]): T {
    if (array.length === 0) {
      throw new Error('Cannot pick from an empty array');
    }
    return array[Math.floor(Math.random() * array.length)];
  }

  /**
   * 從陣列中隨機選擇多個元素
   * @param array 要選擇的陣列
   * @param count 要選擇的元素數量
   * @returns 隨機選擇的元素陣列
   */
  static pickMany<T>(array: T[], count: number): T[] {
    if (count < 0) {
      throw new Error('Count cannot be negative');
    }
    if (count > array.length) {
      throw new Error('Cannot pick more elements than the array length');
    }
    
    const result: T[] = [];
    const shuffled = [...array].sort(() => Math.random() - 0.5);
    
    for (let i = 0; i < count; i++) {
      result.push(shuffled[i]);
    }
    
    return result;
  }

  /**
   * 洗牌陣列
   * @param array 要洗牌的陣列
   * @returns 洗牌後的新陣列
   */
  static shuffle<T>(array: T[]): T[] {
    return [...array].sort(() => Math.random() - 0.5);
  }

  /**
   * 產生範圍內的隨機整數
   * @param min 最小值（包含）
   * @param max 最大值（包含）
   * @returns 隨機整數
   */
  static getRandomInt(min: number, max: number): number {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * 根據機率產生布林值
   * @param probability 機率（0-1之間）
   * @returns 是否成功
   */
  static chance(probability: number): boolean {
    if (probability < 0 || probability > 1) {
      throw new Error('Probability must be between 0 and 1');
    }
    return Math.random() < probability;
  }

  /**
   * 產生唯一ID
   * @param prefix ID 前綴
   * @returns 唯一ID
   */
  static generateId(prefix: string = ''): string {
    const timestamp = new Date().getTime();
    const random = Math.floor(Math.random() * 10000);
    return `${prefix}${timestamp}-${random}`;
  }
}
