# LoopTrain-ST 试玩版物料包 v0.1

本包用于 LoopTrain / LoopTavern 试玩版内容验证。

目标：在保持 SillyTavern 角色卡、世界书、Prompt 生态兼容的前提下，为上层 LoopTrain 强控制引擎提供可读取的结构化物料。

## 试玩版范围

- 可交互 NPC：小宁、赵乘警、沈墨寒
- 隐藏 NPC：小宁妈妈
- 主场景：第七节车厢
- 试玩目标：证明第七节车厢存在异常，并说服赵乘警检查地板
- 核心玩法：对话获取线索 → 对话结算 → 线索变行动建议 → 失败结算 → 记忆继承

## 目录说明

```text
st_import/character_cards/     SillyTavern Character Card V2 JSON
st_import/world_books/         CharacterBook/Lorebook 便携格式
st_import/world_info/          SillyTavern World Info 导入草案格式
looptrain/episode/             LoopTrain 剧集卡
looptrain/clues/               线索卡
looptrain/scenes/              场景卡
looptrain/rules/               控制层规则卡
looptrain/prompts/             Prompt 模板
looptrain/schemas/             LoopTrain 扩展字段 schema
assets/portraits/              角色立绘资产
assets/ng/                     失败/NG 概念图
```

## 使用建议

1. 在 ST 中导入 `st_import/character_cards/*.card.json` 作为角色卡。
2. 将 `st_import/world_books/looptrain_trial_character_book.json` 作为角色/剧集 Lorebook 参考。
3. 若需要尝试 ST World Info 导入，可使用 `st_import/world_info/looptrain_trial_worldinfo.st.json`。
4. LoopTrain 控制层读取 `looptrain/**` 目录下的剧集、线索、规则和场景卡。
5. 不建议让 LLM 直接决定线索释放或通关结果；这些必须由 LoopTrain Core Engine 根据规则判定。

## 重要设计原则

- ST 原字段不动。
- 游戏字段都放在 `extensions.looptrain`。
- 世界书用于 Prompt 引导，不作为真实状态。
- 真实状态由 LoopTrain Core Engine 控制。
- 失败结算只能继承玩家已经获得的信息，不能剧透。
