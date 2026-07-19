import Dexie, { type Table } from 'dexie';
import type { Memo } from '@shared/types/memo';
import type { AppConfig } from '@shared/types/config';
import type { IStorageAdapter } from './IStorageAdapter';
import { STORE_NAMES } from '@shared/constants';

export class IndexedDBAdapter implements IStorageAdapter {
  private db: Dexie;

  constructor() {
    this.db = new Dexie(STORE_NAMES.DB_NAME);
    this.db.version(STORE_NAMES.DB_VERSION).stores({
      [STORE_NAMES.MEMOS_TABLE]: 'uuid, status, updatedAt',
      [STORE_NAMES.CONFIG_TABLE]: 'key',
    });
  }

  private get memosTable(): Table<Memo, string> {
    return this.db.table(STORE_NAMES.MEMOS_TABLE);
  }

  async getAll(): Promise<Memo[]> {
    return this.memosTable.toArray();
  }

  async get(uuid: string): Promise<Memo | null> {
    return (await this.memosTable.get(uuid)) ?? null;
  }

  async add(memo: Memo): Promise<void> {
    await this.memosTable.add(memo);
  }

  async update(memo: Memo): Promise<void> {
    await this.memosTable.put(memo);
  }

  async delete(uuid: string): Promise<void> {
    await this.memosTable.delete(uuid);
  }

  async clear(): Promise<void> {
    await this.memosTable.clear();
  }

  async clearAll(): Promise<void> {
    await this.memosTable.clear();
  }
}
