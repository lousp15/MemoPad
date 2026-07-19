import React, { useEffect, useState, useCallback } from 'react';
import { Box } from '@mui/material';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { MemoList } from '../memo/MemoList';
import { MemoEditor } from '../memo/MemoEditor';
import { MemoFilter } from '../memo/MemoFilter';
import { EmptyState } from '../memo/EmptyState';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { RetryBanner } from '../common/RetryBanner';
import { OverLimitChip } from '../settings/OverLimitChip';
import { SettingsPanel } from '../settings/SettingsPanel';
import { useMemoStore } from '../../stores/memoStore';
import { useConfigStore } from '../../stores/configStore';
import { useUiStore } from '../../stores/uiStore';
import { useUndo } from '../../hooks/useUndo';
import { useKeyboard } from '../../hooks/useKeyboard';
import { memoService } from '../../../core/services/MemoService';
import { IndexedDBAdapter } from '../../../core/adapters/IndexedDBAdapter';
import { PersistQueue } from '../../../core/persistence/PersistQueue';
import { emergencyStorage } from '../../../core/persistence/EmergencyStorage';
import type { Memo } from '@shared/types/memo';

type View = 'memos' | 'settings';

export function AppShell() {
  // --- Stores ---
  const memos = useMemoStore((s) => s.memos);
  const setMemos = useMemoStore((s) => s.setMemos);
  const addMemo = useMemoStore((s) => s.addMemo);
  const updateMemo = useMemoStore((s) => s.updateMemo);
  const deleteMemo = useMemoStore((s) => s.deleteMemo);
  const filter = useMemoStore((s) => s.filter);
  const setFilter = useMemoStore((s) => s.setFilter);
  const selectedId = useMemoStore((s) => s.selectedId);
  const setSelectedId = useMemoStore((s) => s.setSelectedId);
  const isOverLimit = useMemoStore((s) => s.isOverLimit);
  const setIsOverLimit = useMemoStore((s) => s.setIsOverLimit);

  const config = useConfigStore((s) => s.config);

  const sidebarOpen = useUiStore((s) => s.sidebarOpen);
  const batchMode = useUiStore((s) => s.batchMode);
  const setBatchMode = useUiStore((s) => s.setBatchMode);

  // --- Local state ---
  const [view, setView] = useState<View>('memos');
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingMemo, setEditingMemo] = useState<Memo | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [retryInfo, setRetryInfo] = useState<{ message: string; count: number } | null>(null);

  // --- Core services ---
  const [dbAdapter] = useState(() => new IndexedDBAdapter());
  const [persistQueue] = useState(() => new PersistQueue(dbAdapter, config.autoSaveDelay));

  const {
    undoCount,
    redoCount,
    undoDescriptions,
    redoDescriptions,
    pushSnapshot,
    undo,
    redo,
    endSession,
  } = useUndo();

  // --- Keyboard shortcuts ---
  useKeyboard({ onUndo: undo, onRedo: redo });

  // --- Init: load data from IndexedDB ---
  useEffect(() => {
    (async () => {
      try {
        const loaded = await dbAdapter.getAll();
        const marked = memoService.markExpired(loaded);
        setMemos(marked);
        // 检查紧急备份
        const emergency = emergencyStorage.recover<Memo[]>();
        if (emergency && emergency.length > 0) {
          for (const m of emergency) {
            const exists = marked.find((x) => x.uuid === m.uuid);
            if (!exists) {
              await dbAdapter.add(m);
              setMemos((prev) => [...prev, m]);
            }
          }
          emergencyStorage.clear();
        }
      } catch (err) {
        console.error('[AppShell] 数据加载失败:', err);
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // --- Over-limit check ---
  useEffect(() => {
    if (config.maxMemos === -1) {
      setIsOverLimit(false);
    } else {
      setIsOverLimit(memos.length > config.maxMemos);
    }
  }, [memos.length, config.maxMemos, setIsOverLimit]);

  // --- CRUD handlers ---
  const handleCreate = useCallback(() => {
    setEditingMemo(null);
    setEditorOpen(true);
  }, []);

  const handleSave = useCallback(
    (content: string, remindTime: Date) => {
      if (editingMemo) {
        // 编辑已有条目
        pushSnapshot({ action: 'edit', description: `编辑 "${content.slice(0, 20)}"` });
        const updated = memoService.touchMemo({ ...editingMemo, content, remindTime });
        updateMemo(updated);
        persistQueue.enqueue({ type: 'upsert', memoId: updated.uuid, data: updated });
      } else {
        // 新建条目
        try {
          memoService.validateMaxMemos(memos.length, config.maxMemos);
        } catch (err: any) {
          alert(err.message);
          return;
        }
        pushSnapshot({ action: 'create', description: `创建 "${content.slice(0, 20)}"` });
        const memo = memoService.createMemo(content, remindTime);
        addMemo(memo);
        persistQueue.enqueue({ type: 'upsert', memoId: memo.uuid, data: memo });
      }
      setEditorOpen(false);
      setEditingMemo(null);
    },
    [editingMemo, memos.length, config.maxMemos, pushSnapshot, updateMemo, addMemo, persistQueue],
  );

  const handleEdit = useCallback((memo: Memo) => {
    setEditingMemo(memo);
    setEditorOpen(true);
  }, []);

  const handleDelete = useCallback(
    (uuid: string) => {
      const target = memos.find((m) => m.uuid === uuid);
      pushSnapshot({ action: 'delete', description: `删除 "${target?.content.slice(0, 20)}"` });
      deleteMemo(uuid);
      persistQueue.enqueue({ type: 'delete', memoId: uuid });
    },
    [memos, pushSnapshot, deleteMemo, persistQueue],
  );

  const handleBatchDelete = useCallback(
    (ids: string[]) => {
      pushSnapshot({ action: 'bulk', description: `批量删除 ${ids.length} 条` });
      for (const id of ids) {
        deleteMemo(id);
        persistQueue.enqueue({ type: 'delete', memoId: id });
      }
    },
    [pushSnapshot, deleteMemo, persistQueue],
  );

  // --- End session ---
  const handleEndSession = useCallback(() => {
    setConfirmOpen(true);
  }, []);

  const confirmEndSession = useCallback(() => {
    endSession();
    setConfirmOpen(false);
  }, [endSession]);

  // --- Filter ---
  const counts = {
    all: memos.length,
    pending: memos.filter((m) => m.status === 'pending').length,
    completed: memos.filter((m) => m.status === 'completed').length,
    expired: memos.filter((m) => m.status === 'expired').length,
  };

  const filteredMemos = memoService.filterMemos(memos, filter);

  // --- Navigation ---
  const handleNavigate = useCallback((target: string) => {
    if (target === 'settings') setSettingsOpen(true);
    else setView('memos');
  }, []);

  // --- Retry ---
  const handleRetry = useCallback(async () => {
    try {
      await persistQueue.flush();
      setRetryInfo(null);
    } catch {
      setRetryInfo((prev) => ({
        message: '保存失败，请检查 IndexedDB 是否可用',
        count: (prev?.count ?? 0) + 1,
      }));
    }
  }, [persistQueue]);

  // --- Persist error handling ---
  useEffect(() => {
    const interval = setInterval(async () => {
      if (persistQueue.pendingCount > 0) {
        try {
          await persistQueue.flush();
          setRetryInfo(null);
        } catch {
          // 尝试应急存储
          const pending = memos.filter((m) =>
            ['pending', 'expired', 'completed'].includes(m.status),
          );
          emergencyStorage.save(pending);
        }
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [persistQueue, memos]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <TopBar
        undoCount={undoCount}
        redoCount={redoCount}
        undoDescription={undoDescriptions[0]}
        redoDescription={redoDescriptions[0]}
        onUndo={undo}
        onRedo={redo}
        onEndSession={handleEndSession}
      />

      <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {sidebarOpen && <Sidebar onNavigate={handleNavigate} />}

        <Box
          component="main"
          sx={{
            flex: 1,
            p: 2,
            overflow: 'auto',
            bgcolor: 'background.default',
          }}
        >
          {isOverLimit && (
            <OverLimitChip
              currentCount={memos.length}
              maxMemos={config.maxMemos}
              onClick={() => setBatchMode(true)}
            />
          )}

          {memos.length === 0 ? (
            <EmptyState onCreateNew={handleCreate} />
          ) : (
            <>
              <MemoFilter value={filter} onChange={setFilter} counts={counts} />
              <MemoList
                memos={filteredMemos}
                selectedId={selectedId}
                onSelect={setSelectedId}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onBatchDelete={handleBatchDelete}
              />
            </>
          )}
        </Box>
      </Box>

      {/* Editor Dialog */}
      <MemoEditor
        open={editorOpen}
        initialContent={editingMemo?.content}
        initialRemindTime={editingMemo?.remindTime}
        onSave={handleSave}
        onCancel={() => {
          setEditorOpen(false);
          setEditingMemo(null);
        }}
      />

      {/* End Session Confirm */}
      <ConfirmDialog
        open={confirmOpen}
        title="结束会话"
        message="清空后将无法撤回本次会话的所有更改，确定继续吗？"
        confirmText="确定清空"
        onConfirm={confirmEndSession}
        onCancel={() => setConfirmOpen(false)}
      />

      {/* Settings */}
      <SettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />

      {/* Retry Banner */}
      {retryInfo && (
        <RetryBanner
          message={retryInfo.message}
          retryCount={retryInfo.count}
          onRetry={handleRetry}
          onIgnore={() => setRetryInfo(null)}
        />
      )}
    </Box>
  );
}
