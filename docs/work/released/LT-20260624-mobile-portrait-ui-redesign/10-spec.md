# 10-spec.md — 手机竖版 UX/UI 重设计规格

**Work Item**: LT-20260624-mobile-portrait-ui-redesign
**版本级别**: minor
**版本号**: v0.11.0
**基于**: 00-idea.md + 前端代码全面审计（index.html / app.js / style.css / engine.js / server.js + TypeScript runtime 24 模块）

---

## 1. 目标（追溯 00-idea.md）

将 LoopTrain 的手机竖版 UI 从"功能堆叠的聊天界面"重构为"现场状态面板 + 行动反馈流 + 时间线调试器"。让玩家每一眼都知道当前局势，每一次点击都看到世界状态变化，每一轮循环都能对比自己改变了什么。

四阶段交付：
1. **P0 主界面重排**：三栏压缩为一栏 + 命令栏收进档案 + 目标卡结构化 + 行动按钮下移
2. **P1 统一行动结果卡**：所有行动后生成结构化 ActionResultCard
3. **P2 持续观察状态**：盯住/守点升级为持续状态 FocusWatchBar
4. **P3 档案抽屉化 + 时间线可视化**：统一档案入口 + 迷你时间线 + 跨轮对比

## 2. 非目标

不引入前端框架（Vue/React/Svelte）。不修改 engine.js 核心裁判逻辑。不修改 server.js API 路由签名。不做 LLM Bridge 接入。不做复杂可视化时间轴（SVG/Canvas）。不做玩家手动拖拽排序/编辑时间线。不做多结局复杂推理树 UI。不做立绘呼吸/眨眼等氛围动画。不做背景音乐系统改造。不改变存档系统。不做许知微判定交互 UI。不做失败复盘叙事动画。

## 3. 核心架构决策

### 3.1 布局模型：从 absolute 堆叠改为 flex 流式 + overlay

**当前问题**：`style.css` 中 7 个主要区域使用 `position: absolute`，12 层 z-index 堆叠，`padding-bottom: 120px` 魔法数字防止遮挡。

**新方案**：

```css
.lt-phone {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.lt-content { flex: 1; overflow-y: auto; }  /* 唯一滚动区 */
.lt-bottom  { flex-shrink: 0; }              /* 底部固定 */
```

仅以下元素使用 absolute 定位（overlay 性质）：
- `.lt-archive-sheet`（档案抽屉，从底部滑入）
- `.lt-dialogue-focus-sheet`（对话聚焦模式）
- `.lt-more-actions-sheet`（更多行动抽屉）
- `.lt-ng-overlay`（失败覆盖层）
- `.lt-intro-overlay`（开场覆盖层）
- `.lt-reset-overlay`（重置确认）
- `.lt-goal-feedback`（目标完成反馈卡）
- `.lt-toast` / `.lt-clue-badge`（临时提示）

### 3.2 渲染模型：从全量重渲染改为增量更新

**当前问题**：`app.js` `render()`（L87-186）每次行动后重建所有 DOM（topLeft/topRight/locationEl/sceneText/goalEl/npcWrap 的 innerHTML），导致 CSS 动画重置、性能浪费。

**新方案**：组件化渲染，每个组件有独立的 `update(state)` 方法，只更新变化的 DOM 片段：

```javascript
// 组件基类
class Component {
  constructor(el) { this.el = el; }
  update(state) { /* 子类实现 */ }
}

// 示例：StatusBar 只更新变化的字段
class StatusBar extends Component {
  update(state) {
    if (this._lastLoop !== state.loop) {
      this.el.querySelector('.loop').textContent = `第 ${state.loop} 轮`;
      this._lastLoop = state.loop;
    }
    if (this._lastClock !== state.clock) {
      this.el.querySelector('.clock').textContent = state.clock;
      this._lastClock = state.clock;
    }
    if (this._lastAp !== state.ap_remaining) {
      this.el.querySelector('.ap').textContent = `AP ${state.ap_remaining}`;
      this._lastAp = state.ap_remaining;
    }
  }
}
```

**保留**：`GameShell` 维护组件列表，每次 state 变化时调用所有组件的 `update(state)`。消息日志仍为 append-only。

### 3.3 EventFeed 替代聊天流

**当前问题**：所有行动结果通过 `appendMsg()` / `appendHtml()` 追加到 `.lt-log`，表现为普通聊天消息（4 种颜色区分），引擎的结构化数据被扁平化。

**新方案**：EventFeed 作为主反馈通道，接收结构化卡片而非纯文本：

```javascript
// EventFeed 管理 ActionResultCard 的插入
class EventFeed extends Component {
  appendCard(actionResult) {
    const card = new ActionResultCard(actionResult);
    this.el.appendChild(card.el);
    this.el.scrollTop = this.el.scrollHeight;
  }
  appendMessage(msg) {
    // 兼容：系统消息/NPC 对白仍以文本形式插入
  }
}
```

**与引擎的映射**：
- `res.messages[]` → `appendMessage()`（系统/NPC 文本）
- `res.observation_result` → `appendCard()`（观察结果卡）
- `res.dialogue_outcome` → `appendCard()`（对话摘要卡）
- `res.loop_failure_outcome` → 触发 NG overlay（不在 EventFeed 中）
- `res.goal.newlyCompleted` → `appendCard()`（目标推进卡）+ goal feedback 动画

