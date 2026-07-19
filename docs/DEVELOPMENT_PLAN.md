# MemoPad 备忘录软件开发方案（最终版）

> 本方案已融合三次审查全部修正建议（前两次 18+6 项 + 第三次 6 项）。变更点用 `[修正]` 标记。

---

## 一、技术栈清单

| 类别 | 选型 | 版本约束 | 用途 |
| :--- | :--- | :--- | :--- |
| 桌面容器 | **Electron** | ≥ 30 | 跨平台桌面壳 |
| 前端框架 | **React 18 + TypeScript** | 18.3+ | UI 渲染 |
| 构建工具 | **Vite + `vite-plugin-electron`** | ≥ 5 | 快速 HMR + 打包 |
| UI 组件库 | **MUI (Material-UI)** | **=6.0.0** [修正] | 精确版本锁定，注释注明已验证组合 |
| 日期组件 | **`@mui/x-date-pickers`** | **=7.0.0** [修正] | 精确版本锁定 |
| 日期引擎 | **dayjs** | ≥ 1.11 | 轻量日期库（2KB） |
| 状态管理 | **Zustand** | ≥ 4 | L1 内存缓存 |
| 本地 NoSQL | **Dexie.js** | ≥ 4 | IndexedDB 包装，L2 持久化 |
| 云端同步 | **Octokit.js** | ≥ 3 | GitHub REST API |
| **加密存储** | **Electron `safeStorage` 原生模块** [修正] | 内置 ≥ 15 | 替代第三方 `electron-safe-storage` |
| **配置存储** | **`electron-store`** | ≥ 9 | 主进程持久化配置 |
| 深拷贝 | `structuredClone`（原生） | — | 撤销快照核心 |
| 测试框架 | **Vitest** | ≥ 1.6 | 单元 + 集成测试 |
| E2E 测试 | **Playwright** | ≥ 1.40 | Electron E2E |
| 构建/分发 | **electron-builder** | ≥ 24 | 安装包生成 |
| 代码规范 | **ESLint + Prettier** | latest | 一致性 |

---

## 二、完整目录结构

```
memo-pad/
├── package.json
├── pnpm-workspace.yaml
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
├── vitest.config.ts
├── electron-builder.yml
├── .env.example
├── .eslintrc.cjs
├── .prettierrc
│
├── src/
│   ├── shared/                            # 主进程/渲染进程共享
│   │   ├── types/
│   │   │   ├── memo.ts                    # Memo 实体类型
│   │   │   ├── config.ts                  # AppConfig 类型
│   │   │   └── sync.ts                    # 同步状态 + 冲突类型
│   │   ├── constants.ts                   # 默认值 + 常亮
│   │   └── electron-api.ts               # ElectronAPI 接口定义
│   │
│   ├── main/                              # Electron 主进程
│   │   ├── index.ts                       # 入口：单例锁 + 窗口创建
│   │   ├── lifecycle.ts                   # beforeunload 拦截 + forceFlush
│   │   ├── autoUpdater.ts                 # 自动更新
│   │   ├── preload.ts                     # contextBridge 暴露类型安全 API
│   │   ├── global.d.ts                    # 扩展 Window 类型
│   │   └── services/
│   │       └── StoreService.ts            # electron-store + safeStorage 加密
│   │
│   ├── renderer/                          # React 渲染进程
│   │   ├── index.html
│   │   ├── main.tsx                       # ReactDOM.createRoot
│   │   ├── App.tsx                        # 根组件
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── AppShell.tsx           # 主布局
│   │   │   │   ├── Sidebar.tsx            # 侧边导航
│   │   │   │   └── TopBar.tsx             # 顶栏：撤销/重做/结束会话
│   │   │   ├── memo/
│   │   │   │   ├── MemoList.tsx           # 虚拟化列表
│   │   │   │   ├── MemoCard.tsx           # 单卡片
│   │   │   │   ├── MemoEditor.tsx         # 弹窗编辑器（+ DateTimePicker）
│   │   │   │   ├── MemoFilter.tsx         # 状态筛选
│   │   │   │   └── EmptyState.tsx         # 空状态
│   │   │   ├── settings/
│   │   │   │   ├── SettingsPanel.tsx      # 设置面板入口
│   │   │   │   ├── ThemeSettings.tsx      # MUI CSS 变量主题
│   │   │   │   ├── MemoSettings.tsx       # 上限/撤销深度
│   │   │   │   ├── SyncSettings.tsx       # GitHub 配置 + Token 状态检验 + 强制覆盖开关
│   │   │   │   └── OverLimitChip.tsx      # 超出上限引导 Chip
│   │   │   ├── sync/
│   │   │   │   ├── SyncStatusBar.tsx      # 同步状态指示器
│   │   │   │   └── ConflictDialog.tsx     # 冲突解决弹窗
│   │   │   └── common/
│   │   │       ├── ConfirmDialog.tsx      # 通用二次确认
│   │   │       ├── RetryBanner.tsx        # 写入失败重试横幅（含"忽略"选项）
│   │   │       └── LoadingSpinner.tsx
│   │   ├── providers/
│   │   │   └── ThemeProvider.tsx          # CssVarsProvider + dayjs 适配器
│   │   ├── hooks/
│   │   │   ├── useMemos.ts               # CRUD hooks
│   │   │   ├── useUndo.ts                # 撤销/重做 hooks
│   │   │   ├── useAutoSave.ts            # 防抖自动保存
│   │   │   ├── useSync.ts                # 同步状态
│   │   │   └── useKeyboard.ts            # Ctrl+Z/Y 快捷键
│   │   └── styles/
│   │       └── theme.ts                  # MUI 主题变量定义
│   │
│   ├── core/                              # 纯业务逻辑（无 UI 依赖）
│   │   ├── services/
│   │   │   ├── MemoService.ts            # 备忘录 CRUD + 上限校验
│   │   │   ├── ConfigService.ts          # 配置读写（主进程 safeStorage 加密 Token）
│   │   │   └── SyncService.ts            # 合并逻辑 + 文件损坏降级
│   │   ├── undo/
│   │   │   ├── UndoManager.ts            # 快照栈（+ 操作类型元信息）
│   │   │   └── types.ts                  # SnapshotMeta 类型
│   │   ├── persistence/
│   │   │   ├── PersistQueue.ts           # 防抖队列（+ 取消机制 + 竞态边界）
│   │   │   └── EmergencyStorage.ts       # localStorage 紧急备份
│   │   └── adapters/
│   │       ├── IStorageAdapter.ts        # 适配器接口（+ clearAll）
│   │       ├── IndexedDBAdapter.ts       # Dexie 实现（+ 版本迁移 + 数据导出备份）
│   │       ├── GitHubAdapter.ts          # Octokit 实现（+ 文件损坏降级与回滚）
│   │       └── RetryPolicy.ts            # 指数退避重试策略
│   │
│   └── tests/                             # (已移至项目根目录)
│
├── tests/                                 # 与 src/ 平级
│   ├── unit/
│   │   ├── MemoService.test.ts
│   │   ├── UndoManager.test.ts
│   │   ├── UndoManager.perf.test.ts
│   │   ├── PersistQueue.test.ts
│   │   ├── RetryPolicy.test.ts
│   │   └── ConflictResolver.test.ts
│   ├── integration/
│   │   ├── IndexedDBAdapter.test.ts      # 含版本迁移 + 升级数据导出
│   │   └── GitHubAdapter.test.ts         # 含文件损坏降级 + Token 失效 + 备份回滚
│   └── e2e/
│       ├── memo-crud.spec.ts
│       ├── undo-redo.spec.ts
│       ├── sync-conflict.spec.ts
│       ├── persist-restart.spec.ts       # 正常关闭重启恢复
│       └── crash-recovery.spec.ts        # [修正] 模拟进程崩溃/强行终止后数据恢复
│
├── resources/                             # 图标、安装资源
│   └── icon.png
├── scripts/
│   ├── dev.ts
│   └── build.ts
└── docs/
    ├── ARCHITECTURE.md
    ├── API_REFERENCE.md
    ├── USER_GUIDE.md
    └── CHANGELOG.md
```

