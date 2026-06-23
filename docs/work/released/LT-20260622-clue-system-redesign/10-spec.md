# 10-spec.md — NPC 时间线推理系统设计规格

**Work Item**: LT-20260622-clue-system-redesign
**版本级别**: minor
**版本号**: v0.10.0
**基于**: 00-idea.md + 全面评审（5 red issues resolved）

---

## 1. 目标（追溯 00-idea.md）

建立 NPC 时间线推理系统。玩家通过观察 NPC 行动、记录场景事件、询问 NPC 得到主张、对比事实和自述、发现时间线矛盾、推断谁在说谎或隐瞒，利用循环重新验证关键时间点。

三条通关路径：原物理证据 / 对话+时间线矛盾 / 纯观察跨轮。

## 2. 非目标

不做许知微判定交互、时间线整理话术、行动推荐器、失败复盘叙事、LLM Bridge、复杂可视化时间轴、拖拽排序、多结局推理树、LLM 动态解释、判定推翻逻辑。不做小宁母亲 runtime NPC。不开放三号车厢场景。

## 3. 核心架构决策（源自评审 5 个红色问题）

### 3.1 状态模型：known_clues 与 player_timeline 并存（方案 B）

```js
state = {
  known_clues: [],          // 物理线索 + 开场纸条 + 检查类线索 + UI 兼容
  player_timeline: {        // NPC 时间线系统事实源
    entries: [],            // 观察 / 主张 / 推理 / 记忆条目
    relations: [],          // 矛盾关系 / 支持关系
    inferences: []          // 推理线索 id 列表（去重）
  },
  carried_memory: [],       // 跨轮继承的 known_clue id
  flags: {}                 // 判定标志位
}
```

**职责分离**：
- `known_clues`：物理线索、开场纸条、检查类线索、兼容现有 UI 和成功判定
- `player_timeline.entries`：观察到的 NPC 行动、NPC 自述、推理条目、记忆条目
- **同步规则**：添加 timeline entry 时，若其 `public_clue_id` 存在，同步写入 `known_clues` 用于 UI 展示

### 3.2 证据维度映射表

```js
// evaluateEvidence(state) → evidence_score
evidence_score = {
  physical_anomaly: 0,
  timeline_conflict: 0,
  suspect_route: 0,
  actionable_location: 0,
  police_context: 0
}
```

| 线索 / 条目 | physical_anomaly | timeline_conflict | suspect_route | actionable_location | police_context |
|---|---|---|---|---|---|
| `clue_ticking_under_floor` | +1 | 0 | 0 | 0 | 0 |
| `clue_sound_not_from_seat` | +1 | 0 | 0 | +1 | 0 |
| `clue_floor_panel_scratch` | 0 | 0 | 0 | +1 | 0 |
| `obs_metal_sound_1408` | +1 | 0 | 0 | 0 | 0 |
| `inf_gray_alibi_contradicted` | 0 | +1 | 0 | 0 | 0 |
| `inf_gray_denial_false` | 0 | +1 | 0 | 0 | 0 |
| `obs_gray_passes_1404` | 0 | 0 | +1 | 0 | 0 |
| `obs_gray_enters_c3_1406` | 0 | 0 | +1 | 0 | 0 |
| `inf_gray_connected_to_c3_anomaly` | 0 | 0 | +1 | 0 | 0 |
| `inf_c3_needs_inspection` | 0 | 0 | +1 | +1 | 0 |
| `claim_zhao_needs_actionable_evidence` | 0 | 0 | 0 | 0 | +1 |

注意：小宁隐瞒线不直接给 suspect_route 分。小宁线提供情报方向和三号车厢动机线，而非定罪证据。

### 3.3 canConvinceZhao() — 含 police_context

```js
function canConvinceZhao(state) {
  const e = evaluateEvidence(state);

  // police_context 必须满足
  // 若首次报告赵乘警时仍无 police_context，自动注入 claim_zhao_needs_actionable_evidence
  if (e.police_context < 1) return false;

  // 路径 A：物理证据充分
  if (e.physical_anomaly >= 2 && e.actionable_location >= 1) return true;

  // 路径 B：时间线推理 + 物理异常 + 可执行位置
  if (e.physical_anomaly >= 1 && e.timeline_conflict >= 1
      && e.suspect_route >= 1 && e.actionable_location >= 1) return true;

  // 路径 C：完整灰衣观察链 + 可执行位置
  if (hasCurrentEntry(state, "entry_gray_seen_passes_1404")
      && hasCurrentEntry(state, "entry_gray_seen_enters_c3_1406")
      && hasCurrentEntry(state, "entry_metal_sound_1408")
      && e.actionable_location >= 1) return true;

  // 路径 D：三号车厢需要检查的综合推理
  if (hasInference(state, "inf_c3_needs_inspection")
      && e.actionable_location >= 1) return true;

  return false;
}
```

