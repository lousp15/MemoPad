import type { Memo } from './memo';

export type SyncMode = 'safe' | 'forceLocal' | 'forceRemote';

export type ConflictResolution = {
  [memoId: string]: 'useLocal' | 'useRemote' | 'skip';
};

export interface ConflictItem {
  memoId: string;
  local: Memo;
  remote: Memo;
  localUpdatedAt: Date;
  remoteUpdatedAt: Date;
}

export interface SyncResult {
  success: boolean;
  conflictCount: number;
  syncedAt: Date;
  error?: string;
}
