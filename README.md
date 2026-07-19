# MemoPad — 轻量桌面备忘录

![Electron](https://img.shields.io/badge/Electron-30-blue) ![React](https://img.shields.io/badge/React-18-61DAFB) ![MUI](https://img.shields.io/badge/MUI-6-007FFF) ![TypeScript](https://img.shields.io/badge/TypeScript-5-strict)

MemoPad 是一款基于 **Electron + React + MUI 6** 构建的轻量级桌面备忘录应用，支持**本地优先持久化**、**会话级无限撤销**、**GitHub 云端灾备**。

---

## 核心特性

### 备忘录管理
- 创建/编辑/删除备忘录，支持设置提醒时间
- 状态自动管理：根据提醒时间自动标记「待办 / 已过期 / 已完成」
- 一键标记完成
- 筛选视图：全部 / 待办 / 已完成 / 已过期
- 上限控制：可配置 5~500 条或无限制
- 批量删除

### 撤销 / 重做
- 会话级无限撤销：`Ctrl+Z` / `Ctrl+Y`
- 每次操作前自动保存快照
- 智能焦点检测：在输入框中按 Ctrl+Z 不会误触全局撤销
- 「结束会话」清空撤销历史（二次确认防误触）

### 本地持久化
- **Electron 安装版**：IPC → 文件系统（`userData/data/memos.json`）
- **开发模式**：`localStorage`
- 每次数据变更即时落盘，关闭重启不丢失
- 每分钟自动扫描并持久化过期提醒状态

### GitHub 云端同步
- 推送 / 拉取备忘录到 GitHub 仓库的 `memos.json`
- 三种同步模式：安全合并 / 强制本地覆盖 / 强制远程覆盖
- Token 本地加密存储（Electron `safeStorage`）
- 配置持久化，关闭应用不丢失
- 自动定时同步（每 30 分钟）
- 手动立即同步（顶栏按钮）
- 跨平台统一 API：Electron 走 IPC，Web 走 fetch

### 自动更新
- 启动 3 秒后自动检测 GitHub Release
- 有新版本时弹窗提示下载

### 提醒通知
- 每分钟扫描过期提醒
- 系统原生通知弹窗（需授权）

---

## 技术栈

| 层级 | 技术 | 用途 |
| :--- | :--- | :--- |
| 桌面壳 | **Electron 30** | 跨平台桌面容器 |
| 前端框架 | **React 18 + TypeScript** (strict) | UI 渲染 |
| UI 组件库 | **MUI 6** (Material-UI) | 组件库 |
| 状态管理 | **Zustand** | 内存缓存 |
| 本地存储 | **electron-store** + `fs` 文件写入 | 数据持久化 |
| 云端同步 | **Octokit.js** / fetch | GitHub API |
| 构建工具 | **Vite 5** + **electron-builder** | 开发 + 打包 |
| 测试 | **Vitest** (45 条) | 单元测试 |

---

## 快速开始

### 环境要求
- Node.js ≥ 18
- npm ≥ 9

### 安装与运行

```bash
# 克隆仓库
git clone https://github.com/lousp15/MemoPad.git
cd MemoPad

# 安装依赖
npm install --legacy-peer-deps

# 开发模式（自动启动 Electron 窗口）
npm run dev

# 浏览器预览（无 Electron 壳）
npm run dev:web
```

### 构建安装包

```bash
# 生产构建 + Windows 安装包
npm run build:installer

# 输出位置
release/MemoPad Setup 0.1.0.exe
```

---

## 使用指南

### 首次使用
1. 启动后创建第一条备忘录
2. 数据自动保存，关闭重启不丢失

### GitHub 同步配置
1. 前往 [GitHub Token 设置](https://github.com/settings/tokens) 生成 Personal Access Token（勾选 `repo` 权限）
2. 在设置 → GitHub 同步中填入 Token 和仓库地址（格式：`owner/repo`）
3. 点击「验证并保存」确认连接正常
4. 选择同步模式后点击「立即同步」或使用顶栏同步按钮

### 同步模式说明

| 模式 | 行为 | 适用场景 |
| :--- | :--- | :--- |
| **安全模式** | 拉取远程 + 合并本地没有的条目 | 日常使用 |
| **强制本地覆盖远程** | 推送本地数据覆盖远程 | 本地数据为最新 |
| **强制远程覆盖本地** | 拉取远程数据替换本地 | 设备切换 / 重置 |

---

## 项目结构

```
memo-pad/
├── src/
│   ├── main/              # Electron 主进程
│   │   ├── index.ts       # 入口 + 单例锁 + 自动更新
│   │   ├── preload.ts     # contextBridge 安全 API
│   │   ├── ipc-handlers.ts # IPC 通信 + 文件持久化
│   │   └── services/      # StoreService (Token 加密存储)
│   ├── renderer/          # React 渲染进程
│   │   ├── components/    # UI 组件
│   │   │   ├── layout/    # AppShell / Sidebar / TopBar
│   │   │   ├── memo/      # MemoCard / MemoList / MemoEditor
│   │   │   ├── settings/  # 上限 / 同步配置
│   │   │   ├── sync/      # 同步状态
│   │   │   └── common/    # ConfirmDialog / RetryBanner / ErrorBoundary
│   │   ├── stores/        # Zustand 状态管理
│   │   ├── hooks/         # useUndo / useKeyboard
│   │   └── providers/     # MUI 主题提供器
│   ├── core/              # 纯业务逻辑
│   │   ├── services/      # MemoService / GitHubApi
│   │   ├── undo/          # UndoManager
│   │   ├── persistence/   # PersistQueue / EmergencyStorage
│   │   └── adapters/      # IndexedDB / GitHub 适配器
│   └── shared/            # 共享类型
│       ├── types/         # Memo / Config 类型定义
│       └── constants.ts   # 默认值常量
├── scripts/               # 构建辅助脚本
├── release/               # 安装包输出目录
└── MemoPad-Windows.zip    # Windows 源码包
```

---

## 测试

```bash
# 运行单元测试（45 条）
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

## 数据存储位置

| 数据 | 路径 |
| :--- | :--- |
| 备忘录 | `%APPDATA%\com.memopad.app\data\memos.json` |
| Token | `electron-store` 加密存储（`%APPDATA%\com.memopad.app\`） |
| 仓库配置 | `electron-store` 持久化 |

---

## 许可证

MIT