### 3.4 inf_c3_needs_inspection — 行动解锁型推理

```js
{
  id: "inf_c3_needs_inspection",
  title: "三号车厢 / 二三号连接处需要立即检查",
  source_type: "inference",
  derived_from: ["inf_gray_connected_to_c3_anomaly", "clue_floor_panel_scratch"],
  effect: {
    unlock_actions: ["action_report_c3_inspection", "action_request_zhao_check_connector"],
    contributes_to_success: true
  },
  carry_to_next_loop: true
}
```

触发条件（二选一）：
- `inf_gray_connected_to_c3_anomaly` + `clue_floor_panel_scratch`
- 或 `obs_gray_enters_c3_1406` + `obs_metal_sound_1408` + `clue_floor_panel_scratch`

### 3.5 失败继承：玩家已构建时间线快照

继承：
- `player_timeline.entries` 中 `carry_to_next_loop = true` 的条目
- `player_timeline.inferences` 中 `carry_to_next_loop = true` 的推理
- `known_clues` 中 `carry_to_next_loop = true` 的物理线索

不继承：
- `current_loop_verified`
- NPC 当前轮状态（灰衣是否被质问、小宁是否信任、赵乘警是否相信）
- 许知微交互状态（本迭代无）

```js
function carryTimelineToNextLoop(prevState) {
  return prevState.player_timeline.entries
    .filter(e => e.carry_to_next_loop)
    .map(e => ({
      ...e,
      source_type: "memory",
      source_label: "上一轮记忆",
      status: "remembered",
      current_loop_verified: false,
      counts_as_current_evidence: false,
      can_unlock_prepositioning: true
    }));
}
```

## 4. 时间线条目数据结构

```js
// 观察条目
{
  id: "entry_gray_seen_passes_1404",
  public_clue_id: "obs_gray_passes_1404",  // 同步到 known_clues 的 id
  actor: "gray_passenger",
  time: "14:04",
  time_range: null,
  location: "carriage_2",
  action: "passed_through",
  source_type: "observation",       // observation | claim | inference | memory
  source_label: "玩家观察",
  reliability: "high",
  status: "verified",               // verified | claimed | remembered | unverified
  loop_observed: 1,
  current_loop_verified: true,
  visible_to_player: true,
  carry_to_next_loop: true,
  tags: ["gray_passenger", "movement", "timeline"],
  contradicts: ["entry_gray_claim_stayed_connector"],
  supports: ["inf_gray_alibi_contradicted"]
}

// NPC 主张条目
{
  id: "entry_gray_claim_stayed_connector",
  public_clue_id: "claim_gray_stayed_connector",
  actor: "gray_passenger",
  time: null,
  time_range: ["14:00", "14:12"],
  location: "connector_2_3",
  action: "stayed",
  source_type: "claim",
  source_label: "灰衣乘客自述",
  speaker: "gray_passenger",
  reliability: "unknown",
  status: "claimed",
  loop_observed: 1,
  current_loop_verified: false,
  visible_to_player: true,
  carry_to_next_loop: true,
  tags: ["gray_passenger", "claim", "alibi"],
  contradicts: ["entry_gray_seen_passes_1404", "entry_gray_seen_enters_c3_1406"],
  supports: []
}

// 推理条目
{
  id: "entry_gray_alibi_contradicted",
  public_clue_id: "inf_gray_alibi_contradicted",
  actor: "gray_passenger",
  time: null,
  location: null,
  action: null,
  source_type: "inference",
  source_label: "玩家推理",
  reliability: "high",
  status: "verified",
  loop_observed: 1,
  current_loop_verified: true,
  visible_to_player: true,
  carry_to_next_loop: true,
  derived_from: ["entry_gray_claim_stayed_connector", "entry_gray_seen_passes_1404"],
  effect: {
    unlock_actions: ["action_confront_gray_movement"],
    contributes_to: "timeline_conflict"
  },
  tags: ["gray_passenger", "inference", "contradiction"]
}

// 记忆条目（失败继承后）
{
  id: "memory_gray_seen_passes_1404_l2",
  actor: "gray_passenger",
  time: "14:04",
  location: "carriage_2",
  action: "passed_through",
  source_type: "memory",
  source_label: "上一轮记忆",
  reliability: "high",
  status: "remembered",
  loop_observed: 1,
  current_loop_verified: false,
  counts_as_current_evidence: false,
  can_unlock_prepositioning: true,
  visible_to_player: true,
  carry_to_next_loop: true,
  tags: ["memory", "gray_passenger", "prepositioning"]
}
```