### 3.4 ActionDock 推荐行动机制

**当前问题**：所有行动 chips 放在场景卡内（`app.js` L111-133），无优先级区分，拇指不可达。

**新方案**：ActionDock 固定在底部输入区上方，从 `state._suggestions` 选取 2-3 个推荐行动：

```javascript
class ActionDock extends Component {
  update(state) {
    const recommended = this.selectRecommended(state._suggestions, state);
    const more = this.selectMore(state._suggestions, state);
    this.renderRecommended(recommended);
    this.renderMoreCount(more.length);
  }
  
  selectRecommended(suggestions, state) {
    // 优先级：推理解锁行动 > 观察行动 > 对话 > 移动
    const sorted = suggestions
      .filter(s => !s.template.startsWith('__END_'))
      .map(s => this.classify(s, state))
      .sort((a, b) => a.priority - b.priority);
    return sorted.slice(0, 3);
  }
}
```

### 3.5 FocusWatchBar 持续观察状态

**当前问题**："盯住 NPC"是一次性观察按钮（`app.js` L556-571），点击后只返回一次结果。

**新方案**：前端维护 `focusWatch` 状态，时间推进时自动检查新观察条目：

```javascript
class FocusWatchBar extends Component {
  constructor(el) {
    super(el);
    this.focus = null;  // { type: 'npc'|'location', target: string }
  }

  startWatch(type, target) {
    this.focus = { type, target };
    this.show();
  }

  stopWatch() {
    this.focus = null;
    this.hide();
  }

  // 每次 state 变化时检查是否有新的观察条目
  update(state) {
    if (!this.focus) return;
    const newEntries = this.findNewObservationEntries(state);
    if (newEntries.length > 0) {
      this.eventFeed.appendCard(this.buildWatchCard(newEntries));
    }
  }

  findNewObservationEntries(state) {
    const entries = state.player_timeline.entries;
    return entries.filter(e =>
      e.source_type === 'observation' &&
      e.loop_observed === state.loop &&
      !this._shownEntryIds.has(e.id) &&
      this.matchesFocus(e)
    );
  }
}
```

**关键约束**：不修改 `engine.js`。FocusWatchBar 不自动调用 observe API。它在每次 state 变化后检查 `player_timeline.entries` 中是否有与 focus 目标匹配的新条目（由玩家其他行动间接触发的世界事件），有则生成观察卡片。

**避免双重消耗**：FocusWatchBar 的自动观察不消耗额外 AP — 它复用玩家已执行行动的时间推进结果。玩家主动点击"盯住"按钮时消耗 1 AP + 2 min 执行一次 `POST /api/action/observe`，之后 FocusWatchBar 持续追踪该 NPC 的后续行为。

## 4. 组件规格

### 4.1 组件树与职责

```
GameShell (根容器)
  ├─ StatusBar                 # 轮次/时间/AP + 音效按钮
  │   └─ TimelineMiniBar       # 迷你时间线进度条
  ├─ ObjectiveCard             # 当前目标 + 结构化进展
  ├─ SceneStateCard            # 位置/描述/NPC状态摘要
  ├─ FocusWatchBar             # 持续观察状态栏（条件显示）
  ├─ EventFeed                 # 行动反馈流
  │   ├─ ActionResultCard      # 行动结果卡
  │   ├─ ClueUnlockedCard      # 线索解锁卡
  │   ├─ TimelineChangeCard    # 时间线变化卡
  │   └─ DialogueSummaryCard   # 对话摘要卡
  ├─ ActionDock                # 底部行动区
  │   ├─ RecommendedActions    # 推荐行动（2-3个）
  │   └─ MoreActionsSheet      # 更多行动抽屉
  ├─ CommandInput              # 底部输入区
  ├─ ArchiveSheet (overlay)    # 档案抽屉
  ├─ DialogueFocusSheet (overlay) # 对话聚焦模式
  ├─ GoalFeedback (overlay)    # 目标完成反馈
  ├─ Toast (overlay)           # 临时提示
  ├─ ClueBadge (overlay)       # 线索徽章
  ├─ IntroOverlay (overlay)    # 开场覆盖层
  └─ NGOverlay (overlay)       # 失败覆盖层
```

### 4.2 StatusBar

**DOM 结构**：
```html
<div class="lt-status-bar">
  <span class="lt-status-loop">第 1 轮</span>
  <span class="lt-status-sep">·</span>
  <span class="lt-status-clock">14:00</span>
  <span class="lt-status-ap">AP 10</span>
  <button class="lt-audio-mute">🔊</button>
</div>
<div class="lt-timeline-mini">
  <span class="lt-tl-start">14:00</span>
  <div class="lt-tl-track">
    <div class="lt-tl-progress"></div>
    <div class="lt-tl-marker" style="left: 0%"></div>
  </div>
  <span class="lt-tl-end">14:15</span>
</div>
```

**数据映射**：
- `state.loop` → `.lt-status-loop`
- `state.clock` → `.lt-status-clock`
- `state.ap_remaining` → `.lt-status-ap`
- 进度条：`(parseTime(state.clock) - parseTime("14:00")) / (parseTime("14:15") - parseTime("14:00")) * 100%`
- 事件标记：`state.player_timeline.entries` 中 `loop_observed === state.loop` 的条目按时间位置放置 marker

