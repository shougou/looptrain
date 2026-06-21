# LoopTrain 试玩版物料包

本包用于 LoopTrain Standalone 试玩版内容验证。

目标：为 LoopTrain 独立运行时提供可读取、可校验、可迁移的结构化内容。

## 试玩版范围

- 可交互 NPC：小宁(xiaoning)、赵乘警(zhao_police)、灰衣乘客(grey_passenger)、许知微(xu_zhiwei)
- 主场景：二号车厢
- 试玩目标：证明二号车厢存在异常，并说服赵乘警检查地板
- 注：v0.8 移除了沈墨寒(shen_mohan)和小宁妈妈(xiaoning_mother)角色
- 核心玩法：对话获取线索 → 对话结算 → 线索变行动建议 → 失败结算 → 记忆继承

## 目录说明

```text
looptrain/episode/             LoopTrain 剧集卡
looptrain/clues/               线索卡
looptrain/scenes/              场景卡
looptrain/rules/               控制层规则卡
looptrain/prompts/             Prompt 模板
looptrain/schemas/             LoopTrain 内容 schema
assets/portraits/              角色立绘资产
assets/ng/                     失败/NG 概念图
```

## 使用建议

1. Standalone Runtime 应逐步从 `looptrain/**` 读取剧集、线索、规则和场景卡。
2. Prompt 模板应作为 LLM Bridge 输入，不应写死在前端。
3. 世界设定和角色设定应迁移为 SLT 自有 JSON / Markdown 格式。
4. 不建议让 LLM 直接决定线索释放或通关结果；这些必须由 LoopTrain Engine 根据规则判定。

## 重要设计原则

- 游戏字段由 LoopTrain 自己定义和校验。
- Prompt 用于表演和语言生成，不作为真实状态。
- 真实状态由 LoopTrain Engine 控制。
- 失败结算只能继承玩家已经获得的信息，不能剧透。
- 素材授权状态必须持续记录。
