# Plan: 新手阶段渐进解锁 UI 优化

**版本**: v0.11.1-newbie-ui-unlock
**关联 Spec**: `10-spec.md`
**日期**: 2026-06-25

---

## 1. 实施概览

| 项目 | 内容 |
|------|------|
| **目标** | 实现 UIStage 状态机驱动的渐进解锁 UI |
| **工期** | 3 天（前端 2 天 + 测试 1 天） |
| **风险** | 中（前端逻辑变更，不影响后端核心） |
| **依赖** | 无新依赖，继续使用 Vanilla JS + CSS3 |

---

## 2. 阶段划分

### Phase 1: 基础设施（Day 1 上午）
- 创建 `ui-stage.js` 状态机模块
- 创建 `assistant-hint.js` 提示生成器
- 修改 `server.js` 新增 `/api/ui-stage` 端点
- 修改 `index.html` 新增容器节点

### Phase 2: 核心组件（Day 1 下午 - Day 2）
- 修改 `app.js` 集成 UIStage 状态机
- 实现许知微提示卡渲染
- 实现 ActionDock 动态按钮数量
- 实现案件板 (CaseBoard) 渲染
- 修改 `style.css` 新增样式

### Phase 3: 交互优化（Day 2 下午）
- 实现加载状态动画
- 实现面板滑入/滑出动画
- 实现按钮点击反馈
- 添加安全区适配

### Phase 4: 测试与验收（Day 3）
- 编写单元测试
- 编写 E2E 测试
- 人工走查新手流程
- 修复 bug

---

## 3. 文件变更清单

### 3.1 新增文件（4个）

| 文件 | 大小估算 | 依赖 | 说明 |
|------|---------|------|------|
| `public/ui-stage.js` | ~80 行 | 无 | UIStage 枚举 + 阶段计算函数 |
| `public/assistant-hint.js` | ~120 行 | ui-stage.js | 提示内容模板 + 生成器 |
| `public/case-board.js` | ~100 行 | 无 | 案件板渲染逻辑 |
| `public/loading-state.js` | ~40 行 | 无 | 加载状态管理器 |

### 3.2 修改文件（4个）

| 文件 | 变更行数 | 核心变更 | 风险 |
|------|---------|---------|------|
| `public/app.js` | ~200 行 | 集成 UIStage、重构渲染逻辑、新增组件 | 高（主逻辑文件） |
| `public/style.css` | ~150 行 | 新增样式、动画、布局调整 | 中 |
| `public/index.html` | ~20 行 | 新增容器 div、引入新 JS 文件 | 低 |
| `server.js` | ~30 行 | 新增 `/api/ui-stage` 端点 | 低 |

### 3.3 测试文件（3个）

| 文件 | 类型 | 覆盖范围 |
|------|------|---------|
| `tests/ui-stage.test.js` | 单元测试 | 阶段转换边界条件 |
| `tests/assistant-hint.test.js` | 单元测试 | 提示内容生成逻辑 |
| `tests/e2e/newbie-flow.spec.js` | E2E | 完整新手流程 |

---

## 4. 详细实施步骤

### Step 1: 创建 UIStage 状态机 (`public/ui-stage.js`)

```javascript
'use strict';

const UIStage = {
  INTRO: 'intro',
  FIRST_OBSERVATION: 'first_observation',
  FIRST_DIALOGUE: 'first_dialogue',
  LOOP_MEMORY_INTRO: 'loop_memory_intro',
  CASEBOARD_INTRO: 'caseboard_intro',
  CONTRADICTION_INTRO: 'contradiction_intro',
  NORMAL_PLAY: 'normal_play'
};

function getUIStage(state) {
  if (!state) return UIStage.INTRO;
  
  const loop = state.loop || 1;
  const history = state.history || [];
  const clues = state.clues || [];
  const hasObservation = history.some(h => h.type === 'observe');
  const hasDialogue = history.some(h => h.type === 'dialogue');
  const hasContradiction = state.contradictions && state.contradictions.length > 0;
  
  if (loop >= 3 || (state.flags && state.flags.caseboard_seen)) {
    return hasContradiction ? UIStage.CONTRADICTION_INTRO : UIStage.NORMAL_PLAY;
  }
  
  if (loop === 2 && history.length === 0) return UIStage.LOOP_MEMORY_INTRO;
  if (loop === 2 && clues.length >= 3) return UIStage.CASEBOARD_INTRO;
  
  if (loop === 1) {
    if (hasDialogue) return UIStage.FIRST_DIALOGUE;
    if (hasObservation) return UIStage.FIRST_OBSERVATION;
    return UIStage.INTRO;
  }
  
  return UIStage.NORMAL_PLAY;
}

function getVisibleControls(stage) {
  const map = {
    [UIStage.INTRO]: ['status', 'scene', 'assistant', 'primary_action', 'settings'],
    [UIStage.FIRST_OBSERVATION]: ['status', 'scene', 'last_result', 'assistant', 'two_actions', 'settings'],
    [UIStage.FIRST_DIALOGUE]: ['dialogue_focus', 'recommended_questions', 'settings'],
    [UIStage.LOOP_MEMORY_INTRO]: ['status', 'scene', 'memory_hint', 'assistant', 'watch_action', 'settings'],
    [UIStage.CASEBOARD_INTRO]: ['caseboard_button', 'scene', 'assistant', 'actions', 'settings'],
    [UIStage.CONTRADICTION_INTRO]: ['assistant_verdict', 'caseboard_button', 'actions', 'settings'],
    [UIStage.NORMAL_PLAY]: ['status', 'scene', 'feed', 'action_dock', 'caseboard', 'settings', 'input']
  };
  return map[stage] || map[UIStage.NORMAL_PLAY];
}

module.exports = { UIStage, getUIStage, getVisibleControls };
```