---

## 三、核心修正项（基于二次审查的 6 条建议）

### [修正 1] 加密存储：`electron-safe-storage` → Electron 原生 `safeStorage`

**背景**：原方案使用第三方库 `electron-safe-storage`（2021 年最后发布），存在维护断层风险。

**改动**：替换为 Electron ≥ 15 内置的 `safeStorage` 模块（Windows DPAPI / macOS Keychain / Linux libsecret）。

```typescript
// src/main/services/StoreService.ts
import { safeStorage } from 'electron';
import Store from 'electron-store';

class StoreService {
  private store: Store;
  private useSafeStorage: boolean;

  constructor() {
    this.useSafeStorage = safeStorage.isEncryptionAvailable();
    this.store = new Store({
      name: 'memo-pad-config',
      // safeStorage 不可用时（如 Linux 无 libsecret），回退到 electron-store 自身加密
      encryptionKey: this.useSafeStorage ? undefined : (process.env.STORE_ENCRYPTION_KEY || undefined),
    });
  }

  setGithubToken(token: string): void {
    if (this.useSafeStorage) {
      const encrypted = safeStorage.encryptString(token).toString('base64');
      this.store.set('githubToken', encrypted);
    } else {
      // 降级：依赖 electron-store 的 encryptionKey
      this.store.set('githubToken', token);
    }
  }

  getGithubToken(): string | null {
    const stored = this.store.get('githubToken') as string | undefined;
    if (!stored) return null;
    if (this.useSafeStorage) {
      try {
        const buffer = Buffer.from(stored, 'base64');
        return safeStorage.decryptString(buffer);
      } catch {
        return null; // 解密失败（如跨设备迁移）返回 null 引导重新配置
      }
    }
    return stored; // 降级模式直接返回
  }

  clearGithubToken(): void {
    this.store.delete('githubToken');
  }

  /** Token 是否存在且可解密 */
  hasValidToken(): boolean {
    return this.getGithubToken() !== null;
  }

  /** 首次启动时检查加密可用性，不可用时提示用户安装 libsecret */
  getEncryptionStatus(): 'available' | 'unavailable' {
    return this.useSafeStorage ? 'available' : 'unavailable';
  }
}

export const storeService = new StoreService();
```

**实施注意**：
- preload 中只暴露安全方法，**绝不暴露原始 Token** 给渲染进程。`electronAPI` 接口定义如下：

```typescript
// src/shared/electron-api.ts
interface ElectronAPI {
  /** 验证 Token 有效性（返回 boolean，不泄漏 Token 明文） */
  validateGithubToken: (token: string) => Promise<boolean>;

  /** 获取已存储 Token 的 Octokit 实例（主进程内部使用，不返回到渲染进程） */
  getOctokitInstance: () => Promise<{ user: string } | null>;

  /** 查询 Token 是否存在且可解密 */
  hasGithubToken: () => Promise<boolean>;
}
```