**样式规格**：
- 高度：36px（状态栏）+ 20px（迷你时间线）= 56px 总高
- 字号：11px（状态栏）/ 10px（时间线标签）
- AP ≤ 3 时红色高亮

### 4.3 ObjectiveCard

**DOM 结构**：
```html
<div class="lt-objective-card">
  <div class="lt-objective-title">当前目标</div>
  <div class="lt-objective-text">证明二号车厢异常</div>
  <ul class="lt-objective-steps">
    <li class="lt-step lt-step-done">✓ 找到可疑证据</li>
    <li class="lt-step lt-step-pending">□ 说服赵乘警检查地板</li>
  </ul>
</div>
```

**数据映射**：
- `state._goalData.goals[0].title` → `.lt-objective-text`
- 步骤列表：从 `GoalEngineResult.activeGoals` 的 `completionCondition` 推导
  - 由于当前 GoalEngine 返回的是文字目标而非结构化步骤，v0.11.0 采用**前端硬编码步骤映射**：
    - 目标包含"证明" + "异常" → 步骤：找到可疑证据 / 说服赵乘警检查地板
    - 目标包含"证据已足够" → 步骤：✓ 找到证据 / ✓ 形成证据链 / □ 说服赵乘警
    - 目标包含"已完成" → 全部 ✓
  - 步骤完成状态从 `state.known_clues` 和 `state.flags.trial_success` 推导

**样式规格**：
- 卡片高度：自适应内容（~60-80px）
- 完成步骤：绿色 ✓ + 删除线
- 未完成步骤：灰色 □
- 标题：金色 15px weight 700

### 4.4 SceneStateCard

**DOM 结构**：
```html
<div class="lt-scene-card">
  <div class="lt-scene-location">二号车厢</div>
  <div class="lt-scene-text">列车中段，灯光昏黄。小宁抱着旧布娃娃坐在靠窗位置。</div>
  <div class="lt-scene-status">
    <div class="lt-status-line"><span class="lt-status-label">小宁</span> 紧张，频繁看向座位下方</div>
    <div class="lt-status-line"><span class="lt-status-label">赵乘警</span> 警惕，但暂未相信你</div>
    <div class="lt-status-line"><span class="lt-status-label">车厢地板</span> 未检查</div>
  </div>
</div>
```

**数据映射**：
- `SCENES[state.location].name` → `.lt-scene-location`
- `SCENES[state.location].text` + 记忆前缀 → `.lt-scene-text`
- NPC 状态摘要：从 `state.npc_states[npcId]` 映射为文字描述
  - trust < 30 → "不信任"
  - trust 30-60 → "警惕"
  - trust > 60 → "信任"
  - fear > 60 → "恐惧"
  - suspicion > 60 → "怀疑你"
- 场景状态（地板/声音等）：从 `state.flags` 映射

**与当前的区别**：移除 `.lt-visible-npcs`（NPC chips）和 `.lt-scene-chip`（移动 chips）和 `.lt-observe-chip`（观察 chips）。这些移到 ActionDock。

### 4.5 ActionResultCard（核心组件）

**DOM 结构**：
```html
<div class="lt-action-card lt-action-observe">
  <div class="lt-action-header">
    <span class="lt-action-time">14:01</span>
    <span class="lt-action-type">观察结果</span>
  </div>
  <div class="lt-action-title">你观察了二号车厢</div>
  <div class="lt-action-cost">消耗：1 AP / 1 分钟</div>
  <div class="lt-action-narrative">
    你注意到小宁一直避开你的目光，但她的右手始终按着布娃娃。
    当赵乘警经过时，她明显缩了一下。
  </div>
  <div class="lt-action-clues">
    <div class="lt-clue-line lt-clue-add">+ 小宁害怕赵乘警</div>
    <div class="lt-clue-line lt-clue-add">+ 小宁反复看向座位下方</div>
  </div>
  <div class="lt-action-unlocked">
    <span class="lt-unlock-label">解锁行动：</span>
    <button class="lt-unlock-btn">检查小宁座位下方</button>
    <button class="lt-unlock-btn">追问小宁</button>
  </div>
</div>
```

**数据映射**（从引擎响应到卡片）：

| 卡片字段 | 引擎数据源 | 映射逻辑 |
|---|---|---|
| time | `state.clock`（行动后） | 直接取值 |
| type | 行动类型推断 | observe→"观察结果", dialogue→"对话摘要", move→"移动", system→"系统" |
| title | 行动描述 | 从 suggestion.label 或玩家输入文本生成 |
| cost.ap | `prevAP - state.ap_remaining` | 差值计算 |
| cost.minutes | `parseTime(state.clock) - parseTime(prevClock)` | 差值计算 |
| narrative | `res.messages` 中 type='outcome' 的 text | 提取正文 |
| cluesAdded | `res.dialogue_outcome.clues_gained` 或观察发现的 `public_clue_id` | 映射为 `{id, title, source_type}` |
| npcStateChanges | `state.npc_states` 与前状态的差值 | 计算 trust/fear/suspicion 变化量 |
| objectiveChanges | `res.goal.newlyCompleted` | 映射为 `{goalId, title, completed: true}` |
| unlockedActions | `res.suggestions` 中新增的项 | 过滤出之前不存在的 suggestion |
| conflictDetected | `res.observation_result.conflict_detected` | 布尔值，true 时卡片显示红色矛盾标记 |

