# ST 字段到 LoopTrain 控制层映射

本项目保持 SillyTavern 原生角色卡字段不变，只在 `data.extensions.looptrain` 中增加游戏控制字段。普通 ST 可以忽略这些扩展字段；LoopTrain 控制层会读取这些字段决定 AP、线索、轮数和立绘。

| ST 字段 | LoopTrain 用途 |
|---|---|
| `data.name` | NPC 显示名 |
| `data.description` | NPC 外显身份与基础介绍 |
| `data.personality` | NPC 语气、性格、表演风格 |
| `data.scenario` | 当前剧情场景背景 |
| `data.first_mes` | 进入对话时的第一句表演参考 |
| `data.mes_example` | 真实 LLM 接入后的口吻样例 |
| `data.post_history_instructions` | 防越权、防剧透、防替玩家做决定 |
| `data.extensions.looptrain.npc_id` | 控制层 NPC ID |
| `data.extensions.looptrain.visibility` | 可见 NPC / 隐藏节点 |
| `data.extensions.looptrain.dialogue_ap_cost` | 进入对话消耗 AP |
| `data.extensions.looptrain.dialogue_turn_limit` | 当前 NPC 单次对话最大轮数 |
| `data.extensions.looptrain.near_limit_hint_at` | 接近上限时的剧情提示轮数 |
| `data.extensions.looptrain.turn_limit_policy` | 达到上限后的处理策略 |
| `data.extensions.looptrain.on_turn_limit` | 达到上限后的消息、状态变化 |
| `data.extensions.looptrain.release_rules` | 线索释放规则 |
| `data.extensions.looptrain.gate_rules` | 证据门槛规则，如赵乘警检查地板 |
| `data.extensions.looptrain.portrait_assets` | NPC 立绘资源 |
| `data.extensions.looptrain.dialogue_suggestions` | 底部建议句 |

## 对话轮数配置

v0.3.2 按“原建议值 2 倍”配置：

| NPC | AP | 最大轮数 | 临界提示 | 策略 |
|---|---:|---:|---:|---|
| 小宁 | 3 | 10 | 8 | `soft_close` |
| 赵乘警 | 3 | 8 | 6 | `evidence_gate` |
| 沈墨寒 | 3 | 8 | 6 | `risk_escalation` |
| 小宁妈妈 | 0 | 2 | 1 | `memory_once` |

## 线索对象

线索不再只是 ID + 标题，而是证据对象：

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

该对象用于：

- 对话结算卡
- 失败结算卡
- 下一轮记忆继承
- 赵乘警证据门槛
- 指令通道“查看线索”
- 后续线索抽屉