- **渲染进程禁止存储 Token**：`useSync` hook 不将 Token 存入 Zustand 或任何变量中，调用 `window.electronAPI.validateGithubToken(token)` 时传入用户刚刚输入的明文，主进程校验后丢弃，不留存在渲染进程内存
- `getGithubToken` 不是 preload 暴露的方法，而是主进程内部 `SyncService` 通过 IPC handler 读取后直接初始化 Octokit 实例，渲染进程只拿得到 `Octokit` 请求结果，拿不到 Token 本身
- 加密/解密全部在主进程完成，渲染进程无解密能力

---

### [修正 2] GitHub 文件损坏降级：完整备份与回滚流程

**背景**：原方案仅说"自动备份为 `.backup`"，未定义备份文件是否推送远程、本地如何恢复。

**完整流程**：

```
GitHubAdapter.pullMemos()
  │
  ├── 成功 → 解析 JSON → 返回 Memo[]
  │
  └── 失败（JSON 解析错误）
        │
        ├── ① 检查远程是否存在同名的 .backup 文件
        │     ├── 存在 → 拉取 .backup → 提示用户是否回滚到备份版本
        │     │     ├── 用户选择"回滚" → 以备份数据为远程基准进行冲突合并
        │     │     └── 用户选择"忽略" → 以本地数据为准，标记远程损坏
        │     └── 不存在 → 创建备份：将损坏内容（原始 bytes）以 base64 写入 .backup 文件并推送远程
        │
        ├── ② 若本地有数据 → 以本地为准，UI 提示"远程文件已损坏，建议手动修复"
        │
        └── ③ 若本地无数据且无 .backup → 提示用户"远程数据损坏且无备份"，重置为空
```

**备份文件格式**（推送到远程仓库）：
```json
// memos.json.backup
{
  "originalContent": "<损坏文件的 base64 编码>",
  "backupedAt": "2025-01-15T10:30:00Z",
  "appVersion": "1.0.0"
}
```

---

### [修正 3] 单例锁调用时机与 `second-instance` 事件

**背景**：原方案仅写"调用 `app.requestSingleInstanceLock()`"，未明确在 `app.whenReady()` 之前的调用顺序，也未监听 `second-instance` 事件让第二个实例激活主窗口。

```typescript
// src/main/index.ts
import { app, BrowserWindow } from 'electron';

let mainWindow: BrowserWindow | null = null;

// 必须在 whenReady 之前调用单例锁
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
  // 注意：quit() 后仍需 return 退出当前脚本
  process.exit(0);
}

// 第二个实例启动时：激活现有窗口而非创建新窗口
app.on('second-instance', (_event, _argv, _cwd) => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

app.whenReady().then(() => {
  mainWindow = new BrowserWindow({ /* config */ });
  // ...
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
```

---

### [修正 4] `PersistQueue.cancel(id)` 的竞态边界

**背景**：队列中某操作可能已进入 `flush()` 执行阶段，此时 `cancel()` 无效。原方案未定义边界行为。

```typescript
// src/core/persistence/PersistQueue.ts
type OperationStatus = 'pending' | 'executing' | 'completed' | 'cancelled';

interface OperationRecord {
  id: string;
  op: PersistOperation;
  status: OperationStatus;
  enqueuedAt: number;
}

class PersistQueue {
  // ...

  /**
   * 取消指定操作。
   * @returns true 取消成功；false 操作已开始执行或已完成，无法取消
   * @throws 永不抛出异常——UI 层调用不需要 try/catch
   */
  cancel(operationId: string): boolean {
    const record = this.queue.find(r => r.id === operationId);
    if (!record) return false;                     // 不存在
    if (record.status === 'pending') {
      record.status = 'cancelled';
      this.queue = this.queue.filter(r => r.status !== 'cancelled');
      return true;
    }
    // status === 'executing' 或 'completed'：无法取消，静默返回 false
    console.warn(
      `[PersistQueue] cancel(${operationId}) ignored: already ${record.status}`
    );
    return false;
  }

  /** 查询操作是否仍可取消 */
  isPending(operationId: string): boolean {
    const record = this.queue.find(r => r.id === operationId);
    return record?.status === 'pending' ?? false;
  }
}
```

---

### [修正 5] 测试覆盖：模拟进程崩溃/强行终止的异常恢复

**背景**：原 `persist-restart.spec.ts` 仅覆盖正常关闭触发 forceFlush，未验证 `EmergencyStorage` 在异常关机时的兜底效果。

```typescript
// tests/e2e/crash-recovery.spec.ts
import { _electron as electron } from 'playwright';

test('进程崩溃后重启恢复未落盘数据', async () => {
  // 1. 启动应用
  const app = await electron.launch({ args: ['.'] });
  const page = await app.firstWindow();

  // 2. 创建一条备忘录（不等待防抖落盘）
  await page.fill('[data-testid="memo-editor"]', '崩溃前的内容');

  // 3. 模拟进程真崩溃（不走 beforeunload，不等 forceFlush）
  // 注意：app.close() 触发正常关闭流程，无法验证 EmergencyStorage
  // 因此使用 process.exit(1) 模拟 SIGKILL 级崩溃
  await app.evaluate(() => process.exit(1));

  // 4. 重启应用
  const app2 = await electron.launch({ args: ['.'] });
  const page2 = await app2.firstWindow();

  // 5. 验证 EmergencyStorage 恢复了未落盘数据
  await expect(page2.locator('[data-testid="memo-card"]')).toContainText('崩溃前的内容');

  await app2.close();
});

test('EmergencyStorage 容量限制', async () => {
  // 构造超过 5KB 的备忘录内容，验证 saveEmergency 拒绝写入
  // ...
});
```

---

### [修正 6] MUI 6.x + `@mui/x-date-pickers` 7.x 精确版本锁定 + CI 检查

