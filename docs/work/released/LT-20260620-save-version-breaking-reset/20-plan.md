# Plan: 存档版本检测与 Breaking Change 强制重置

> 基于 `10-spec.md` 生成。回答：具体怎么改？改哪些文件？分几步？怎么验证？

## 1. 实施范围

- **前端存档层完全重做主 key 体系**：从单 key `looptrain.standalone.v1` 迁移到 `lt:save:meta` + `lt:save:runtime` 双 key 架构。
- **新增版本检测引导**：`init()` 流程中插入旧数据扫描 → 强制重置 / 兼容存档恢复 三条路径。
- **新增重置模态框 UI**：匹配现有 `.lt-ng` 卡片样式，仅一个主按钮，不可点遮罩关闭。
- **音频设置迁移**：`AudioManager` 的 `looptrain.audio.muted` 迁移到 `lt:settings`。
- **手动重置三路径**：UI 按钮（「重新开始试玩版」）、URL 参数（`?reset=1`）、控制台命令（`window.LT_RESET()`）。
- **IndexedDB 旧库清理**：启动时异步删除 `LoopTrainDB`、`LoopTrainRuntimeDB`、`LoopTrainMemoryDB`。
- **引擎测试更新**：smoke_test.js 新增存档版本检测测试。

## 2. 文件变更清单

| File | Action | Purpose | AC Mapping |
|------|--------|---------|------------|
| `looptrain/standalone/public/app.js` | MODIFY | 新增版本常量、saveMeta/runtime 读写、旧数据扫描、版本检测分支、重置模态逻辑、URL 参数处理、`window.LT_RESET()`、清理函数、IndexedDB 清理 | AC-1~14 |
| `looptrain/standalone/public/index.html` | MODIFY | 新增 `.lt-reset-overlay` 模态框 DOM 结构；新增「重新开始试玩版」按钮在命令栏 | AC-2, AC-3, AC-6, AC-13 |
| `looptrain/standalone/public/style.css` | MODIFY | 新增 `.lt-reset-overlay` / `.lt-reset-card` / `.lt-reset-title` / `.lt-reset-body` / `.lt-reset-btn` 样式，匹配现有 `.lt-ng-card` 设计系统 | AC-2, AC-3, AC-13 |
| `looptrain/standalone/public/audio-manager.js` | MODIFY | `readMuted()` / `writeMuted()` 改为从 `lt:settings` 读写；启动时迁移旧 key → 新 key | AC-9, AC-14 |
| `looptrain/standalone/tests/smoke_test.js` | MODIFY | 新增存档版本检测相关测试（SaveMeta 结构验证、legacy key 检测逻辑、clearLtKeys 不删非 lt: key） | AC-8, AC-9, AC-11 |
| `looptrain/standalone/engine.js` | MODIFY | `resetGame` 命令的 `executeCommand` 分支行为无需改动但确认其返回 `normalize(START_STATE)` 的一致性 | AC-12 |

## 3. 数据结构变更

### 3.1 localStorage Key 体系（旧 → 新）

| 旧 Key | 新 Key | 读写方 | 说明 |
|--------|--------|--------|------|
| `looptrain.standalone.v1` | `lt:save:runtime` | `saveState()` / `loadState()` | 全量 state JSON |
| （无） | `lt:save:meta` | `saveSaveMeta()` / `loadSaveMeta()` | 存档版本元数据 |
| `looptrain.audio.muted` | `lt:settings` | `AudioManager.readMuted()` / `writeMuted()` | 用户静音偏好 |
| （无） | `lt:legacy:<timestamp>` | `archiveLegacyData()` | 归档旧数据（只写） |
| （无） | `lt:save:memory` | 预留—不实现 | MemoryRuntime 状态（后续 IndexedDB 迁移） |
| （无） | `lt:save:goals` | 预留—不实现 | GoalEngine 状态（后续 IndexedDB 迁移） |

### 3.2 SaveMeta 结构（写入 `lt:save:meta`）

```js
// 写入 localStorage 时为 JSON.stringify(meta)
const SaveMeta = {
  appId: 'looptrain',
  saveSchemaVersion: 1,           // LT_SAVE_SCHEMA_VERSION
  runtimeVersion: '0.8.0',        // LT_RUNTIME_VERSION
  storyVersion: 'demo-0.8-handeng', // LT_STORY_VERSION
  createdAt: '2026-06-20T...',    // new Date().toISOString()
  updatedAt: '2026-06-20T...',    // 每次 saveState() 时更新
};
```

### 3.3 Settings 结构（写入 `lt:settings`）

```js
{ muted: true }  // 或 { muted: false }
```

