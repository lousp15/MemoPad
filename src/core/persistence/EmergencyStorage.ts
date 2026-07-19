import { DEFAULTS } from '@shared/constants';

export class EmergencyStorage {
  save(data: unknown): boolean {
    try {
      const json = JSON.stringify(data);
      if (json.length > DEFAULTS.EMERGENCY_STORAGE_MAX_BYTES) {
        console.warn(
          `[EmergencyStorage] 数据超出 ${DEFAULTS.EMERGENCY_STORAGE_MAX_BYTES} 字节限制`,
        );
        return false;
      }
      localStorage.setItem(DEFAULTS.EMERGENCY_STORAGE_KEY, json);
      return true;
    } catch (err) {
      console.error('[EmergencyStorage] 保存失败:', err);
      return false;
    }
  }

  recover<T>(): T | null {
    try {
      const raw = localStorage.getItem(DEFAULTS.EMERGENCY_STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  clear(): void {
    localStorage.removeItem(DEFAULTS.EMERGENCY_STORAGE_KEY);
  }

  hasData(): boolean {
    return localStorage.getItem(DEFAULTS.EMERGENCY_STORAGE_KEY) !== null;
  }
}

export const emergencyStorage = new EmergencyStorage();