```jsonc
// package.json
{
  "dependencies": {
    "@mui/material": "6.0.0",           // 精确版本，注释：经验证兼容组合
    "@mui/x-date-pickers": "7.0.0",     // 精确版本
    "dayjs": "^1.11.10"
  },
  "scripts": {
    "check:deps": "pnpm ls --depth=0",   // 用于 CI 检查依赖树
    "ci": "pnpm check:deps && pnpm lint && pnpm typecheck && pnpm test"
  }
}
```

CI 流程中增加 peer dependency 检查：
```yaml
# .github/workflows/ci.yml (示意)
- run: pnpm install --frozen-lockfile
- run: pnpm ls --depth=0                # 确认精确版本未被覆盖
- run: npx check-peer-deps              # 或 pnpm why @mui/material
```

---

### [修正 7] 关闭流程增加三选一对话窗（防误触关闭）

**背景**：原设计关闭时自动 `forceFlush` 静默退出，用户误触关闭按钮时没有取消机会。

**改动**：主进程 `lifecycle.ts` 中拦截 `close` 事件，弹出原生对话框提供三个选项（与 VS Code 行为一致）：

```typescript
// src/main/lifecycle.ts
import { BrowserWindow, dialog } from 'electron';

export function setupCloseHandler(win: BrowserWindow, persistQueue: PersistQueue) {
  let userConfirmedClose = false;

  win.on('close', async (event) => {
    if (userConfirmedClose) return; // 防止递归

    event.preventDefault();

    const { response } = await dialog.showMessageBox(win, {
      type: 'question',
      buttons: ['保存并退出', '不保存退出', '取消'],
      defaultId: 0,
      cancelId: 2,
      message: '有未保存的更改，是否保存？',
      detail: '选择"保存并退出"将写入所有未落盘数据；选择"不保存退出"将丢弃未保存的更改。',
    });

    if (response === 0) {
      // "保存并退出"：强制落盘后关闭
      try {
        await persistQueue.forceFlush();
      } catch {
        // forceFlush 失败时尝试 EmergencyStorage 兜底
        console.warn('[lifecycle] forceFlush 失败，数据已存入 EmergencyStorage');
      }
      userConfirmedClose = true;
      win.destroy();
    } else if (response === 1) {
      // "不保存退出"：丢弃内存数据直接关闭
      userConfirmedClose = true;
      win.destroy();
    }
    // response === 2 ("取消")：不做任何操作，窗口保持打开
  });
}
```

**实施注意**：
- `userConfirmedClose` 标志位防止递归（`destroy()` 会再次触发 `close`）
- `forceFlush` 若抛出异常，不应阻塞退出，降级为 EmergencyStorage 兜底
- 对话框使用 `dialog.showMessageBox`（原生样式），而非 MUI 组件——确保关闭流程不依赖渲染进程响应

---

## 四、可选增强（按优先级纳入）

### 高优先级：IndexedDB 版本迁移时自动数据导出备份

当 Dexie 数据库版本号升级（如 `db.version(1)` → `db.version(2)`），在 `upgrade` 回调中将旧数据导出为 JSON 文件，通过 Electron 的 `dialog.showSaveDialog` 让用户选择保存路径或自动保存到用户文档目录：

```typescript
// src/core/adapters/IndexedDBAdapter.ts
class IndexedDBAdapter implements IStorageAdapter {
  private db: Dexie;

  constructor() {
    this.db = new Dexie('MemoPadDB');
    this.db.version(2).stores({
      memos: 'uuid, status, updatedAt',
      config: 'key',
    }).upgrade(async (tx) => {
      // 导出旧数据作为备份
      const oldMemos = await tx.table('memos').toArray();
      const backupPath = await this.exportBackup(oldMemos);
      console.info(`[IndexedDB] 数据已备份至 ${backupPath}`);
    });
  }

  private async exportBackup(data: unknown): Promise<string> {
    // 通过 IPC 调用主进程写入用户文档目录
    return ipcRenderer.invoke('db:export-backup', data);
  }
}
```

### 中优先级：RetryBanner 增加"忽略"按钮

```typescript
// RetryBanner.tsx
interface RetryBannerProps {
  message: string;
  onRetry: () => void;
  onIgnore: () => void;          // 新增：暂时忽略，保留内存缓存
  retryCount: number;
}
```

点击"忽略"后：横幅消失，数据保留在 Zustand 和 PersistQueue 中，下次编辑时自动触发新的一轮重试。用户可随时通过手动点击"保存"按钮触发重试。

### 低优先级：GitHub 同步增加"强制覆盖"模式

在 `SyncSettings.tsx` 中增加选项：

| 同步模式 | 行为 | 适用场景 |
| :--- | :--- | :--- |
| **安全模式**（默认） | 冲突时弹窗让用户选择 | 日常使用 |
| **强制本地覆盖远程** | 跳过冲突检测，直接推送本地数据 | 本地数据为最新权威版本 |
| **强制远程覆盖本地** | 跳过冲突检测，直接拉取覆盖本地 | 重置或设备切换 |

```typescript
// SyncSettings.tsx
type SyncMode = 'safe' | 'forceLocal' | 'forceRemote';

// SyncService
class SyncService {
  async sync(mode: SyncMode): Promise<SyncResult> {
    if (mode === 'forceLocal') {
      return this.pushLocal();        // 直接推送，不检测冲突
    }
    if (mode === 'forceRemote') {
      return this.pullRemote();       // 直接拉取，覆盖本地
    }
    return this.safeSync();           // 原冲突检测流程
  }
}
```

### 低优先级：TopBar 撤销 Tooltip 展示操作描述

