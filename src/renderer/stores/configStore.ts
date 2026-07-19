import { create } from 'zustand';
import type { AppConfig, SyncMode } from '@shared/types';
import { DEFAULTS } from '@shared/constants';

interface ConfigState {
  config: AppConfig;
  setConfig: (config: AppConfig) => void;
  updateConfig: (partial: Partial<AppConfig>) => void;
  setSyncMode: (mode: SyncMode) => void;
}

export const useConfigStore = create<ConfigState>((set) => ({
  config: {
    maxMemos: DEFAULTS.MAX_MEMOS,
    maxUndoStack: DEFAULTS.MAX_UNDO_STACK,
    autoSaveDelay: DEFAULTS.AUTO_SAVE_DELAY_MS,
    theme: DEFAULTS.THEME,
  },

  setConfig: (config) => set({ config }),
  updateConfig: (partial) =>
    set((state) => ({ config: { ...state.config, ...partial } })),
  setSyncMode: (syncMode) =>
    set((state) => ({
      config: {
        ...state.config,
        github: state.config.github
          ? { ...state.config.github, syncMode }
          : undefined,
      },
    })),
}));