**卡片变体**：

| 变体 | class | 额外字段 | 触发条件 |
|---|---|---|---|
| 观察结果 | `.lt-action-observe` | discovered[] | observeEnvironment 响应 |
| 对话摘要 | `.lt-action-dialogue` | npcName, turnCount | endDialogue 响应 |
| 移动 | `.lt-action-move` | fromLocation, toLocation | location 变化 |
| 系统事件 | `.lt-action-system` | — | loop start, xu reminder |
| 线索解锁 | `.lt-action-clue` | clueId, sourceType, confidence | clue 新增时 |
| 时间线变化 | `.lt-action-timeline` | entry, contradicts[] | timeline 新条目或矛盾 |

**渲染规则**：
- 只显示有值的字段（无线索不显示 clues 区，无解锁不显示 unlocked 区）
- narrative 超过 3 行时折叠，点击展开
- unlocked actions 按钮可点击直接执行

### 4.6 ActionDock

**DOM 结构**：
```html
<div class="lt-action-dock">
  <div class="lt-action-recommended">
    <button class="lt-action-btn lt-btn-observe">观察当前场景</button>
    <button class="lt-action-btn lt-btn-dialogue">询问小宁</button>
    <button class="lt-action-btn lt-btn-move">前往连接处</button>
  </div>
  <button class="lt-action-more">更多行动 (5)</button>
</div>
```

**推荐行动选取规则**（优先级从高到低）：

| 优先级 | 类型 | 选取条件 | 按钮颜色 |
|---|---|---|---|
| 1 | 推理解锁 | `suggestion.template` 匹配 `unlocked_actions` | 金色 |
| 2 | 观察 | `suggestion.template` 以 `__OBSERVE_` 开头 | 蓝色 |
| 3 | 对话 | `suggestion.template` 匹配 NPC 对话触发 | 绿色 |
| 4 | 移动 | `suggestion.template` 匹配移动触发 | 灰蓝 |

默认显示前 3 个，不足 3 个时显示实际数量。超过 3 个的全部进入"更多行动"抽屉。

**更多行动抽屉**（MoreActionsSheet）：

```html
<div class="lt-more-actions-sheet lt-show">
  <div class="lt-more-header">
    <span>更多行动</span>
    <button class="lt-more-close">✕</button>
  </div>
  <div class="lt-more-section">
    <div class="lt-more-label">观察</div>
    <button class="lt-action-btn lt-btn-observe">盯住小宁</button>
    <button class="lt-action-btn lt-btn-observe">守连接处观察</button>
  </div>
  <div class="lt-more-section">
    <div class="lt-more-label">对话</div>
    <button class="lt-action-btn lt-btn-dialogue">询问许知微</button>
    <button class="lt-action-btn lt-btn-dialogue">提醒赵乘警</button>
  </div>
  <div class="lt-more-section">
    <div class="lt-more-label">移动</div>
    <button class="lt-action-btn lt-btn-move">返回二号车厢</button>
  </div>
  <div class="lt-more-section">
    <div class="lt-more-label">高风险</div>
    <button class="lt-action-btn lt-btn-danger">强行检查地板</button>
  </div>
</div>
```

**高风险行动确认**：

```html
<div class="lt-confirm-overlay">
  <div class="lt-confirm-card">
    <div class="lt-confirm-title">高风险行动</div>
    <div class="lt-confirm-body">
      你要直接提醒赵乘警检查地板。
      如果证据不足，他可能认为你精神异常，并降低信任。
    </div>
    <div class="lt-confirm-evidence">
      <div>当前可用证据：2 条</div>
      <div>缺少关键证据：地板异常</div>
    </div>
    <div class="lt-confirm-actions">
      <button class="lt-btn-cancel">取消</button>
      <button class="lt-btn-confirm">继续</button>
    </div>
  </div>
</div>
```

**高风险行动判定**：前端维护高风险行动模板列表（从 NPC suggestion 中标记 `high_risk: true` 或硬编码）：
- 提醒赵乘警（在证据不足时）
- 强行检查地板
- 抢走小宁布娃娃
- 公开喊有炸弹

### 4.7 FocusWatchBar

**DOM 结构**：
```html
<div class="lt-focus-watch">
  <div class="lt-focus-icon">👁</div>
  <div class="lt-focus-info">
    <div class="lt-focus-target">正在盯住：小宁</div>
    <div class="lt-focus-hint">持续观察中 · 下一次异常动作可能被捕捉</div>
  </div>
  <button class="lt-focus-stop">停止盯住</button>
</div>
```

**行为规格**：

| 事件 | 行为 |
|---|---|
| 点击"盯住小宁" | `FocusWatchBar.show({type:'npc', target:'xiaoning'})`，执行一次 `POST /api/action/observe {type:'npc', npc_id:'xiaoning'}` |
| 玩家执行其他行动 | `FocusWatchBar.update(state)` 检查 `player_timeline.entries` 是否有与 `xiaoning` 相关的新观察条目（`actor === 'xiaoning' && source_type === 'observation' && loop_observed === state.loop`） |
| 发现新条目 | 生成 `TimelineChangeCard` 插入 EventFeed |
| 点击"停止盯住" | `FocusWatchBar.hide()`，清除 focus 状态 |
| 对话模式开始 | `FocusWatchBar` 保持可见但暂停检查（对话期间不产生观察条目） |
| 循环失败 | `FocusWatchBar.hide()`（focus 不跨轮继承） |

