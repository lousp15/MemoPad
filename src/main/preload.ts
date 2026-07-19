import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  // Token 操作：主进程加密，渲染进程不接触明文 Token
  validateGithubToken: (token: string) =>
    ipcRenderer.invoke('github:validate-token', token),

  getOctokitUser: () =>
    ipcRenderer.invoke('github:get-user'),

  hasGithubToken: () =>
    ipcRenderer.invoke('github:has-token'),

  saveGithubToken: (token: string) =>
    ipcRenderer.invoke('github:save-token', token),

  getGithubToken: () =>
    ipcRenderer.invoke('github:get-token'),

  clearGithubToken: () =>
    ipcRenderer.invoke('github:clear-token'),

  // 仓库配置持久化
  saveGithubConfig: (config: { owner: string; repo: string; branch: string; syncMode: string }) =>
    ipcRenderer.invoke('github:save-config', config),
  getGithubConfig: () =>
    ipcRenderer.invoke('github:get-config'),

  // GitHub 同步拉取
  syncPull: (params: { token: string; owner: string; repo: string }) =>
    ipcRenderer.invoke('sync:pull', params),

  // GitHub 同步推送
  syncPush: (params: { token: string; owner: string; repo: string; memos: unknown[] }) =>
    ipcRenderer.invoke('sync:push', params),

  // 文件级持久化
  saveMemos: (memos: unknown[]) => ipcRenderer.invoke('storage:save-memos', memos),
  loadMemos: () => ipcRenderer.invoke('storage:load-memos'),

  // 持久化队列
  flushQueue: () =>
    ipcRenderer.invoke('persist:flush'),

  // 应用信息
  getAppVersion: () =>
    ipcRenderer.invoke('app:get-version'),
});
