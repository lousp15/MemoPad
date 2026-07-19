// 解决本地 SSL 证书验证问题（Node.js v24 在 Windows 上的已知兼容性问题）
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

import { app, BrowserWindow, dialog } from 'electron';
import path from 'path';
import { registerIpcHandlers } from './ipc-handlers';

const APP_VERSION = '0.1.0';
const GITHUB_REPO = 'lousp15/bwl';

// 必须在 whenReady 之前调用单例锁
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
  process.exit(0);
}

let mainWindow: BrowserWindow | null = null;

// 第二个实例启动时：激活现有窗口而非创建新窗口
app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

registerIpcHandlers();

/** 检查 GitHub Release 是否有新版本 */
async function checkForUpdates() {
  try {
    const url = `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`;
    const res = await fetch(url);
    if (!res.ok) return;
    const data = await res.json() as { tag_name: string; html_url: string; body?: string };
    const latestVersion = data.tag_name.replace(/^v/, '');
    if (latestVersion > APP_VERSION) {
      const { response } = await dialog.showMessageBox({
        type: 'info',
        title: '发现新版本',
        message: `MemoPad v${latestVersion} 可用`,
        detail: `当前版本: v${APP_VERSION}\n\n更新内容:\n${(data.body || '').slice(0, 500)}\n\n是否前往下载？`,
        buttons: ['前往下载', '稍后提醒'],
        defaultId: 0,
        cancelId: 1,
      });
      if (response === 0) {
        const { shell } = await import('electron');
        await shell.openExternal(data.html_url);
      }
    }
  } catch {
    // 静默失败（网络不可用等）
  }
}

app.whenReady().then(() => {
  mainWindow = new BrowserWindow({
    width: 960,
    height: 680,
    minWidth: 640,
    minHeight: 480,
    title: 'MemoPad',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // 开发模式加载 Vite dev server，生产模式加载打包文件
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    // 生产环境：index.html 在 dist/renderer/ 内
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  // 启动后延迟 3 秒检查更新（生产环境）
  if (!process.env.VITE_DEV_SERVER_URL) {
    setTimeout(checkForUpdates, 3000);
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    app.emit('ready');
  }
});
