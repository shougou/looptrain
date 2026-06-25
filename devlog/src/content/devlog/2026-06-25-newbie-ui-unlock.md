---
title: 'v0.11.0：渐进式 UI 解锁系统——从 overwhelm 到 flow'
date: 2026-06-25T12:00:00+08:00
version: 'v0.11.0-newbie-ui-unlock'
status: 'published'
summary: '实现 UIStage 7 阶段状态机，许知微主界面化提示卡，案件板 CaseBoard，加载状态管理，按钮点击反馈动效。解决新手面对 12 个按钮和复杂行动选项的认知负荷问题。'
---

## 问题

v0.10.0 的 NPC 时间线推理系统上线后，虽然玩法深度有了，但新手第一次进入游戏时面对 12 个按钮、自由输入框和复杂的行动选项，认知负荷过大。我们需要一个引导系统，让新手从简单开始，逐步解锁 complexity。

## 方案：UIStage 状态机

核心思路：把游戏 UI 拆成 7 个阶段，每个阶段只展示必要的 UI 元素。

```
intro → first_observation → first_dialogue → loop_memory_intro → caseboard_intro → contradiction_intro → normal_play
```

**intro 阶段**：只有 1 个按钮（"开始观察"），隐藏输入框，许知微提示卡引导玩家。

**first_observation 阶段**：2 个按钮，显示输入框，许知微提示变化为"你发现了一些线索..."

**normal_play 阶段**：所有按钮可用，完整 UI。

## 关键设计决策

1. **AP 判断优于 history 判断**：使用 `ap < 10` 判断是否有行动历史，不依赖引擎未保证的字段
2. **许知微主界面化**：从顶部按钮改为场景下方提示卡，更自然融入游戏流程
3. **不修改 engine.js**：仅前端 UI 层控制渲染，引擎行为不变

## 技术实现

4 个新模块：
- `ui-stage.js`：7 阶段状态机
- `assistant-hint.js`：许知微动态提示生成
- `case-board.js`：案件板渲染
- `loading-state.js`：加载状态管理

## 验证

- 单元测试：2/2 通过
- E2E 回归：25/25 通过
- 引擎冒烟：7/7 通过

## 下一步

- `loop_memory_intro` 阶段记忆提示 UI
- `contradiction_intro` 阶段矛盾可视化
- 更多按钮动效（涟漪效果）