**验收**: 单元测试覆盖所有阶段转换路径

---

### Step 2: 创建许知微提示生成器 (`public/assistant-hint.js`)

定义提示模板，根据 state 和 stage 返回对应提示内容。

**关键函数**:
- `generateHint(state, stage)` → 返回 `{speaker, text, recommendedActions}`
- `getIntroHint(state)` → 开场提示
- `getObservationHint(state)` → 观察后提示
- `getDialogueHint(state)` → 对话后提示
- `getMemoryHint(state)` → 循环记忆提示
- `getContradictionHint(state)` → 矛盾提示

**验收**: 每个阶段至少生成 1 个有效提示，推荐行动对应 engine 可用 action

---

### Step 3: 修改后端 API (`server.js`)

新增端点:
```javascript
app.get('/api/ui-stage', (req, res) => {
  const state = req.query.state ? JSON.parse(req.query.state) : engine.START_STATE;
  const stage = uiStage.getUIStage(state);
  res.json({
    stage,
    visible_controls: uiStage.getVisibleControls(stage),
    action_count: getActionCount(stage),
    assistant_hint: assistantHint.generateHint(state, stage)
  });
});
```

修改现有端点:
- `POST /api/session/init` → 响应新增 `ui_stage` 字段
- `POST /api/action/commit` → 响应新增 `ui_stage` 和 `assistant_hint` 字段

**验收**: API 测试通过，响应格式符合 spec

---

### Step 4: 重构主界面渲染 (`app.js`)

#### 4.1 初始化阶段
- 加载 `ui-stage.js` 和 `assistant-hint.js`
- 在 `initGame()` 中计算初始 UIStage
- 根据 UIStage 决定渲染哪些组件

#### 4.2 渲染逻辑调整
```javascript
function renderGame() {
  const stage = getUIStage(state);
  const visibleControls = getVisibleControls(stage);
  
  // 始终渲染
  statusBar.render(state);
  sceneStateCard.render(state);
  assistantHintCard.render(state, stage);
  
  // 条件渲染
  if (visibleControls.includes('action_dock')) {
    actionDock.render(state, stage);
  }
  
  if (visibleControls.includes('caseboard')) {
    caseboardButton.render(state);
  }
  
  // 隐藏非必要控件
  if (!visibleControls.includes('input')) {
    commandInput.hide();
  }
  
  //  etc...
}
```

#### 4.3 新增组件
- `AssistantHintCard`: 许知微提示卡
- `CaseboardButton`: 案件板入口按钮
- `LoadingState`: 加载状态遮罩

#### 4.4 按钮数量控制
```javascript
function getActionButtons(state, stage) {
  const allActions = engine.suggestions(state);
  const count = stage === 'intro' ? 1 : 
                stage === 'first_observation' ? 2 : 3;
  return allActions.slice(0, count);
}
```

**验收**: 浏览器审查确认各阶段显示正确数量的按钮和控件

---

### Step 5: 样式实现 (`style.css`)

#### 5.1 新增组件样式
```css
/* 许知微提示卡 */
.lt-assistant-hint { background: rgba(42, 37, 32, 0.9); border-left: 3px solid var(--lt-gold); border-radius: 10px; padding: 12px 14px; margin-bottom: 8px; }
.lt-assistant-avatar { width: 32px; height: 32px; border-radius: 50%; background: var(--lt-gold); }
.lt-assistant-text { font-size: 14px; line-height: 1.6; color: var(--lt-text); }
.lt-assistant-actions { display: flex; gap: 8px; margin-top: 8px; }

/* 案件板入口 */
.lt-caseboard-btn { background: rgba(201, 169, 110, 0.1); border: 1px solid var(--lt-gold); color: var(--lt-gold); }

/* 加载状态 */
.lt-loading { display: flex; align-items: center; justify-content: center; gap: 8px; }
.lt-loading-spinner { width: 16px; height: 16px; border: 2px solid var(--lt-border); border-top-color: var(--lt-gold); border-radius: 50%; animation: lt-spin 1s linear infinite; }
@keyframes lt-spin { to { transform: rotate(360deg); } }

/* 按钮加载态 */
.lt-btn-loading { opacity: 0.6; pointer-events: none; }
```