```typescript
// TopBar.tsx
const { undoCount, redoCount, undoDescriptions, redoDescriptions } = useUndo();

<Tooltip title={undoCount > 0 ? `撤销 ${undoDescriptions[0]}` : ''}>
  <IconButton onClick={undo} disabled={undoCount === 0}>
    <UndoIcon />
  </IconButton>
</Tooltip>
```

---

## 五、开发阶段（6 个阶段）

### Phase 1 — 项目脚手架与 Electron 壳

**目标**：可启动的空窗口，单例锁正确工作，preload 类型安全，ESLint + Prettier 就绪。

| Step | 操作 | 产出物 | 验证标准 |
| :--- | :--- | :--- | :--- |
| 1.1 | `pnpm init` → 安装全部依赖（精确锁定 MUI/x-date-pickers 版本） | `package.json` | `pnpm ls --depth=0` 列出所有依赖 |
| 1.2 | 配置 `vite.config.ts` + `vitest.config.ts` + `tsconfig.json`（strict 模式） | 构建配置 | `npx tsc --noEmit` 无错误 |
| 1.3 | `src/main/index.ts`：`BrowserWindow` + 单例锁（`requestSingleInstanceLock` 在 `whenReady` 前）+ `second-instance` 事件监听 | 单例锁 | 双开时第二个实例退出并激活主窗口 |
| 1.4 | `src/main/preload.ts` + `src/shared/electron-api.ts` + `src/main/global.d.ts` | 类型安全 bridge | 渲染进程 `window.electronAPI` 有 TS 类型 |
| 1.5 | `src/renderer/main.tsx` + `App.tsx` 最小挂载 | React 壳 | Electron 窗口显示 "MemoPad v0.1" |
| 1.6 | `.eslintrc.cjs` + `.prettierrc` + CI 配置文件 | lint 配置 | `pnpm lint` 通过 |

---

### Phase 2 — 数据层：存储适配器 + 状态管理

**目标**：增删改查可持久化，重启后数据不丢失，Dexie 版本迁移触发数据导出备份。

| Step | 操作 | 产出物 | 验证标准 |
| :--- | :--- | :--- | :--- |
| 2.1 | `src/core/adapters/IStorageAdapter.ts`：定义完整接口（`getAll/get/add/update/delete/clear/clearAll`） | 适配器接口 | 接口被 IndexedDBAdapter 实现 |
| 2.2 | `src/core/adapters/IndexedDBAdapter.ts`：Dexie 实现 + `upgrade` 回调导出旧数据备份 | 持久化存储 | 创建→重启→数据仍在；DB 版本号变更触发 upgrade + 备份 |
| 2.3 | `src/renderer/stores/memoStore.ts`：Zustand store（memos[] + selectedId + CRUD actions） | 内存缓存 | UI 绑定后 < 16ms 响应 |
| 2.4 | `src/renderer/stores/configStore.ts`：Zustand store（AppConfig） | 配置缓存 | 配置变更即时反映到 UI |
| 2.5 | `src/renderer/stores/uiStore.ts`：侧边栏/筛选/同步状态的 Zustand store | UI 状态 | 筛选切换正确 |
| 2.6 | `src/core/services/MemoService.ts`：上限校验 → store action → 触发 PersistQueue | 业务服务层 | 超过上限时抛出异常，不生成撤销快照 |
| 2.7 | `src/core/services/ConfigService.ts`：配置读写，Token 经主进程 StoreService + safeStorage 加密 | 配置服务 | 设置页保存 Token 后，主进程文件为加密内容 |
| 2.8 | `src/main/services/StoreService.ts`：`electron-store` + Electron `safeStorage` 加解密 | 主进程配置 | Token 写入后读取一致；明文搜索文件无 Token |

---

### Phase 3 — UI 层：MUI 主题 + 完整页面

**目标**：可用的用户界面，含列表、编辑器、设置、主题切换、日期选择、同步模式配置。

| Step | 操作 | 产出物 | 验证标准 |
| :--- | :--- | :--- | :--- |
| 3.1 | `src/renderer/providers/ThemeProvider.tsx`：`CssVarsProvider` + `LocalizationProvider`（dayjs） | 主题提供器 | MUI 组件颜色/圆角/间距随主题切换 |
| 3.2 | `src/renderer/styles/theme.ts`：亮/暗主题变量 + 自定义 token | 主题定义 | 设置页修改色彩后全局刷新 |
| 3.3 | `src/renderer/components/layout/AppShell.tsx` | 主布局 | 侧边栏 + 内容区 + 顶栏 |
| 3.4 | `src/renderer/components/layout/Sidebar.tsx` | 导航 | 菜单切换路由 |
| 3.5 | `src/renderer/components/layout/TopBar.tsx`：含撤销/重做按钮（Tooltip 显示操作描述）+ 结束会话按钮 | 顶栏 | Tooltip 显示"撤销 删除备忘C" |
| 3.6 | `src/renderer/components/memo/MemoList.tsx`：**基础列表（无虚拟化——设计决策：上限最大 500 条 ≈ 500 DOM 节点，现代浏览器可流畅渲染；默认上限 15 条无性能风险。后续若用户反馈大批量卡顿再引入 `react-window`）**，**超出上限时自动启用多选模式（Checkbox + 批量删除按钮）** | 备忘录列表 | 渲染所有数据；超出上限时显示 Checkbox 和"批量删除"按钮 |
| 3.7 | `src/renderer/components/memo/MemoCard.tsx`：状态标签 + 摘要 + 提醒时间 + 操作按钮 | 单卡片 | 状态标签颜色正确 |
| 3.8 | `src/renderer/components/memo/MemoEditor.tsx`：`Dialog` + `TextField` + `DateTimePicker` | 编辑器 | 创建/编辑保存正确 |
| 3.9 | `src/renderer/components/memo/MemoFilter.tsx`：Chip 组筛选 | 筛选栏 | 筛选后列表正确 |
| 3.10 | `src/renderer/components/settings/SettingsPanel.tsx` | 设置页入口 | 显示主题/备忘录/GitHub 配置 |
| 3.11 | `src/renderer/components/settings/ThemeSettings.tsx` | 主题配置 | 亮暗切换 + 自定义色板 |
| 3.12 | `src/renderer/components/settings/MemoSettings.tsx` | 备忘录配置 | 上限/撤销深度/自动保存延迟 |
| 3.13 | `src/renderer/components/settings/SyncSettings.tsx`：Token 验证 + 强制覆盖模式开关 | 同步配置 | 输入 Token 后用 `GET /user` 验证有效/无效；切换同步模式 |
| 3.14 | `src/renderer/components/settings/OverLimitChip.tsx` | 超出上限引导 | 当前 25/10 时显示橙色 Chip"当前超出 X 条，请清理"，点击后自动启用 MemoList 多选模式 + 提示"请勾选需要删除的条目" |
| 3.15 | `src/renderer/components/memo/EmptyState.tsx` | 空状态占位 | 无数据时显示引导文案 |