## 5. v0.10.0 MVP 内容对象（18-20 条）

### 物理/场景线索（4 条）

| id | 标题 | 来源 | 位置 |
|---|---|---|---|
| `clue_gray_note_warning` | 不要相信灰大衣 | 开场纸条 | — |
| `clue_ticking_under_floor` | 地板下方的滴答声 | 检查地板 | 二号车厢 |
| `clue_sound_not_from_seat` | 声音不来自座位下方 | 检查声音来源 | 二号车厢 |
| `clue_floor_panel_scratch` | 地板边缘有新划痕 | 检查连接处地板 | connector_2_3 |

### NPC 主张（5 条）

| id | 标题 | 来源 | 可信度 |
|---|---|---|---|
| `claim_gray_stayed_connector` | 灰衣声称一直在连接处 | 灰衣对话 | 未验证 |
| `claim_gray_denies_carriage3` | 灰衣否认去过三号车厢 | 质问灰衣（解锁后） | 可推翻 |
| `claim_xiaoning_stayed_carriage2` | 小宁说一直坐在二号车厢 | 小宁对话 | 未验证 |
| `claim_xiaoning_heard_ticking` | 小宁说自己听见过滴答声 | 小宁对话 | 部分可信 |
| `claim_zhao_needs_actionable_evidence` | 赵乘警要求可执行证据 | 赵乘警对话 | 可信 |

### 时间线观察（6 条）

| id | 时间 | 标题 | 位置 |
|---|---|---|---|
| `obs_xiaoning_returns_1402` | 14:02 | 小宁从三号车厢方向回来 | 二号车厢 |
| `obs_gray_checks_watch_1403` | 14:03 | 灰衣看表 | connector_2_3 |
| `obs_gray_passes_1404` | 14:04 | 灰衣经过二号车厢 | 二号车厢 |
| `obs_zhao_called_away_1405` | 14:05 | 赵乘警被叫走 | 二号车厢 |
| `obs_gray_enters_c3_1406` | 14:06 | 灰衣进入三号车厢方向 | connector_2_3 |
| `obs_metal_sound_1408` | 14:08 | 三号车厢方向金属碰撞声 | connector_2_3 |

### 推理线索（5 条）

| id | 标题 | 触发条件 | 效果 |
|---|---|---|---|
| `inf_xiaoning_statement_incomplete` | 小宁没有说出完整事实 | claim_xiaoning_stayed + obs_xiaoning_returns | 解锁温和追问 |
| `inf_gray_alibi_contradicted` | 灰衣不在场说法不成立 | claim_gray_stayed + obs_gray_passes | 解锁质问灰衣 |
| `inf_gray_denial_false` | 灰衣否认三号车厢说法不成立 | claim_gray_denies + obs_gray_enters | timeline_conflict +1 |
| `inf_gray_connected_to_c3_anomaly` | 灰衣与三号车厢异常有关 | obs_gray_enters + obs_metal_sound | suspect_route +1 |
| `inf_c3_needs_inspection` | 三号车厢/连接处需立即检查 | inf_gray_connected + clue_floor_panel_scratch | 解锁报告行动 + 成功路径D |

### v0.10.0 排除项

以下对象推迟到 v0.10.1 或 v0.11：
- `obs_gray_returns_1412`、`obs_zhao_near_connector_1410`、`obs_xiaoning_freezes_1409`
- `clue_tunnel_light_flicker`、`clue_metal_sound_carriage3`
- `claim_zhao_no_search_without_reason`、`claim_xiaoning_mother_nearby`
- 小宁母亲 runtime NPC

## 6. 世界真实时间线（16 个事件）

