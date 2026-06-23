---
status: accepted
type: feature
priority: P1
topic: npc-timeline-inference-system
created: 2026-06-22T00:00:00+08:00
updated: 2026-06-22T23:59:00+08:00
owner: shougou
target_release: v0.10.0
decision: accepted-for-spec
---

# LT-20260622 — NPC 时间线推理系统

## 背景

LoopTrain 当前试玩版最应该强化的不是"增加更多 NPC"，也不是"立即接入 LLM"，而是建立一套独特的 **NPC 时间线推理系统**。

当前线索系统存在三个核心问题：

1. **线索全部互补递进，无对抗关系**：8 条线索是协作设计的，玩家不需要判读"谁在撒谎"，收集即可推进。
2. **NPC 时间线是死数据**：`trial-timeline.json` 定义了 9 个时间线事件，但 `engine.js` 完全没有引用，玩家无法获取这些客观事实。
3. **无推理线索机制**：玩家只能被动收集线索，无法通过发现矛盾主动推理得出新结论，缺乏判读深度。

**核心问题**：线索无对抗 → 玩家不需要判读 → 时间线数据浪费 → 推理体验缺失。

### 核心差异点

```
普通互动叙事：和 NPC 对话，拿线索，推进剧情。
LoopTrain：观察 NPC 行动，构建时间线，用事实反证 NPC 的说法。
```

v0.10.0 的核心功能正式命名为 **NPC 时间线推理系统**。玩家通过观察、对话和跨轮记忆，构建每个 NPC 的行动时间线，并根据时间线矛盾推断谁在说谎。

## 用户决策（2026-06-22）

### 第一轮决策（Q1-Q7）

| # | 决策点 | 选择 | 理由 |
|---|---|---|---|
| Q1 | 现有 8 条线索处理 | C — 推倒重设计，时间线作为线索 | 现有线索互补设计无法承载对抗体验 |
| Q2 | 对抗范围 | D — 灰衣主动撒谎 + 小宁隐瞒 | 两种对抗模式（谎言 vs 隐瞒），不破坏成功路径 |
| Q3 | 时间线线索获取机制 | D — 观察行动 + 场景触发 + 时间窗口 | AP 消耗制造策略压力，时间窗口制造紧迫感 |
| Q4 | 线索关系系统深度 | B — conflicts_with + supports | 矛盾 + 支持链，不做派生（留给后续） |
| Q5 | 推理线索生成方式 | B — 固定判定结论预写，矛盾自动生成 | 第一版固定简单，许知微交互下迭代做 |
| Q6 | 推理线索影响 | D — 算有效证据 + 解锁新行动 | 推理既加速成功又开辟新路径 |
| Q7 | 失败继承 | C — 基础/时间线/推理线索继承，判定结果清空 | 推理成果不白费，但每轮需重新判定 |

### 第二轮决策（Q8-Q13，基于 spec draft 升级）

| # | 决策点 | 选择 | 理由 |
|---|---|---|---|
| Q8 | 许知微话术是否纳入本迭代 | B — 下迭代做 | 许知微交互下迭代统一做 |
| Q9 | trial-timeline.json 事件数 | 16 个世界事件 | 扩展时间线覆盖所有 NPC 行动 |
| Q10 | 三种观察行动 AP/时间消耗 | 确认（观察场景 1AP/1min，盯住NPC 1AP/2min，守点观察 1AP/2min） | 以后可调整 |
| Q11 | 原路径门槛提高 | 有意提高，三条路径都需要 actionable_location | 太简单就没有推理体验 |
| Q12 | 小宁母亲 | 彩蛋，有触发条件，不影响剧情 | 解释小宁隐瞒动机，不新增主线复杂度 |
| Q13 | 版本号 | v0.10.0 | 新增系统模块，minor 级别 |

### 方向升级

