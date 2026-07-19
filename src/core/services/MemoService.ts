import { v4 as uuidv4 } from 'uuid';
import type { Memo } from '@shared/types/memo';
import { MAX_MEMOS_RANGE } from '@shared/constants';

export class MemoService {
  /**
   * 创建新的备忘录实体
   */
  createMemo(content: string, remindTime?: Date): Memo {
    const now = new Date();
    return {
      uuid: uuidv4(),
      content,
      remindTime: remindTime ?? new Date(now.getTime() + 24 * 60 * 60 * 1000),
      status: 'pending',
      createdAt: now,
      updatedAt: now,
      reminderCount: 0,
    };
  }

  /**
   * 校验是否超过上限
   */
  validateMaxMemos(currentCount: number, maxMemos: number): void {
    if (maxMemos === MAX_MEMOS_RANGE.UNLIMITED) return;
    if (currentCount >= maxMemos) {
      throw new Error(
        `备忘录数量已达上限（${maxMemos} 条），请删除部分条目后再添加`,
      );
    }
  }

  /**
   * 更新备忘录时间戳
   */
  touchMemo(memo: Memo): Memo {
    return { ...memo, updatedAt: new Date() };
  }

  /**
   * 检查提醒是否过期
   */
  checkExpired(memo: Memo): boolean {
    return memo.status === 'pending' && new Date() > memo.remindTime;
  }

  /**
   * 标记过期条目
   */
  markExpired(memos: Memo[]): Memo[] {
    return memos.map((m) =>
      this.checkExpired(m) ? { ...m, status: 'expired' as const } : m,
    );
  }

  /**
   * 过滤备忘录
   */
  filterMemos(
    memos: Memo[],
    filter: 'all' | 'pending' | 'completed' | 'expired',
  ): Memo[] {
    if (filter === 'all') return memos;
    return memos.filter((m) => m.status === filter);
  }
}

export const memoService = new MemoService();