| 时间 | 事件 id | 角色 | 位置 | 真实事件 |
|---|---|---|---|---|
| 14:00 | evt_loop_start | 玩家 | 二号车厢 | 玩家醒来 |
| 14:00 | evt_xiaoning_at_seat | 小宁 | 二号车厢 | 小宁在座位附近 |
| 14:00 | evt_gray_near_door | 灰衣 | connector_2_3 | 灰衣在连接处靠二号车厢门口 |
| 14:01 | evt_xiaoning_slips | 小宁 | 二号车厢→连接处 | 小宁向三号车厢方向走去 |
| 14:02 | evt_xiaoning_returns | 小宁 | 连接处→二号车厢 | 小宁从三号车厢方向回来 |
| 14:03 | evt_zhao_patrols | 赵乘警 | 二号车厢 | 赵乘警例行经过 |
| 14:03 | evt_gray_checks_watch | 灰衣 | connector_2_3 | 灰衣看表 |
| 14:04 | evt_gray_passes | 灰衣 | 二号车厢 | 灰衣经过二号车厢前部 |
| 14:05 | evt_zhao_called_away | 赵乘警 | 二号车厢→前方 | 赵乘警被叫走 |
| 14:06 | evt_gray_enters_c3 | 灰衣 | connector_2_3→三号车厢 | 灰衣进入三号车厢方向 |
| 14:08 | evt_metal_sound | 场景 | 三号车厢方向 | 金属碰撞声 |
| 14:09 | evt_xiaoning_freezes | 小宁 | 二号车厢 | 小宁听到声音后僵住 |
| 14:10 | evt_zhao_returns | 赵乘警 | connector_2_3 附近 | 赵乘警回到附近 |
| 14:12 | evt_gray_returns | 灰衣 | 三号车厢→connector_2_3 | 灰衣回到连接处 |
| 14:13 | evt_tunnel_flicker | 场景 | 全车 | 灯光闪烁 |
| 14:14 | evt_ticking_accel | 场景 | 二/三号交界 | 滴答声加快 |
| 14:15 | evt_explosion | 场景 | 二/三号交界 | 爆炸 |

## 7. 观察行动系统

### 7.1 三种观察行动

| 行动 | AP | 时间 | 效果 | API 路由 |
|---|---|---|---|---|
| 观察当前场景 | 1 | 1min | 发现当前位置当前时间的事件 | POST /api/action/observe { type: "scene" } |
| 盯住NPC | 1 | 2min | 记录该 NPC 2 分钟内行动 | POST /api/action/observe { type: "npc", npc_id: "gray" } |
| 守点观察 | 1 | 2min | 记录该位置 2 分钟内事件 | POST /api/action/observe { type: "location", location: "connector_2_3" } |

### 7.2 观察结果结构

```js
{
  observation_result: {
    discovered: [
      {
        entry: { /* 完整时间线条目 */ },
        is_conflict_with: "entry_gray_claim_stayed_connector",  // 若存在冲突
        added_to_timeline: true,
        added_to_clues: true
      }
    ],
    nothing_found: false,
    conflict_detected: true,     // 新发现的条目与已有条目冲突
    clock_advanced: "14:05",
    ap_remaining: 9
  }
}
```

### 7.3 NPC 移出场景时的观察中断规则

当"盯住NPC"或"守点观察"期间 NPC 移出当前场景时：
- 记录 NPC 离开事件（"灰衣离开二号车厢，向连接处走去"）
- 不自动追踪到新场景
- 若玩家也想观察 NPC 在新场景的行动，需移动到新场景后重新观察

## 8. 其他行动 AP 调整

| 行动 | AP | 时间 | 备注 |
|---|---|---|---|
| 普通对话 | 2 | 2min | 从 3AP 下调 |
| 深度追问 | 2 | 2min | 质问、追问等解锁行动 |
| 报告赵乘警 | 2 | 2min | — |
| 检查物理异常 | 2 | 2min | 检查地板/声音来源/划痕 |
| 移动场景 | 1 | 1min | 不变 |

总 AP 保持 10。时间线路径 ~8AP，留 2AP 容错。

## 9. 矛盾检测与推理生成

### 9.1 detectConflicts(state)

遍历 `player_timeline.entries`，检查 `contradicts` 字段。若条目 A 的 `contradicts` 包含条目 B 的 id，且 B 也在 entries 中，则记录冲突对。

### 9.2 generateInference(state)

对每个冲突对，找到关联的推理条目。若推理条目的 `derived_from` 中的两个源条目都已获得，且推理条目尚未在 `player_timeline.inferences` 中，则生成推理条目并添加到 entries。

### 9.3 触发时机

- 每次 `addTimelineEntry()` 后
- 每次 `endDialogue()` 后
- 每次 `observeEnvironment()` 后

## 10. 通关路径 AP 经济

### 路径 1：原物理证据路径

