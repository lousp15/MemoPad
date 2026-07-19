import type { Memo } from '@shared/types/memo';
import type { ConflictItem, ConflictResolution, SyncMode, SyncResult } from '@shared/types';

export class SyncService {
  /**
   * 检测本地与远程的冲突
   */
  detectConflicts(local: Memo[], remote: Memo[]): ConflictItem[] {
    const conflicts: ConflictItem[] = [];
    const localMap = new Map(local.map((m) => [m.uuid, m]));
    const remoteMap = new Map(remote.map((m) => [m.uuid, m]));

    // 检查双方都有的条目
    for (const [uuid, localMemo] of localMap) {
      const remoteMemo = remoteMap.get(uuid);
      if (!remoteMemo) continue;

      if (
        localMemo.updatedAt.getTime() !== remoteMemo.updatedAt.getTime()
      ) {
        conflicts.push({
          memoId: uuid,
          local: localMemo,
          remote: remoteMemo,
          localUpdatedAt: localMemo.updatedAt,
          remoteUpdatedAt: remoteMemo.updatedAt,
        });
      }
    }

    return conflicts;
  }

  /**
   * 根据用户选择合并
   */
  resolveConflicts(
    local: Memo[],
    remote: Memo[],
    resolution: ConflictResolution,
  ): Memo[] {
    const merged = new Map<string, Memo>();

    // 先处理双方共同条目
    const localMap = new Map(local.map((m) => [m.uuid, m]));
    const remoteMap = new Map(remote.map((m) => [m.uuid, m]));

    for (const uuid of new Set([...localMap.keys(), ...remoteMap.keys()])) {
      const localMemo = localMap.get(uuid);
      const remoteMemo = remoteMap.get(uuid);
      const choice = resolution[uuid];

      if (!localMemo) {
        // 仅远程有
        merged.set(uuid, remoteMemo!);
      } else if (!remoteMemo) {
        // 仅本地有
        merged.set(uuid, localMemo);
      } else if (choice === 'useLocal') {
        merged.set(uuid, localMemo);
      } else if (choice === 'useRemote') {
        merged.set(uuid, remoteMemo);
      } else {
        // 'skip' 或未指定 — 保留本地
        merged.set(uuid, localMemo);
      }
    }

    return Array.from(merged.values());
  }

  /**
   * 强制合并（以某一方为准）
   */
  forceMerge(
    local: Memo[],
    remote: Memo[],
    mode: SyncMode,
  ): { memos: Memo[]; conflicts: ConflictItem[] } {
    if (mode === 'forceLocal') {
      return { memos: local, conflicts: [] };
    }
    if (mode === 'forceRemote') {
      return { memos: remote, conflicts: [] };
    }
    // safe 模式
    const conflicts = this.detectConflicts(local, remote);
    if (conflicts.length === 0) {
      // 无冲突，自动合并（远程条目+本地独有条目）
      const merged = this.resolveConflicts(local, remote, {});
      return { memos: merged, conflicts: [] };
    }
    return { memos: local, conflicts };
  }
}

export const syncService = new SyncService();