**限制**：
- 同时只能有一个 focus（盯住一个 NPC 或守一个位置）
- focus 期间 ActionDock 推荐行动变为：等待 1 分钟 / 靠近目标 / 停止盯住
- focus 不消耗额外 AP（复用玩家其他行动的时间推进）

### 4.8 ArchiveSheet（档案抽屉）

**入口**：顶部 `[档案]` 按钮（替代当前 5 个命令栏按钮）

**DOM 结构**：
```html
<div class="lt-archive-sheet">
  <div class="lt-archive-header">
    <span>档案</span>
    <button class="lt-archive-close">✕</button>
  </div>
  <div class="lt-archive-tabs">
    <button class="lt-tab lt-active" data-tab="clues">线索</button>
    <button class="lt-tab" data-tab="characters">人物</button>
    <button class="lt-tab" data-tab="timeline">时间线</button>
    <button class="lt-tab" data-tab="memory">记忆</button>
  </div>
  <div class="lt-archive-content">
    <!-- 动态内容 -->
  </div>
</div>
```

**各 Tab 内容**：

| Tab | 数据源 | 展示方式 |
|---|---|---|
| 线索 | `state.known_clues` → `npcCache.clue_titles` | 按 `source_type` 分组（物理/主张/观察/推理），每条显示标题+来源+可信度 |
| 人物 | `state.npc_states` + `NPC_INFO` | 每个 NPC 一张卡：名字 + 立绘小图 + trust/fear/suspicion 数值条 + 已知信息 |
| 时间线 | `state.player_timeline.entries` | 按 NPC 分组列表，5 种颜色标签，矛盾红色标记，本轮确认绿色边框 |
| 记忆 | `state.carried_memory` + `player_timeline.entries` 中 `source_type='memory'` | 列表展示，灰色标签 |

### 4.9 DialogueFocusSheet（对话聚焦模式）

**当前问题**：对话面板（`.lt-dialogue-panel`）与场景卡同屏，`body.dialogue-active` 时场景卡缩为 80px/0.4 opacity，信息丢失。

**新方案**：对话聚焦模式为全屏覆盖（保留顶部状态栏），结束后生成摘要卡：

```html
<div class="lt-dialogue-focus lt-show">
  <div class="lt-df-header">
    <button class="lt-df-back">← 返回</button>
    <span class="lt-df-npc">小宁</span>
    <div class="lt-df-portrait"><!-- 64x88px 立绘 --></div>
  </div>
  <div class="lt-df-status">
    <span>紧张</span> · <span>信任低</span>
  </div>
  <div class="lt-df-log"><!-- 对话记录 --></div>
  <div class="lt-df-suggestions">
    <button>你刚才在看什么？</button>
    <button>你是不是知道地板下面有什么？</button>
    <button>别害怕，我不是乘警</button>
  </div>
  <button class="lt-df-end">结束对话</button>
</div>
```

**结束对话后**：生成 `DialogueSummaryCard` 插入 EventFeed：

```html
<div class="lt-action-card lt-action-dialogue">
  <div class="lt-action-header">
    <span class="lt-action-time">14:04</span>
    <span class="lt-action-type">对话摘要</span>
  </div>
  <div class="lt-action-title">你询问了小宁</div>
  <div class="lt-action-narrative">
    她没有直接回答，但在你提到"座位下面"时明显慌了。
  </div>
  <div class="lt-action-npc-changes">
    <div class="lt-change-line">小宁信任 +1</div>
    <div class="lt-change-line">小宁恐惧 +1</div>
  </div>
  <div class="lt-action-clues">
    <div class="lt-clue-line lt-clue-add">+ 小宁知道座位下方有东西</div>
  </div>
</div>
```

## 5. Runtime 影响

### 5.1 不修改 engine.js

本迭代不修改 `engine.js` 的任何函数。所有 UI 重设计通过前端层（`app.js` + `style.css` + 新增组件文件）实现。

### 5.2 不修改 server.js API

所有现有 API 路由保持不变。前端通过现有 API 获取数据，在前端层做字段映射和结构化渲染。

### 5.3 前端状态扩展

在 `state` 对象上新增前端专用字段（不发送到后端）：

```javascript
state._ui = {
  focusWatch: null,              // { type: 'npc'|'location', target: string } | null
  archiveTab: 'clues',          // 当前档案 Tab
  moreActionsOpen: false,       // 更多行动抽屉是否打开
  dialogueFocusActive: false,   // 对话聚焦模式是否激活
  eventFeedCards: [],           // EventFeed 中的卡片历史（用于重渲染）
  shownEntryIds: new Set(),     // 已展示过的时间线索目 ID（FocusWatchBar 去重）
}
```

### 5.4 存档兼容

`state._ui` 不持久化到 localStorage（`saveState()` 时排除 `_ui` 字段）。存档只保存引擎状态，UI 状态在页面加载时重置。

现有 `lt:save:runtime` 和 `lt:save:meta` 的 key 结构不变。因 `state` 结构无变化（仅新增 `_ui` 前端字段），不触发 breaking change 检测。