### 3.4 版本常量（定义在 `app.js` 顶部，第 6 行之后）

```js
const LT_SAVE_SCHEMA_VERSION = 1;
const LT_MIN_COMPATIBLE_SCHEMA_VERSION = 1;
const LT_RUNTIME_VERSION = '0.8.0';
const LT_STORY_VERSION = 'demo-0.8-handeng';
```

## 4. Runtime 改造步骤

### Step 4.1：新增版本常量（app.js 第 6 行之后）

在 `'use strict';` 注释块之后、`const API_BASE` 之前插入：

```js
const LT_SAVE_SCHEMA_VERSION = 1;
const LT_MIN_COMPATIBLE_SCHEMA_VERSION = 1;
const LT_RUNTIME_VERSION = '0.8.0';
const LT_STORY_VERSION = 'demo-0.8-handeng';
const LT_KEY_PREFIX = 'lt:';
const LT_SAVE_META_KEY = 'lt:save:meta';
const LT_SAVE_RUNTIME_KEY = 'lt:save:runtime';
const LT_SETTINGS_KEY = 'lt:settings';
```

**依赖**：无，纯常量声明。

### Step 4.2：重写 `saveState()`（替换 app.js 第 632–633 行）

**当前**：
```js
const STORAGE_KEY = 'looptrain.standalone.v1';
function saveState() { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (_) {} }
```

**改为**：
```js
function saveState() {
  try {
    localStorage.setItem(LT_SAVE_RUNTIME_KEY, JSON.stringify(state));
  } catch (_) {}
  saveSaveMeta();
}

function saveSaveMeta() {
  try {
    const now = new Date().toISOString();
    const existing = loadSaveMeta();
    const meta = {
      appId: 'looptrain',
      saveSchemaVersion: LT_SAVE_SCHEMA_VERSION,
      runtimeVersion: LT_RUNTIME_VERSION,
      storyVersion: LT_STORY_VERSION,
      createdAt: (existing && existing.createdAt) || now,
      updatedAt: now,
    };
    localStorage.setItem(LT_SAVE_META_KEY, JSON.stringify(meta));
  } catch (_) {}
}
```

**依赖**：Step 4.1（常量） → 先于 Step 4.3。

### Step 4.3：新增 `loadSaveMeta()`（插入在 `saveSaveMeta()` 之后）

```js
function loadSaveMeta() {
  try {
    const raw = localStorage.getItem(LT_SAVE_META_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (_) { return null; }
}
```

**依赖**：Step 4.1（常量）。

### Step 4.4：新增 `detectLegacyKeys()`（插入在 `loadSaveMeta()` 之后）

扫描所有 `localStorage` key，返回需要触发重置的 key 列表：

```js
function detectLegacyKeys() {
  const legacy = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key === 'looptrain.standalone.v1') {
        // 检查是否已有新存档覆盖（双重保险）
        if (!localStorage.getItem(LT_SAVE_META_KEY)) {
          legacy.push(key);
        }
      }
    }
  } catch (_) {}
  return legacy;
}
```

**依赖**：Step 4.1（常量）。

### Step 4.5：新增 `archiveLegacyData()`（插入在 `detectLegacyKeys()` 之后）

```js
function archiveLegacyData(legacyKeys) {
  const ts = Date.now();
  legacyKeys.forEach(function (key) {
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        localStorage.setItem('lt:legacy:' + ts, raw);
      }
      localStorage.removeItem(key);
    } catch (e) {
      console.warn('[LT] Failed to archive legacy key:', key, e);
    }
  });
}
```

**依赖**：Step 4.4（调用方传入 legacyKeys）。

### Step 4.6：新增 `clearLtKeys()`（插入在 `archiveLegacyData()` 之后）

清除所有 `lt:` 前缀 key，但排除 `lt:legacy:` 和 `lt:settings`：

```js
function clearLtKeys() {
  try {
    const toRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith(LT_KEY_PREFIX) &&
          !key.startsWith('lt:legacy:') &&
          key !== LT_SETTINGS_KEY) {
        toRemove.push(key);
      }
    }
    toRemove.forEach(function (key) { localStorage.removeItem(key); });
  } catch (_) {}
}
```

**依赖**：Step 4.1（常量）。

### Step 4.7：新增 `clearOldIndexedDBs()`（插入在 `clearLtKeys()` 之后）

异步删除旧版 IndexedDB 数据库，不阻塞启动：

