import type { Memo } from './memo';

export interface AppConfig {
  maxMemos: number;           // 默认15，范围5~500，-1无限制
  maxUndoStack: number;       // 默认50
  autoSaveDelay: number;      // 默认1000ms
  theme: 'light' | 'dark';
  github?: GitHubRepoConfig;
}

export interface GitHubRepoConfig {
  owner: string;
  repo: string;
  branch: string;      // 默认 'main'
  syncMode: SyncMode;  // 同步模式
}

export type SyncMode = 'safe' | 'forceLocal' | 'forceRemote';