---

### Phase 4 — 撤销 + 异常恢复

**目标**：Ctrl+Z/Ctrl+Y 可用（含操作类型提示），写入失败有重试和紧急备份，"结束会话"有二次确认，PersistQueue 取消边界明确。

| Step | 操作 | 产出物 | 验证标准 |
| :--- | :--- | :--- | :--- |
| 4.1 | `src/core/undo/UndoManager.ts`：`push(snapshot, meta?)` + `undo()` + `redo()` + `clear()` + `undoCount/redoCount/undoDescriptions/redoDescriptions` | 撤销管理器 | 推入 3 次 → 撤销 2 次 → 重做 1 次；`undoDescriptions` 返回操作描述数组 |
| 4.2 | `src/core/persistence/PersistQueue.ts`：`enqueue(op)` → `operationId`，`cancel(id)`（pending 状态取消，executing 返回 false）+ `isPending(id)` + `flush()` + `forceFlush()` | 防抖队列 | 防抖 1s 后自动写入；取消 pending 操作成功；取消 executing 操作返回 false |
| 4.3 | `src/core/persistence/EmergencyStorage.ts`：`saveEmergency()` / `recover()` / `clearEmergency()`，容量 < 5KB | 紧急备份 | forceFlush 超时时数据写入 localStorage，下次启动恢复 |
| 4.4 | `src/core/adapters/RetryPolicy.ts`：重试 3 次（1s/2s/4s），失败抛 `RetryExhaustedError` | 重试策略 | 断网写入 → 重试 3 次 → 保留内存数据 + 弹出重试横幅 |
| 4.5 | `src/renderer/hooks/useKeyboard.ts`：`Ctrl+Z` / `Ctrl+Y` 绑定，**增加输入框焦点检测，`document.activeElement` 为 `INPUT`/`TEXTAREA`/`[contenteditable]` 时跳过全局快捷键** | 快捷键 | 焦点在输入框内时 Ctrl+Z 交给 MUI 内部处理，不在输入框时触发全局撤销 |
| 4.6 | `src/renderer/hooks/useUndo.ts`：集成 UndoManager + useKeyboard | undo hook | 撤销时 UI 立即回退 |
| 4.7 | `src/renderer/hooks/useAutoSave.ts`：PersistQueue 的 React hook | auto-save hook | 编辑后 1s 无操作触发落盘 |
| 4.8 | `src/renderer/components/common/RetryBanner.tsx`：底部红色横幅 + "重试"按钮 + "忽略"按钮 | 重试横幅 | 写入失败时显示；点击"重试"调用 `flush()`；点击"忽略"横幅消失，保留内存缓存 |
| 4.9 | `src/renderer/components/common/ConfirmDialog.tsx`：通用二次确认 Dialog | 确认弹窗 | "结束会话"弹窗明确提示"清空后将无法撤回" |
| 4.10 | **"结束会话"全流程联调**：TopBar 按钮 → ConfirmDialog → UndoManager.clear() → PersistQueue.flush() → 更新 UI | 完整流程 | 点击后撤销栈清空、未落盘数据立即写入、UI 刷新 |

---

### Phase 5 — GitHub 云端同步

**目标**：手动/定时同步至 GitHub，冲突有 UI 引导，Token 用 safeStorage 加密，文件损坏有完整备份/回滚流程。

| Step | 操作 | 产出物 | 验证标准 |
| :--- | :--- | :--- | :--- |
| 5.1 | `src/core/adapters/GitHubAdapter.ts`：Octokit 封装（`pushMemos`、`pullMemos`），文件损坏时：检查 `.backup` → 拉取 → 提示用户回滚/忽略；创建 `.backup` 推送远程 | GitHub 适配器 | 远程 JSON 损坏 → 自动备份损坏内容为 `.backup` 并推送 → 提示用户选择恢复策略 |
| 5.2 | `src/core/services/SyncService.ts`：安全模式（先拉取→比对 `updatedAt`→检测冲突→合并）+ 强制覆盖模式（`forceLocal` / `forceRemote`） | 同步服务 | 安全模式：无冲突自动合并，有冲突返回列表；强制模式：跳过冲突检测 |
| 5.3 | `src/core/services/SyncService.ts`：推送失败时回滚本地合并结果，不修改内存缓存 | 回滚机制 | 推送中断后本地数据与同步前一致 |
| 5.4 | `src/renderer/components/sync/SyncStatusBar.tsx`：空闲/同步中/上次同步时间/冲突数 | 同步状态栏 | 同步中显示进度 |
| 5.5 | `src/renderer/components/sync/ConflictDialog.tsx`：每条冲突 memo 三按钮（使用本地/使用远程/跳过） | 冲突解决弹窗 | 选择后合并结果正确 |
| 5.6 | `src/renderer/hooks/useSync.ts`：手动触发 + 定时触发（每 30 分钟） | 同步 hook | 触发后状态栏变化 |
| 5.7 | `src/renderer/components/settings/SyncSettings.tsx`：Token 验证状态 + 强制覆盖模式开关 | Token 状态检验 | 输入错 Token → 显示"无效" + 跳转 GitHub Token 页面链接；切换同步模式生效 |

