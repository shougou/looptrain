# LoopTrain-ST v0.3.2 试玩版规格说明书

## 1. 产品名称

LoopTrain-ST

试玩剧集：

```text
第七节车厢：试玩版
```

## 2. 产品定位

LoopTrain-ST 是一个基于 SillyTavern 生态的强控制 AI 互动故事引擎。

它将 ST 的角色卡、世界书、Prompt、模型连接能力，与一个外层游戏控制层结合，使玩家可以通过自然语言进行：

- 探索。
- 对话。
- 试探。
- 查看线索。
- 推动剧情。
- 失败循环。
- 记忆继承。

## 3. 试玩版背景

```text
1947 年冬，重庆。
一辆夜行列车正穿过群山，驶向江城。
列车编号：渝江线 307 次。
```

玩家公开身份：

```text
普通乘客
```

玩家隐藏身份：

```text
打入敌人内部的地下工作者
```

当前任务：

```text
携带绝密情报前往江城，与代号“扣子”的同志接头。
```

当前危机：

```text
09:00 前后，列车将在北江铁桥前爆炸。
```

试玩版目标：

```text
证明第七节车厢存在异常，并说服赵乘警检查地板。
```

正式版目标伏笔：

```text
活下去，找到炸弹，猜出敌人，留下扣子。
```

## 4. 核心玩法

### 4.1 游戏模式

LoopTrain 有两个游戏模式：

| 模式 | 说明 |
|---|---|
| 探索模式 | 玩家输入行动，观察车厢、寻找 NPC、检查环境 |
| 对话模式 | 玩家与当前 NPC 交谈，获得线索或触发事件 |

### 4.2 输入通道

LoopTrain 有两个输入通道：

| 通道 | 说明 |
|---|---|
| 扮演 | 输入会进入故事，探索时是行动，对话时是台词 |
| 指令 | 输入不会被 NPC 听见，只用于控制游戏系统 |

组合关系：

| 当前模式 | 扮演 | 指令 |
|---|---|---|
| 探索模式 | 描述行动 | 查看线索、人物、状态、失败测试、重置 |
| 对话模式 | 对 NPC 说话 | 结束对话、查看线索、人物、状态 |

## 5. NPC 规格

### 5.1 小宁

角色定位：

```text
情绪锚点 / 线索来源
```

功能：

- 提供地板下方滴答声线索。
- 触发小宁妈妈隐藏记忆节点。
- 通过儿童视角提供事实，不做成人推理。

配置：

```json
{
  "npc_id": "xiaoning",
  "dialogue_ap_cost": 3,
  "dialogue_turn_limit": 10,
  "near_limit_hint_at": 8,
  "turn_limit_policy": "soft_close"
}
```

### 5.2 赵乘警

角色定位：

```text
规则门槛 / 权威验证者
```

功能：

- 需要至少两条有效证据才会行动。
- 证据不足时拒绝玩家。
- 证据足够时检查地板并触发试玩版成功。

配置：

```json
{
  "npc_id": "zhao_police",
  "dialogue_ap_cost": 3,
  "dialogue_turn_limit": 8,
  "near_limit_hint_at": 6,
  "turn_limit_policy": "evidence_gate"
}
```

### 5.3 沈墨寒

角色定位：

```text
误导 / 压力 / 可疑线索来源
```

功能：

- 对“灰大衣纸条”产生反应。
- 对“连接处”“08:48”“口琴声”产生反应。
- 提供连接处停留、口琴声疑点。
- 过度追问会导致警觉上升。

配置：

```json
{
  "npc_id": "shen_mohan",
  "dialogue_ap_cost": 3,
  "dialogue_turn_limit": 8,
  "near_limit_hint_at": 6,
  "turn_limit_policy": "risk_escalation",
  "suspicion_delta_on_limit": 15
}
```

### 5.4 小宁妈妈

角色定位：

```text
隐藏情感记忆节点
```

功能：

- 通过小宁对话触发。
- 不作为可见 NPC 出现。
- 不推进主线成功。
- 增强小宁角色厚度。

配置：

```json
{
  "npc_id": "xiaoning_mother_hidden",
  "visibility": "hidden",
  "dialogue_ap_cost": 0,
  "dialogue_turn_limit": 2,
  "turn_limit_policy": "memory_once"
}
```

## 6. AP 与时间规则

初始状态：

```json
{
  "clock": "08:45",
  "ap_remaining": 10,
  "loop": 1
}
```

行动消耗：

| 行动 | AP |
|---|---:|
| 检查座位下方 | 1 |
| 说服赵乘警 | 2 |
| 普通 NPC 对话 | 3 |
| 隐藏记忆节点 | 0 |

失败条件：

```text
AP <= 0 或 clock >= 09:00
```

## 7. 线索规格

线索是结构化对象，不只是文本。

示例：

```json
{
  "id": "ticking_under_floor",
  "title": "地板下方的滴答声",
  "source": "小宁对话",
  "confidence": "high",
  "usable_with": ["zhao_police", "shen_mohan", "connector"],
  "carry_to_next_loop": true,
  "used_in": []
}
```

核心线索：

| 线索 ID | 标题 | 来源 | 可信度 |
|---|---|---|---|
| `gray_coat_note_pressure` | 不要相信灰大衣 | 开场纸条 | medium |
| `xiaoning_heard_ticking` | 小宁也听见过声音 | 小宁对话 | high |
| `ticking_under_floor` | 地板下方的滴答声 | 小宁对话 | high |
| `sound_not_from_seat` | 声音不来自座位下方 | 玩家检查 | high |
| `suspicious_connector_movement` | 连接处有人停留过 | 沈墨寒对话 | medium |
| `mother_doll_memory` | 小宁妈妈与布娃娃 | 隐藏记忆节点 | high |
| `harmonica_from_dining_car` | 餐车方向的口琴声 | 世界事件 | low |
| `zhao_requires_evidence` | 赵乘警需要证据才会行动 | 赵乘警反馈 | high |

## 8. 成功条件

试玩版成功条件：

```text
拥有至少两条有效证据，并说服赵乘警检查地板。
```

有效证据包括：

```text
ticking_under_floor
xiaoning_heard_ticking
sound_not_from_seat
suspicious_connector_movement
```

成功结算展示：

- 你证明了什么。
- 你还不知道什么。
- 正式版目标是什么。

## 9. 失败循环

失败结算包括：

- 失败原因。
- 本轮确认事实。
- 疑点。
- 错误判断。
- 下一轮建议。
- 带入下一轮的记忆。

下一轮开场会根据已继承线索变化。

例如：

```text
你记得上一轮小宁说过：声音不是来自座位下面，而是地板下方。
```

## 10. 当前版本边界

v0.3.2 不包含：

- 真实 LLM 接入。
- 真实模型 Prompt 编排。
- 角色卡运行时完全动态加载。
- 线索 / 人物 / 状态抽屉。
- Playwright UI 自动化测试。
- 真实 ST 实机截图级验证。