```js
function clearOldIndexedDBs() {
  if (!window.indexedDB || !window.indexedDB.deleteDatabase) return;
  var OLD_DBS = ['LoopTrainDB', 'LoopTrainRuntimeDB', 'LoopTrainMemoryDB'];
  OLD_DBS.forEach(function (dbName) {
    try {
      var req = window.indexedDB.deleteDatabase(dbName);
      req.onsuccess = function () { console.log('[LT] Deleted old IndexedDB:', dbName); };
      req.onerror = function () { console.warn('[LT] Failed to delete old IndexedDB:', dbName); };
      req.onblocked = function () { console.warn('[LT] IndexedDB deletion blocked:', dbName); };
    } catch (e) {
      console.warn('[LT] IndexedDB deleteDatabase threw:', dbName, e);
    }
  });
}
```

**依赖**：无。

### Step 4.8：新增 `initNewSave()`（插入在 `clearOldIndexedDBs()` 之后）

创建新版初始存档（基于 `START_STATE`）：

```js
function initNewSave() {
  state = clone(START_STATE);
  state.flags.intro_seen = false;
  saveState(); // 写入 lt:save:runtime + lt:save:meta
  prevAudioState = null;
}
```

**依赖**：Step 4.2（`saveSaveMeta` 已存在）。

### Step 4.9：新增 `showResetModal()` / `hideResetModal()`（插入在 `initNewSave()` 之后）

```js
function showResetModal(reason) {
  // reason: 'legacy' | 'incompatible'
  var overlay = document.getElementById('lt-reset-modal');
  if (!overlay) return;
  var bodyEl = overlay.querySelector('.lt-reset-body');
  if (bodyEl) {
    if (reason === 'legacy') {
      bodyEl.textContent = '《寒灯初醒》试玩是一次全面重构，剧情、人物和游戏系统都已更新。旧存档无法兼容，需要重新开始。\n\n你的旧进度已保留在浏览器中，不会丢失（开发侧留档）。';
    } else {
      bodyEl.textContent = '检测到旧版本存档（剧情版本不匹配）。新版试玩已重构，需要重新开始。\n\n你的旧进度已保留在浏览器中，不会丢失。';
    }
  }
  overlay.style.display = 'flex';
  // 隐藏 intro overlay，避免重叠
  introLayer.classList.remove('lt-show');
  contentEl.style.display = 'none';
  bottomEl.style.display = 'none';
}

function hideResetModal() {
  var overlay = document.getElementById('lt-reset-modal');
  if (overlay) overlay.style.display = 'none';
}
```

**依赖**：Step 5.1（HTML 元素已存在）。

### Step 4.10：新增 `handleReset()`（插入在 `hideResetModal()` 之后）

统一的强制重置入口，归档旧数据 → 清除 → 重建：

```js
function handleReset() {
  var legacyKeys = detectLegacyKeys();
  if (legacyKeys.length) archiveLegacyData(legacyKeys);
  clearLtKeys();
  initNewSave();
  // 迁移音频设置到 lt:settings（如果尚未迁移）
  try {
    var oldMuted = localStorage.getItem('looptrain.audio.muted');
    if (oldMuted === 'true' || oldMuted === 'false') {
      AudioManager.setMuted(oldMuted === 'true'); // 这会写入 lt:settings
    }
  } catch (_) {}
  hideResetModal();
  // 显示 intro overlay
  introLayer.classList.add('lt-show');
  state.flags.intro_seen = false;
  contentEl.style.display = 'none';
  bottomEl.style.display = 'none';
  logEl.innerHTML = '';
  dialogueLog.innerHTML = '';
  ngLayer.classList.remove('lt-show');
  if (portraitLayer) portraitLayer.classList.remove('lt-show');
  dialoguePanel.classList.remove('lt-show');
  latestMsg.classList.remove('lt-show');
  inputEl.value = '';
  autoSizeInput();
  render();
}
```

**依赖**：Step 4.4, 4.5, 4.6, 4.8, 4.9；Step 5.2（按钮绑定）。

### Step 4.11：新增 `window.LT_RESET()`（插入在 `handleReset()` 之后）

```js
window.LT_RESET = function () {
  var legacyKeys = detectLegacyKeys();
  if (legacyKeys.length) archiveLegacyData(legacyKeys);
  clearLtKeys();
  location.reload();
};
```

**依赖**：Step 4.4, 4.5, 4.6。

### Step 4.12：改造 `loadState()`（替换 app.js 第 634–639 行）

**当前**（第 634–639 行）：
```js
function loadState() {
  try { const raw = localStorage.getItem(STORAGE_KEY); if (raw) state = JSON.parse(raw); } catch (_) {}
  if (!state) { state = clone(START_STATE); return; }
  if (state.mode === 'dialogue') { state.mode = 'explore'; state.active_npc = null; }
  if (!state._goalData && state._goal) state._goalData = state._goal;
}
```