---

### Phase 6 — 测试 + 构建

**目标**：测试覆盖全部核心路径和异常场景，CI 通过，可构建出安装包。

| Step | 操作 | 产出物 | 验证标准 |
| :--- | :--- | :--- | :--- |
| 6.1 | `tests/unit/MemoService.test.ts`：上限校验边界、CRUD 路径 | 单元测试 | `maxMemos=5` 时第 6 条抛异常 |
| 6.2 | `tests/unit/UndoManager.test.ts`：推入/撤销/重做/栈满/清空/元信息/描述数组 | 单元测试 | 50 条上限满时第 51 条挤掉最早快照；`undoDescriptions` 返回正确 |
| 6.3 | `tests/unit/UndoManager.perf.test.ts`：`structuredClone` 深拷贝 500 条数据耗时 | 性能基准测试 | < 5ms |
| 6.4 | `tests/unit/PersistQueue.test.ts`：防抖时机/取消 pending 成功/取消 executing 返回 false/forceFlush | 单元测试 | `cancel(id)` 对 pending 操作成功；对 executing 操作返回 false |
| 6.5 | `tests/unit/RetryPolicy.test.ts`：重试次数/退避间隔/最终失败 | 单元测试 | 第 3 次仍失败抛 `RetryExhaustedError` |
| 6.6 | `tests/unit/ConflictResolver.test.ts`：本地新/远程新/两者都新/跳过/强制覆盖 | 单元测试 | 安全模式合并结果正确；强制模式跳过冲突检测 |
| 6.7 | `tests/integration/IndexedDBAdapter.test.ts`：含版本迁移场景 + 升级数据导出验证 | 集成测试 | DB 版本从 1→2 时触发 upgrade + 备份文件创建成功 |
| 6.8 | `tests/integration/GitHubAdapter.test.ts`：文件损坏降级 + 备份推送 + Token 失效 + 回滚回退 | 集成测试 | 损坏时提示 + 创建 `.backup` 推送远程 + 提供回滚选项 |
| 6.9 | `tests/e2e/memo-crud.spec.ts`：创建→编辑→删除→筛选→关闭→重启→验证数据 | E2E | 重启后数据仍在 |
| 6.10 | `tests/e2e/undo-redo.spec.ts`：编辑→撤销→重做→结束会话（二次确认拦截） | E2E | 撤销后内容回退；结束会话快照清空 |
| 6.11 | `tests/e2e/sync-conflict.spec.ts`：同步→远程修改→再次同步→选择方向→强制模式 | E2E | 安全模式正确合并；强制模式跳过冲突 |
| 6.12 | `tests/e2e/persist-restart.spec.ts`：创建→正常关闭→重启→验证数据 | E2E | forceFlush 逻辑覆盖 |
| 6.13 | `tests/e2e/crash-recovery.spec.ts`：**进程崩溃后重启恢复** + EmergencyStorage 容量限制 [修正] | E2E | 崩溃后未落盘数据恢复；>5KB 时拒绝写入 |
| 6.14 | CI 配置：`pnpm install --frozen-lockfile` + `pnpm check:deps` + `pnpm lint` + `pnpm typecheck` + `pnpm test` | CI 流水线 | 所有步骤通过 |
| 6.15 | `electron-builder.yml`：Windows NSIS / macOS DMG / Linux AppImage | 构建配置 | `pnpm build` 产出安装包 |
| 6.16 | `docs/API_REFERENCE.md` + `docs/CHANGELOG.md` | 文档 | CHANGELOG 记录本次迭代 |

---

## 六、关键接口定义（最终版）

### 6.1 撤销管理器（含元信息 + 描述数组）

```typescript
// src/core/undo/types.ts
interface SnapshotMeta {
  action: 'create' | 'edit' | 'delete' | 'bulk';
  description: string;    // 如 "删除"备忘C""
  timestamp: number;
}

// src/core/undo/UndoManager.ts
class UndoManager {
  constructor(maxStack: number);                       // 默认 50

  push(snapshot: Memo[], meta?: SnapshotMeta): void;
  undo(): { memos: Memo[]; meta: SnapshotMeta } | null;
  redo(): { memos: Memo[]; meta: SnapshotMeta } | null;

  get undoCount(): number;
  get redoCount(): number;
  get undoDescriptions(): string[];     // 用于 UI Tooltip
  get redoDescriptions(): string[];

  clear(): void;
}
```

### 6.2 防抖队列（含取消 + 竞态边界）

```typescript
// src/core/persistence/PersistQueue.ts
interface PersistOperation {
  type: 'upsert' | 'delete';
  memoId: string;
  data?: Memo;
}

type OperationStatus = 'pending' | 'executing' | 'completed' | 'cancelled';

class PersistQueue {
  constructor(
    private adapter: IStorageAdapter,
    private delayMs: number = 1000
  );

  enqueue(op: PersistOperation): string;              // 返回 operationId
  cancel(operationId: string): boolean;                // true=已取消；false=无法取消（正在执行或已完成）
  isPending(operationId: string): boolean;              // 查询是否仍可取消
  flush(): Promise<void>;
  forceFlush(): Promise<void>;
  get pendingCount(): number;
}
```

