import { ipcMain, app } from 'electron';
import { storeService } from './services/StoreService';

export function registerIpcHandlers(): void {
  // GitHub Token
  ipcMain.handle('github:validate-token', async (_event, token: string) => {
    const { gitHubAdapter } = await import('../core/adapters/GitHubAdapter');
    return gitHubAdapter.validateToken(token);
  });

  ipcMain.handle('github:get-user', async () => {
    const { gitHubAdapter } = await import('../core/adapters/GitHubAdapter');
    return gitHubAdapter.getUser();
  });

  ipcMain.handle('github:has-token', () => {
    return storeService.hasValidToken();
  });

  ipcMain.handle('github:save-token', (_event, token: string) => {
    storeService.setGithubToken(token);
  });

  ipcMain.handle('github:clear-token', () => {
    storeService.clearGithubToken();
  });

  // 持久化队列
  ipcMain.handle('persist:flush', async () => {
    // 由渲染进程触发后通知主进程
    console.log('[IPC] flush 请求已接收');
  });

  // 应用版本
  ipcMain.handle('app:get-version', () => {
    return app.getVersion();
  });

  // 数据库导出备份
  ipcMain.handle('db:export-backup', async (_event, data: unknown) => {
    const fs = await import('fs/promises');
    const path = await import('path');
    const { app } = await import('electron');

    const backupDir = path.join(app.getPath('documents'), 'MemoPadBackups');
    await fs.mkdir(backupDir, { recursive: true });
    const filename = `memos-backup-${Date.now()}.json`;
    await fs.writeFile(
      path.join(backupDir, filename),
      JSON.stringify(data, null, 2),
      'utf-8',
    );
    return path.join(backupDir, filename);
  });
}
