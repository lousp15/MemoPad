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

  ipcMain.handle('github:get-token', () => {
    return storeService.getGithubToken();
  });

  ipcMain.handle('github:clear-token', () => {
    storeService.clearGithubToken();
  });

  // 仓库配置持久化
  ipcMain.handle('github:save-config', (_event, config: { owner: string; repo: string; branch: string; syncMode: string }) => {
    storeService.setGithubConfig(config);
  });

  ipcMain.handle('github:get-config', () => {
    return storeService.getGithubConfig();
  });

  // GitHub 同步拉取
  ipcMain.handle('sync:pull', async (_event, { token, owner, repo }: {
    token: string; owner: string; repo: string;
  }) => {
    const { Octokit } = await import('octokit');
    const octokit = new Octokit({ auth: token });
    try {
      const { data } = await octokit.request(
        'GET /repos/{owner}/{repo}/contents/memos.json',
        { owner, repo, ref: 'master' },
      );
      if (!('content' in data)) return [];
      const content = Buffer.from(data.content, 'base64').toString('utf-8');
      return JSON.parse(content);
    } catch {
      return [];
    }
  });

  // GitHub 同步推送
  ipcMain.handle('sync:push', async (_event, { token, owner, repo, memos }: {
    token: string; owner: string; repo: string; memos: unknown[];
  }) => {
    const { Octokit } = await import('octokit');
    const octokit = new Octokit({ auth: token });
    const path = 'memos.json';
    const content = Buffer.from(JSON.stringify(memos, null, 2)).toString('base64');
    const branch = 'master';

    try {
      const { data } = await octokit.request(
        'GET /repos/{owner}/{repo}/contents/{path}',
        { owner, repo, path, ref: branch },
      );
      const sha = 'sha' in data ? data.sha : undefined;
      await octokit.request('PUT /repos/{owner}/{repo}/contents/{path}', {
        owner, repo, path, message: `MemoPad 同步 ${new Date().toISOString()}`,
        content, sha, branch,
      });
    } catch (err: any) {
      if (err?.status === 404) {
        await octokit.request('PUT /repos/{owner}/{repo}/contents/{path}', {
          owner, repo, path,
          message: `MemoPad 初始同步 ${new Date().toISOString()}`,
          content, branch,
        });
        return;
      }
      throw err;
    }
  });

  // 持久化队列
  ipcMain.handle('persist:flush', async () => {
    // 由渲染进程触发后通知主进程
    console.log('[IPC] flush 请求已接收');
  });

  // 文件级持久化（替代 localStorage，解决 file:// 协议下不可靠问题）
  ipcMain.handle('storage:save-memos', async (_event, memos: unknown[]) => {
    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      const dataDir = path.join(app.getPath('userData'), 'data');
      await fs.mkdir(dataDir, { recursive: true });
      await fs.writeFile(
        path.join(dataDir, 'memos.json'),
        JSON.stringify(memos, null, 2),
        'utf-8',
      );
    } catch (err) {
      console.error('[storage] 保存失败:', err);
    }
  });

  ipcMain.handle('storage:load-memos', async () => {
    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      const filePath = path.join(app.getPath('userData'), 'data', 'memos.json');
      const exists = await fs.stat(filePath).then(() => true).catch(() => false);
      if (!exists) return [];
      const raw = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(raw);
    } catch {
      return [];
    }
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
