# LT Standalone 架构文档

> 本文档反映 v0.11.0 当前架构。MVP 三阶段（提取引擎、本地 Mock、LLM 接入）已全部完成并部署上线。第 3-4 节描述当前实际架构，第 5 节列出架构亮点，第 6-11 节为历史约束和验证命令。

## 1. 动机：为什么做独立运行时

LoopTrain 的核心价值在于游戏引擎本身：状态管理、AP、线索、NPC 对话边界、结算逻辑。这些功能与 SillyTavern 并无本质耦合。

当前 ST 集成方案的问题：

- 部署依赖完整的 SillyTavern 环境，对玩家门槛过高。
- 前端 UI 受限于 ST Extension 机制，无法自由设计游戏体验。
- LLM 调用必须经过 ST 中转，增加了不必要的延迟和复杂度。
- 独立发布需要 ST 作为底座，无法作为独立游戏分发。

目标：让 LoopTrain 成为一个可以独立运行的游戏引擎，玩家只需打开浏览器即可游玩。

## 2. 核心策略：提取优先，不做大重写

### 原则

```text
提取 > 重写
复用 > 新建
本地验证 > 线上部署
```

不推翻现有代码。`engine.js` 已经是纯函数式的裁判引擎，输入 state、输出 new state 与 messages。这就是独立运行时的核心。

### 为什么不做 Vue/FastAPI 大重写

- 现有 engine 逻辑已经过测试验证（5 个测试文件全部通过）。
- engine 的纯函数接口天然适合任何前端框架。
- 大重写的风险远高于渐进提取。
- MVP 阶段只需要一个能跑通试玩版的轻量前端。

### 提取什么

```text
engine.js（核心）          → 独立 Node.js 包
Mock 剧情数据（materials）  → 独立数据层
LLM 连接逻辑               → 新增独立模块（直接调 API）
前端 UI                    → 新建轻量前端（不依赖 ST）
```

### 不提取什么

```text
ST Extension UI           → 保留为传统参考
ST Server Plugin 路由     → 保留为传统参考
ST 角色卡 PNG 元数据       → 保留为传统参考
ST 世界书 / WorldInfo      → 保留为传统参考
```

## 3. 目标架构

### 最终形态（当前实现，v0.11.0）

```text
浏览器 (Browser)
  └── SLT 前端 (Vanilla JS 组件化架构)
        ├── GameShell (根编排器, components/layout.js)
        ├── 11 个 UI 组件
        │   ├── 布局层: StatusBar / TimelineMiniBar / ObjectiveCard / SceneStateCard / CommandInput
        │   ├── 行动层: ActionDock / MoreActionsSheet / FocusWatchBar
        │   ├── 反馈层: EventFeed
        │   └── 覆盖层: ArchiveSheet / DialogueFocusSheet
        ├── UIStage 渐进解锁系统 (7 阶段状态机)
        ├── 许知微助手 (assistant-hint.js + case-board.js)
        ├── 加载状态管理 (loading-state.js)
        ├── 立绘入场动画 (portrait-intro.js)
        ├── 音效系统 (audio-manager.js, Web Audio API)
        └── 存档系统 (localStorage 版本化双 key)

SLT Server (Node.js + Express, 端口 3030)
  ├── engine.js — 裁判引擎 (纯函数, 1261 行)
  │   └── AP/线索/对话/循环/时间线推理/证据评分/记忆继承
  ├── TypeScript Runtime (src/runtime/, 68 文件 14 子系统)
  │   ├── MemoryRuntime — 事件溯源状态管理
  │   ├── LegacyEngineAdapter — 引擎桥接
  │   ├── Assistant AI — 意图分类/行动规划/策略引擎
  │   ├── Companion View — 陪伴视角安全投影
  │   ├── Goal Engine — DSL 条件判定
  │   └── Command System — 指令匹配注册表
  ├── LLM Bridge (llm/)
  │   ├── providers.js — DeepSeek + Mock 双模式
  │   └── prompt.js — NPC prompt 构建
  └── 数据层 (materials/runtime/, 26 JSON 文件 13 子目录)
      ├── characters/ — 4 NPC 角色数据
      ├── dialogues/ — 3 NPC 对话树
      ├── scenes/ — 3 场景定义
      ├── clues/ — 20 条线索 (4物理+5主张+6观察+5推理)
      ├── goals/ — 8 个目标定义
      ├── timeline/ — NPC 时间线推理数据
      ├── assistant/ — 行动定义/模板/Mock响应/UI标签
      └── intro/commands/ending/settlement/scene-data/prompts/

线上部署 (Alibaba Cloud ECS, Ubuntu 22.04)
  ├── nginx 反向代理 (devlog + /play/game + /api/*)
  ├── pm2 进程管理 (looptrain-standalone)
  └── https://looptrain.me/
```