## 6. 数据结构设计

### 6.1 ActionResultCard 类型（前端专用）

```typescript
type ActionResultCard = {
  id: string                    // 唯一标识（前端生成）
  actionType: 'observe' | 'dialogue' | 'move' | 'high_risk' | 'system'
  title: string
  time: string                  // HH:MM
  cost: {
    ap: number
    minutes: number
  }
  narrative: string
  cluesAdded?: Array<{
    id: string
    title: string
    source_type: 'physical' | 'claim' | 'observation' | 'inference'
  }>
  npcStateChanges?: Array<{
    npcId: string
    npcName: string
    trust?: number              // 变化量（正负）
    fear?: number
    suspicion?: number
  }>
  objectiveChanges?: Array<{
    goalId: string
    title: string
    completed: boolean
  }>
  unlockedActions?: Array<{
    label: string
    template: string
    actionType: 'observe' | 'dialogue' | 'move' | 'high_risk'
  }>
  conflictDetected?: boolean
  timelineEvents?: Array<{
    entryId: string
    time: string
    actor: string
    action: string
    source_type: string
    contradicts: string[]
  }>
}
```

### 6.2 前端组件基类

```typescript
interface Component {
  el: HTMLElement
  update(state: GameState): void
  show?(): void
  hide?(): void
}

interface GameShell {
  components: Component[]
  state: GameState
  updateAll(state: GameState): void  // 调用所有组件的 update
}
```

### 6.3 高风险行动注册表（前端硬编码）

```javascript
const HIGH_RISK_ACTIONS = [
  { pattern: /提醒赵乘警|报告赵乘警|说服赵乘警/, label: '提醒赵乘警', requiresEvidence: true },
  { pattern: /强行检查|检查地板/, label: '强行检查地板', requiresEvidence: false },
  { pattern: /抢走|拿走.*布娃娃/, label: '抢走小宁布娃娃', requiresEvidence: false },
  { pattern: /喊|大声|公开.*炸弹/, label: '公开喊有炸弹', requiresEvidence: false },
]
```

## 7. UI 状态设计

### 7.1 状态转换图

```
                    ┌─────────┐
                    │  Intro  │ ← 首次进入
                    └────┬────┘
                         ↓
                ┌────────────────┐
                │    Explore     │ ← 默认状态
                │  (主界面四区)   │
                └───────┬────────┘
                        │
           ┌────────────┼────────────┐
           ↓            ↓            ↓
    ┌──────────┐ ┌──────────┐ ┌──────────┐
    │ Dialogue │ │ Archive  │ │ MoreAct  │
    │  Focus   │ │  Sheet   │ │  Sheet   │
    └────┬─────┘ └────┬─────┘ └────┬─────┘
         │            │            │
         ↓            ↓            ↓
    ┌──────────┐ ┌──────────┐ ┌──────────┐
    │ Dialogue │ │ Archive  │ │  More    │
    │ Summary  │ │  Close   │ │ Actions  │
    │  Card    │ │  → Exp   │ │ → Exp    │
    └────┬─────┘ └──────────┘ └──────────┘
         ↓
    ┌──────────┐
    │  Explore │
    └──────────┘

    任何状态 → NGOverlay (循环失败) → Explore (下一轮)
```

### 7.2 各状态的 UI 元素可见性

| UI 元素 | Explore | Dialogue Focus | Archive Sheet | More Actions | NG Overlay |
|---|---|---|---|---|---|
| StatusBar | ✓ | ✓ | ✓ | ✓ | ✗ |
| ObjectiveCard | ✓ | ✗ | ✗ | ✗ | ✗ |
| SceneStateCard | ✓ | ✗ | ✗ | ✗ | ✗ |
| FocusWatchBar | ✓(条件) | ✓(暂停) | ✗ | ✗ | ✗ |
| EventFeed | ✓ | ✗ | ✗ | ✗ | ✗ |
| ActionDock | ✓ | ✗ | ✗ | ✗ | ✗ |
| CommandInput | ✓ | ✓(对话模式) | ✗ | ✗ | ✗ |
| DialogueFocusSheet | ✗ | ✓ | ✗ | ✗ | ✗ |
| ArchiveSheet | ✗ | ✗ | ✓ | ✗ | ✗ |
| MoreActionsSheet | ✗ | ✗ | ✗ | ✓ | ✗ |
| NGOverlay | ✗ | ✗ | ✗ | ✗ | ✓ |

## 8. 指令系统影响

### 8.1 不新增系统指令

本迭代不新增引擎层指令。所有 UI 交互通过按钮/抽屉完成。

### 8.2 保留的文本指令

以下文本指令继续可用（兼容习惯玩家）：
- `查看线索` / `查看人物` / `查看记忆` / `查看时间线` → 打开 ArchiveSheet 对应 Tab
- `查看NPC时间线` / `查看灰衣乘客时间线` / `查看小宁时间线` → 打开 ArchiveSheet 时间线 Tab
- `结束对话` → 关闭 DialogueFocusSheet
- `查看状态` / `查看目标` → 在 EventFeed 中显示系统卡片

### 8.3 命令栏移除的影响

