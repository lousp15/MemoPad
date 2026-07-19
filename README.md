# MemoPad — 轻量桌面备忘录

![Electron](https://img.shields.io/badge/Electron-30-blue) ![React](https://img.shields.io/badge/React-18-61DAFB) ![MUI](https://img.shields.io/badge/MUI-6-007FFF) ![TypeScript](https://img.shields.io/badge/TypeScript-5-strict)

MemoPad 是一款基于 **Electron + React + MUI 6** 构建的轻量级桌面备忘录应用，支持**本地优先持久化**、**会话级无限撤销**、**GitHub 云端灾备**。

---

## 截图

| 主界面 | 设置 | 同步 |
| :---: | :---: | :---: |
| 备忘录列表 + 筛选 | 主题/上限/撤销配置 | GitHub 仓库配置 |

---

## 核心特性

### 备忘录管理
- 创建/编辑/删除备忘录，支持设置提醒时间
- 状态自动管理：根据提醒时间自动标记「待办/已过期/已完成」
- 一键标记完成
- 筛选视图：全部 / 待办 / 已完成 / 已过期
- 上限控制：可配置 5~500 条或无限制
- 批量删除

### 撤销/重做
- 会话级无限撤销：`Ctrl+Z` / `Ctrl+Y`
- 每次操作前自动保存快照
- 智能焦点检测：在输入框中按 Ctrl+Z 不会误触全局撤销
- 「结束会话」清空撤销历史（二次确认防误触）

### 本地持久化
- 四层存储架构：Zustand（内存）→ 防抖队列 → IndexedDB（Dexie.js）→ 本地磁盘
- 写入失败自动重试（指数退避 3 次）
- 紧急备份：IndexedDB 写入失败时自动存入 `localStorage`
- 进程崩溃恢复：下次启动自动检查紧急备份

### GitHub 云端同步
- 推送备忘录到 GitHub 仓库的 `memos.json`
- 三种同步模式：安全合并 / 强制本地覆盖 / 强制远程覆盖
- Token 本地加密存储（Electron `safeStorage`）
- 自动定时同步（每 30 分钟）
- 手动立即同步（顶栏按钮）

### 外观定制
- 亮色/暗色主题一键切换
- MUI CSS 变量主题系统

### 提醒通知
- 每分钟扫描过期提醒
- 系统原生通知弹窗（需授权）

---

## 技术栈

| 层级 | 技术 | 用途 |
| :--- | :--- | :--- |
| 桌面壳 | **Electron 30** | 跨平台桌面容器 |
| 前端框架 | **React 18 + TypeScript** (strict) | UI 渲染 |
| UI 组件库 | **MUI 6** (Material-UI) | 组件 + CSS 变量主题 |
| 状态管理 | **Zustand** | 内存缓存 (L1) |
| 本地存储 | **Dexie.js** (IndexedDB) | 持久化 (L2) |
| 云端同步 | **Octokit.js** | GitHub API (L3) |
| 构建工具 | **Vite 5** | 开发服务器 + 打包 |
| 测试 | **Vitest** + **Playwright** | 单元测试 + E2E |

---

## 快速开始

### 环境要求
- Node.js ≥ 18
- npm ≥ 9

### 安装与运行

```bash
# 克隆仓库
git clone https://github.com/your-username/memo-pad.git
cd memo-pad

# 安装依赖
npm install --legacy-peer-deps

# 开发模式（自动启动 Electron 窗口）
npm run dev

# 仅浏览器预览（无 Electron 壳）
npm run dev:web
```

### 构建

```bash
# 生产构建
npm run build

# Windows 安装包
npm run build:installer       # 输出到 release/

# 打包源代码（不含 node_modules）
# 已产出 MemoPad-source.zip
```

---

## 使用指南

### 首次使用
1. 启动后创建第一条备忘录
2. 进入「设置」配置主题偏好
3. （可选）配置 GitHub 同步实现云端备份

### GitHub 同步配置
1. 前往 [GitHub Token 设置](https://github.com/settings/tokens) 生成 Personal Access Token（勾选 `repo` 权限）
2. 在设置页填入 Token 和仓库地址（格式：`owner/repo`，如 `lousp15/bwl`）
3. 点击「验证仓库」确认连接正常
4. Token 和仓库信息自动保存，下次启动无需重新配置

---

## 项目结构

```
memo-pad/
├── src/
│   ├── main/              # Electron 主进程
│   │   ├── index.ts       # 入口 + 单例锁
│   │   ├── preload.ts     # contextBridge 安全 API
│   │   ├── lifecycle.ts   # 关闭三选一弹窗
│   │   ├── ipc-handlers.ts # IPC 通信处理
│   │   └── services/      # StoreService (加密存储)
│   ├── renderer/          # React 渲染进程
│   │   ├── components/    # UI 组件
│   │   │   ├── layout/    # AppShell / Sidebar / TopBar
│   │   │   ├── memo/      # MemoCard / MemoList / MemoEditor
│   │   │   ├── settings/  # 主题 / 上限 / 同步配置
│   │   │   ├── sync/      # 冲突解决 / 同步状态
│   │   │   └── common/    # ConfirmDialog / RetryBanner
│   │   ├── stores/        # Zustand 状态管理
│   │   ├── hooks/         # useUndo / useKeyboard
│   │   └── providers/     # MUI 主题提供器
│   ├── core/              # 纯业务逻辑
│   │   ├── services/      # MemoService / SyncService
│   │   ├── undo/          # UndoManager
│   │   ├── persistence/   # PersistQueue / EmergencyStorage
│   │   └── adapters/      # IndexedDB / GitHub / IStorageAdapter
│   └── shared/            # 跨进程共享类型
│       ├── types/         # Memo / Config / Sync 类型定义
│       └── constants.ts   # 默认值常量
├── tests/                 # 测试文件
│   ├── unit/              # 单元测试 45 条
│   └── e2e/               # E2E 测试骨架
├── android/               # Capacitor Android 项目
├── docs/                  # 设计文档
├── MemoPad-source.zip     # 源代码打包
└── MemoPad-android.zip    # Android 项目打包
```

---

## 测试

```bash
# 运行全部单元测试（45 条）
npm test

# 类型检查
npm run typecheck
```

| 测试文件 | 用例数 | 覆盖内容 |
| :--- | :--- | :--- |
| UndoManager | 10 | 推入/撤销/重做/栈满/清空/描述 |
| PersistQueue | 8 | 防抖/取消/批量/flush/错误恢复 |
| RetryPolicy | 5 | 重试次数/退避/耗尽 |
| MemoService | 9 | 创建/上限/过期/筛选 |
| ConflictResolver | 13 | 冲突检测/解决/强制模式 |

---

## 已知限制

- **提醒机制**：依赖应用前台运行，关闭后无系统通知
- **GitHub 同步**：需用户自行创建 Personal Access Token
- **备忘录列表**：非虚拟化，500 条以内流畅（默认上限 15 条）
- **Android 版**：需通过 Android Studio 构建 APK（见 `android/` 目录）

---

## 许可证

MIT