## 4. 三阶段路线（MVP 状态）

### 阶段一：提取引擎 ✅ 已完成

```text
目标：engine.js 脱离 ST 环境可独立运行
状态：已完成 (v0.5.0-standalone, 2026-06-13)
```

engine.js 已成功提取为独立模块，所有 11 个引擎测试在独立环境中通过。

### 阶段二：本地 Mock 可玩 ✅ 已完成

```text
目标：浏览器打开 /play/game，可以跑通完整试玩版
状态：已完成 (v0.8-testplay, 2026-06-19)
```

不仅完成了 Mock 闭环，还实现了：

- 组件化前端架构（11 组件 + GameShell）
- NPC 时间线推理系统
- Goal Engine + 指令系统
- 许知微助手 + 案件板
- UIStage 渐进解锁系统
- 音效系统
- 存档系统
- Playwright E2E 测试
- TypeScript Runtime（MemoryRuntime + 事件溯源）
- 已部署线上：https://looptrain.me/play/game

### 阶段三：接入 LLM ✅ 已完成

```text
目标：独立运行时可以通过真实 LLM 生成 NPC 表演文本
状态：DeepSeek 已上线 (2026-06-26), Mock 为降级 fallback
```

LLM Bridge 已实现并启用：

- DeepSeek provider (llm/providers.js)
- NPC prompt 构建 (llm/prompt.js)
- 环境变量配置 (.env: DEEPSEEK_API_KEY, LLM_ENABLED, etc.)
- Mock fallback 机制（LLM_ENABLED=false 或 API 错误时降级）
- 线上 /api/config 返回 llm_enabled: true, lt_llm_provider: "deepseek"

## 5. 当前架构亮点（v0.11.0）

### 组件化前端架构

采用 Vanilla JS ES6 class 组件化架构，无框架依赖：

```text
GameShell (根编排器)
  ├── setState() 触发全量 updateAll()
  ├── 维护 prevState 用于 diff
  └── 11 个组件
      ├── StatusBar — 轮次/时间/AP
      ├── TimelineMiniBar — 可视化时间进度条
      ├── ObjectiveCard — 目标 + 步骤清单
      ├── SceneStateCard — 场景描述 + NPC 列表
      ├── CommandInput — 对话/行动模式切换 + 输入栏
      ├── ActionDock — 推荐行动按钮（前3个）
      ├── MoreActionsSheet — 补充行动抽屉
      ├── FocusWatchBar — 专注观察模式指示条
      ├── EventFeed — 可滚动事件流
      ├── ArchiveSheet — 档案（线索/人物/时间线/记忆）
      └── DialogueFocusSheet — 对话沉浸视图
```

### UIStage 渐进解锁系统

7 阶段状态机控制 UI 元素可见性：

```text
intro → first_observation → first_dialogue → loop_memory_intro
  → caseboard_intro → contradiction_intro → normal_play
```

每阶段控制：按钮数量、输入框可见性、Archive 按钮可见性等。

### NPC 时间线推理系统

玩家通过 3 种观察行动构建 NPC 行动时间线：

- 观察当前场景（1AP/1min）
- 盯住 NPC（1AP/2min）
- 守点观察（1AP/2min）

系统功能：

- 矛盾检测：detectConflicts() 检测 NPC 主张与时间线事实冲突
- 推理生成：generateInference() 基于矛盾对生成推理结论
- 多维证据评分：5 维度（物理异常/时间线矛盾/嫌疑人路线/可执行位置/程序要求）
- 4 条通关路径：物理证据/时间线推理/纯观察/综合推理

### TypeScript Runtime

68 文件 14 子系统的事件溯源状态管理：

