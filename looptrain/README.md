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
  server.js          # Express 本地后端
  engine.js          # LoopTrain 裁判引擎
  public/            # 无 ST 前端
  tests/             # standalone smoke tests

materials/
  looptrain/         # 可复用剧情/线索/规则/场景/Prompt
  assets/            # 可复用立绘和概念图

docs/
  LT_STANDALONE_ARCHITECTURE.md
  CONTROL_FLOW.md
  SPEC.md
  UI_UX_DESIGN.md
```

---

## 当前能力

- 本地 3030 独立运行。
- 不依赖 SillyTavern。
- 不加载 ST UI。
- 成功路径可到达试玩版结算。
- 失败路径可进入下一轮。
- 默认 Mock 模式，无需 LLM Key。

---

## 尚未完成

- 真实 LLM Bridge。
- 内容完全外置化。
- 音效系统实现。
- 生产部署和 `/play/game` 线上切换。

---

## 关键原则

- Engine 是唯一裁判。
- LLM 只做 NPC 表演文本。
- API Key 不进入前端。
- 本地验证先于线上部署。
- 未最终确认前，不切换生产 `/play/game`。
