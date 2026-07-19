import type { Memo } from '@shared/types/memo';

export interface SnapshotMeta {
  action: 'create' | 'edit' | 'delete' | 'bulk';
  description: string;
  timestamp: number;
}

interface Snapshot {
  memos: Memo[];
  meta: SnapshotMeta;
}

export class UndoManager {
  private undoStack: Snapshot[] = [];
  private redoStack: Snapshot[] = [];
  private readonly maxStack: number;

  constructor(maxStack: number = 50) {
    this.maxStack = maxStack;
  }

  push(snapshot: Memo[], meta?: Partial<SnapshotMeta>): void {
    const fullMeta: SnapshotMeta = {
      action: meta?.action ?? 'edit',
      description: meta?.description ?? '修改',
      timestamp: meta?.timestamp ?? Date.now(),
    };

    this.undoStack.push({ memos: structuredClone(snapshot), meta: fullMeta });
    this.redoStack = [];

    if (this.undoStack.length > this.maxStack) {
      this.undoStack.shift();
    }
  }

  undo(): { memos: Memo[]; meta: SnapshotMeta } | null {
    if (this.undoStack.length === 0) return null;

    const snapshot = this.undoStack.pop()!;

    // 如果还有可撤销的历史，将当前状态压入重做栈
    // 实际调用时，当前状态由外部提供

    return { memos: snapshot.memos, meta: snapshot.meta };
  }

  redo(): { memos: Memo[]; meta: SnapshotMeta } | null {
    if (this.redoStack.length === 0) return null;

    const snapshot = this.redoStack.pop()!;
    return { memos: snapshot.memos, meta: snapshot.meta };
  }

  pushRedo(snapshot: Memo[], meta: SnapshotMeta): void {
    this.redoStack.push({ memos: structuredClone(snapshot), meta });
    if (this.redoStack.length > this.maxStack) {
      this.redoStack.shift();
    }
  }

  get undoCount(): number {
    return this.undoStack.length;
  }

  get redoCount(): number {
    return this.redoStack.length;
  }

  get undoDescriptions(): string[] {
    return this.undoStack.map((s) => s.meta.description).reverse();
  }

  get redoDescriptions(): string[] {
    return this.redoStack.map((s) => s.meta.description).reverse();
  }

  clear(): void {
    this.undoStack = [];
    this.redoStack = [];
  }
}