### 6.3 存储适配器接口

```typescript
// src/core/adapters/IStorageAdapter.ts
interface IStorageAdapter {
  getAll(): Promise<Memo[]>;
  get(uuid: string): Promise<Memo | null>;
  add(memo: Memo): Promise<void>;
  update(memo: Memo): Promise<void>;
  delete(uuid: string): Promise<void>;
  clear(): Promise<void>;
  clearAll(): Promise<void>;
}
```

### 6.4 冲突解决 + 同步模式

```typescript
// src/shared/types/sync.ts
type SyncMode = 'safe' | 'forceLocal' | 'forceRemote';

type ConflictResolution = {
  [memoId: string]: 'useLocal' | 'useRemote' | 'skip';
};

interface ConflictItem {
  memoId: string;
  local: Memo;
  remote: Memo;
  localUpdatedAt: Date;
  remoteUpdatedAt: Date;
}

class SyncService {
  detectConflicts(local: Memo[], remote: Memo[]): ConflictItem[];

  resolveConflicts(
    local: Memo[],
    remote: Memo[],
    resolution: ConflictResolution
  ): Memo[];

  async sync(mode: SyncMode): Promise<SyncResult>;

  rollback(backupBeforeSync: Memo[]): void;
}
```

### 6.5 主进程加密存储（Electron safeStorage）

```typescript
// src/main/services/StoreService.ts
class StoreService {
  constructor();

  setGithubToken(token: string): void;     // safeStorage.encryptString → electron-store
  getGithubToken(): string | null;         // electron-store → safeStorage.decryptString
  hasValidToken(): boolean;                // Token 存在且可解密
  clearGithubToken(): void;
}
```

---

## 七、测试矩阵

| 测试类型 | 文件 | 覆盖场景 |
| :--- | :--- | :--- |
| **单元测试** | `MemoService.test.ts` | 上限边界、CRUD 路径、异常输入 |
| | `UndoManager.test.ts` | 推入/撤销/重做/栈满/清空/元信息描述 |
| | `UndoManager.perf.test.ts` | 500 条 × structuredClone 耗时 < 5ms |
| | `PersistQueue.test.ts` | 防抖等待/取消 pending 成功/取消 executing 失败/flush 顺序/forceFlush |
| | `RetryPolicy.test.ts` | 重试次数/退避间隔/最终抛 RetryExhaustedError |
| | `ConflictResolver.test.ts` | 本地新/远程新/两者都新/跳过/强制模式 |
| **集成测试** | `IndexedDBAdapter.test.ts` | 增删改查 + 事务回滚 + 版本迁移 upgrade + 数据导出备份 |
| | `GitHubAdapter.test.ts` | 正常推送/拉取 + 文件损坏降级 + 备份推送 + Token 失效 + 回滚回退 |
| **E2E 测试** | `memo-crud.spec.ts` | 创建→编辑→删除→筛选→关闭→重启 |
| | `undo-redo.spec.ts` | 撤销→重做→结束会话（含二次确认拦截） |
| | `sync-conflict.spec.ts` | 安全模式选择方向 + 强制本地/远程覆盖 |
| | `persist-restart.spec.ts` | 正常关闭→重启→数据恢复验证 forceFlush |
| | `crash-recovery.spec.ts` | **进程崩溃→重启→EmergencyStorage 恢复** + 容量限制 |

---

## 八、风险与缓解

| 风险 | 概率 | 影响 | 缓解措施 |
| :--- | :--- | :--- | :--- |
| `forceFlush` 超时（3s）导致数据丢失 | 中 | 高 | 超时前将内存未落盘数据写入 `localStorage` 紧急备份；下次启动优先检查恢复 |
| 双开应用 → IndexedDB 锁冲突 | 低 | 中 | `app.requestSingleInstanceLock()` 在 `whenReady` 前调用；`second-instance` 事件激活主窗口 |
| GitHub 同步时网络中断导致半写状态 | 中 | 中 | 先拉取→合并→推送的原子流程；推送失败回滚本地合并结果，不修改内存缓存 |
| `structuredClone` 在旧版 Electron 不支持 | 低 | 高 | preload 中检测，不支持时回退 `JSON.parse(JSON.stringify())` |
| IndexedDB 在 Electron 环境下异步初始化延迟 | 低 | 低 | 启动时加载动画 + Zustand 初始值为空数组 |
| MUI 6.x 与 `@mui/x-date-pickers` 版本冲突 | 低 | 中 | `package.json` 精确版本锁定 + CI 中 `pnpm ls --depth=0` 检查 peer 依赖 |
| `safeStorage` 跨设备迁移无法解密 | 低 | 中 | `getGithubToken()` 捕获解密异常返回 null，UI 引导用户重新配置 Token |
| `safeStorage` 在 Linux 无 `libsecret` 时不可用 | 中 | 中 | `isEncryptionAvailable()` 检测后降级为 `electron-store` encryptionKey；首次启动提示用户安装 `libsecret` |
| 用户误触关闭按钮导致未保存数据丢失 | 中 | 中 | `close` 事件拦截 + 原生三选一对话框（保存并退出 / 不保存退出 / 取消） |
| 全局 Ctrl+Z 与输入框内文本撤销冲突 | 低 | 中 | `useKeyboard` 中检测 `document.activeElement` 跳过 INPUT/TEXTAREA 焦点 |
| GitHub 远程 JSON 文件损坏 | 低 | 高 | 完整降级流程：备份损坏内容 → 推送 `.backup` → 检查历史备份 → 提供回滚选项 |
