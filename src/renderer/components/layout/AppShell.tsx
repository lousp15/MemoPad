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
import { githubApi } from '../../../core/services/GitHubApi';
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

  // --- 持久化存储（Electron 走 IPC 文件写入，Android/Web 走 localStorage） ---
  const saveToDisk = useCallback((memos: Memo[]) => {
    try {
      if (window.electronAPI?.saveMemos) {
        window.electronAPI.saveMemos(memos);
      } else {
        localStorage.setItem('memos', JSON.stringify(memos));
      }
    } catch (err) {
      console.error('[Save] 写入失败:', err);
    }
  }, []);

  // --- Keyboard shortcuts ---
  useKeyboard({ onUndo: undo, onRedo: redo });

  // --- 启动时加载数据 ---
  useEffect(() => {
    (async () => {
      try {
        let loaded: Memo[] = [];
        if (window.electronAPI?.loadMemos) {
          const data = await window.electronAPI.loadMemos();
          loaded = data as Memo[];
        } else {
          const raw = localStorage.getItem('memos');
          if (raw) loaded = JSON.parse(raw);
        }
        if (loaded.length > 0) {
          const marked = memoService.markExpired(loaded);
          setMemos(marked);
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
      const computedStatus = remindTime > new Date() ? ('pending' as const) : ('expired' as const);
      let saved: Memo[];

      if (editingMemo) {
        pushSnapshot({ action: 'edit', description: `编辑 "${content.slice(0, 20)}"` });
        const updated = memoService.touchMemo({
          ...editingMemo, content, remindTime, status: computedStatus,
        });
        updateMemo(updated);
        saved = memos.map((m) => (m.uuid === updated.uuid ? updated : m));
        saveToDisk(saved);
      } else {
        try {
          memoService.validateMaxMemos(memos.length, config.maxMemos);
        } catch (err: any) {
          alert(err.message);
          return;
        }
        pushSnapshot({ action: 'create', description: `创建 "${content.slice(0, 20)}"` });
        const memo = { ...memoService.createMemo(content, remindTime), status: computedStatus };
        addMemo(memo);
        saved = [...memos, memo];
        saveToDisk(saved);
      }
      setEditorOpen(false);
      setEditingMemo(null);
    },
    [editingMemo, memos.length, config.maxMemos, pushSnapshot, updateMemo, memos, saveToDisk],
  );

  const handleComplete = useCallback(
    (uuid: string) => {
      const target = memos.find((m) => m.uuid === uuid);
      if (!target) return;
      pushSnapshot({ action: 'edit', description: `完成 "${target.content.slice(0, 20)}"` });
      const updated = { ...target, status: 'completed' as const, updatedAt: new Date() };
      updateMemo(updated);
      const saved = memos.map((m) => (m.uuid === uuid ? updated : m));
      saveToDisk(saved);
    },
    [memos, pushSnapshot, updateMemo, saveToDisk],
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
      const saved = memos.filter((m) => m.uuid !== uuid);
      saveToDisk(saved);
    },
    [memos, pushSnapshot, deleteMemo, saveToDisk],
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

  // --- Sync to GitHub ---
  const [syncing, setSyncing] = useState(false);
  const syncConfigured = !!(config.github);

  const handleSync = useCallback(async () => {
    setSyncing(true);
    try {
      if (!config.github) return;
      const token = await githubApi.getToken();
      if (!token) {
        alert('未配置 Token，请在设置中配置');
        return;
      }
      const { owner, repo, syncMode } = config.github;

      if (syncMode === 'forceRemote') {
        const remote = await githubApi.pullMemos(token, owner, repo);
        if (remote && remote.length > 0) {
          setMemos(remote);
          saveToDisk(remote);
          alert(`[${syncMode}] 同步完成！已拉取 ${remote.length} 条远程数据覆盖本地`);
        } else {
          alert(`[${syncMode}] 远程仓库无数据，本地数据未改变`);
        }
      } else if (syncMode === 'forceLocal') {
        await githubApi.pushMemos(token, owner, repo, memos);
        alert(`[${syncMode}] 同步完成！已推送 ${memos.length} 条覆盖远程`);
      } else {
        const remote = await githubApi.pullMemos(token, owner, repo);
        if (remote && remote.length > 0) {
          const localIds = new Set(memos.map((m) => m.uuid));
          const merged = [...memos];
          for (const r of remote) {
            if (!localIds.has(r.uuid)) merged.push(r);
          }
          setMemos(merged);
          await githubApi.pushMemos(token, owner, repo, merged);
          alert(`同步完成！已合并远程 ${remote.length} 条`);
        } else {
          await githubApi.pushMemos(token, owner, repo, memos);
          alert(`同步完成！已推送 ${memos.length} 条到远程`);
        }
      }
    } catch (err: any) {
      alert('同步失败: ' + (err?.message ?? '未知错误'));
    } finally {
      setSyncing(false);
    }
  }, [config.github, memos, setMemos]);

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

  // --- 关闭前确保数据落盘 ---
  useEffect(() => {
    const handler = () => {
      // 同步阻塞 IndexedDB 写入完成
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, []);

  // --- 自动同步：每 30 分钟推送一次到 GitHub ---
  useEffect(() => {
    if (!config.github) return;

    const interval = setInterval(async () => {
      try {
        const token = await githubApi.getToken();
        if (!token || !config.github) return;
        await githubApi.pushMemos(token, config.github.owner, config.github.repo, memos);
        console.log('[AutoSync] 同步完成');
      } catch (err) {
        console.warn('[AutoSync] 同步失败（下次重试）:', err);
      }
    }, 30 * 60 * 1000); // 30 分钟

    return () => clearInterval(interval);
  }, [config.github?.owner, config.github?.repo, memos]);

  // --- 提醒检查：每分钟检查过期提醒并弹窗通知 ---
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      let changed = false;
      const updated = memos.map((memo) => {
        if (memo.status === 'pending' && new Date(memo.remindTime) <= now) {
          changed = true;
          // 浏览器通知（Android WebView 不支持 Notification API）
          if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
            new Notification('备忘录提醒', {
              body: memo.content.length > 80
                ? memo.content.slice(0, 80) + '...'
                : memo.content,
            });
          }
          return { ...memo, status: 'expired' as const };
        }
        return memo;
      });
      if (changed) {
        // 一次性更新 Zustand 并落盘
        memos.forEach((m, i) => {
          if (m.status === 'pending' && new Date(m.remindTime) <= now) {
            updateMemo(updated[i]);
          }
        });
        saveToDisk(updated);
      }
    }, 60 * 1000); // 每分钟

    // 请求通知权限（Android WebView 不支持 Notification API）
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => clearInterval(interval);
  }, [memos, updateMemo, saveToDisk]);

  // --- 跨平台版本更新检测 ---
  useEffect(() => {
    const APP_VERSION = '0.1.0';
    const checkUpdate = async () => {
      try {
        const res = await fetch('https://api.github.com/repos/lousp15/MemoPad/releases/latest');
        if (!res.ok) return;
        const data = await res.json();
        const latestVer = (data.tag_name || '').replace(/^v/, '');
        const newer = latestVer.split('.').map(Number)
          .reduce((acc: boolean, n: number, i: number) => acc || n > (APP_VERSION.split('.').map(Number)[i] || 0), false);
        if (newer && confirm(`发现新版本 v${latestVer}，是否前往下载？`)) {
          window.open(data.html_url, '_blank');
        }
      } catch {}
    };
    const timer = setTimeout(checkUpdate, 3000);
    return () => clearTimeout(timer);
  }, []);

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
        onSync={handleSync}
        syncing={syncing}
        syncConfigured={syncConfigured}
      />

      <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {sidebarOpen && <Sidebar onNavigate={handleNavigate} />}

        <Box
          component="main"
          sx={{
            flex: 1,
            p: { xs: 1, sm: 2 },
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
              <MemoFilter value={filter} onChange={setFilter} counts={counts} onAdd={handleCreate} />
              <MemoList
                memos={filteredMemos}
                selectedId={selectedId}
                onSelect={setSelectedId}
                onEdit={handleEdit}
                onComplete={handleComplete}
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
