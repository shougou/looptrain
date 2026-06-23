# Plan: NPC 时间线推理系统

> 基于 `10-spec.md` 生成。回答：具体怎么改？改哪些文件？分几步？怎么验证？

---

## 1. 实施范围

v0.10.0 NPC 时间线推理系统 MVP。核心改动：
- 新增 `player_timeline` 状态结构，与 `known_clues` 并存
- 16 个世界事件 + 20 条内容对象（4 物理 + 5 主张 + 6 观察 + 5 推理）
- 3 种观察行动 + 矛盾检测 + 推理生成 + 多维证据评分
- 3 条通关路径 + 失败继承（current_loop_verified 机制）
- 时间线 UI + 查看指令
- 旧路径兼容（clue_floor_panel_scratch 自动补充）

## 2. 文件变更清单

| File | Action | Purpose |
|------|--------|---------|
| `looptrain/standalone/engine.js` | MODIFY | 新增 player_timeline、observeEnvironment、detectConflicts、generateInference、evaluateEvidence、canConvinceZhao、carryTimelineToNextLoop；重写 suggestions、endDialogue、failLoop、nextLoop、countValidEvidence |
| `looptrain/standalone/server.js` | MODIFY | 新增 POST /api/action/observe 路由；修改 /api/session/init 返回 player_timeline 初始结构 |
| `looptrain/standalone/public/app.js` | MODIFY | 观察行动 UI、时间线渲染、矛盾标记、新指令匹配、证据评分展示 |
| `looptrain/standalone/public/style.css` | MODIFY | 时间线 UI 样式（5 种颜色+标签+绿色边框） |
| `looptrain/materials/runtime/timeline/trial-timeline.json` | REWRITE | 16 个世界事件 + 时间窗口 + 可观察位置 |
| `looptrain/materials/runtime/clues/trial_001_clues.json` | REWRITE | 20 条线索数据（含 source_type / contradicts / supports / derived_from / carry_to_next_loop） |
| `looptrain/materials/runtime/characters/xiaoning.json` | MODIFY | 新增 claim_xiaoning_stayed_carriage2 对话选项 |
| `looptrain/materials/runtime/characters/gray_passenger.json` | MODIFY | 新增 claim_gray_stayed_connector + claim_gray_denies_carriage3 对话选项 |
| `looptrain/materials/runtime/characters/zhao_police.json` | MODIFY | 新增 claim_zhao_needs_actionable_evidence 对话节点 |
| `looptrain/materials/runtime/commands/command-registry.json` | MODIFY | 新增 3 条查看时间线指令 |
| `looptrain/tests/timeline_observation_test.js` | CREATE | 观察行动测试（时间窗口匹配、3 种观察类型） |
| `looptrain/tests/conflict_detection_test.js` | CREATE | 矛盾检测测试（灰衣撒谎 + 小宁隐瞒） |
| `looptrain/tests/inference_generation_test.js` | CREATE | 推理线索生成测试（5 条推理链） |
| `looptrain/tests/evidence_scoring_test.js` | CREATE | 多维证据评分测试（5 维度 + 4 条成功路径） |
| `looptrain/tests/loop_inheritance_test.js` | CREATE | 失败继承测试（memory 转换、current_loop_verified、counts_as_current_evidence） |
| `looptrain/tests/engine_flow_test.js` | MODIFY | 更新成功路径（canConvinceZhao 替代 countValidEvidence） |
| `looptrain/tests/failure_next_loop_test.js` | MODIFY | 更新继承逻辑（player_timeline + known_clues 并存） |
| `looptrain/standalone/tests/e2e/full-player-journey.spec.js` | MODIFY | 更新成功路径 E2E（新证据评分） |
| `looptrain/standalone/tests/e2e/timeline-paths.spec.js` | CREATE | 时间线推理路径 E2E（路径 2 + 路径 3） |
| `docs/project/GAME_DESIGN.md` | MODIFY | 更新线索系统描述（8→20 条，新增时间线推理） |
| `docs/project/ARCHITECTURE.md` | MODIFY | 新增时间线系统架构段落 |
| `VERSION` | MODIFY | v0.9.0 → v0.10.0 |

## 3. 数据结构变更

### 3.1 state 新增字段

