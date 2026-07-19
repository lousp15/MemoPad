import type { Memo } from '@shared/types/memo';

export interface IStorageAdapter {
  getAll(): Promise<Memo[]>;
  get(uuid: string): Promise<Memo | null>;
  add(memo: Memo): Promise<void>;
  update(memo: Memo): Promise<void>;
  delete(uuid: string): Promise<void>;
  clear(): Promise<void>;
  clearAll(): Promise<void>;
}