基于 spec draft 讨论，设计方向从"线索系统重构"升级为"NPC 时间线推理系统"：
- 核心数据结构从 CLUE_DETAILS 扩展升级为 **PlayerConstructedTimeline**（玩家构建的时间线）
- 时间线事件从 5 条扩展为 **16 个世界事件 + 11 条观察条目**
- 观察行动从 1 种扩展为 **3 种**（观察场景/盯住NPC/守点观察）
- 成功条件从 countValidEvidence >= 2 升级为 **多维证据评分 canConvinceZhao()**
- 内容对象从 15 条扩展为 **24 条**（6 物理 + 7 主张 + 11 观察 + 7 推理）
- 新增"查看NPC时间线"系统指令（零 AP）
- 新增小宁母亲隐藏 NPC（彩蛋）

## 目标

### 核心目标

把 LoopTrain 的核心玩法确立为 **NPC 时间线推理**。玩家通过观察 NPC 行动、记录场景事件、询问 NPC 得到主张、对比事实和自述、发现时间线矛盾、推断谁在说谎或隐瞒，利用循环重新验证关键时间点。

### 具体目标

1. 推倒重设计 24 条内容对象（6 物理 + 7 主张 + 11 观察 + 7 推理）
2. 将 `trial-timeline.json` 更新为 16 个世界事件
3. 新增 PlayerConstructedTimeline 数据结构（玩家构建的时间线，非上帝视角）
4. 新增 3 种观察行动（观察场景/盯住NPC/守点观察）
5. 新增"查看NPC时间线"系统指令（零 AP，零时间消耗）
6. 建立时间线矛盾检测 + 推理线索自动生成
7. 实现多维证据评分 `canConvinceZhao()`（5 个证据维度）
8. 三条通关路径（原物理证据 / 对话+时间线矛盾 / 纯观察跨轮）
9. 失败继承：观察/矛盾/推理/时间线继承，current_loop_verified 清空
10. 时间线 UI（颜色 + 标签 + 按 NPC 分组 + 矛盾标记）
11. 小宁母亲作为彩蛋 NPC（有触发条件，不影响剧情）
12. 数据结构预留许知微判定接口

### 非目标

- 不做许知微判定交互 UI（下迭代）
- 不做许知微时间线整理话术（Q8=B，下迭代）
- 不做许知微行动推荐器（TODO 8 搁置）
- 不做失败复盘叙事（TODO 9 搁置）
- 不做 LLM Bridge 接入（TODO 10/11 搁置）
- 不做复杂可视化时间轴（后续版本）
- 不做玩家手动拖拽排序/编辑时间线
- 不做多结局复杂推理树
- 不做 LLM 动态生成时间线解释
- 不做判定推翻逻辑（下迭代）

## 初步设计

### 1. 试玩版故事真相边界

v0.10.0 只需完成第一阶段目标：在 14:15 爆炸前，说服赵乘警相信列车存在真实危险，并引导他检查关键位置。

真相定义：
1. 爆炸危险真实存在
2. 异常源与三号车厢 / 二号车厢地板下方有关
3. 灰衣乘客确实隐瞒了自己的行动轨迹
4. 灰衣乘客在 14:04-14:12 之间多次接近三号车厢
5. 小宁不是坏人，但因恐惧和保护母亲而隐瞒了自己去过三号车厢附近
6. 赵乘警不是反派，他只是需要可执行证据
7. 许知微不是事实裁决者，只负责帮助玩家整理时间线和发现矛盾

**边界**：灰衣乘客是关键嫌疑人，但 v0.10.0 不直接确认他是最终幕后主使，保留正式版后续反转空间。

### 2. 玩法铁律

- **时间线不是系统赠送的**：系统内部有真实世界时间线，但玩家看到的是 PlayerConstructedTimeline（自己拼出来的）
- **观察产生事实，但事实不等于结论**：看到灰衣 14:04 经过二号车厢 ≠ 灰衣是凶手
- **对话产生主张，但主张可能为假**：灰衣说"没动过"是自述，必须标记为"未验证"
- **推理来自时间线冲突，而不是线索数量**：不再用"收集 2 条线索 → 成功"
- **循环的价值是重新验证关键时间点**：上一轮记忆可继承但不直接变成本轮证据，玩家可提前守点重新观察

### 3. 世界真实时间线（16 个事件）

