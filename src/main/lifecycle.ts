import { BrowserWindow, dialog, app } from 'electron';

export interface CloseHandlerDeps {
  hasPendingData: () => Promise<boolean>;
  forceFlush: () => Promise<void>;
}

export function setupCloseHandler(win: BrowserWindow, deps: CloseHandlerDeps) {
  let userConfirmedClose = false;

  const handleClose = async (event: Electron.Event) => {
    if (userConfirmedClose) return;

    const hasPending = await deps.hasPendingData();
    if (!hasPending) {
      userConfirmedClose = true;
      app.quit();
      return;
    }

    event.preventDefault();

    const { response } = await dialog.showMessageBox(win, {
      type: 'question',
      buttons: ['保存并退出', '不保存退出', '取消'],
      defaultId: 0,
      cancelId: 2,
      message: '有未保存的更改，是否保存？',
      detail:
        '选择"保存并退出"将写入所有未落盘数据；选择"不保存退出"将丢弃未保存的更改。',
    });

    if (response === 0) {
      try {
        await deps.forceFlush();
      } catch {
        console.warn('[lifecycle] forceFlush 失败');
      }
      userConfirmedClose = true;
      app.quit();
    } else if (response === 1) {
      userConfirmedClose = true;
      app.quit();
    }
    // response === 2 ("取消")：不做任何操作，窗口保持打开
  };

  win.on('close', handleClose);
}
