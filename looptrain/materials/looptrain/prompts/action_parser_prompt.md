# Action Parser Prompt

任务：将玩家输入解析为结构化行动。只输出 JSON。

当前模式可能是：

- explore：玩家输入表示行动。
- dialogue：玩家输入表示对当前 NPC 的台词或对话内小动作。

JSON 输出格式：

```json
{
  "mode": "explore|dialogue",
  "intent": "start_dialogue|observe|move|search|convince|dialogue_message|dialogue_action|end_dialogue|unknown",
  "target_npc": "xiaoning|zhao_police|shen_mohan|null",
  "target_object": "string|null",
  "tone": "gentle|neutral|threatening|probing|urgent|unknown",
  "mentioned_clues": [],
  "confidence": 0.0
}
```