**改为**：
```js
function loadState() {
  try {
    var raw = localStorage.getItem(LT_SAVE_RUNTIME_KEY);
    if (raw) state = JSON.parse(raw);
  } catch (_) {}
  if (!state) { state = clone(START_STATE); return; }
  // 安全修复：对话中断后重新进入探索模式
  if (state.mode === 'dialogue') { state.mode = 'explore'; state.active_npc = null; }
  // 兼容旧存档：_goal 不存在时从 _goalData 补
  if (!state._goalData && state._goal) state._goalData = state._goal;
  if (!state._goal && state._goalData) state._goal = state._goalData;
}
```

**依赖**：Step 4.1（常量 `LT_SAVE_RUNTIME_KEY`）。

**AC 映射**：AC-4（兼容存档正常恢复）。

### Step 4.13：改造 `init()` 函数（替换 app.js 第 755–758 行中 `loadState()` 之后部分）

**当前**（第 755–758 行）：
```js
async function init() {
  await bootContent();
  await AudioManager.init();
  loadState();
  render();
```

**改为**：
```js
async function init() {
  await bootContent();
  await AudioManager.init();

  // ── Audio settings migration ──
  migrateAudioSettings();

  // ── Save bootstrap: version detection ──
  var urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('reset') === '1') {
    // AC-5: ?reset=1 → force reset → clean URL
    handleReset();
    if (window.history && window.history.replaceState) {
      var cleanUrl = window.location.pathname;
      window.history.replaceState(null, '', cleanUrl);
    }
  } else {
    var meta = loadSaveMeta();
    var legacyKeys = detectLegacyKeys();

    if (legacyKeys.length > 0) {
      // AC-2: 旧 key 存在且无新 meta → 弹模态框
      showResetModal('legacy');
    } else if (meta) {
      // AC-3: 版本不兼容检测
      if (meta.storyVersion !== LT_STORY_VERSION ||
          meta.saveSchemaVersion < LT_MIN_COMPATIBLE_SCHEMA_VERSION) {
        showResetModal('incompatible');
      } else {
        // AC-4: 兼容存档 → 正常恢复
        loadState();
        render();
      }
    } else {
      // AC-1: 新玩家 → 创建新版存档
      initNewSave();
      render();
    }
  }

  // ── IndexedDB cleanup (async, non-blocking) ──
  clearOldIndexedDBs();
```

同时在 `init()` 函数内、`AudioManager.init()` 之后插入 `migrateAudioSettings()` 的定义（作为模块级函数）：

```js
function migrateAudioSettings() {
  try {
    var oldMuted = localStorage.getItem('looptrain.audio.muted');
    if (oldMuted === 'true' || oldMuted === 'false') {
      var settings = { muted: oldMuted === 'true' };
      localStorage.setItem(LT_SETTINGS_KEY, JSON.stringify(settings));
    }
  } catch (_) {}
}
```

**依赖**：Step 4.2–4.11 全部完成。

**AC 映射**：AC-1, AC-2, AC-3, AC-4, AC-5, AC-10, AC-14。

### Step 4.14：改造 `resetGame()` 函数（替换 app.js 第 453–470 行）

**当前**（第 453–470 行）：
```js
async function resetGame() {
  PortraitIntro.reset();
  lastFailure = null;
  state = clone(START_STATE);
  state.flags.intro_seen = false;
  logEl.innerHTML = '';
  ...
  render();
}
```

**改为**（调用 `handleReset()` 完成统一路径）：
```js
async function resetGame() {
  PortraitIntro.reset();
  lastFailure = null;
  // 清除 LT 存档 → 重建 → 展示 intro
  var legacyKeys = detectLegacyKeys();
  if (legacyKeys.length) archiveLegacyData(legacyKeys);
  clearLtKeys();
  initNewSave();
  state.flags.intro_seen = false;
  logEl.innerHTML = '';
  dialogueLog.innerHTML = '';
  ngLayer.classList.remove('lt-show');
  if (portraitLayer) portraitLayer.classList.remove('lt-show');
  dialoguePanel.classList.remove('lt-show');
  logDrawer.classList.remove('lt-show');
  latestMsg.classList.remove('lt-show');
  document.activeElement?.blur();
  inputEl.value = '';
  autoSizeInput();
  appendMsg('system', APP_STRINGS.resetToast || '已重置试玩版。开场背景将重新显示。', logEl);
  render();
}
```

**依赖**：Step 4.4, 4.5, 4.6, 4.8。

**AC 映射**：AC-12（重置后与全新玩家一致）。

## 5. UI 改造步骤

### Step 5.1：新增重置模态框 HTML（index.html）

