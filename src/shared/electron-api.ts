// ElectronAPI 接口定义 — preload 暴露给渲染进程的安全 API

export interface ElectronAPI {
  /** 验证 GitHub Token 有效性（主进程调用 Octokit GET /user，不泄漏 Token 明文） */
  validateGithubToken: (token: string) => Promise<boolean>;

  /** 获取已存储 Token 的 Octokit 实例信息（主进程内部使用） */
  getOctokitUser: () => Promise<{ login: string } | null>;

  /** 查询 Token 是否存在且可解密 */
  hasGithubToken: () => Promise<boolean>;

  /** 保存 GitHub Token（主进程加密存储） */
  saveGithubToken: (token: string) => Promise<void>;

  /** 删除 GitHub Token */
  clearGithubToken: () => Promise<void>;

  /** 强制刷新持久化队列 */
  flushQueue: () => Promise<void>;

  /** 获取应用版本号 */
  getAppVersion: () => string;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
