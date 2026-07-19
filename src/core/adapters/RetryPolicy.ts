import type { Memo } from '@shared/types/memo';

export interface RetryOptions {
  maxRetries?: number;     // 默认 3
  baseDelayMs?: number;    // 默认 1000
  onRetry?: (attempt: number, error: Error) => void;
}

export class RetryExhaustedError extends Error {
  constructor(public readonly lastError: Error) {
    super(`Retry exhausted: ${lastError.message}`);
    this.name = 'RetryExhaustedError';
  }
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options?: RetryOptions,
): Promise<T> {
  const maxRetries = options?.maxRetries ?? 3;
  const baseDelayMs = options?.baseDelayMs ?? 1000;
  const onRetry = options?.onRetry;

  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < maxRetries) {
        onRetry?.(attempt + 1, lastError);
        await sleep(baseDelayMs * Math.pow(2, attempt));
      }
    }
  }

  throw new RetryExhaustedError(lastError!);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