在 `index.html` 中、`<!-- Failure overlay -->` 之后、`<!-- Intro overlay -->` 之前插入：

```html
<!-- Reset modal (version-incompatible / legacy data detected) -->
<div id="lt-reset-modal" class="lt-reset-overlay" style="display:none">
  <div class="lt-reset-card">
    <h2 class="lt-reset-title">新版试玩已重构</h2>
    <p class="lt-reset-body"></p>
    <button id="lt-reset-confirm" class="lt-reset-btn">重新开始</button>
  </div>
</div>
```

**位置**：在第 87 行 `.lt-ng` 的 `</div>` 之后、第 90 行 `.lt-intro` 之前。

**依赖**：Step 5.3（CSS 样式）。

### Step 5.2：添加重置事件绑定（在 `init()` 的事件绑定区，第 763 行 mute toggle 之后）

```js
// 重置模态框按钮（AC-2, AC-3）
var resetConfirm = document.getElementById('lt-reset-confirm');
if (resetConfirm) {
  resetConfirm.addEventListener('click', function () {
    var legacyKeys = detectLegacyKeys();
    if (legacyKeys.length) archiveLegacyData(legacyKeys);
    clearLtKeys();
    initNewSave();
    hideResetModal();
    introLayer.classList.add('lt-show');
    state.flags.intro_seen = false;
    contentEl.style.display = 'none';
    bottomEl.style.display = 'none';
    logEl.innerHTML = '';
    dialogueLog.innerHTML = '';
    ngLayer.classList.remove('lt-show');
    if (portraitLayer) portraitLayer.classList.remove('lt-show');
    dialoguePanel.classList.remove('lt-show');
    latestMsg.classList.remove('lt-show');
    inputEl.value = '';
    autoSizeInput();
    render();
  });
}

// 「重新开始试玩版」按钮（AC-6）
var manualResetBtn = document.getElementById('btn-manual-reset');
if (manualResetBtn) {
  manualResetBtn.addEventListener('click', function () {
    if (confirm('确定要重新开始吗？当前进度将清除。')) {
      handleReset();
    }
  });
}
```

**依赖**：Step 4.10（`handleReset()`）；Step 5.4（按钮元素）。

### Step 5.3：新增 CSS 样式（插入 `style.css` 第 548 行之后）

```css
/* ── Reset modal (version-incompatible prompt) ── */
.lt-reset-overlay {
  position: absolute; z-index: 110; inset: 0;
  background: linear-gradient(180deg, rgba(0,0,0,.95), rgba(4,6,10,.98));
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 24px;
}
.lt-reset-card {
  background: var(--lt-panel-strong);
  border: 1px solid var(--lt-border);
  border-radius: 16px;
  padding: 28px 24px;
  max-width: 320px; width: 100%;
  text-align: center;
  font-size: 14px; line-height: 1.8;
  color: var(--lt-text);
}
.lt-reset-title {
  font-size: 20px; font-weight: 700; color: var(--lt-gold);
  margin-bottom: 16px; letter-spacing: 1px;
}
.lt-reset-body {
  color: var(--lt-muted);
  font-size: 13px; line-height: 1.7;
  margin-bottom: 20px;
  white-space: pre-line;
}
.lt-reset-btn {
  display: block; width: 100%;
  padding: 12px 0; border-radius: 999px;
  background: var(--lt-gold); color: #0d1118;
  font-size: 15px; font-weight: 700; letter-spacing: 1px;
  border: none; cursor: pointer;
  transition: opacity .15s;
  min-height: 44px;
}
.lt-reset-btn:active { opacity: .85; }
```

**样式说明**：
- `.lt-reset-overlay` 匹配 `.lt-intro` 的全屏居中模式，但 z-index 更高（110），确保覆盖 intro overlay。
- `.lt-reset-card` 匹配 `.lt-ng-card` 的卡片样式（`--lt-panel-strong` 背景、16px 圆角、1px border）。
- `.lt-reset-btn` 匹配 `.lt-intro-btn` 的金色主按钮样式（`--lt-gold` 背景、`#0d1118` 文字、圆角 999px）。
- 遮罩不绑定点击事件 → 不可点遮罩关闭（AC-13）。

**依赖**：Step 5.1（HTML 已插入）。

### Step 5.4：添加「重新开始试玩版」按钮 HTML（index.html）

在 `.lt-command-bar` 的 `</div>`（第 38 行末尾）之前加一个重置按钮：

```html
<button class="lt-cmd-btn" id="btn-manual-reset" title="重新开始试玩版">🔄重置</button>
```

完整命令栏变为（第 33–38 行）：