| 时间 | 事件 id | 角色 | 位置 | 真实事件 |
|---|---|---|---|---|
| 14:00 | evt_loop_start | 玩家 | 二号车厢 | 玩家醒来，循环开始 |
| 14:00 | evt_xiaoning_at_seat | 小宁 | 二号车厢 | 小宁在座位附近，明显紧张 |
| 14:00 | evt_gray_near_front_door | 灰衣 | 二号车厢前端 | 灰衣在车门附近观察车厢 |
| 14:01 | evt_xiaoning_slips_to_connector | 小宁 | 二号车厢→连接处 | 小宁趁混乱向三号车厢方向走去 |
| 14:02 | evt_xiaoning_returns_from_carriage3 | 小宁 | 连接处→二号车厢 | 小宁从三号车厢方向回来，神情紧张 |
| 14:03 | evt_zhao_patrols_carriage2 | 赵乘警 | 二号车厢 | 赵乘警例行经过，没有发现异常 |
| 14:03 | evt_gray_checks_watch | 灰衣 | 二号车厢前端 | 灰衣看表，等待时机 |
| 14:04 | evt_gray_passes_carriage2 | 灰衣 | 二号车厢 | 灰衣经过二号车厢，走向连接处 |
| 14:05 | evt_zhao_called_away | 赵乘警 | 二号车厢→前方 | 赵乘警被其他乘客叫走，暂时离开 |
| 14:06 | evt_gray_enters_carriage3 | 灰衣 | 连接处→三号车厢 | 灰衣进入三号车厢 |
| 14:08 | evt_metal_sound_carriage3 | 场景 | 三号车厢 | 三号车厢方向传来短促金属碰撞声 |
| 14:09 | evt_xiaoning_freezes | 小宁 | 二号车厢 | 小宁听到声音后明显僵住 |
| 14:10 | evt_zhao_returns_near_connector | 赵乘警 | 连接处附近 | 赵乘警回到附近，但没有掌握证据 |
| 14:12 | evt_gray_returns_carriage2 | 灰衣 | 三号车厢→二号车厢 | 灰衣回到二号车厢，表现镇定 |
| 14:13 | evt_tunnel_light_flicker | 场景 | 全车 | 列车进入山洞，灯光闪烁 |
| 14:14 | evt_ticking_accelerates | 场景 | 二号/三号交界 | 滴答声加快，但容易被列车噪音掩盖 |
| 14:15 | evt_explosion | 场景 | 二号/三号交界 | 爆炸发生，循环失败 |

### 4. 时间线条目数据结构

```js
// 玩家观察条目
{
  id: "entry_gray_seen_passes_1404",
  actor: "gray_passenger",
  time: "14:04",
  time_range: null,
  location: "carriage_2",
  action: "passed_through",
  source_type: "observation",      // observation / claim / inference / memory
  source_label: "玩家观察",
  source_id: "obs_gray_passes_1404",
  reliability: "high",             // high / unknown / low
  status: "verified",              // verified / claimed / remembered / unverified
  loop_observed: 1,
  current_loop_verified: true,     // 跨轮继承时变为 false，重新观察后变回 true
  visible_to_player: true,
  tags: ["gray_passenger", "movement", "timeline"],
  contradicts: ["entry_gray_claim_stayed_connector"],
  supports: ["inf_gray_alibi_contradicted"]
}

// NPC 主张条目
{
  id: "entry_gray_claim_stayed_connector",
  actor: "gray_passenger",
  time: null,
  time_range: ["14:00", "14:12"],
  location: "connector",
  action: "stayed",
  source_type: "claim",
  source_label: "灰衣乘客自述",
  source_id: "claim_gray_stayed_connector",
  speaker: "gray_passenger",
  reliability: "unknown",
  status: "claimed",
  loop_observed: 1,
  current_loop_verified: false,
  visible_to_player: true,
  tags: ["gray_passenger", "claim", "alibi"],
  contradicts: ["entry_gray_seen_passes_1404", "entry_gray_seen_enters_c3_1406", "entry_gray_seen_returns_1412"],
  supports: []
}

// 跨轮记忆条目
{
  id: "memory_gray_seen_passes_1404_loop1",
  actor: "gray_passenger",
  time: "14:04",
  location: "carriage_2",
  action: "passed_through",
  source_type: "memory",
  source_label: "上一轮记忆",
  source_id: "obs_gray_passes_1404",
  reliability: "high",
  status: "remembered",
  loop_observed: 1,
  current_loop_verified: false,        // 继承时为 false
  counts_as_current_evidence: false,   // 记忆不算本轮证据
  can_unlock_prepositioning: true,     // 允许玩家提前守点
  visible_to_player: true,
  tags: ["memory", "gray_passenger", "prepositioning"]
}
```

