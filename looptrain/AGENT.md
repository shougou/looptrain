# AGENT.md — LoopTrain-ST 开发协作规范

## 1. 项目定位

LoopTrain-ST 是一个基于 SillyTavern 生态的 AI 互动故事游戏扩展。

核心原则：

> 不修改 SillyTavern 核心代码，只通过外层 UI Extension、Server Plugin、ST 角色卡、WorldInfo、Prompt 与 `chatMetadata.looptrain` 实现强控制互动故事引擎。

本项目不是普通聊天角色卡，而是：

- ST 负责：角色卡、世界书、模型连接、聊天底座、扩展加载。
- LoopTrain 负责：游戏状态、AP、线索、NPC 对话边界、结算、失败循环、试玩版目标。
- LLM 未来只负责：NPC 语言表演，不负责裁判状态。

## 2. 当前版本

当前版本：v0.3.2

当前状态：

- 已完成 ST 外层扩展骨架。
- 已完成 Server Plugin 控制层。
- 已完成 Mock Harness。
- 已完成 4 个 NPC 角色卡与立绘。
- 已完成开场背景页。
- 已完成扮演 / 指令双通道输入。
- 已完成 NPC 对话轮数限制。
- 已完成成功 / 失败结算。
- 已完成线索对象增强。
- 尚未接入真实 LLM。

## 3. 项目铁律

### 3.1 不动 ST 核心代码

禁止修改 SillyTavern 原始核心文件。

允许：

- 新增 UI Extension。
- 新增 Server Plugin。
- 新增 ST Character Card。
- 新增 WorldInfo / Lorebook。
- 通过 `chatMetadata.looptrain` 保存游戏状态。
- 通过 `/api/plugins/looptrain/*` 暴露控制层接口。

禁止：

- 直接修改 ST 原生发送逻辑。
- 覆盖 ST 原接口。
- 强耦合某个 ST 内部私有变量。
- 破坏普通 ST 聊天体验。

### 3.2 控制层裁判优先

LLM 不得直接决定：

- AP 扣除。
- 时间推进。
- 获得线索。
- NPC 状态变化。
- 试玩版成功。
- 循环失败。
- 下一轮继承记忆。

这些必须由 LoopTrain 控制层计算。

### 3.3 角色卡只提供表演与配置

ST 角色卡字段用于角色人格、口吻、场景和扩展配置。

`data.extensions.looptrain` 可以包含：

- `npc_id`
- `visibility`
- `dialogue_ap_cost`
- `dialogue_turn_limit`
- `near_limit_hint_at`
- `turn_limit_policy`
- `release_rules`
- `gate_rules`
- `portrait_assets`
- `dialogue_suggestions`

### 3.4 所有玩法必须可验证

新增功能必须至少满足一种验证方式：

- Node 单元测试。
- JSON 校验。
- Mock Harness 手动路径。
- ST 实机 checklist。

新增规则必须可复现，不能只依赖模型“感觉”。

## 4. 目录说明

```text
st-extension/LoopTrain/
  manifest.json
  index.js
  style.css
  *.png

st-server-plugin/looptrain/
  index.js
  engine.js
  package.json

materials/
  st_import/
    character_cards/
    character_cards_png/
    world_books/
    world_info/
  looptrain/
    episode/
    clues/
    rules/
    scenes/
    prompts/
    schemas/
  assets/

mock-harness/
  index.html

tests/
  *.js

tools/
  validate_package.py
  validate_st_cards.py

docs/
  *.md
```

## 5. 开发优先级

### P0：不能破坏

- ST 普通聊天功能。
- 已有 Mock Harness 路径。
- 角色卡 PNG 导入格式。
- 线索、AP、失败继承测试。

### P1：当前试玩版核心

- 开场背景页。
- 探索 / 对话模式。
- 扮演 / 指令输入通道。
- 小宁、赵乘警、沈墨寒、小宁妈妈。
- 线索对象。
- 对话轮数限制。
- 对话结算。
- 失败结算。
- 成功结算。

### P2：后续增强

- 真实 LLM 接入。
- 线索 / 人物 / 状态抽屉。
- Playwright UI 自动测试。
- 剧集包动态加载。
- 角色卡运行时解析。
- 创作者编辑器。

