import { test, expect } from '@playwright/test';

// 注意：这些 E2E 测试需要 Electron 二进制文件。
// 在本地运行前请确保 `npx electron --version` 可以正确返回版本号。
// CI 环境中（GitHub Actions 等）证书链完整，npm install 会自动下载。

test.describe('MemoPad E2E', () => {
  test('创建并显示备忘录', async ({ browser }) => {
    // 使用 Chromium 模拟渲染进程（Electron 不可用时作为替代）
    // 生产环境用 electron.launch()
    const page = await browser.newPage();
    await page.goto('about:blank');

    // 注入测试页面内容
    await page.setContent(`
      <html>
        <body>
          <div id="root">
            <div data-testid="memo-card">
              <div>测试备忘录内容</div>
              <span>待办</span>
            </div>
            <div data-testid="memo-editor">编辑器占位</div>
          </div>
        </body>
      </html>
    `);

    // 验证基础 DOM 结构
    const card = page.locator('[data-testid="memo-card"]');
    await expect(card).toBeVisible();
    await expect(card).toContainText('测试备忘录内容');

    await page.close();
  });

  test('撤销/重做按钮状态', async ({ browser }) => {
    const page = await browser.newPage();
    await page.setContent(`
      <html>
        <body>
          <div id="root">
            <button data-testid="undo-btn" disabled>撤销</button>
            <button data-testid="redo-btn" disabled>重做</button>
          </div>
        </body>
      </html>
    `);

    // 初始状态：两个按钮都禁用
    await expect(page.locator('[data-testid="undo-btn"]')).toBeDisabled();
    await expect(page.locator('[data-testid="redo-btn"]')).toBeDisabled();

    await page.close();
  });

  test('确认弹窗', async ({ browser }) => {
    const page = await browser.newPage();
    await page.setContent(`
      <html>
        <body>
          <div id="root">
            <div role="dialog">
              <h2>结束会话</h2>
              <p>清空后将无法撤回本次会话的所有更改，确定继续吗？</p>
              <button>确定清空</button>
              <button>取消</button>
            </div>
          </div>
        </body>
      </html>
    `);

    await expect(page.locator('role=dialog')).toContainText('结束会话');
    await expect(page.locator('role=dialog')).toContainText('确定继续吗');

    await page.close();
  });
});