### 5. 三种观察行动

| 行动 | AP | 时间 | 效果 |
|---|---|---|---|
| 观察当前场景 | 1 | 1min | 发现当前位置当前时间的事件 |
| 盯住NPC | 1 | 2min | 记录该 NPC 2 分钟内的行动（可能错过其他位置事件） |
| 守点观察 | 1 | 2min | 记录该位置 2 分钟内经过的事件（循环玩法的核心动作） |

### 6. 线索总表（24 条）

#### 物理/场景线索（6 条）

| id | 标题 | 来源 | 类型 |
|---|---|---|---|
| clue_gray_note_warning | 不要相信灰大衣 | 开场纸条 | memory/physical |
| clue_ticking_under_floor | 地板下方的滴答声 | 检查地板 | physical |
| clue_sound_not_from_seat | 声音不来自座位下方 | 检查声音来源 | physical |
| clue_floor_panel_scratch | 地板边缘有新划痕 | 检查二/三号交界 | physical |
| clue_metal_sound_carriage3 | 三号车厢方向的金属声 | 场景观察 | observation |
| clue_tunnel_light_flicker | 山洞中灯光闪烁 | 场景观察 | environment |

#### NPC 主张线索（7 条）

| id | 标题 | 来源 | 可信度 |
|---|---|---|---|
| claim_xiaoning_stayed_carriage2 | 小宁说自己一直坐在二号车厢 | 小宁对话 | 未验证 |
| claim_xiaoning_heard_ticking | 小宁说自己听见过滴答声 | 小宁对话 | 部分可信 |
| claim_xiaoning_mother_nearby | 小宁迟疑提到妈妈在那边 | 小宁追问 | 未验证 |
| claim_gray_stayed_connector | 灰衣声称自己一直在连接处 | 灰衣对话 | 未验证 |
| claim_gray_denies_carriage3 | 灰衣否认去过三号车厢 | 灰衣追问 | 可被观察推翻 |
| claim_zhao_needs_actionable_evidence | 赵乘警要求可执行证据 | 赵乘警对话 | 可信 |
| claim_zhao_no_search_without_reason | 赵乘警不能无理由搜查 | 赵乘警对话 | 可信 |

#### 观察时间线线索（11 条）

| id | 时间 | 标题 | 位置 |
|---|---|---|---|
| obs_xiaoning_leaves_1401 | 14:01 | 小宁向连接处走去 | 二号车厢 |
| obs_xiaoning_returns_1402 | 14:02 | 小宁从三号车厢方向回来 | 二号车厢 |
| obs_zhao_patrols_1403 | 14:03 | 赵乘警经过二号车厢 | 二号车厢 |
| obs_gray_checks_watch_1403 | 14:03 | 灰衣看表 | 二号车厢 |
| obs_gray_passes_1404 | 14:04 | 灰衣经过二号车厢 | 二号车厢 |
| obs_zhao_called_away_1405 | 14:05 | 赵乘警被叫走 | 二号车厢 |
| obs_gray_enters_c3_1406 | 14:06 | 灰衣进入三号车厢 | 连接处 |
| obs_metal_sound_1408 | 14:08 | 三号车厢传来金属碰撞声 | 连接处/三号车厢门口 |
| obs_xiaoning_freezes_1409 | 14:09 | 小宁听见声音后僵住 | 二号车厢 |
| obs_zhao_near_connector_1410 | 14:10 | 赵乘警回到连接处附近 | 连接处 |
| obs_gray_returns_1412 | 14:12 | 灰衣回到二号车厢 | 二号车厢 |

#### 推理线索（7 条）

