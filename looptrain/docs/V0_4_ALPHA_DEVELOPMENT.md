# LoopTrain-ST v0.4-alpha Development Notes

## 版本目标

v0.4-alpha 是 **ST 原生 LLM 接入验证版**。

本版不做独立 Web Runtime，不重新实现 ST 角色卡、世界书、模型配置和 API Key 管理。

核心目标：

```text
在真实 SillyTavern 中，复用 ST 当前模型连接生成 NPC 回复；
LoopTrain 只负责游戏 UI、控制层、AP、线索、对话轮数、成功失败结算。
```

## 新增能力

### 1. NPC 回复来源切换

UI 顶部新增：

```text
回复：Mock / 回复：ST LLM
```

- Mock：使用本地规则文本，适合调试控制层。
- ST LLM：调用 SillyTavern 当前模型连接生成 NPC 回复。

### 2. ST LLM Bridge

新增前端桥接函数：

```js
generateNpcReplyWithST(npcId, playerText)
```

调用链：

```text
玩家输入
→ LoopTrain 判断当前模式 / NPC / 轮数
→ buildNpcQuietPrompt()
→ SillyTavern generateQuietPrompt()
→ sanitizeLlmReply()
→ Server Plugin / Local Engine dialogueMessage()
→ 控制层结算线索、轮数、成功失败
```

### 3. 游戏约束 Prompt

LLM 只负责 NPC 表演。

Prompt 明确禁止：

- 替玩家行动。
- 宣布获得线索。
- 扣 AP。
- 宣布成功 / 失败。
- 进入下一轮。
- 剧透炸弹位置或敌人身份。

### 4. LLM 输出清洗

即使模型输出：

```text
【获得线索】
【AP -3】
【试玩版成功】
```

这些文本也会被清洗，不作为真实状态。

真实状态只由 LoopTrain Engine 判定。

### 5. Engine 支持 llm_reply

Server Plugin 的 `/dialogue/message` 现在支持：

```json
{
  "npc_id": "xiaoning",
  "player_text": "...",
  "state": {},
  "llm_reply": "小宁的模型回复文本"
}
```

Engine 会把 `llm_reply` 当作 NPC 表演文本，但线索、轮数、成功失败仍由规则计算。

## DeepSeek V4 Pro 配置建议

在 SillyTavern 中配置：

```text
API Type: Chat Completion
Chat Completion Source: Custom (OpenAI-compatible) 或 DeepSeek
Endpoint / Base URL: https://api.deepseek.com
Model: deepseek-v4-pro
```

如果你希望先验证稳定性，可以关闭流式输出；等确认稳定后再开启 streaming。

## 验证路径

### Mock 路径

```text
回复：Mock
→ 和小宁对话
→ 提到滴答声
→ 结束对话
→ 检查座位下方
→ 说服赵乘警
→ 试玩版成功
```

### ST LLM 路径

```text
在 ST 中配置 DeepSeek V4 Pro
→ 进入 LoopTrain
→ 切换“回复：ST LLM”
→ 和小宁对话
→ 输入自由问题
→ 观察小宁是否由 DeepSeek 生成回复
→ 结束对话
→ 检查结算是否仍由 LoopTrain 控制
```

## 已知边界

v0.4-alpha 仍属于验证版：

- ST LLM Bridge 依赖 SillyTavern `generateQuietPrompt()`。
- 不同 ST 版本内部函数可能变化。
- 真实 ST 环境需要人工验证。
- 目前不做公网安全加固。
- 目前不做账号、云存档、限流、防刷。

## 新增测试

```text
tests/llm_bridge_test.js
```

验证：

- LLM 回复只作为表演文本。
- 模型输出中的系统裁判文本会被清洗。
- 线索仍由 Engine 根据玩家输入和规则判定。
