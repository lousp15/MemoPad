import type { IStorageAdapter } from '../adapters/IStorageAdapter';
import type { Memo } from '@shared/types/memo';

export interface PersistOperation {
  type: 'upsert' | 'delete';
  memoId: string;
  data?: Memo;
}

type OperationStatus = 'pending' | 'executing' | 'completed' | 'cancelled';

interface OperationRecord {
  id: string;
  op: PersistOperation;
  status: OperationStatus;
  enqueuedAt: number;
}

let nextOpId = 0;

export class PersistQueue {
  private queue: OperationRecord[] = [];
  private timer: ReturnType<typeof setTimeout> | null = null;
  private flushing = false;

  constructor(
    private adapter: IStorageAdapter,
    private delayMs: number = 1000,
  ) {}

  enqueue(op: PersistOperation): string {
    const id = `op_${++nextOpId}`;
    this.queue.push({ id, op, status: 'pending', enqueuedAt: Date.now() });
    this.scheduleFlush();
    return id;
  }

  cancel(operationId: string): boolean {
    const record = this.queue.find((r) => r.id === operationId);
    if (!record) return false;
    if (record.status === 'pending') {
      record.status = 'cancelled';
      this.queue = this.queue.filter((r) => r.status !== 'cancelled');
      return true;
    }
    // executing / completed 不可取消
    return false;
  }

  isPending(operationId: string): boolean {
    const record = this.queue.find((r) => r.id === operationId);
    return record?.status === 'pending';
  }

  get pendingCount(): number {
    return this.queue.filter((r) => r.status === 'pending').length;
  }

  private scheduleFlush(): void {
    if (this.timer) clearTimeout(this.timer);
    if (this.flushing) return;
    this.timer = setTimeout(() => this.flush(), this.delayMs);
  }

  async flush(): Promise<void> {
    if (this.flushing) return;
    this.flushing = true;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    const pending = this.queue.filter((r) => r.status === 'pending');
    if (pending.length === 0) {
      this.flushing = false;
      return;
    }

    try {
      for (const record of pending) {
        record.status = 'executing';
        if (record.op.type === 'upsert' && record.op.data) {
          await this.adapter.update(record.op.data);
        } else if (record.op.type === 'delete') {
          await this.adapter.delete(record.op.memoId);
        }
        record.status = 'completed';
      }
      // 清理已完成和已取消的操作
      this.queue = this.queue.filter(
        (r) => r.status !== 'completed' && r.status !== 'cancelled',
      );
    } catch (err) {
      console.error('[PersistQueue] flush error:', err);
      // 将执行中但失败的操作重置为 pending，以便上层重试
      for (const record of this.queue) {
        if (record.status === 'executing') {
          record.status = 'pending';
        }
      }
      throw err;
    } finally {
      this.flushing = false;
    }
  }

  async forceFlush(): Promise<void> {
    await this.flush();
  }
}
