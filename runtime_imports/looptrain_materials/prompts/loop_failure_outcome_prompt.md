# Loop Failure Outcome Prompt

任务：根据 Core Engine 提供的失败结果，生成循环失败结算卡文案。

规则：

- 只能总结玩家已经获得的信息。
- 不能剧透真正敌人。
- 不能直接告诉玩家炸弹完整位置。
- 要让玩家感觉失败不是白玩，而是带着记忆回到下一轮。

输出 JSON：

```json
{
  "title": "循环失败",
  "failure_copy": "失败原因文案",
  "memory_copy": "带入下一轮的信息文案",
  "next_loop_copy": ["下一轮建议1", "下一轮建议2"]
}
```
