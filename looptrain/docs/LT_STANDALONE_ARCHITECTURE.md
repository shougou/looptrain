# LT Standalone 架构文档

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

### 最终形态

```text
浏览器
  └── LT Standalone 前端（/play/game）
        ├── 用户输入：扮演 / 指令
        ├── 游戏 UI：场景、NPC 立绘、状态栏
        ├── API 调用 → LT Server
        └── 渲染：消息、结算、线索

LT Server（Node.js）
  ├── engine.js（裁判引擎，纯函数）
  ├── LLM 连接层（直接调用模型 API）
  └── 数据层（剧集、线索、规则、场景）

SillyTavern（传统线，保留）
  ├── ST Extension（参考实现）
  ├── ST Server Plugin（参考实现）
  └── 角色卡 / 世界书（参考物料）
```

### MVP 最小形态

```text
浏览器
  └── LT MVP 前端（单页 HTML，/play/game）
        └── LT MVP Server（Node.js，端口 3001）
              ├── engine.js
              └── Mock 数据
```

MVP 不连真实 LLM，先跑通 Mock 闭环。前端极简，目标是证明 engine 可以独立驱动完整游戏循环。

## 4. 三阶段路线

### 阶段一：提取引擎（当前）

```text
目标：engine.js 脱离 ST 环境可独立运行
验证：所有现有测试在独立环境中通过
```

具体工作：

1. 将 LoopTrain 核心引擎（`engine.js`）提取为独立 Node.js 模块。
2. 剥离所有 ST 相关的 import/require 依赖。
3. 创建独立的测试入口，不依赖 ST 插件加载机制。
4. 确认 `node tests/*.js` 全部通过。

验收标准：

```bash
node tests/engine_flow_test.js      # PASS
node tests/hidden_node_test.js      # PASS
node tests/all_npc_flow_test.js     # PASS
node tests/failure_next_loop_test.js # PASS
node tests/dialogue_turn_limit_test.js # PASS
```

### 阶段二：本地 Mock 可玩

```text
目标：浏览器打开 /play/game，可以跑通完整试玩版
验证：Mock Harness 路径在独立前端中全部通过
```

具体工作：

1. 构建轻量前端（单页 HTML + 原生 JS，无框架）。
2. 实现简单的 HTTP Server 暴露 engine API。
3. 前端调用 `/api/looptrain/*` 接口，复用 engine 的所有功能。
4. UI 设计：手机端优先，场景文本 + NPC 立绘 + 扮演/指令输入 + 结算页。
5. 不显示任何 SillyTavern UI 元素。

验收标准（Mock 闭环）：

```text
开始第 1 轮
→ 和小宁对话 → 温和询问 → 提到滴答声
→ 结束对话 → 对话结算卡出现
→ 检查座位下方 → 获得线索
→ 说服赵乘警检查地板 → 试玩版成功结算
```

以及失败路径：

```text
强制失败 → 失败结算 → 进入下一轮 → 继承记忆 → 开场文本变化
```

### 阶段三：接入 LLM

```text
目标：独立运行时可以通过真实 LLM 生成 NPC 表演文本
验证：Engine 仍然控制所有状态，LLM 只输出文本
```

具体工作：

1. 实现独立的 LLM 连接模块（直接调用 DeepSeek / OpenAI API）。
2. Engine 调用 LLM 获取 NPC 表演文本，但不让 LLM 接触状态。
3. 保持三段式架构：

```text
玩家输入
→ Engine 解析与状态检查
→ LLM 生成 NPC 表演文本
→ Engine Outcome 结构化结算
```

4. API Key 由服务端环境变量注入，不写入代码，不暴露给前端。

## 5. 核心不变项

以下规则在所有阶段、所有版本中不可违反：

| 规则 | 说明 |
|------|------|
| Engine 是唯一裁判 | LLM 不得直接修改 AP、线索、成功失败状态 |
| LLM 只输出表演文本 | NPC 回复、语气建议、可选情绪描述 |
| API Key 不入前端 | 只能由服务端持有，通过环境变量注入 |
| 本地验证先于部署 | 任何功能先在本地跑通，确认有效后再考虑线上 |
| 禁止上传线上 | 直到用户最终确认，所有工作保持在本地 |
| 玩法必须可验证 | 单元测试 / Mock Harness / checklist 至少一种 |

## 6. 目录规划

独立运行时的代码放在新目录中，不与 ST 传统文件混用：

```text
looptrain/
  standalone/                      # SLT 独立运行时 ⭐ 当前主目标
    server.js                      # Express 本地后端
    engine.js                      # LoopTrain 裁判引擎
    public/                        # 无 ST 前端 + 资产
    tests/                         # standalone smoke tests
  materials/                       # 剧情物料（共享）
  docs/                            # 文档（含本文）
```

`materials/` 目录中的剧情物料（剧集、线索、规则、场景）在两条线之间共享。

## 7. 技术约束

- 前端：原生 HTML/JS/CSS，不引入 Vue/React 等框架（MVP 阶段）。
- 后端：Node.js，不引入 Express/Fastify 等框架（MVP 阶段可用 Node 原生 http 模块）。
- 数据：JSON 文件，不引入数据库。
- 构建：不引入 Webpack/Vite 等构建工具（MVP 阶段）。
- 手机端优先：前端 UI 必须适配手机屏幕。

这些约束仅针对 MVP 阶段。MVP 验证通过后，可以根据实际需要引入合适的工具。

## 8. 禁止事项（独立运行时线）

- 不修改 ST 传统文件，除非是共享的 `materials/` 数据。
- 不删除旧 ST 文档，仅追加迁移上下文。
- 不在独立前端中使用任何 SillyTavern 内部 API。
- 不做完整框架重写，优先提取现有逻辑。
- 不上传线上，直到用户最终确认。
- 不让 LLM 成为裁判。
- 不将 API Key 写入前端代码或提交到 Git。

## 9. Git 信息

```text
基线 tag：pre-lt-standalone-20260613
开发分支：lt-standalone-mvp
```

所有独立运行时的工作在 `lt-standalone-mvp` 分支上进行。

## 10. 验证命令

独立运行时的测试命令（后续补充）：

```bash
# 引擎语法检查
node --check standalone/engine/engine.js

# 独立引擎测试
node standalone/tests/engine_flow_test.js

# 独立 Server 启动
node standalone/server/index.js
# 访问 http://localhost:3001/play/game
```