## 6. 代码修改要求

### 修改 UI Extension

文件：

```text
st-extension/LoopTrain/index.js
st-extension/LoopTrain/style.css
```

要求：

- 不依赖外部构建流程。
- 保持原生 JS 可运行。
- 保持手机端优先。
- 不引入重型前端框架。
- `node --check st-extension/LoopTrain/index.js` 必须通过。

### 修改 Server Plugin

文件：

```text
st-server-plugin/looptrain/index.js
st-server-plugin/looptrain/engine.js
```

要求：

- Engine 尽量保持纯函数。
- 输入 state，输出新 state 与 messages。
- 不在 Engine 中调用 LLM。
- 不依赖数据库。
- `node --check st-server-plugin/looptrain/engine.js` 必须通过。

### 修改角色卡

文件：

```text
materials/st_import/character_cards/*.card.json
st-character-cards/*.png
```

要求：

- JSON 卡与 PNG 卡保持一致。
- PNG 角色卡必须包含 `chara` 元数据。
- 修改 JSON 后必须重新生成 PNG 卡。
- `python tools/validate_st_cards.py` 必须通过。

## 7. 测试命令

在项目根目录执行：

```bash
node --check st-extension/LoopTrain/index.js
node --check st-server-plugin/looptrain/engine.js

node tests/engine_flow_test.js
node tests/hidden_node_test.js
node tests/all_npc_flow_test.js
node tests/failure_next_loop_test.js
node tests/dialogue_turn_limit_test.js

python tools/validate_package.py
python tools/validate_st_cards.py
```

说明：当前沙箱中 Python 可能打印 spreadsheet warmup warning，只要退出码为 0 即可视为通过。

## 8. 真实 ST 验证 Checklist

安装后验证：

1. ST 页面右下角出现 `LoopTrain` 按钮。
2. 点击后出现手机端覆盖层。
3. 首次打开显示《第七节车厢》开场背景页。
4. 点击“开始第 1 轮”进入游戏。
5. 底部显示“扮演 / 指令”页签。
6. 扮演模式输入“和小宁对话”，进入对话。
7. 小宁立绘出现。
8. 指令模式输入“查看线索”，不会进入 NPC 对话。
9. 对话中输入“结束对话”，出现对话结算。
10. 失败测试后出现失败结算。
11. 进入下一轮后继承记忆。
12. 成功路径能触发试玩版成功结算页。

## 9. 禁止事项

- 不允许让 LLM 直接修改状态。
- 不允许将 AP、线索、结局逻辑写进 Prompt 后完全交给模型判断。
- 不允许在未测试情况下修改角色卡 PNG 元数据。
- 不允许将真实模型 API Key 写入项目。
- 不允许引入不必要的复杂框架。
- 不允许将 ST 插件改造成侵入式 patch。

## 10. 后续接真实 LLM 的原则

未来 v0.4 接真实 LLM 时，采用三段式：

```text
玩家输入
→ LoopTrain 解析与状态检查
→ LLM 生成 NPC 表演文本
→ LoopTrain Outcome Engine 结构化结算
```

LLM 输出只进入：

- NPC 回复文本。
- 语气变化建议。
- 可选情绪描述。

LLM 输出不能直接进入：

- `known_clues`
- `ap_remaining`
- `flags.trial_success`
- `loop_failure_outcome`
- `carried_memory`


## v0.4-alpha 追加铁律：不重造 ST，复用 ST 运行时

从 v0.4-alpha 开始，项目路线明确为：

```text
SillyTavern 负责：角色卡、世界书、Prompt、模型连接、API Key、聊天上下文。
LoopTrain 负责：游戏 UI、控制层、AP、线索、对话轮数、成功失败结算。
```

禁止事项：

- 不做独立 Web Runtime。
- 不在 LoopTrain 中重新实现 ST 模型配置。
- 不在 LoopTrain 中保存 DeepSeek / OpenAI API Key。
- 不让 LLM 直接修改 AP、线索、成功失败状态。
- 不让 LLM 输出成为真实游戏裁判。

v0.4-alpha 的 LLM 回复只能作为 NPC 表演文本，真实状态必须由 Engine 结算。
