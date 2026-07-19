import { describe, it, expect, beforeEach } from 'vitest';
import { UndoManager } from '../../src/core/undo/UndoManager';
import type { Memo } from '../../src/shared/types/memo';

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

describe('UndoManager', () => {
  let manager: UndoManager;

  beforeEach(() => {
    manager = new UndoManager(5); // 小容量方便测试
  });

  it('should start empty', () => {
    expect(manager.undoCount).toBe(0);
    expect(manager.redoCount).toBe(0);
  });

  it('should push and undo', () => {
    const memo1 = makeMemo('1', '备忘A');
    const memo2 = makeMemo('2', '备忘B');

    manager.push([memo1], { action: 'create', description: '创建 备忘A' });
    expect(manager.undoCount).toBe(1);

    const result = manager.undo();
    expect(result).not.toBeNull();
    expect(result!.memos).toEqual([memo1]);
    expect(result!.meta.description).toBe('创建 备忘A');
    expect(manager.undoCount).toBe(0);
    expect(manager.redoCount).toBe(0);
  });

  it('should undo multiple steps', () => {
    const memo1 = makeMemo('1', '备忘A');
    const memo2 = makeMemo('2', '备忘B');
    const memo3 = makeMemo('3', '备忘C');

    manager.push([memo1], { action: 'create', description: '创建 备忘A' });
    manager.push([memo1, memo2], { action: 'create', description: '创建 备忘B' });
    manager.push([memo1, memo2, memo3], { action: 'create', description: '创建 备忘C' });

    // undo 返回最近一次 push 的快照
    const undo1 = manager.undo();
    expect(undo1!.memos).toEqual([memo1, memo2, memo3]);
    expect(manager.undoCount).toBe(2);

    const undo2 = manager.undo();
    expect(undo2!.memos).toEqual([memo1, memo2]);
    expect(manager.undoCount).toBe(1);

    const undo3 = manager.undo();
    expect(undo3!.memos).toEqual([memo1]);
    expect(manager.undoCount).toBe(0);
    expect(manager.undo()).toBeNull();
  });

  it('should undo and redo with pushRedo', () => {
    const memo1 = makeMemo('1', '备忘A');
    const memo2 = makeMemo('2', '备忘B');

    manager.push([memo1], { action: 'create', description: '创建' });
    expect(manager.undoCount).toBe(1);

    const undo1 = manager.undo();
    expect(undo1!.memos).toEqual([memo1]);
    expect(manager.undoCount).toBe(0);

    // redo 需要外部 pushRedo 将状态放回
    manager.pushRedo([memo1], undo1!.meta);
    const redo1 = manager.redo();
    expect(redo1).not.toBeNull();
    expect(redo1!.memos).toHaveLength(1);
    expect(redo1!.meta.description).toBe('创建');
  });

  it('should return null when nothing to undo', () => {
    expect(manager.undo()).toBeNull();
    expect(manager.redo()).toBeNull();
  });

  it('should limit stack size', () => {
    for (let i = 0; i < 10; i++) {
      manager.push([makeMemo(`${i}`, `备忘${i}`)], {
        action: 'create',
        description: `创建 备忘${i}`,
      });
    }
    expect(manager.undoCount).toBe(5); // 只有最近 5 条
  });

  it('should clear all stacks', () => {
    manager.push([makeMemo('1', '备忘A')], { action: 'create', description: '创建' });
    manager.push([makeMemo('2', '备忘B')], { action: 'create', description: '创建' });
    expect(manager.undoCount).toBe(2);

    manager.clear();
    expect(manager.undoCount).toBe(0);
    expect(manager.redoCount).toBe(0);
    expect(manager.undo()).toBeNull();
  });

  it('should clear redo stack on new push', () => {
    manager.push([makeMemo('1', '备忘A')], { action: 'create', description: '创建' });
    manager.undo();
    expect(manager.undoCount).toBe(0);

    // 新操作清空 redo
    manager.push([makeMemo('3', '备忘C')], { action: 'create', description: '创建' });
    expect(manager.redoCount).toBe(0);
  });

  it('should return descriptions', () => {
    manager.push([makeMemo('1', '备忘A')], { action: 'create', description: '创建 备忘A' });
    manager.push([makeMemo('1', '备忘A改'), makeMemo('2', '备忘B')], {
      action: 'edit',
      description: '编辑 备忘A',
    });

    expect(manager.undoDescriptions).toEqual(['编辑 备忘A', '创建 备忘A']);
    expect(manager.undoDescriptions).toHaveLength(2);
  });

  it('should use default meta when not provided', () => {
    manager.push([makeMemo('1', '备忘A')]);
    const result = manager.undo();
    expect(result!.meta.action).toBe('edit');
    expect(result!.meta.description).toBe('修改');
  });
});