| id | 标题 | 触发条件 | 效果 |
|---|---|---|---|
| inf_xiaoning_statement_incomplete | 小宁没有说出完整事实 | claim_xiaoning_stayed_carriage2 + obs_xiaoning_returns_1402 | 解锁追问小宁 |
| inf_gray_alibi_contradicted | 灰衣的不在场说法不成立 | claim_gray_stayed_connector + obs_gray_passes_1404 | 解锁质问灰衣/报告赵乘警 |
| inf_gray_denial_false | 灰衣否认去三号车厢的说法不成立 | claim_gray_denies_carriage3 + obs_gray_enters_c3_1406 | 强化灰衣嫌疑 |
| inf_gray_connected_to_c3_anomaly | 灰衣与三号车厢异常有关 | obs_gray_enters_c3_1406 + obs_metal_sound_1408 | 解锁检查三号车厢/报告赵乘警 |
| inf_xiaoning_knows_c3 | 小宁可能知道三号车厢发生了什么 | inf_xiaoning_statement_incomplete + obs_xiaoning_freezes_1409 | 解锁温和追问小宁 |
| inf_zhao_missed_gray_movement | 赵乘警错过了灰衣关键行动 | obs_zhao_called_away_1405 + obs_gray_enters_c3_1406 | 解释为什么必须由玩家提供证据 |
| inf_c3_needs_inspection | 三号车厢需要立即检查 | inf_gray_connected_to_c3_anomaly + clue_floor_panel_scratch 或 clue_ticking_under_floor | 满足成功条件之一 |

### 7. 多维证据评分 + 成功条件

5 个证据维度：
- physical_anomaly：物理异常证据
- timeline_conflict：时间线矛盾
- suspect_route：嫌疑人路线
- actionable_location：可执行检查位置
- police_context：赵乘警程序要求

三条成功路径：

```js
function canConvinceZhao(state) {
  // 原路径：物理证据充分（门槛已提高，需 actionable_location）
  if (physical_anomaly >= 2 && actionable_location >= 1) return true;

  // 时间线推理路径：物理异常 + 时间线矛盾 + 嫌疑人路线 + 可执行位置
  if (physical_anomaly >= 1 && timeline_conflict >= 1
      && suspect_route >= 1 && actionable_location >= 1) return true;

  // 纯观察路径：完整观察灰衣路线 + 三号车厢异常 + 可执行位置
  if (known("obs_gray_passes_1404") && known("obs_gray_enters_c3_1406")
      && known("obs_metal_sound_1408") && actionable_location >= 1) return true;

  return false;
}
```

### 8. 三条核心通关路径

**路径 1 — 原观察证据路径**（门槛已提高）：
```
检查地板 → clue_ticking_under_floor
检查声音来源 → clue_sound_not_from_seat
检查地板划痕 → clue_floor_panel_scratch  ← 新增必需
询问赵乘警 → claim_zhao_needs_actionable_evidence
报告赵乘警 → 成功
```

**路径 2 — 对话+时间线矛盾路径**：
```
询问灰衣 → claim_gray_stayed_connector
观察二号车厢 14:04 → obs_gray_passes_1404
查看灰衣时间线 → 发现矛盾
生成 inf_gray_alibi_contradicted
守连接处 14:06 → obs_gray_enters_c3_1406
观察 14:08 → obs_metal_sound_1408
生成 inf_gray_connected_to_c3_anomaly
检查地板划痕 → clue_floor_panel_scratch
报告赵乘警 → 成功
```

**路径 3 — 纯观察跨轮路径**（高级玩法）：
```
第一轮：观察二号车厢 → obs_xiaoning_returns_1402, obs_gray_passes_1404
  → 失败，但继承记忆
第二轮：守连接处 → obs_gray_enters_c3_1406, obs_metal_sound_1408
  → 失败，但继承记忆
第三轮：提前检查三号车厢/地板划痕 → clue_floor_panel_scratch
  查看灰衣时间线 → 发现完整异常路线
  报告赵乘警 → 成功
```

### 9. 失败继承设计

继承：
- 观察过的时间点（转为 memory 类型，current_loop_verified = false）
- 已发现的矛盾
- 已形成的推理
- 许知微整理过的时间线

