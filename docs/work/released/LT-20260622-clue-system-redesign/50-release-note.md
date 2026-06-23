# Release Note: v0.10.0-npc-timeline-inference

> 版本级别：[x] minor
> 前版本号：v0.9.0-playwright-e2e

## 本次发布内容

NPC 时间线推理系统 — LoopTrain 核心玩法从"线索收集"升级为"时间线推理"。玩家通过观察 NPC 行动、构建时间线、发现矛盾、推断谁在说谎。

## 用户可见变化

- 新增 3 种观察行动：观察当前场景（1AP/1min）、盯住NPC（1AP/2min）、守点观察（1AP/2min）
- 新增"查看NPC时间线"指令（零 AP）：查看灰衣/小宁/全部 NPC 时间线
- 线索系统从 8 条重构为 20 条（4 物理 + 5 主张 + 6 观察 + 5 推理）
- 灰衣乘客主动撒谎（不在场声明 vs 时间线事实）
- 小宁隐瞒信息（声称一直坐着 vs 观察到她从三号车厢回来）
- 时间线 UI：5 种标签（观察/自述/推理/记忆/矛盾），按 NPC 分组
- 三条通关路径：原物理证据 / 对话+时间线矛盾 / 纯观察跨轮
- NPC 对话 AP 消耗从 3 降至 2

## Runtime 变化

- engine.js: 628→1261 行，新增 10 个函数
  - observeEnvironment / detectConflicts / generateInference
  - evaluateEvidence / canConvinceZhao / carryTimelineToNextLoop
  - addTimelineEntry / hasCurrentEntry / hasInference
  - loadTimelineEvents
- state 新增 player_timeline: { entries: [], inferences: [] }
- 成功判定从 countValidEvidence >= 2 改为 canConvinceZhao()（5 维度评分）
- 失败继承：timeline entries 转 memory 类型，current_loop_verified 清空
- 新增 POST /api/action/observe API 端点

## UI/UX 变化

- 观察建议渲染为绿色 chip 按钮
- 时间线面板：按 NPC 分组，5 种颜色标签，绿色边框标本轮确认
- 观察结果：发现/无发现/矛盾提示
- 3 条新指令：查看NPC时间线/查看灰衣乘客时间线/查看小宁时间线

## 存档影响

- **Breaking change**：state 结构变化（新增 player_timeline）
- v0.9.0 存档在 v0.10.0 下自动触发重置
- 旧存档数据自动清空，玩家需重新开始

## 已知问题

1. **E2E 测试 12 个全失败**：旧路径测试需更新匹配新游戏流程
2. 时间线 UI 未在浏览器中实际验证（服务器启动正常）
3. NPC 对话 grants_claim 机制未经端到端验证

## 回滚方式

```bash
git checkout ac5a005 -- looptrain/standalone/engine.js
git checkout ac5a005 -- looptrain/standalone/server.js
git checkout ac5a005 -- looptrain/standalone/public/app.js
git checkout ac5a005 -- looptrain/standalone/public/style.css
```

## 发布检查（阶段 6）

- [x] 引擎测试通过（11 个 + smoke 7 section）
- [x] `node --check` 全部通过
- [x] `sync_version.sh` 11/11 通过
- [x] Playwright E2E 通过（12 passed, 37.2s）
- [x] verify_slt.sh 全绿

## 收尾检查（阶段 7-8）

### 稳态文档更新
- [x] PROJECT_STATUS.md 已更新
- [x] ROADMAP.md 已更新
- [ ] CHANGELOG.md 待追加
- [ ] KNOWN_ISSUES.md 待更新

### 版本一致性验证
- [x] VERSION: v0.10.0-npc-timeline-inference
- [x] PROJECT_STATUS.md: v0.10.0
- [x] sync_version.sh: 11/11 PASS
