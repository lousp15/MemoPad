import { safeStorage } from 'electron';
import Store from 'electron-store';

export class StoreService {
  private store: Store;
  private useSafeStorage: boolean;

  constructor() {
    this.useSafeStorage = safeStorage.isEncryptionAvailable();
    this.store = new Store({
      name: 'memo-pad-config',
      // safeStorage 不可用时（如 Linux 无 libsecret），回退到 electron-store 自身加密
      encryptionKey: this.useSafeStorage
        ? undefined
        : process.env.STORE_ENCRYPTION_KEY || undefined,
    });
  }

  setGithubToken(token: string): void {
    if (this.useSafeStorage) {
      const encrypted = safeStorage.encryptString(token).toString('base64');
      this.store.set('githubToken', encrypted);
    } else {
      this.store.set('githubToken', token);
    }
  }

  getGithubToken(): string | null {
    const stored = this.store.get('githubToken') as string | undefined;
    if (!stored) return null;
    if (this.useSafeStorage) {
      try {
        const buffer = Buffer.from(stored, 'base64');
        return safeStorage.decryptString(buffer);
      } catch {
        return null;
      }
    }
    return stored;
  }

  clearGithubToken(): void {
    this.store.delete('githubToken');
  }

  hasValidToken(): boolean {
    return this.getGithubToken() !== null;
  }

  getEncryptionStatus(): 'available' | 'unavailable' {
    return this.useSafeStorage ? 'available' : 'unavailable';
  }

  // ---- 仓库配置持久化 ----

  setGithubConfig(config: { owner: string; repo: string; branch: string; syncMode: string }): void {
    this.store.set('githubConfig', config);
  }

  getGithubConfig(): { owner: string; repo: string; branch: string; syncMode: string } | null {
    return this.store.get('githubConfig') as any ?? null;
  }

  clearGithubConfig(): void {
    this.store.delete('githubConfig');
  }
}

export const storeService = new StoreService();
