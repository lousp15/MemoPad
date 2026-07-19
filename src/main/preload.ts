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

  clearGithubToken: () =>
    ipcRenderer.invoke('github:clear-token'),

  // 持久化队列
  flushQueue: () =>
    ipcRenderer.invoke('persist:flush'),

  // 应用信息
  getAppVersion: () =>
    ipcRenderer.invoke('app:get-version'),
});
