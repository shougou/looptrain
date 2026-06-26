# LoopTrain Standalone

LoopTrain 当前本地运行目标是 **SLT（Standalone LoopTrain）**。

本目录不再以 SillyTavern 为本地运行依赖。

---

## 快速启动

从仓库根目录运行：

```bash
bash scripts/start_slt.sh
```

打开：

```text
http://127.0.0.1:3030/
```

---

## 本地验证

```bash
bash scripts/verify_slt.sh
```

或者进入 standalone 目录：

```bash
cd looptrain/standalone
npm run check
npm test
```

---

## 当前结构

```text
standalone/
  server.js              # Express 本地后端, 端口 3030
  engine.js              # LoopTrain 裁判引擎 (1261 行)
  src/runtime/           # TypeScript Runtime (68 文件, 14 子系统)
  llm/                   # LLM Bridge (DeepSeek + Mock)
  public/                # 无 ST 前端 (组件化架构)
    app.js               # 主编排器
    components/          # 5 个 UI 组件
    ui-stage.js          # 渐进解锁状态机
    assistant-hint.js    # 许知微提示生成
    case-board.js        # 案件板渲染
    loading-state.js     # 加载状态管理
    portrait-intro.js    # 立绘入场动画
    audio-manager.js     # 音效系统
    style.css            # 手机端 UI 样式
    assets/              # 立绘 + 音效
  tests/                 # standalone 测试 + e2e/

materials/
  looptrain/             # 设计态内容 (线索/剧集/规则/场景/Prompt)
  runtime/               # 运行态数据 (13 子目录 26 JSON 文件)
  assets/                # 可复用立绘和概念图
  sound/                 # 音频源素材

docs/
  CONTROL_FLOW.md
  DEPLOY.md

tests/                   # 引擎单元测试 (11 个测试文件)
```

---

## 当前能力 (v0.11.0)

- 本地 3030 独立运行。
- 不依赖 SillyTavern。
- 不加载 ST UI。
- 成功路径可到达试玩版结算。
- 失败路径可进入下一轮。
- LLM 动态对话已上线 (DeepSeek), Mock 为降级模式
- 组件化前端架构 (GameShell + 组件系统)。
- UIStage 渐进解锁系统 (7 阶段)。
- NPC 时间线推理系统 (3 种观察行动 + 矛盾检测 + 5 维证据评分)。
- Goal Engine DSL + 12 条指令系统。
- 许知微助手 (提示卡 + 案件板)。
- 音效系统 (场景环境音 + 按钮音效 + 时间压力 + 失败冲击)。
- TypeScript Runtime (MemoryRuntime + 事件溯源 + Assistant AI)。
- 存档系统 (localStorage 版本化双 key + breaking change 检测)。
- Playwright E2E 回归测试 (4 spec)。
- 已部署线上: https://looptrain.me/play/game

---

## 尚未完成

- 许知微判定交互 (verdict_options 数据已预留)。
- 存档系统迁移到 IndexedDB。
- 手机端真机测试覆盖。

---

## 关键原则

- Engine 是唯一裁判。
- LLM 只做 NPC 表演文本。
- API Key 不进入前端。
- 本地验证先于线上部署。
- 未最终确认前，不切换生产 `/play/game`。
