# Dialogue Outcome Prompt

任务：根据本次对话，生成“对话结算卡”的文案草稿。最终状态以 LoopTrain Core Engine 的结构化结果为准。

输出 JSON：

```json
{
  "summary": "一句话总结对话价值",
  "card_text": "适合展示给玩家的对话结算文案",
  "next_step_copy": ["下一步建议1", "下一步建议2"]
}
```

不得新增 Core Engine 未确认的线索。