```html
<div class="lt-command-bar">
  <button class="lt-cmd-btn" data-cmd="view_clues">🔍线索</button>
  <button class="lt-cmd-btn" data-cmd="view_characters">👤人物</button>
  <button class="lt-cmd-btn" data-cmd="view_memory">🧠记忆</button>
  <button class="lt-cmd-btn" data-cmd="ask_xu">❓帮助</button>
  <button class="lt-cmd-btn" id="btn-manual-reset" title="重新开始试玩版">🔄重置</button>
</div>
```

**依赖**：Step 5.2（事件绑定）。

## 6. 测试计划

### 6.1 自动化测试（smoke_test.js）

在 `smoke_test.js` 中新增 `7. Save version detection` 测试块：

```js
// ── Save version detection tests ──
console.log('\n7. Engine: save version detection...');
// 验证 meta 结构完整性 (AC-11)
assert.strictEqual(typeof LT_SAVE_SCHEMA_VERSION, 'number');
assert.strictEqual(LT_SAVE_SCHEMA_VERSION, 1);
assert.strictEqual(LT_RUNTIME_VERSION, '0.8.0');
assert.strictEqual(LT_STORY_VERSION, 'demo-0.8-handeng');
// 验证 resetGame engine 命令返回 normalize(START_STATE) (AC-12)
var resetResult = engine.executeCommand('reset_game', engine.START_STATE);
assert.strictEqual(resetResult.state.loop, 1);
assert.strictEqual(resetResult.state.clock, '14:00');
assert.ok(resetResult.state.known_clues.includes('gray_coat_note_pressure'));
console.log('   OK save version constants & engine reset');
```

**AC 映射**：AC-11（meta 字段完整性）、AC-12（重置状态一致性）。

### 6.2 手动测试（浏览器，每个 AC 一条验证路径）

#### AC-1：新玩家首次进入
1. 打开浏览器隐私窗口。
2. 访问 `http://127.0.0.1:3030/`。
3. **预期**：无弹窗，intro overlay 正常显示，点击「进入二号车厢」进入游戏。
4. 打开 DevTools → Application → Local Storage → 确认存在 `lt:save:meta` 和 `lt:save:runtime`。

#### AC-2：旧玩家有 `looptrain.standalone.v1`
1. 在普通窗口手动写入 `localStorage.setItem('looptrain.standalone.v1', '{"loop":3}')`。
2. 刷新页面。
3. **预期**：弹出「新版试玩已重构」模态框，内容含「旧存档无法兼容」。
4. 点击「重新开始」按钮。
5. **预期**：模态关闭，intro overlay 显示；DevTools 确认 `looptrain.standalone.v1` 被删除，新 key `lt:save:meta` + `lt:save:runtime` 存在；`lt:legacy:<ts>` 存在且包含旧数据。

#### AC-3：storyVersion 不兼容
1. 手动写入：`localStorage.setItem('lt:save:meta', JSON.stringify({appId:'looptrain',saveSchemaVersion:1,runtimeVersion:'0.8.0',storyVersion:'old-story'}))`。
2. 刷新页面。
3. **预期**：弹出重置提示（版本不兼容文案）。
4. 点击「重新开始」后正常进入游戏。

#### AC-4：兼容存档正常恢复
1. 先正常玩一轮（AC-1 路径），此时 `lt:save:meta.storyVersion === 'demo-0.8-handeng'`。
2. 刷新页面。
3. **预期**：无弹窗，直接恢复存档状态（loop、clock、known_clues 等与保存前一致）。

#### AC-5：URL 参数 `?reset=1`
1. 访问 `http://127.0.0.1:3030/?reset=1`。
2. **预期**：intro overlay 直接显示（无模态框），URL 自动回退到 `http://127.0.0.1:3030/`（无 `?reset=1`）。
3. DevTools 确认所有 `lt:save:` key 已被清除后重建，`lt:legacy:` key 保留。

#### AC-6：UI 按钮「重新开始试玩版」
1. 正常游戏进行中（loop>1）。
2. 点击命令栏的「🔄重置」按钮。
3. **预期**：弹出 confirm 对话框：「确定要重新开始吗？当前进度将清除。」
4. 确认后 intro overlay 显示，游戏重置到 loop=1。

#### AC-7：控制台 `window.LT_RESET()`
1. 在 DevTools Console 执行 `window.LT_RESET()`。
2. **预期**：页面刷新，刷新后 intro overlay 显示。
3. DevTools 确认 `lt:save:meta` 和 `lt:save:runtime` 被清除后重建。

