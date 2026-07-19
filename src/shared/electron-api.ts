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

  /** 获取已存储的 Token（解密后） */
  getGithubToken: () => Promise<string | null>;

  /** 删除 GitHub Token */
  clearGithubToken: () => Promise<void>;

  /** 保存仓库配置 */
  saveGithubConfig: (config: { owner: string; repo: string; branch: string; syncMode: string }) => Promise<void>;

  /** 获取已存储的仓库配置 */
  getGithubConfig: () => Promise<{ owner: string; repo: string; branch: string; syncMode: string } | null>;

  /** 从 GitHub 仓库拉取备忘录 */
  syncPull: (params: { token: string; owner: string; repo: string }) => Promise<any[]>;

  /** 推送备忘录到 GitHub 仓库 */
  syncPush: (params: { token: string; owner: string; repo: string; memos: any[] }) => Promise<void>;

  /** 文件级持久化保存 */
  saveMemos: (memos: unknown[]) => Promise<void>;
  /** 文件级持久化加载 */
  loadMemos: () => Promise<unknown[]>;

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
