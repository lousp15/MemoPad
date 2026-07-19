import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PersistQueue } from '../../src/core/persistence/PersistQueue';
import type { Memo } from '../../src/shared/types/memo';
import type { IStorageAdapter } from '../../src/core/adapters/IStorageAdapter';

function makeMemo(uuid: string, content: string): Memo {
  return {
    uuid,
    content,
    remindTime: new Date(),
    status: 'pending',
    createdAt: new Date(),
    updatedAt: new Date(),
    reminderCount: 0,
  };
}

function createMockAdapter(): IStorageAdapter {
  return {
    getAll: vi.fn().mockResolvedValue([]),
    get: vi.fn().mockResolvedValue(null),
    add: vi.fn().mockResolvedValue(undefined),
    update: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined),
    clear: vi.fn().mockResolvedValue(undefined),
    clearAll: vi.fn().mockResolvedValue(undefined),
  };
}

describe('PersistQueue', () => {
  let adapter: IStorageAdapter;
  let queue: PersistQueue;

  beforeEach(() => {
    vi.useFakeTimers();
    adapter = createMockAdapter();
    queue = new PersistQueue(adapter, 1000);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should enqueue and flush after delay', async () => {
    const memo = makeMemo('1', '测试');
    queue.enqueue({ type: 'upsert', memoId: '1', data: memo });

    expect(queue.pendingCount).toBe(1);

    // 快进时间触发自动 flush
    await vi.advanceTimersByTimeAsync(1000);

    expect(adapter.update).toHaveBeenCalledWith(memo);
    expect(queue.pendingCount).toBe(0);
  });

  it('should cancel pending operation', () => {
    const id = queue.enqueue({ type: 'upsert', memoId: '1', data: makeMemo('1', '测试') });
    expect(queue.pendingCount).toBe(1);

    const result = queue.cancel(id);
    expect(result).toBe(true);
    expect(queue.pendingCount).toBe(0);
  });

  it('should not cancel already flushed operation', async () => {
    const id = queue.enqueue({ type: 'upsert', memoId: '1', data: makeMemo('1', '测试') });

    await vi.advanceTimersByTimeAsync(1000);

    // flush 后取消
    const result = queue.cancel(id);
    expect(result).toBe(false);
  });

  it('should batch multiple operations', async () => {
    queue.enqueue({ type: 'upsert', memoId: '1', data: makeMemo('1', 'A') });
    queue.enqueue({ type: 'upsert', memoId: '2', data: makeMemo('2', 'B') });
    queue.enqueue({ type: 'delete', memoId: '3' });

    expect(queue.pendingCount).toBe(3);

    await vi.advanceTimersByTimeAsync(1000);

    expect(adapter.update).toHaveBeenCalledTimes(2);
    expect(adapter.delete).toHaveBeenCalledTimes(1);
    expect(queue.pendingCount).toBe(0);
  });

  it('should be pending check correctly', () => {
    const id = queue.enqueue({ type: 'upsert', memoId: '1', data: makeMemo('1', '测试') });
    expect(queue.isPending(id)).toBe(true);

    queue.cancel(id);
    expect(queue.isPending(id)).toBe(false);
  });

  it('should forceFlush immediately', async () => {
    queue.enqueue({ type: 'upsert', memoId: '1', data: makeMemo('1', '测试') });

    await queue.forceFlush();

    expect(adapter.update).toHaveBeenCalledTimes(1);
    expect(queue.pendingCount).toBe(0);
  });

  it('should handle flush errors', async () => {
    adapter.update = vi.fn().mockRejectedValue(new Error('DB error'));

    queue.enqueue({ type: 'upsert', memoId: '1', data: makeMemo('1', '测试') });

    await expect(queue.forceFlush()).rejects.toThrow('DB error');
    // 失败后操作仍保留在队列中（由上层决定重试或丢弃）
    expect(queue.pendingCount).toBe(1);
  });

  it('should reset delay on new enqueue', async () => {
    queue.enqueue({ type: 'upsert', memoId: '1', data: makeMemo('1', 'A') });

    // 500ms 时入队新操作，重置计时器
    await vi.advanceTimersByTimeAsync(500);
    queue.enqueue({ type: 'upsert', memoId: '2', data: makeMemo('2', 'B') });

    // 再过 500ms（总 1000ms），第一次的 1000ms 已到但被重置，所以应还没 flush
    await vi.advanceTimersByTimeAsync(500);
    expect(adapter.update).not.toHaveBeenCalled();

    // 再过 500ms（距上次入队 1000ms），触发 flush
    await vi.advanceTimersByTimeAsync(500);
    expect(adapter.update).toHaveBeenCalledTimes(2);
  });
});