#### AC-8：不删除 `lt:legacy:` 前缀 key
1. 先触发 AC-2 流程（归档旧数据），确认 `lt:legacy:<ts>` 存在。
2. 再执行 `window.LT_RESET()` 或点击「重新开始」。
3. **预期**：`lt:legacy:<ts>` 依然保留在 localStorage 中。

#### AC-9：不删除非 `lt:` 前缀 key
1. 手动写入 `localStorage.setItem('some-other-key', 'test')`。
2. 执行任意重置路径。
3. **预期**：`some-other-key` 仍在 localStorage 中。

#### AC-10：IndexedDB 旧库清理
1. 在 DevTools → Application → IndexedDB 手动创建 `LoopTrainDB`（如果允许）。
2. 刷新页面。
3. **预期**：Console 中有 `[LT] Deleted old IndexedDB: LoopTrainDB` 或 `[LT] Failed to delete old IndexedDB`（取决于浏览器），但不阻塞游戏启动。

#### AC-11：SaveMeta 字段完整性
1. 正常开始游戏。
2. DevTools 执行：`JSON.parse(localStorage.getItem('lt:save:meta'))`。
3. **预期**：返回对象，包含全部 6 个字段且类型正确。

#### AC-12：三种重置路径结果一致
1. 分别通过 UI 按钮、`?reset=1`、`window.LT_RESET()` 重置游戏。
2. 每次进入游戏后检查：`loop === 1`、`clock === '14:00'`、`known_clues` 含 `gray_coat_note_pressure`、`intro_seen === false`。

#### AC-13：模态框不可通过点击遮罩关闭
1. 触发 AC-2 路径，模态框显示。
2. 点击模态框外灰色遮罩区域。
3. **预期**：无任何响应，模态框保持显示。
4. 只有点击「重新开始」按钮才能关闭。

#### AC-14：音频静音设置跨版本保留
1. 在旧版点击 🔊 切换为 🔇（静音）。
2. 刷新（触发版本检测 + 重置）。
3. **预期**：静音状态保持（🔇 图标），`lt:settings` 中 `{ muted: true }`。
4. DevTools 确认 `looptrain.audio.muted` 的值已迁移到 `lt:settings`。

## 7. 回滚方案

### 7.1 代码回滚

所有改动集中在前端文件（app.js, index.html, style.css, audio-manager.js, smoke_test.js），无数据库迁移、无 API 变更。回滚方式：

```bash
git checkout HEAD~1 -- looptrain/standalone/public/app.js
git checkout HEAD~1 -- looptrain/standalone/public/index.html
git checkout HEAD~1 -- looptrain/standalone/public/style.css
git checkout HEAD~1 -- looptrain/standalone/public/audio-manager.js
git checkout HEAD~1 -- looptrain/standalone/tests/smoke_test.js
```

或直接 `git revert <commit>`。

### 7.2 用户数据回滚

如果旧玩家已触发重置并被归档：
- 旧数据在 `lt:legacy:<timestamp>` key 中保留，可手动复制回 `looptrain.standalone.v1` 恢复。
- 回滚代码后，旧 `loadState()` 会重新读取 `looptrain.standalone.v1`。

### 7.3 风险缓解

| 风险 | 缓解 |
|------|------|
| 重置逻辑有 bug 导致死循环 | `handleReset()` 后仅调用 `render()`，不递归调用 `init()` |
| localStorage 配额超限 | 归档前不检查；如归档失败只打 `console.warn` |
| 某些浏览器不支持 IndexedDB.deleteDatabase | `clearOldIndexedDBs()` 内有 try/catch，失败不阻塞 |

## 8. 分阶段任务

### Phase A：常量 + 核心函数（无 UI 变更，可独立验证）

1. 在 `app.js` 顶部新增版本常量（Step 4.1）。
2. 新增 `saveSaveMeta()` / `loadSaveMeta()`（Step 4.2, 4.3）。
3. 新增 `detectLegacyKeys()`（Step 4.4）。
4. 新增 `archiveLegacyData()`（Step 4.5）。
5. 新增 `clearLtKeys()`（Step 4.6）。
6. 新增 `clearOldIndexedDBs()`（Step 4.7）。
7. 新增 `initNewSave()`（Step 4.8）。

**验证点**：在浏览器 Console 中手动调用 `detectLegacyKeys()`、`archiveLegacyData()`、`clearLtKeys()` 确认行为正确。

### Phase B：init() 流程改造 + 音频迁移

8. 改造 `saveState()` → 多 key 写入（Step 4.2 后半）。
9. 改造 `loadState()` → 读取新 key（Step 4.12）。
10. 改造 `init()` → 版本检测分支（Step 4.13）。
11. 改造 `audio-manager.js` → `lt:settings` 读写 + 迁移逻辑。

