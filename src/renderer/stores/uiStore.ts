import { create } from 'zustand';
import type { SyncMode } from '@shared/types';

interface UiState {
  sidebarOpen: boolean;
  syncStatus: 'idle' | 'syncing' | 'error' | 'conflict';
  lastSyncTime: Date | null;
  batchMode: boolean;

  toggleSidebar: () => void;
  setSyncStatus: (status: UiState['syncStatus']) => void;
  setLastSyncTime: (time: Date | null) => void;
  setBatchMode: (mode: boolean) => void;
}

export const useUiStore = create<UiState>((set) => ({
  sidebarOpen: true,
  syncStatus: 'idle',
  lastSyncTime: null,
  batchMode: false,

  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSyncStatus: (syncStatus) => set({ syncStatus }),
  setLastSyncTime: (time) => set({ lastSyncTime: time }),
  setBatchMode: (batchMode) => set({ batchMode }),
}));