```
检查地板 2AP → ticking_under_floor
检查声音来源 2AP → sound_not_from_seat + floor_panel_scratch（自动补充）
询问赵乘警 2AP → claim_zhao_needs_actionable_evidence
报告赵乘警 2AP → 成功
合计：8AP
```

### 路径 2：对话+时间线矛盾路径

```
询问灰衣 2AP → claim_gray_stayed_connector
观察二号车厢 1AP (14:04) → obs_gray_passes_1404
查看时间线 → inf_gray_alibi_contradicted
守连接处 1AP (14:06-14:08) → obs_gray_enters_c3_1406, obs_metal_sound_1408
检查连接处地板 2AP → clue_floor_panel_scratch
报告赵乘警 2AP → 成功
合计：8AP（含自动注入 police_context）
```

### 路径 3：纯观察跨轮路径

```
第1轮：观察二号车厢(1AP) + 观察连接处(1AP) → 部分观察 → 失败
第2轮：守连接处(1AP) → 补充观察 → 失败
第3轮：检查地板(2AP) + 报告赵乘警(2AP) → 成功
```

## 11. 系统指令

新增指令（零 AP，零时间）：

| 指令 | 触发词 | 效果 |
|---|---|---|
| 查看NPC时间线 | `查看NPC时间线` | 渲染所有 NPC 时间线概览 |
| 查看灰衣乘客时间线 | `查看灰衣乘客时间线` | 渲染灰衣时间线详细视图 |
| 查看小宁时间线 | `查看小宁时间线` | 渲染小宁时间线详细视图 |

需更新 `materials/runtime/commands/command-registry.json`。

## 12. 时间线 UI

5 种标签（不依赖颜色，必须同时显示文字标签）：

| 类型 | 颜色 | 标签 |
|---|---|---|
| 玩家观察 | 蓝色 | `[观察]` |
| NPC 自述 | 黄色 | `[自述]` |
| 推理结论 | 紫色 | `[推理]` |
| 上一轮记忆 | 灰色 | `[记忆]` |
| 矛盾标记 | 红色 | `[矛盾]` |

"本轮确认"条目加绿色左边框。

列表式展示，按 NPC 分组，手机竖屏优先。

## 13. 涉及文件变更

| 文件 | 变更类型 | 说明 |
|---|---|---|
| `looptrain/standalone/engine.js` | 重写线索相关函数 | 新增 player_timeline、observeEnvironment、detectConflicts、generateInference、evaluateEvidence、canConvinceZhao、carryTimelineToNextLoop；重写 suggestions、endDialogue、failLoop、nextLoop |
| `looptrain/standalone/server.js` | 新增路由 | POST /api/action/observe；修改 /api/session/init 返回值 |
| `looptrain/standalone/public/app.js` | 修改 | 观察行动 UI、时间线渲染、矛盾标记、新指令匹配 |
| `looptrain/standalone/public/style.css` | 修改 | 时间线 UI 样式（5 种颜色+标签） |
| `looptrain/materials/runtime/timeline/trial-timeline.json` | 重写 | 16 个世界事件 + 时间窗口 + 位置定义 |
| `looptrain/materials/runtime/clues/` | 重写 | 20 条线索数据（含 source_type / contradicts / supports / derived_from） |
| `looptrain/materials/runtime/characters/` | 修改 | NPC 对话模板更新（新增主张选项） |
| `looptrain/materials/runtime/commands/command-registry.json` | 修改 | 新增 3 条查看时间线指令 |
| `looptrain/tests/` | 新增 + 修改 | 新测试 + 更新现有 6 个引擎测试 |
| `looptrain/standalone/tests/e2e/` | 修改 | E2E 测试更新（新成功路径） |
| `docs/project/GAME_DESIGN.md` | 修改 | 更新线索系统描述 |
| `docs/project/ARCHITECTURE.md` | 修改 | 新增时间线系统架构 |

## 14. 验收标准

### AC-1: 数据层
- [ ] `trial-timeline.json` 含 16 个事件定义，每个事件含时间窗口和可观察位置
- [ ] 20 条线索/条目数据完整，含 source_type / contradicts / supports / derived_from 字段
- [ ] command-registry.json 含 3 条新时间线指令

### AC-2: Engine 层 — 观察行动
- [ ] `observeEnvironment({type: "scene"})` 消耗 1AP + 推进 1min，发现当前位置当前时间的事件
- [ ] `observeEnvironment({type: "npc", npc_id})` 消耗 1AP + 推进 2min，记录 NPC 行动
- [ ] `observeEnvironment({type: "location", location})` 消耗 1AP + 推进 2min，记录位置事件
- [ ] NPC 移出场景时观察中断，记录离开事件但不追踪