当前 `app.js` L277-283 从第 4 轮起隐藏命令栏（`display:none`）。新方案中命令栏被 ArchiveSheet 替代，ArchiveSheet 常驻可用（不随轮次隐藏）。

## 9. GoalEngine 影响

### 9.1 不修改 GoalEngine

GoalEngine 的 DSL 判定逻辑不变。`GoalDefinition`、`GoalInstanceState`、`GoalEngineResult` 类型不变。

### 9.2 ObjectiveCard 的步骤展示

当前 GoalEngine 返回 `GoalResult { goals: [{ title: string }] }` — 只有目标文字，无结构化步骤。

v0.11.0 采用**前端硬编码步骤映射**（见 4.3 节），不修改 GoalEngine。未来版本可扩展 GoalEngine 返回结构化步骤。

## 10. 兼容性与存档影响

### 10.1 存档兼容

- `state` 结构无变化（仅新增 `_ui` 前端字段，不持久化）
- `lt:save:runtime` 和 `lt:save:meta` 的 key 结构不变
- 不触发 breaking change 检测
- 旧存档可正常加载

### 10.2 API 兼容

- 所有 API 路由签名不变
- 请求/响应结构不变
- 前端通过现有 API 获取数据，在前端层做字段映射

### 10.3 测试兼容

- 现有 Playwright E2E 12 步回归测试需更新（DOM 结构变化）
- 引擎层测试（smoke_test.js + 6 个 engine tests）不受影响
- 新增前端组件测试

## 11. 验收标准

### AC-1: P0 主界面重排

- [ ] 顶部三栏（topbar + goal-bar + command-bar）压缩为一栏（StatusBar + TimelineMiniBar）
- [ ] StatusBar 显示：轮次 · 时间 · AP + 音效按钮
- [ ] TimelineMiniBar 显示 14:00→14:15 进度条，当前时间标记
- [ ] TimelineMiniBar 可点击展开本轮时间线
- [ ] ObjectiveCard 显示当前目标 + 结构化进展步骤（✓/□）
- [ ] SceneStateCard 显示位置 + 描述 + NPC 状态摘要
- [ ] SceneStateCard 不再包含 NPC chips / 移动 chips / 观察 chips
- [ ] ActionDock 固定在底部输入区上方
- [ ] ActionDock 默认显示 2-3 个推荐行动
- [ ] ActionDock 有"更多行动"按钮
- [ ] 命令栏 5 按钮被"档案"+"许知微"两个入口替代
- [ ] 重置移入右上角更多菜单

### AC-2: P1 统一行动结果卡

- [ ] 观察行动后生成 ActionResultCard（含时间/AP/叙述/发现/线索/解锁行动）
- [ ] 对话结束后生成 DialogueSummaryCard（含 NPC 状态变化/线索/目标推进）
- [ ] 移动行动后生成移动卡（含 from/to 位置）
- [ ] 新增线索时生成 ClueUnlockedCard
- [ ] 时间线矛盾检测时生成 TimelineChangeCard（含矛盾标记）
- [ ] 目标完成时生成目标推进卡
- [ ] EventFeed 按时间倒序排列卡片
- [ ] 卡片只显示有值的字段（无线索不显示 clues 区）
- [ ] 卡片中的解锁行动按钮可点击直接执行

### AC-3: P2 持续观察状态

- [ ] 点击"盯住 NPC"后 FocusWatchBar 出现在场景卡下方
- [ ] FocusWatchBar 显示当前关注对象 + 停止按钮
- [ ] 玩家执行其他行动时，FocusWatchBar 检查新观察条目
- [ ] 发现新条目时生成 TimelineChangeCard 插入 EventFeed
- [ ] 点击"停止盯住"后 FocusWatchBar 消失
- [ ] 同时只能有一个 focus
- [ ] focus 状态不跨轮继承（循环失败后清除）
- [ ] 对话模式期间 FocusWatchBar 暂停检查

### AC-4: P3 档案抽屉化 + 时间线可视化

- [ ] 点击"档案"按钮打开 ArchiveSheet 抽屉
- [ ] ArchiveSheet 有 4 个 Tab：线索/人物/时间线/记忆
- [ ] 线索 Tab 按 source_type 分组展示
- [ ] 人物 Tab 显示 NPC 状态数值条（trust/fear/suspicion）
- [ ] 时间线 Tab 按 NPC 分组，5 种颜色标签 + 矛盾红色标记 + 本轮确认绿色边框
- [ ] 记忆 Tab 显示跨轮继承的条目
- [ ] 点击"许知微"显示当前局势建议
- [ ] TimelineMiniBar 点击后展开本轮时间线
- [ ] 跨轮时间线对比视图（同时间点不同行为对比）

### AC-5: 视觉规范

- [ ] 金色仅用于主线目标/关键推进（不再用于 NPC chips/发送按钮等）
- [ ] 蓝色用于观察/信息
- [ ] 绿色用于线索/安全行动
- [ ] 红色用于危险/高风险/时间逼近（AP ≤ 3 红色高亮）
- [ ] 紫色用于推理结论
- [ ] 灰色用于不可用/已完成
- [ ] 场景标题 22px weight 700
- [ ] 正文 16px
- [ ] 按钮 15px weight 600
- [ ] 辅助文字 13px
- [ ] 所有可点击元素最小 44×44px

### AC-6: 高风险行动确认

