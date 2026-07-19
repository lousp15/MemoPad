import { useMemo, useCallback } from 'react';
import { UndoManager } from '../../core/undo/UndoManager';
import { useMemoStore } from '../stores/memoStore';
import { useConfigStore } from '../stores/configStore';

let undoManager: UndoManager | null = null;

function getUndoManager(maxStack: number): UndoManager {
  if (!undoManager) {
    undoManager = new UndoManager(maxStack);
  }
  return undoManager;
}

export function useUndo() {
  const maxUndoStack = useConfigStore((s) => s.config.maxUndoStack);
  const memos = useMemoStore((s) => s.memos);
  const setMemos = useMemoStore((s) => s.setMemos);

  const manager = useMemo(() => getUndoManager(maxUndoStack), [maxUndoStack]);

  const pushSnapshot = useCallback(
    (meta?: { action?: 'create' | 'edit' | 'delete' | 'bulk'; description?: string }) => {
      manager.push(memos, meta);
    },
    [manager, memos],
  );

  const undo = useCallback(() => {
    const result = manager.undo();
    if (result) {
      setMemos(result.memos);
    }
    return result;
  }, [manager, setMemos]);

  const redo = useCallback(() => {
    const result = manager.redo();
    if (result) {
      // 在 redo 前保存当前状态到 undo 栈
      manager.pushRedo(memos, result.meta);
      setMemos(result.memos);
    }
    return result;
  }, [manager, setMemos, memos]);

  const endSession = useCallback(() => {
    manager.clear();
  }, [manager]);

  return {
    undoCount: manager.undoCount,
    redoCount: manager.redoCount,
    undoDescriptions: manager.undoDescriptions,
    redoDescriptions: manager.redoDescriptions,
    pushSnapshot,
    undo,
    redo,
    endSession,
  };
}
