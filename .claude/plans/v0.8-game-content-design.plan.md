# v0.8 游戏内容设计

**来源**: `docs/testplay.md`  
**前置依赖**: v0.7（GoalEngine + 指令系统 + 许知微）  
**复杂度**: Large  
**状态**: 内容设计 — 待 v0.7 完成后实施

---

## 一、故事重构

**名称**: 《LoopTrain：寒灯初醒》  
**背景**: 1939 年冬，江城号列车。主角醒来，头痛、失忆，只记得 15 分钟后列车会爆炸。许知微自称记者，但知道循环存在。

**新开场字幕**: 电影式文字滚动（铁轨震动、窗外夜色、爆炸预知、许知微合上笔记本："你又醒了。"）

**许知微首次对话**: "先别急着证明自己是不是疯了。我们已经试过几次了。这一轮先确认三件事：你在哪里，爆炸什么时候发生，身边谁见过异常。"

**试玩结尾**: 爆炸仍发生，但三号车厢已清空。许知微低声："寒灯。这不是第一次循环，也不会是最后一次。"

---

## 二、人物重新设计

| NPC | 原设计 | v0.8 新设计 | 变化 |
|-----|--------|-----------|------|
| 主角 | 无名乘客 | **寒灯**（试玩结尾揭示代号） | 新增 |
| 赵乘警 | 警察 gatekeeper | **陆成**（列车乘务员） | 替换 |
| 沈墨寒 | 灰大衣 misdirection | **灰衣乘客**（可疑人物，不揭示阵营） | 替换 |
| 小宁 | 女孩 clue_source | 小宁（保留，调整背景） | 微调 |
| 小宁妈妈 | 隐藏 NPC | **移除**（试玩版不需要） | 删除 |

---

## 三、场景重新设计

| 场景 ID | 名称 | NPC | 替代原 |
|---------|------|-----|--------|
| `carriage_2` | 二号车厢 | 小宁、许知微 | 原 `carriage_7` |
| `carriage_3` | 三号车厢 | 灰衣乘客（进入后） | 原 `connector_7_8` |

---

## 四、时间系统

- 每轮：14:00 → 14:15（15 分钟，替代原 08:45-09:00）
- 循环次数：3 轮
- 世界时间线：8 个预编排事件（14:02-14:15）

---

## 五、核心线索（8 条）

| ID | 内容 | 获取方式 |
|----|------|---------|
| `clue.explosion_time_1415` | 爆炸固定发生在 14:15 | 第一轮失败/查看怀表 |
| `clue.xiaoning_nervous` | 小宁从三号车厢回来后紧张 | 观察小宁 |
| `clue.xiaoning_heard_metal_sound` | 小宁听到金属碰撞声 | 询问小宁 |
| `clue.gray_passenger_entered_carriage_3` | 灰衣乘客进入三号车厢 | 询问/跟踪 |
| `clue.canvas_bag_on_luggage_rack` | 行李架有旧帆布包 | 检查行李架 |
| `clue.gray_passenger_returned_without_bag` | 灰衣人空手返回 | 观察/跟踪 |
| `clue.conductor_can_clear_carriage` | 陆成有权清空车厢 | 询问陆成 |
| `clue.enough_evidence_for_conductor` | 线索足以说服陆成 | **派生**（3 条满足后自动生成） |

---

## 六、行动目标（8 个）

目标 1-3：第一轮（确认环境、询问小宁、确认爆炸时间）  
目标 4-6：第二轮（前往三号车厢、检查行李架、确认灰衣人与帆布包关联）  
目标 7-8：第三轮（说服陆成、完成有效干预）

每个目标含：`loopRange`、`activationCondition`、`completionCondition`（DSL）、`feedback`

目标 6 满足后自动派生 `clue.enough_evidence_for_conductor`

---

## 七、三轮结算文本

每轮含：本轮结果 + 新增线索列表 + 下一轮建议 + 许知微复盘对话

---

## 八、内容文件清单（10 个新文件）

| 文件 | 内容 |
|------|------|
| `materials/runtime/characters/lucheng.json` | 陆成 |
| `materials/runtime/characters/gray-passenger.json` | 灰衣乘客 |
| `materials/runtime/scenes/carriage-2.json` | 二号车厢 |
| `materials/runtime/scenes/carriage-3.json` | 三号车厢 |
| `materials/runtime/clues/trial-clues.json` | 8 条线索 |
| `materials/runtime/goals/trial-001-goals.json` | 8 个目标定义 |
| `materials/runtime/timeline/trial-timeline.json` | 世界时间线 |
| `materials/runtime/settlement/loop-settlements.json` | 三轮结算文本 |
| `materials/runtime/intro/intro-subtitle.json` | 开场字幕 |
| `materials/runtime/ending/demo-ending.json` | 试玩结尾 |

---

## 九、依赖 v0.7

- GoalEngine DSL 支持 `loopRange`、`eventOccurred.result`、派生线索
- CommandRegistry 支持 8 种 Action Type
- 许知微对话系统（`tutorial_hint` 意图）
- UI 目标栏 + 正反馈卡片 + 建议行动按钮