- [ ] 高风险行动点击后弹出确认面板（非全屏 modal）
- [ ] 确认面板显示行动描述 + 风险提示 + 当前证据情况
- [ ] 提醒赵乘警在证据不足时需确认
- [ ] 强行检查地板/抢走布娃娃/公开喊有炸弹需确认
- [ ] 普通行动不弹确认

### AC-7: 更多行动抽屉

- [ ] 点击"更多行动"从底部弹出 MoreActionsSheet
- [ ] MoreActionsSheet 按类型分组（观察/对话/移动/高风险）
- [ ] 高风险行动在抽屉内以红色边框标记
- [ ] 点击抽屉外区域或 ✕ 关闭抽屉
- [ ] 抽屉内按钮可点击直接执行

### AC-8: 布局与性能

- [ ] 主布局使用 flex 流式（非 absolute 堆叠）
- [ ] 仅 overlay 类元素使用 absolute 定位
- [ ] `.lt-content` 为唯一滚动区
- [ ] 组件采用增量更新（不全量重建 innerHTML）
- [ ] 消息日志保持 append-only
- [ ] 无 z-index 冲突（overlay 层级清晰）

### AC-9: 测试

- [ ] 现有引擎测试全部通过（smoke_test.js + 6 个 engine tests）
- [ ] 现有 Playwright E2E 12 步测试更新后通过（DOM 选择器更新）
- [ ] 新增前端组件渲染测试（至少覆盖 ActionResultCard / ActionDock / FocusWatchBar / ArchiveSheet）
- [ ] `bash scripts/verify_slt.sh` 通过
- [ ] 手机端 390px 视口下布局正确

### AC-10: 文档

- [ ] PROJECT_STATUS.md 更新版本号至 v0.11.0
- [ ] ARCHITECTURE.md 新增前端组件架构描述
- [ ] UI.md 更新为 v0.11.0 布局描述

## 12. 风险

| 风险 | 程度 | 缓解 |
|---|---|---|
| vanilla JS 实现 12 个组件工作量大 | HIGH | 四阶段渐进式交付，每阶段可独立验证；P0 改动最小但体验提升最大 |
| 增量更新替代全量重渲染可能引入状态不一致 | MEDIUM | 保留全量重渲染作为 fallback；每个组件 update 方法做 dirty check |
| ObjectiveCard 步骤硬编码可能与 GoalEngine 文字不匹配 | MEDIUM | 硬编码映射覆盖当前 4 种目标文字；未来扩展 GoalEngine 返回结构化步骤 |
| FocusWatchBar 的自动观察逻辑边界复杂 | MEDIUM | 不自动调用 observe API，仅检查已有 timeline entries；限制为同时一个 focus |
| Playwright E2E 测试需全面更新 DOM 选择器 | MEDIUM | 先更新测试选择器再验证功能；保留文本指令作为兼容路径 |
| 高风险行动判定依赖前端硬编码 | LOW | v0.11.0 接受硬编码；未来可从 engine suggestion 返回 high_risk 标记 |
| TimelineMiniBar 事件标记在密集时间线上可能重叠 | LOW | 事件标记最小间距 8px；点击展开后显示完整列表 |
| 命令栏移除后老玩家习惯中断 | LOW | 文本指令保留可用；ArchiveSheet 入口位置明显 |

## 13. 涉及文件变更

| 文件 | 变更类型 | 说明 |
|---|---|---|
| `looptrain/standalone/public/index.html` | 重写 | 新 DOM 结构（四区布局 + overlay 容器） |
| `looptrain/standalone/public/app.js` | 重写 | 组件化渲染逻辑（12 个组件 + GameShell） |
| `looptrain/standalone/public/style.css` | 重写 | 新视觉系统（flex 布局 + 语义颜色 + 字号层级） |
| `looptrain/standalone/public/components/` | 新增 | 组件 JS 文件目录（每个组件一个文件） |
| `looptrain/standalone/public/portrait-intro.js` | 保留 | 立绘动画不变 |
| `looptrain/standalone/public/audio-manager.js` | 保留 | 音效系统不变 |
| `looptrain/standalone/engine.js` | 不修改 | Engine 逻辑不变 |
| `looptrain/standalone/server.js` | 不修改 | API 路由不变 |
| `looptrain/standalone/tests/smoke_test.js` | 不修改 | 引擎测试不变 |
| `looptrain/tests/` | 不修改 | 引擎测试不变 |
| `looptrain/standalone/tests/e2e/` | 修改 | Playwright E2E 选择器更新 |
| `docs/project/PROJECT_STATUS.md` | 修改 | 更新版本号 |
| `docs/project/ARCHITECTURE.md` | 修改 | 新增前端组件架构 |
| `docs/project/UI.md` | 修改 | 更新为 v0.11.0 布局 |

## 14. 向后兼容策略

- 现有 API 路由和响应结构完全不变
- 现有引擎测试和 E2E 测试的引擎层部分不受影响
- Playwright E2E 测试需更新 DOM 选择器（DOM 结构变化不可避免），但测试逻辑（游戏流程）不变
- 文本指令保留可用（`查看线索`/`查看时间线`/`结束对话`等）
- 存档兼容（state 结构无变化，`_ui` 字段不持久化）
- 旧版 UI.md 作为历史参考保留，新 UI 描述追加到同一文件
