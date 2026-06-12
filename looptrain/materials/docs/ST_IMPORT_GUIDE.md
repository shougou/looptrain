# ST 导入与兼容说明

## 角色卡

`st_import/character_cards/*.card.json` 使用 Character Card V2 结构：

```json
{
  "spec": "chara_card_v2",
  "spec_version": "2.0",
  "data": {
    "name": "...",
    "description": "...",
    "personality": "...",
    "scenario": "...",
    "first_mes": "...",
    "mes_example": "...",
    "extensions": {
      "looptrain": {}
    }
  }
}
```

其中 `data.extensions.looptrain` 为 LoopTrain 控制层使用，普通 ST 聊天可以忽略。

## 世界书

本包提供两种世界书：

1. `st_import/world_books/looptrain_trial_character_book.json`
   - 便携 CharacterBook / Lorebook 结构。
   - 适合嵌入角色卡或由 LoopTrain Adapter 读取。

2. `st_import/world_info/looptrain_trial_worldinfo.st.json`
   - 按常见 ST World Info 导出结构组织。
   - 不同 ST 版本对导入字段可能有微调，如导入失败，可用其中 entries 内容手动创建 World Info。

## 兼容边界

- LoopTrain 不覆盖 ST 原接口。
- LoopTrain 字段全部命名空间化到 `extensions.looptrain`。
- ST 原生 UI 可用于测试 NPC 口吻。
- 正式试玩流程建议由 LoopTrain Extension 接管输入和状态结算。
