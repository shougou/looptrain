# LoopTrain-ST 项目设计文档

## 1. 设计目标

LoopTrain-ST 的目标是将 SillyTavern 从“角色聊天前端”扩展为“AI 互动故事游戏底座”。

项目采用非侵入式设计：

```text
SillyTavern Core
  ├─ 角色卡
  ├─ 世界书
  ├─ Prompt
  ├─ 模型连接
  └─ 聊天记录

LoopTrain Extension
  ├─ 手机端游戏 UI
  ├─ 探索 / 对话模式
  ├─ 扮演 / 指令输入通道
  ├─ NPC 立绘浮层
  └─ 结算卡 / 失败卡 / 开场页

LoopTrain Server Plugin
  ├─ 状态机
  ├─ AP 与时间
  ├─ 线索引擎
  ├─ 对话轮数限制
  ├─ 成功 / 失败判定
  └─ 下一轮记忆继承
```

## 2. 核心架构原则

### 2.1 ST 作为底座

ST 提供：

- Character Card。
- World Info。
- Prompt 管理。
- 模型 API 配置。
- Chat Metadata。
- UI Extension 机制。
- Server Plugin 机制。

### 2.2 LoopTrain 作为强控制层

LoopTrain 负责：

- 真实游戏状态。
- 行动解析。
- AP 扣除。
- 线索获得。
- NPC 状态。
- 对话结算。
- 失败循环。
- 成功条件。
- 下一轮记忆继承。

### 2.3 LLM 只做表演

后续接 LLM 时，模型只负责：

- NPC 语言风格。
- 情绪表达。
- 台词生成。
- 场景氛围。

模型不负责：

- 判定成功。
- 发放线索。
- 修改 AP。
- 进入下一轮。
- 透露隐藏真相。

## 3. 运行时状态

状态保存在：

```text
chatMetadata.looptrain
```

典型结构：

```json
{
  "episode_id": "trial_001",
  "mode": "explore",
  "input_channel": "roleplay",
  "loop": 1,
  "clock": "08:45",
  "ap_remaining": 10,
  "location": "carriage_7",
  "active_npc": null,
  "known_clues": ["gray_coat_note_pressure"],
  "carried_memory": [],
  "dialogue_session": null,
  "npc_states": {
    "xiaoning": { "trust": 20, "fear": 45 },
    "zhao_police": { "suspicion": 15 },
    "shen_mohan": { "suspicion": 35 }
  },
  "flags": {
    "intro_seen": false,
    "trial_success": false
  }
}
```

## 4. 状态机

主要状态：

| 状态 | 说明 |
|---|---|
| `explore` | 探索模式 |
| `dialogue` | 与 NPC 对话 |
| `loop_failed` | 失败结算显示中 |
| `trial_success` | 试玩版成功 |

主要事件：

```text
SESSION_INIT
ACTION_COMMIT
DIALOGUE_START
DIALOGUE_MESSAGE
DIALOGUE_END
CLUE_GAINED
AP_SPENT
LOOP_FAILED
NEXT_LOOP_STARTED
TRIAL_SUCCESS
```

## 5. UI Extension 设计

目录：

```text
st-extension/LoopTrain/
```

核心文件：

```text
manifest.json
index.js
style.css
```

职责：

- 创建 LoopTrain 覆盖层。
- 显示开场背景页。
- 显示顶部状态栏。
- 显示场景卡与当前目标。
- 显示 NPC 立绘。
- 管理底部输入框。
- 管理扮演 / 指令页签。
- 调用 Server Plugin API。
- 远端不可用时回退 Local Mock。

## 6. Server Plugin 设计

目录：

```text
st-server-plugin/looptrain/
```

核心文件：

```text
index.js
engine.js
```

API：

```text
GET  /api/plugins/looptrain/health
POST /api/plugins/looptrain/session/init
POST /api/plugins/looptrain/state/normalize
POST /api/plugins/looptrain/action/parse
POST /api/plugins/looptrain/action/commit
POST /api/plugins/looptrain/dialogue/start
POST /api/plugins/looptrain/dialogue/message
POST /api/plugins/looptrain/dialogue/end
POST /api/plugins/looptrain/loop/fail
POST /api/plugins/looptrain/loop/next
```

Engine 设计要求：

- 输入 state。
- 输出新 state。
- 不直接操作 DOM。
- 不调用 LLM。
- 不依赖数据库。
- 可被 Node 测试直接调用。

## 7. 内容物料设计

内容物料分为：

```text
ST-compatible 物料
LoopTrain-specific 物料
```

ST-compatible：

```text
character_cards/
character_cards_png/
world_books/
world_info/
```

LoopTrain-specific：

```text
episode/
clues/
rules/
scenes/
prompts/
schemas/
```

## 8. Mock Harness

目录：

```text
mock-harness/index.html
```

作用：

- 不启动 ST 也能验证 UI。
- 不启用 Server Plugin 也能跑本地 Mock。
- 快速验证手机端布局。
- 快速验证游戏路径。

## 9. 测试设计

测试类型：

| 测试 | 文件 |
|---|---|
| 成功路径 | `tests/engine_flow_test.js` |
| 隐藏节点 | `tests/hidden_node_test.js` |
| 三 NPC 路径 | `tests/all_npc_flow_test.js` |
| 失败继承 | `tests/failure_next_loop_test.js` |
| 对话轮数限制 | `tests/dialogue_turn_limit_test.js` |
| 包结构校验 | `tools/validate_package.py` |
| ST 角色卡 PNG 校验 | `tools/validate_st_cards.py` |

## 10. 后续演进

### v0.3.x

- 真实 ST 环境端到端验证。
- UI 细节打磨。
- 线索 / 人物 / 状态抽屉。
- Playwright Mock Harness 测试。

### v0.4

- 接入真实 LLM。
- LLM NPC 表演层。
- 输出校验。
- Prompt 结构化。

### v0.5

- 完整试玩版。
- 剧集包动态加载。
- 第一集正式版准备。
