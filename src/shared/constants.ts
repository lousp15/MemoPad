// 默认配置常量

export const DEFAULTS = {
  MAX_MEMOS: 15,
  MAX_UNDO_STACK: 50,
  AUTO_SAVE_DELAY_MS: 1000,
  THEME: 'light' as const,
  GITHUB_BRANCH: 'main',
  EMERGENCY_STORAGE_KEY: 'memo-pad-emergency',
  EMERGENCY_STORAGE_MAX_BYTES: 5120, // 5KB
  RETRY_MAX_ATTEMPTS: 3,
  RETRY_BASE_DELAY_MS: 1000,
  FORCE_FLUSH_TIMEOUT_MS: 3000,
  SYNC_INTERVAL_MS: 30 * 60 * 1000, // 30 分钟
} as const;

export const MAX_MEMOS_RANGE = { MIN: 5, MAX: 500, UNLIMITED: -1 } as const;

export const STORE_NAMES = {
  DB_NAME: 'MemoPadDB',
  MEMOS_TABLE: 'memos',
  CONFIG_TABLE: 'config',
  DB_VERSION: 1,
} as const;