不继承：
- 本轮已验证状态（current_loop_verified 变为 false）
- 赵乘警是否相信
- 灰衣当前轮是否被质问
- 小宁当前轮是否信任玩家

**循环的核心价值**：上一轮记得 14:04 灰衣会经过二号车厢 → 下一轮玩家可以提前守在那里重新观察 → 获得本轮有效证据。

### 10. 时间线 UI 设计

颜色与标签（不只依赖颜色，必须同时显示文字标签）：

| 类型 | 颜色 | 标签 |
|---|---|---|
| 玩家观察 | 蓝色 | [观察] |
| NPC 自述 | 黄色 | [自述] |
| 他人证词 | 橙色 | [证词] |
| 推理结论 | 紫色 | [推理] |
| 上一轮记忆 | 灰色 | [记忆] |
| 当前矛盾 | 红色 | [矛盾] |
| 本轮已验证 | 绿色边框 | [本轮确认] |

### 11. 系统指令

新增"查看NPC时间线"指令（零 AP，零时间消耗）：
- `查看NPC时间线` — 显示所有 NPC 时间线概览
- `查看小宁时间线` / `查看灰衣乘客时间线` / `查看赵乘警时间线` — 显示单个 NPC 时间线

原因：这是整理玩家已知信息，不是角色在世界中行动。

### 12. 小宁母亲（彩蛋 NPC）

定位：小宁隐瞒动机的来源，解释小宁为什么不敢说完整事实。

- 不作为 v0.10.0 必需通关条件
- 有触发条件（玩家在特定时间观察三号车厢方向可看到她）
- 不新增主线复杂度
- 时间线条目：entry_mother_seen_c3（14:06-14:10 观察可见）

### 13. 判定预留（下迭代接口）

本迭代数据结构预留许知微判定接口：

| 下迭代许知微做什么 | 本迭代已预留 |
|---|---|
| 检测到矛盾，主动发起对话 | 矛盾检测已实现 |
| 展示判定选项让玩家选 | verdict_options 预写 |
| 玩家选择后生成推理线索 | derived_inference 预写 |
| 记录玩家判定 | default_verdict 字段 |
| 允许推翻重判 | reversible 字段 |

## 风险

| 风险 | 程度 | 缓解 |
|---|---|---|
| 推倒重设计破坏现有成功路径 | HIGH | 保留原路径（物理证据），门槛提高但不阻断 |
| 24 条内容对象设计量大 | MEDIUM | 分批设计，先灰衣线再小宁线再赵乘警线 |
| 时间窗口逻辑让玩家错过关键线索 | MEDIUM | 下一轮可重试；纯观察路径需跨轮才能成功 |
| 三种观察行动 AP 平衡 | MEDIUM | Q10 确认以后可调整 |
| PlayerConstructedTimeline 数据结构复杂 | MEDIUM | 先实现核心字段，彩蛋字段（can_unlock_prepositioning）后续迭代 |
| 时间线 UI 在手机竖屏上的展示 | MEDIUM | 按 NPC 分组，列表式展示，不做可视化时间轴 |
| 多维证据评分调参 | LOW | 三条路径 AP 经济验证可达 |

## 版本级别

minor — 新增系统模块（NPC 时间线推理系统、PlayerConstructedTimeline、3 种观察行动、多维证据评分）

版本号：`v0.10.0`

## 讨论记录

- 2026-06-22（第一轮）：完成 7 轮澄清问答（Q1-Q7），用户确认全部决策。设计按 Section 1-5 完整展示，用户确认整体评审通过，要求作为 idea 按项目规范保存。版本号确认为 v0.10.0。
- 2026-06-22（第二轮）：用户提供完整 spec draft（NPC 时间线推理系统设计稿，18 章节），设计方向从"线索系统重构"升级为"NPC 时间线推理系统"。完成 6 轮补充澄清问答（Q8-Q13），用户确认：许知微话术下迭代（Q8=B）、16 个世界事件（Q9）、三种观察行动确认（Q10）、有意提高原路径门槛（Q11）、小宁母亲彩蛋（Q12）、v0.10.0（Q13）。重写 00-idea.md 反映升级后的设计方向。