**AudioManager 具体改动**（替换 audio-manager.js 第 9 行及第 214–219 行）：

```js
// 旧 (line 9)：
const STORAGE_KEY = 'looptrain.audio.muted';
// 新：
const SETTINGS_KEY = 'lt:settings';

// 新增 readSettings/writeSettings：
function readSettings() {
  try {
    var raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (_) { return {}; }
}
function writeSettings(settings) {
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch (_) {}
}

// 旧 (line 214-219)：
function readMuted() {
  try { return localStorage.getItem(STORAGE_KEY) === 'true'; } catch (_) { return false; }
}
function writeMuted(val) {
  try { localStorage.setItem(STORAGE_KEY, val ? 'true' : 'false'); } catch (_) {}
}

// 新：
function readMuted() {
  try { return readSettings().muted === true; } catch (_) { return false; }
}
function writeMuted(val) {
  try {
    var settings = readSettings();
    settings.muted = !!val;
    writeSettings(settings);
  } catch (_) {}
}
```

**依赖**：Phase A 完成。

### Phase C：重置模态 UI + 手动重置路径

12. 在 `index.html` 中新增重置模态框 HTML（Step 5.1）。
13. 在 `style.css` 中新增重置模态样式（Step 5.3）。
14. 新增 `showResetModal()` / `hideResetModal()`（Step 4.9）。
15. 新增 `handleReset()`（Step 4.10）。
16. 新增 `window.LT_RESET()`（Step 4.11）。
17. 绑定重置模态按钮事件（Step 5.2）。
18. 在命令栏新增「🔄重置」按钮（Step 5.4）。
19. 绑定手动重置按钮事件（Step 5.2 后半）。

**依赖**：Phase B 完成（需要 `init()` 已改）。

### Phase D：清理 + 测试

20. 改造 `resetGame()` 函数（Step 4.14）。
21. 新增 smoke test 的存档版本检测测试（Step 6.1）。
22. 端到端手动测试全部 14 条 AC（Step 6.2）。
23. 运行 `npm test`（smoke tests）确认通过。
24. 运行 `bash scripts/verify_slt.sh` 确认完整验证通过。

## 9. 完成检查清单

- [ ] `app.js` 顶部版本常量已定义且值正确。
- [ ] `saveState()` 写入 `lt:save:runtime` + 调用 `saveSaveMeta()`。
- [ ] `saveSaveMeta()` 正确写入全部 6 个字段（ac-11）。
- [ ] `loadSaveMeta()` 正确解析 JSON。
- [ ] `detectLegacyKeys()` 正确识别 `looptrain.standalone.v1`。
- [ ] `archiveLegacyData()` 归档到 `lt:legacy:<timestamp>` 后删除原 key。
- [ ] `clearLtKeys()` 只删除 `lt:` 前缀 key，排除 `lt:legacy:` 和 `lt:settings`（ac-8, ac-9）。
- [ ] `clearOldIndexedDBs()` 在启动时调用，不阻塞 init（ac-10）。
- [ ] `initNewSave()` 创建初始存档，`intro_seen=false`。
- [ ] `showResetModal()` 正确展示模态框，区分 `legacy` 和 `incompatible` 文案。
- [ ] `hideResetModal()` 隐藏模态框。
- [ ] `handleReset()` 完整执行归档 → 清除 → 重建 → 显示 intro。
- [ ] `window.LT_RESET()` 可调用，执行清除后刷新页面（ac-7）。
- [ ] `loadState()` 从 `lt:save:runtime` 读取。
- [ ] `init()` 流程正确分流：新玩家、旧数据、兼容存档、不兼容存档（ac-1~4）。
- [ ] `?reset=1` 参数正确处理，自动删除参数（ac-5）。
- [ ] `resetGame()` 升级为清除 LT 存档 + 重建。
- [ ] 重置模态框不可点击遮罩关闭（ac-13）。
- [ ] 「🔄重置」按钮可触发 confirm → 重置（ac-6）。
- [ ] AudioManager 从 `lt:settings` 读写静音状态（ac-14）。
- [ ] `looptrain.audio.muted` 迁移到 `lt:settings` 后静音偏好保持（ac-14）。
- [ ] 三种重置路径结果状态一致（ac-12）。
- [ ] `npm test` 全部通过（含新增 test）。
- [ ] `bash scripts/verify_slt.sh` 全部通过。
- [ ] `node --check looptrain/standalone/public/app.js` 无语法错误。
- [ ] `node --check looptrain/standalone/public/audio-manager.js` 无语法错误。
- [ ] 所有控制台输出为 `console.warn`（非 `console.log`）。
- [ ] 无硬编码 secret / API key。
