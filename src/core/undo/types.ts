import type { Memo } from '@shared/types/memo';

export interface SnapshotMeta {
  action: 'create' | 'edit' | 'delete' | 'bulk';
  description: string;
  timestamp: number;
}