### AC-3: Engine 层 — 矛盾检测
- [ ] `detectConflicts()` 正确检测灰衣自述 vs 灰衣经过的矛盾
- [ ] `detectConflicts()` 正确检测小宁自述 vs 小宁返回的矛盾
- [ ] `generateInference()` 矛盾触发后自动生成推理线索
- [ ] 推理线索不重复生成（去重检查）

### AC-4: Engine 层 — 成功判定
- [ ] `evaluateEvidence()` 按映射表正确计分
- [ ] `canConvinceZhao()` 四条路径均可成功
- [ ] police_context 为 0 时 canConvinceZhao() 返回 false
- [ ] 首次报告赵乘警时若 police_context=0 自动注入 claim_zhao

### AC-5: Engine 层 — 失败继承
- [ ] `failLoop()` 继承 carry_to_next_loop=true 的 entries + inferences + known_clues
- [ ] 继承的 entry source_type 变为 "memory"，current_loop_verified 变为 false
- [ ] `nextLoop()` 继承的 known_clues 和 timeline entries 在新状态中恢复
- [ ] counts_as_current_evidence=false 的 memory 条目不算本轮证据
- [ ] can_unlock_prepositioning=true 的 memory 条目解锁守点类型行动提示

### AC-6: API 层
- [ ] POST /api/action/observe 返回 observation_result 结构
- [ ] 观察结果含 discovered / nothing_found / conflict_detected / clock_advanced / ap_remaining
- [ ] 矛盾提示在 observation_result.conflict_detected 中返回

### AC-7: UI 层
- [ ] suggestions 栏新增"观察当前场景"/"盯住NPC"/"守点观察"
- [ ] "查看NPC时间线"指令渲染时间线概览
- [ ] 时间线按 NPC 分组，5 种颜色+标签
- [ ] 矛盾条目红色标记
- [ ] 推理结论紫色标记
- [ ] 继承记忆灰色标记
- [ ] 本轮确认绿色边框

### AC-8: 测试
- [ ] 现有 6 个引擎测试全部通过（旧路径保留等价体验）
- [ ] 新增 `timeline_observation_test.js`
- [ ] 新增 `conflict_detection_test.js`
- [ ] 新增 `inference_generation_test.js`
- [ ] 新增 `evidence_scoring_test.js`
- [ ] 新增 `loop_inheritance_test.js`
- [ ] Playwright E2E 测试通过（三条路径各至少一条测试）
- [ ] 旧路径 E2E 测试通过（clue_floor_panel_scratch 自动补充）

### AC-9: 文档
- [ ] GAME_DESIGN.md 更新线索系统描述
- [ ] ARCHITECTURE.md 新增时间线系统架构
- [ ] PROJECT_STATUS.md 更新版本号

## 15. 风险

| 风险 | 程度 | 缓解 |
|---|---|---|
| 旧成功路径破坏 | HIGH | 保留等价体验，clue_floor_panel_scratch 在检查声音时自动补充 |
| known_clues 与 timeline 数据同步不一致 | MEDIUM | 通过 public_clue_id 严格同步，添加 entry 时自动写入 known_clues |
| 18-20 条内容 JSON 设计错误 | MEDIUM | 使用材料验证脚本校验 |
| 时间窗口错过导致卡关 | MEDIUM | 纯观察跨轮路径可恢复；下一轮重置可重试 |
| AP 经济平衡 | MEDIUM | 总 AP 10，路径 ~8AP，留 2AP 容错；实际可调 |
| E2E 测试全部需重写 | MEDIUM | 保留旧路径测试作为兼容性验证 |
| vanilla JS 数据结构维护 | LOW | 保持纯函数式风格，state 不可变 |

## 16. 向后兼容策略

- 旧 `countValidEvidence >= 2` 逻辑被 `canConvinceZhao()` 取代
- 旧路径（检查地板 + 检查声音来源 → 说服赵乘警）在 evidence_scoring 中等价可达成
- `clue_floor_panel_scratch` 在玩家检查声音来源时自动补充获取，不额外增加玩家操作
- `claim_zhao_needs_actionable_evidence` 在首次报告赵乘警时自动注入（若尚未获得）
- 旧 E2E 测试需更新以匹配新成功路径，但预期玩家体验等价
- localStorage 存档因 state 结构变化（新增 player_timeline）可能触发 breaking change 检测 → 由现有 SaveMeta 版本检测机制自动处理