```text
MemoryRuntime (核心)
  ├── 事件溯源: MemoryEvent → MemoryProjector → QueryLayers
  ├── 领域存储: Archive/Belief/Knowledge/Relationship/Timeline/Profile
  ├── Assistant AI: 意图分类 → 行动规划 → 策略引擎 → 响应渲染
  ├── Companion View: 安全投影 + 防剧透
  ├── Goal Engine: DSL 条件判定
  ├── Command System: 指令匹配注册表
  ├── Migration: 旧状态迁移
  └── Reset: 重置规划/执行/策略
```

### 存档系统

localStorage 版本化双 key 架构：

```text
lt:save:meta     → SaveMeta (appId, saveSchemaVersion, runtimeVersion,
                   storyVersion, createdAt, updatedAt)
lt:save:runtime  → 游戏运行时状态
lt:save:memory   → 记忆数据
lt:save:goals    → 目标状态
lt:settings      → 设置（静音等）
```

Breaking change 自动检测：启动时检测 SaveMeta 版本，不兼容时强制重置模态框。

## 6. 核心不变项

以下规则在所有阶段、所有版本中不可违反：

| 规则 | 说明 |
|------|------|
| Engine 是唯一裁判 | LLM 不得直接修改 AP、线索、成功失败状态 |
| LLM 只输出表演文本 | NPC 回复、语气建议、可选情绪描述 |
| API Key 不入前端 | 只能由服务端持有，通过环境变量注入 |
| 本地验证先于部署 | 任何功能先在本地跑通，确认有效后再考虑线上 |
| 禁止上传线上 | 直到用户最终确认，所有工作保持在本地 |
| 玩法必须可验证 | 单元测试 / Mock Harness / checklist 至少一种 |

## 7. 目录规划

独立运行时的代码放在新目录中，不与 ST 传统文件混用：

```text
looptrain/
  standalone/                      # SLT 独立运行时 ⭐ 当前主目标
    server.js                      # Express 本地后端, 21 API 端点
    engine.js                      # LoopTrain 裁判引擎 (1261 行)
    src/runtime/                   # TypeScript Runtime (68 文件)
    llm/                           # LLM Bridge
    public/                        # 组件化前端 + 资产
    tests/                         # standalone + e2e 测试
  materials/
    looptrain/                     # 设计态内容
    runtime/                       # ⭐ 运行态数据 (26 JSON 文件)
  tests/                           # 引擎单元测试 (11 文件)
  docs/                            # 架构文档
```

## 8. 技术约束

- 前端：原生 HTML/JS/CSS + ES6 class 组件化架构（无框架，已验证可支撑复杂 UI）。
- 后端：Node.js + Express（从 MVP 原生 http 升级为 Express）。
- 数据：JSON 文件（materials/runtime/，内容完全外置化）。
- Runtime：TypeScript（src/runtime/，事件溯源架构）。
- 测试：Node.js assert + Playwright E2E。
- 构建：TypeScript 编译（tsconfig.runtime.json），前端无构建工具。
- 手机端优先：390px 基准，flex 布局。

## 9. 禁止事项（独立运行时线）

- 不修改 ST 传统文件，除非是共享的 `materials/` 数据。
- 不删除旧 ST 文档，仅追加迁移上下文。
- 不在独立前端中使用任何 SillyTavern 内部 API。
- 不做完整框架重写，优先提取现有逻辑。
- 不上传线上，直到用户最终确认。
- 不让 LLM 成为裁判。
- 不将 API Key 写入前端代码或提交到 Git。

## 10. Git 信息

```text
基线 tag：pre-lt-standalone-20260613
开发分支：lt-standalone-mvp
```

所有独立运行时的工作在 `lt-standalone-mvp` 分支上进行。

## 11. 验证命令

```bash
# 引擎语法检查
cd looptrain/standalone && npm run check

# 引擎冒烟测试
cd looptrain/standalone && npm test

# 完整本地验证（语法 + 测试 + 健康检查 + E2E）
bash scripts/verify_slt.sh

# Playwright E2E 测试
cd looptrain/standalone && npm run test:e2e

# TypeScript Runtime 测试
cd looptrain/standalone && npm run test:runtime

# 访问 http://localhost:3030
```
