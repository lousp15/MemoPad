import { describe, it, expect, beforeEach } from 'vitest';
import { MemoService, memoService } from '../../src/core/services/MemoService';

describe('MemoService', () => {
  it('should create a memo with correct structure', () => {
    const memo = memoService.createMemo('测试内容', new Date('2025-12-31'));

    expect(memo.uuid).toBeDefined();
    expect(memo.content).toBe('测试内容');
    expect(memo.status).toBe('pending');
    expect(memo.reminderCount).toBe(0);
    expect(memo.createdAt).toBeInstanceOf(Date);
    expect(memo.updatedAt).toBeInstanceOf(Date);
  });

  it('should create memo with default remind time (24h later)', () => {
    const before = Date.now();
    const memo = memoService.createMemo('测试');
    const after = Date.now();

    const remindMs = memo.remindTime.getTime();
    expect(remindMs).toBeGreaterThanOrEqual(before + 24 * 60 * 60 * 1000);
    expect(remindMs).toBeLessThanOrEqual(after + 24 * 60 * 60 * 1000);
  });

  it('should throw when exceeding max memos', () => {
    expect(() => memoService.validateMaxMemos(15, 15)).toThrow('已达上限');
    expect(() => memoService.validateMaxMemos(10, 15)).not.toThrow();
  });

  it('should not throw when maxMemos is -1 (unlimited)', () => {
    expect(() => memoService.validateMaxMemos(999, -1)).not.toThrow();
  });

  it('should update updatedAt on touchMemo', () => {
    const memo = memoService.createMemo('测试');
    const originalUpdatedAt = memo.updatedAt.getTime();

    const touched = memoService.touchMemo(memo);
    expect(touched.updatedAt.getTime()).toBeGreaterThanOrEqual(originalUpdatedAt);
    expect(touched.content).toBe('测试'); // 不影响其他字段
  });

  it('should check expired status', () => {
    const past = memoService.createMemo('过期', new Date('2020-01-01'));
    expect(memoService.checkExpired(past)).toBe(true);

    const future = memoService.createMemo('未到期', new Date('2099-12-31'));
    expect(memoService.checkExpired(future)).toBe(false);
  });

  it('should mark expired memos', () => {
    const memos = [
      memoService.createMemo('已过期', new Date('2020-01-01')),
      memoService.createMemo('未到期', new Date('2099-12-31')),
    ];

    const marked = memoService.markExpired(memos);
    expect(marked[0].status).toBe('expired');
    expect(marked[1].status).toBe('pending');
  });

  it('should filter memos by status', () => {
    const pending = memoService.createMemo('待办');
    const completed = { ...memoService.createMemo('已完成'), status: 'completed' as const };
    const expired = { ...memoService.createMemo('过期'), status: 'expired' as const };

    const all = [pending, completed, expired];

    expect(memoService.filterMemos(all, 'all')).toHaveLength(3);
    expect(memoService.filterMemos(all, 'pending')).toHaveLength(1);
    expect(memoService.filterMemos(all, 'completed')).toHaveLength(1);
    expect(memoService.filterMemos(all, 'expired')).toHaveLength(1);
  });

  it('should not mark completed or expired memos as expired again', () => {
    const completed = { ...memoService.createMemo('已完成'), status: 'completed' as const };
    const expired = { ...memoService.createMemo('已过期'), status: 'expired' as const };

    const marked = memoService.markExpired([completed, expired]);
    expect(marked[0].status).toBe('completed');
    expect(marked[1].status).toBe('expired');
  });
});