#### 5.2 动画效果
```css
/* 面板滑入 */
@keyframes lt-slide-up { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
.lt-panel-enter { animation: lt-slide-up 250ms cubic-bezier(0.4, 0, 0.2, 1); }

/* 按钮点击反馈 */
.lt-btn:active { transform: scale(0.96); transition: transform 150ms ease-out; }
```

**验收**: 动画流畅，无掉帧（Chrome DevTools Performance 面板验证）

---

### Step 6: 案件板实现 (`case-board.js`)

```javascript
function renderCaseBoard(state) {
  const facts = extractConfirmedFacts(state);
  const statements = extractNpcStatements(state);
  const pending = extractPendingQuestions(state);
  const contradictions = state.contradictions || [];
  
  return {
    confirmedFacts: facts,
    npcStatements: statements,
    pendingVerification: pending,
    contradictions: contradictions,
    nextSuggestions: generateSuggestions(state)
  };
}
```

**验收**: 案件板内容正确反映当前游戏状态

---

### Step 7: 加载状态 (`loading-state.js`)

```javascript
const LoadingState = {
  show: function(element) {
    element.classList.add('lt-btn-loading');
    element.innerHTML = '<span class="lt-loading-spinner"></span> 处理中...';
  },
  hide: function(element, originalText) {
    element.classList.remove('lt-btn-loading');
    element.textContent = originalText;
  }
};
```

**验收**: 按钮点击后 100ms 内显示加载态，响应返回后恢复

---

### Step 8: 测试编写

#### 8.1 单元测试 (`tests/ui-stage.test.js`)
```javascript
const assert = require('assert');
const { getUIStage, UIStage } = require('../public/ui-stage');

// 测试：第一轮无历史 → intro
assert.strictEqual(getUIStage({loop: 1, history: []}), UIStage.INTRO);

// 测试：第一轮有观察 → first_observation
assert.strictEqual(getUIStage({loop: 1, history: [{type: 'observe'}]}), UIStage.FIRST_OBSERVATION);

// 测试：第二轮 → loop_memory_intro
assert.strictEqual(getUIStage({loop: 2, history: []}), UIStage.LOOP_MEMORY_INTRO);

// 测试：第三轮 → normal_play
assert.strictEqual(getUIStage({loop: 3}), UIStage.NORMAL_PLAY);

console.log('✓ UIStage tests passed');
```

#### 8.2 E2E 测试 (`tests/e2e/newbie-flow.spec.js`)
- 测试：首屏只有 1 个按钮
- 测试：点击观察后显示 2 个按钮
- 测试：案件板入口在第三轮后显示
- 测试：许知微提示内容变化

**验收**: 所有测试通过

---

## 5. 回滚计划

若实施过程中出现严重问题：
1. **立即回滚**: `git checkout -- public/app.js public/style.css public/index.html server.js`
2. **保留新文件**: 新创建的 JS 文件不影响现有功能（未被引用时）
3. **数据兼容**: 不修改 localStorage 结构，存档数据不受影响
4. **验证回滚**: 运行 `bash scripts/verify_slt.sh` 确认恢复

---

## 6. 检查清单

### 实施前
- [ ] 备份当前 `public/` 和 `server.js`
- [ ] 确认 engine.js 不会被修改
- [ ] 准备测试数据（各阶段 state 快照）

### 实施中
- [ ] 每完成一个 Step 运行 `npm run check`
- [ ] 每修改一个文件运行 `lsp_diagnostics`
- [ ] 及时提交（小步提交）

### 实施后
- [ ] 运行完整测试套件 `npm test`
- [ ] 运行 E2E 测试 `npm run test:e2e`
- [ ] 人工走查新手流程（30秒/3分钟/失败/第二轮）
- [ ] 验证旧存档兼容性
- [ ] 运行 `bash scripts/verify_slt.sh`
- [ ] 更新文档（如需要）

---

## 7. 相关资源

- `00-idea.md` - 原始构想
- `10-spec.md` - 设计规格（含验收标准）
- `looptrain/standalone/AGENT.md` - Agent 工作协议
- `docs/project/GAME_DESIGN.md` - 游戏设计总览

---

*本计划是实施阶段的执行蓝图。如实际进度与计划偏差超过 20%，需更新本文件并说明原因。*
