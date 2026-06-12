# LoopTrain 控制层读取说明

LoopTrain Core Engine 应读取以下物料：

- `looptrain/episode/trial_001.episode.json`
- `looptrain/clues/trial_001_clues.json`
- `looptrain/scenes/carriage_7.scene.json`
- `looptrain/rules/trial_001.rules.json`
- `st_import/character_cards/*.card.json` 中的 `data.extensions.looptrain`
- `st_import/world_books/*.json` 中的 `entries[].extensions.looptrain`

## 状态机建议

所有状态变化都应产生事件：

```text
DIALOGUE_STARTED
CLUE_GAINED
NPC_STATE_CHANGED
AP_SPENT
DIALOGUE_ENDED
LOOP_FAILED
NEXT_LOOP_STARTED
TRIAL_SUCCESS
```

## 不建议

- 不要让 LLM 直接修改 AP。
- 不要让 LLM 直接宣布获得线索。
- 不要让 LLM 直接宣布成功/失败。
- 不要让 World Info 充当真实状态。

## 推荐

- LLM 负责自然语言表演。
- LoopTrain Engine 负责状态裁判。
- UI Extension 负责展示结算卡、建议句和立绘浮层。
