import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  withRetry,
  RetryExhaustedError,
} from '../../src/core/adapters/RetryPolicy';

describe('RetryPolicy', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should succeed on first attempt', async () => {
    const fn = vi.fn().mockResolvedValue('ok');
    const result = await withRetry(fn, { maxRetries: 3, baseDelayMs: 100 });
    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should retry and eventually succeed', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error('fail1'))
      .mockRejectedValueOnce(new Error('fail2'))
      .mockResolvedValue('ok');

    const resultPromise = withRetry(fn, { maxRetries: 3, baseDelayMs: 100 });

    // 第 1 次重试：等待 100ms
    await vi.advanceTimersByTimeAsync(100);
    // 第 2 次重试：等待 200ms
    await vi.advanceTimersByTimeAsync(200);

    const result = await resultPromise;
    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('should exhaust retries and throw', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('persistent fail'));

    const resultPromise = withRetry(fn, { maxRetries: 2, baseDelayMs: 50 });
    // 抑制中间重试的未捕获 rejection，仅捕获最终的 RetryExhaustedError
    resultPromise.catch(() => {});

    await vi.advanceTimersByTimeAsync(50);  // 第1次重试
    await vi.advanceTimersByTimeAsync(100); // 第2次重试

    await expect(resultPromise).rejects.toThrow(RetryExhaustedError);
    expect(fn).toHaveBeenCalledTimes(3); // 1 original + 2 retries
  });

  it('should call onRetry callback', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('fail'));
    const onRetry = vi.fn();

    const resultPromise = withRetry(fn, {
      maxRetries: 1,
      baseDelayMs: 50,
      onRetry,
    });
    resultPromise.catch(() => {});

    await vi.advanceTimersByTimeAsync(50);

    await expect(resultPromise).rejects.toThrow(RetryExhaustedError);
    expect(onRetry).toHaveBeenCalledWith(1, expect.any(Error));
  });

  it('should use exponential backoff', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('fail'));
    const start = Date.now();

    // 使用真实定时器测试退避间隔
    vi.useRealTimers();

    await expect(
      withRetry(fn, { maxRetries: 3, baseDelayMs: 100 }),
    ).rejects.toThrow(RetryExhaustedError);

    const elapsed = Date.now() - start;
    // 3 次重试：100 + 200 + 400 = 700ms，允许 100ms 误差
    expect(elapsed).toBeGreaterThanOrEqual(700);
    expect(elapsed).toBeLessThan(900);
    expect(fn).toHaveBeenCalledTimes(4); // 1 original + 3 retries
  }, 10000);
});