```js
state = {
  // 现有字段保留
  known_clues: [],
  carried_memory: [],
  npc_states: {},
  flags: {},

  // 新增
  player_timeline: {
    entries: [],       // TimelineEntry[]
    inferences: [],    // string[]（推理线索 id 列表，去重）
  }
}
```

### 3.2 TimelineEntry 完整结构

```js
{
  id: string,                    // 条目唯一 id
  public_clue_id: string|null,   // 同步到 known_clues 的 id（null=不同步）
  actor: string,                 // NPC id 或 "scene"
  time: string|null,             // "14:04" 或 null
  time_range: [string, string]|null,
  location: string|null,
  action: string|null,
  source_type: "observation"|"claim"|"inference"|"memory",
  source_label: string,
  source_id: string,             // 对应的 clue/obs/inf id
  speaker: string|null,          // claim 类型时为说话 NPC id
  reliability: "high"|"unknown"|"low",
  status: "verified"|"claimed"|"remembered"|"unverified",
  loop_observed: number,
  current_loop_verified: boolean,
  visible_to_player: boolean,
  carry_to_next_loop: boolean,
  counts_as_current_evidence: boolean,   // memory 类型专用
  can_unlock_prepositioning: boolean,     // memory 类型专用
  tags: string[],
  contradicts: string[],         // 冲突的 entry id 列表
  supports: string[],            // 支持的 entry/inference id 列表
  derived_from: string[],        // inference 类型专用
  effect: object|null            // inference 类型专用
}
```

### 3.3 trial-timeline.json 新结构

```js
{
  "events": [
    {
      "id": "evt_gray_passes_carriage2",
      "time": "14:04",
      "actor": "gray_passenger",
      "location": "carriage_2",
      "action": "passed_through",
      "description": "灰衣经过二号车厢，走向连接处",
      "observable": {
        "window": ["14:04", "14:05"],
        "locations": ["carriage_2"],
        "observation_type": "scene"
      },
      "public_clue_id": "obs_gray_passes_1404"
    }
  ]
}
```

## 4. Runtime 改造步骤

### Step 1: 数据层 — 时间线 + 线索数据文件

1. 重写 `trial-timeline.json`：16 个事件，每个含 `observable.window` / `observable.locations` / `observable.observation_type` / `public_clue_id`
2. 重写 `trial_001_clues.json`：20 条线索，每条含 `source_type` / `contradicts` / `supports` / `derived_from` / `carry_to_next_loop` / `effect`
3. 更新 NPC 对话 JSON：新增 5 条 claim 对话选项
4. 更新 `command-registry.json`：新增 3 条查看时间线指令
5. 验证：`python3 scripts/validate_materials.py`（若有）+ 手动 JSON 语法检查

### Step 2: Engine — 状态初始化 + 数据加载

6. `engine.js` 新增 `TIMELINE_EVENTS` 全局变量 + `loadTimelineEvents()` 函数
7. `normalize(state)` 新增 `player_timeline` 初始化
8. `START_STATE` 新增 `player_timeline: { entries: [], inferences: [] }`
9. 验证：`node --check engine.js`

### Step 3: Engine — 观察行动

10. 新增 `observeEnvironment(state, params)` 函数
    - params: `{ type: "scene"|"npc"|"location", npc_id?, location? }`
    - 消耗 AP + 推进时间
    - 遍历 TIMELINE_EVENTS，匹配时间窗口 + 位置
    - 匹配的事件生成 timeline entry + 同步 known_clues
    - 调用 `detectConflicts()` + `generateInference()`
    - 返回 `observation_result`
11. 新增 NPC 移出场景中断逻辑
12. 验证：`node --check engine.js`

### Step 4: Engine — 矛盾检测 + 推理生成

13. 新增 `detectConflicts(state)` 函数
    - 遍历 `player_timeline.entries`
    - 检查 `contradicts` 字段
    - 返回冲突对列表（去重）
14. 新增 `generateInference(state)` 函数
    - 遍历冲突对 + 推理线索定义
    - 检查 `derived_from` 中的源条目是否已获得
    - 生成推理条目 + 添加到 entries + inferences
    - 去重检查
15. 新增 `addTimelineEntry(state, entry)` 辅助函数
    - 添加 entry 到 `player_timeline.entries`
    - 若 `public_clue_id` 存在，同步添加到 `known_clues`
    - 自动调用 `detectConflicts()` + `generateInference()`
