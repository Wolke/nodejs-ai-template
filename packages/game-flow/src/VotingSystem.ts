import { Player } from '@werewolf/core';

/**
 * 投票類型
 */
export type VoteType = 'elimination' | 'werewolf_kill' | 'custom';

/**
 * 投票選項
 */
export interface VoteOption {
  id: string;
  name: string;
  data?: Record<string, any>;
}

/**
 * 投票
 */
export interface Vote {
  voterId: string;
  optionId: string;
  timestamp: number;
}

/**
 * 投票結果
 */
export interface VotingResult {
  winner?: VoteOption;
  topOptions: Array<{ option: VoteOption; votes: number }>;
  voteMap: Record<string, string[]>; // optionId -> voterId[]
  isTie: boolean;
  totalVotes: number;
  abstainCount: number;
}

/**
 * 投票系統類別
 * 處理各種投票場景
 */
export class VotingSystem {
  /**
   * 投票類型
   */
  readonly type: VoteType;
  
  /**
   * 投票名稱
   */
  readonly name: string;
  
  /**
   * 投票選項
   */
  private options: VoteOption[] = [];
  
  /**
   * 已投票記錄
   */
  private votes: Vote[] = [];
  
  /**
   * 合格的投票者
   */
  private eligibleVoters: Set<string> = new Set();
  
  /**
   * 投票開始時間
   */
  private startTime: number = 0;
  
  /**
   * 是否允許棄權
   */
  private allowAbstain: boolean = false;
  
  /**
   * 是否已結束
   */
  private isEnded: boolean = false;
  
  /**
   * 建立投票系統實例
   * @param type 投票類型
   * @param name 投票名稱
   * @param allowAbstain 是否允許棄權
   */
  constructor(type: VoteType, name: string, allowAbstain: boolean = false) {
    this.type = type;
    this.name = name;
    this.allowAbstain = allowAbstain;
  }
  
  /**
   * 設置投票選項
   * @param options 選項列表
   */
  setOptions(options: VoteOption[]): void {
    // 檢查選項ID是否唯一
    const ids = new Set<string>();
    for (const option of options) {
      if (ids.has(option.id)) {
        throw new Error(`重複的選項ID: ${option.id}`);
      }
      ids.add(option.id);
    }
    
    this.options = [...options];
  }
  
  /**
   * 從玩家列表設置選項
   * @param players 玩家列表
   */
  setOptionsFromPlayers(players: Player[]): void {
    const options = players.map(player => ({
      id: player.id,
      name: player.name
    }));
    
    this.setOptions(options);
  }
  
  /**
   * 設置合格的投票者
   * @param voterIds 投票者ID列表
   */
  setEligibleVoters(voterIds: string[]): void {
    this.eligibleVoters = new Set(voterIds);
  }
  
  /**
   * 開始投票
   */
  start(): void {
    if (this.options.length === 0) {
      throw new Error('開始投票前必須設置選項');
    }
    
    if (this.eligibleVoters.size === 0) {
      throw new Error('開始投票前必須設置合格的投票者');
    }
    
    this.votes = [];
    this.startTime = Date.now();
    this.isEnded = false;
  }
  
  /**
   * 玩家投票
   * @param voterId 投票者ID
   * @param optionId 選項ID
   * @returns 是否投票成功
   */
  castVote(voterId: string, optionId: string): boolean {
    // 檢查投票是否已結束
    if (this.isEnded) {
      return false;
    }
    
    // 檢查投票者是否合格
    if (!this.eligibleVoters.has(voterId)) {
      return false;
    }
    
    // 檢查是否已經投票
    if (this.hasVoted(voterId)) {
      return false;
    }
    
    // 檢查選項是否有效
    if (optionId !== 'abstain' && !this.options.some(option => option.id === optionId)) {
      return false;
    }
    
    // 檢查是否允許棄權
    if (optionId === 'abstain' && !this.allowAbstain) {
      return false;
    }
    
    // 記錄投票
    this.votes.push({
      voterId,
      optionId,
      timestamp: Date.now()
    });
    
    return true;
  }
  
  /**
   * 檢查投票者是否已投票
   * @param voterId 投票者ID
   * @returns 是否已投票
   */
  hasVoted(voterId: string): boolean {
    return this.votes.some(vote => vote.voterId === voterId);
  }
  
  /**
   * 檢查投票是否已完成
   * @returns 是否已完成
   */
  isComplete(): boolean {
    // 檢查所有合格投票者是否都已投票
    for (const voterId of this.eligibleVoters) {
      if (!this.hasVoted(voterId)) {
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * 獲取投票結果
   * @returns 投票結果
   */
  getResult(): VotingResult {
    // 計算每個選項的得票數
    const voteCount: Record<string, number> = {};
    const voteMap: Record<string, string[]> = {};
    
    // 初始化計數
    this.options.forEach(option => {
      voteCount[option.id] = 0;
      voteMap[option.id] = [];
    });
    
    // 計算投票
    let abstainCount = 0;
    for (const vote of this.votes) {
      if (vote.optionId === 'abstain') {
        abstainCount++;
      } else {
        voteCount[vote.optionId] = (voteCount[vote.optionId] || 0) + 1;
        voteMap[vote.optionId] = [...(voteMap[vote.optionId] || []), vote.voterId];
      }
    }
    
    // 找出得票最多的選項
    let maxVotes = 0;
    let winners: VoteOption[] = [];
    
    for (const option of this.options) {
      const votes = voteCount[option.id] || 0;
      
      if (votes > maxVotes) {
        maxVotes = votes;
        winners = [option];
      } else if (votes === maxVotes && votes > 0) {
        winners.push(option);
      }
    }
    
    // 整理得票前三名
    const topOptions = this.options
      .map(option => ({
        option,
        votes: voteCount[option.id] || 0
      }))
      .sort((a, b) => b.votes - a.votes)
      .slice(0, 3);
    
    // 返回結果
    return {
      winner: winners.length === 1 ? winners[0] : undefined,
      topOptions,
      voteMap,
      isTie: winners.length > 1,
      totalVotes: this.votes.length,
      abstainCount
    };
  }
  
  /**
   * 結束投票
   * @returns 投票結果
   */
  end(): VotingResult {
    this.isEnded = true;
    return this.getResult();
  }
}