16. 验证：`node --check engine.js`

### Step 5: Engine — 证据评分 + 成功判定

17. 新增 `evaluateEvidence(state)` 函数
    - 按 spec §3.2 映射表计算 5 个维度
    - 返回 `evidence_score` 对象
18. 新增 `canConvinceZhao(state)` 函数（替代 `countValidEvidence >= 2`）
    - 按 spec §3.3 四条路径判定
    - police_context 门槛检查
    - 首次报告自动注入逻辑
19. 修改 `endDialogue()`：用 `canConvinceZhao()` 替代 `countValidEvidence()`
20. 修改 `suggestions()`：新增观察行动 + 推理解锁行动
21. 验证：`node --check engine.js` + 现有 6 个测试（预期部分失败，Step 11 修复）

### Step 6: Engine — 失败继承

22. 修改 `failLoop()`：
    - 继承 `player_timeline.entries` 中 `carry_to_next_loop=true` 的条目
    - 继承 `player_timeline.inferences` 中 `carry_to_next_loop=true` 的推理
    - 继承 `known_clues` 中 `carry_to_next_loop=true` 的物理线索
    - 清空 `current_loop_verified`
23. 新增 `carryTimelineToNextLoop(prevState)` 函数
    - entries 转为 memory 类型
    - `source_type` → "memory"，`status` → "remembered"
    - `current_loop_verified` → false
    - `counts_as_current_evidence` → false
    - `can_unlock_prepositioning` → true
24. 修改 `nextLoop()`：调用 `carryTimelineToNextLoop()`
25. 验证：`node --check engine.js`

### Step 7: Server — API 路由

26. `server.js` 新增 `POST /api/action/observe` 路由
    - 接收 `{ type, npc_id?, location? }`
    - 调用 `engine.observeEnvironment()`
    - 返回 `observation_result`
27. 修改 `/api/session/init`：返回 `player_timeline` 初始结构
28. 修改 `/api/suggestions`：返回观察行动 + 推理解锁行动
29. 验证：启动 server + curl 测试

## 5. UI 改造步骤

### Step 8: 前端 — 观察行动 UI

30. `app.js` 新增观察行动识别
    - suggestions 含 `__OBSERVE_SCENE__` / `__OBSERVE_NPC__` / `__OBSERVE_LOCATION__` 模板
    - 点击后调用 `/api/action/observe`
31. 观察结果渲染
    - discovered：显示"你注意到……" + 线索描述
    - nothing_found：显示"你仔细观察周围，没有发现异常。"
    - conflict_detected：显示"⚠ 这与你已知的某条线索存在矛盾"
32. `style.css` 新增观察结果样式
33. 验证：浏览器手动测试

### Step 9: 前端 — 时间线 UI

34. `app.js` 新增时间线渲染函数 `renderTimeline(entries)`
    - 按 NPC 分组（gray_passenger / xiaoning / zhao_police / scene）
    - 每条 entry 显示：时间 + 标签 + 内容 + 状态
    - 5 种标签：[观察]蓝 / [自述]黄 / [推理]紫 / [记忆]灰 / [矛盾]红
    - 本轮确认：绿色左边框
35. `app.js` 新增"查看NPC时间线"指令处理
    - 匹配 `查看NPC时间线` / `查看灰衣乘客时间线` / `查看小宁时间线`
    - 零 AP，零时间
    - 渲染时间线面板
36. `style.css` 新增时间线面板样式（手机竖屏，列表式）
37. 验证：浏览器手动测试

## 6. 测试计划

### Step 10: 新增引擎测试

38. `timeline_observation_test.js`
    - 观察二号车厢 14:04 能获得 obs_gray_passes_1404
    - 观察连接处 14:06 能获得 obs_gray_enters_c3_1406
    - 错过时间窗口观察返回 nothing_found
    - 三种观察类型 AP/时间消耗正确
39. `conflict_detection_test.js`
    - 灰衣自述 + 灰衣经过 → 检测到矛盾
    - 小宁自述 + 小宁返回 → 检测到矛盾
    - 无冲突时返回空列表
40. `inference_generation_test.js`
    - 5 条推理链分别测试触发条件
    - 推理不重复生成
    - 推理条目正确添加到 entries + inferences
41. `evidence_scoring_test.js`
    - evaluateEvidence 按映射表正确计分
    - canConvinceZhao 四条路径均可成功
    - police_context=0 时返回 false
    - 首次报告自动注入 claim_zhao
42. `loop_inheritance_test.js`
    - failLoop 继承 carry_to_next_loop=true 的条目
    - 继承的 entry source_type 变为 memory
    - current_loop_verified 变为 false
    - counts_as_current_evidence=false 的 memory 不算证据
    - nextLoop 恢复继承的 known_clues + timeline entries

### Step 11: 更新现有测试

43. `engine_flow_test.js`：更新成功路径（canConvinceZhao 替代 countValidEvidence）
44. `failure_next_loop_test.js`：更新继承逻辑（player_timeline + known_clues 并存）
45. `all_npc_flow_test.js`：更新 NPC 对话（新增 claim 选项）
46. `hidden_node_test.js`：检查是否受影响
47. `dialogue_turn_limit_test.js`：检查是否受影响

### Step 12: E2E 测试

48. 更新 `full-player-journey.spec.js`：成功路径用新证据评分
49. 新增 `timeline-paths.spec.js`：
    - 路径 2 E2E（对话+时间线矛盾）
    - 路径 3 E2E（纯观察跨轮，3 轮）
50. 验证：`npx playwright test`

## 7. 回滚方案

- 所有改动在 `lt-standalone-mvp` 分支
- 若需回滚：`git checkout ac5a005 -- looptrain/standalone/engine.js`（恢复 v0.9.0 引擎）
- 数据文件（trial-timeline.json / clues）保留旧版本备份
- localStorage 存档因 state 结构变化会触发 breaking change 检测 → 自动重置

## 8. 分阶段任务

| 阶段 | 步骤 | 内容 | 依赖 |
|---|---|---|---|
| Phase 1 | Step 1 | 数据层（时间线+线索 JSON） | 无 |
| Phase 2 | Step 2-6 | Engine 改造（状态+观察+矛盾+推理+评分+继承） | Phase 1 |
| Phase 3 | Step 7 | Server API | Phase 2 |
| Phase 4 | Step 8-9 | 前端 UI（观察+时间线） | Phase 3 |
| Phase 5 | Step 10-12 | 测试（引擎+E2E） | Phase 4 |
| Phase 6 | — | 文档更新 + 版本号 + 收尾 | Phase 5 |

Phase 1-2 可独立验证（node --check + 单元测试）。
Phase 3-4 需联合验证（浏览器手动测试）。
Phase 5 是验收门槛。

## 9. 完成检查清单

### 数据层
- [ ] trial-timeline.json 含 16 个事件，每个含 observable 字段
- [ ] trial_001_clues.json 含 20 条线索，含完整关系字段
- [ ] 3 个 NPC 对话 JSON 新增 claim 选项
- [ ] command-registry.json 新增 3 条时间线指令

### Engine 层
- [ ] observeEnvironment 三种类型正确工作
- [ ] detectConflicts 正确检测灰衣+小宁矛盾
- [ ] generateInference 正确生成 5 条推理
- [ ] evaluateEvidence 按映射表计分
- [ ] canConvinceZhao 四条路径均可成功
- [ ] failLoop/nextLoop 正确继承+转换 memory
- [ ] suggestions 含观察行动+推理解锁行动

### API 层
- [ ] POST /api/action/observe 返回正确结构
- [ ] /api/session/init 返回 player_timeline

### UI 层
- [ ] 观察行动按钮可点击
- [ ] 观察结果正确渲染
- [ ] 时间线面板按 NPC 分组
- [ ] 5 种颜色+标签正确显示
- [ ] 矛盾标记红色
- [ ] 查看时间线指令可触发

### 测试
- [ ] 5 个新引擎测试全部通过
- [ ] 6 个现有引擎测试更新后通过
- [ ] Playwright E2E 全部通过
- [ ] `bash scripts/verify_slt.sh` 通过

### 文档
- [ ] GAME_DESIGN.md 更新
- [ ] ARCHITECTURE.md 更新
- [ ] VERSION → v0.10.0
- [ ] `bash scripts/sync_version.sh` 执行
- [ ] `bash scripts/check_release_wrapup.sh` 通过
