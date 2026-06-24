'use strict';

/* LoopTrain Standalone v0.11.0-mobile-portrait-ui-redesign
 * Component-based UI. Pure vanilla JS. No SillyTavern.
 * Preserves all game logic from v0.10.0; replaces rendering layer.
 */

// ── Save version constants ──
var LT_SAVE_SCHEMA_VERSION = 1;
var LT_MIN_COMPATIBLE_SCHEMA_VERSION = 1;
var LT_RUNTIME_VERSION = 'v0.11.0-mobile-portrait-ui-redesign';
var LT_STORY_VERSION = 'demo-0.8-handeng';
var LT_KEY_PREFIX = 'lt:';
var LT_SAVE_META_KEY = 'lt:save:meta';
var LT_SAVE_RUNTIME_KEY = 'lt:save:runtime';
var LT_SETTINGS_KEY = 'lt:settings';

const API_BASE = '/api';
const ASSET_BASE = '/assets/';

// ── Content ──
let START_STATE = null;
let SCENES = {};
let NPC_INFO = {};
let APP_STRINGS = {};
let INTRO_DATA = null;

// ── State ──
let state = null;
let llmEnabled = false;
let llmMode = true;
let lastFailure = null;
let npcCache = null;
let prevAudioState = null;
let COMMANDS = [];
let XU_DIALOGUES = null;

// ── GameShell + Components ──
let gameShell = null;
let statusBar, timelineMiniBar, objectiveCard, sceneStateCard, commandInput;
let actionDock, moreActionsSheet, focusWatchBar;
let eventFeed, archiveSheet, dialogueFocusSheet;

function clone(x) { return JSON.parse(JSON.stringify(x)); }
const $ = (sel) => document.querySelector(sel);

// ── API ──
async function api(route, body) {
  const opts = { method: body ? 'POST' : 'GET', headers: { 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);
  try {
    const r = await fetch(`${API_BASE}${route}`, opts);
    if (!r.ok) throw new Error(`${r.status}`);
    return await r.json();
  } catch (e) {
    return null;
  }
}

function s(key) { return (APP_STRINGS && APP_STRINGS[key]) || key; }

// ── Engine helpers ──
function clueName(id) { return (npcCache?.clue_titles || {})[id] || id; }
function npcName(id) { return NPC_INFO[id]?.name || id; }
function sceneName(id) { return SCENES[id]?.name || id; }

// ── Persistence ──
function saveState() {
  try {
    var toSave = clone(state);
    delete toSave._ui; // Don't persist UI state
    localStorage.setItem(LT_SAVE_RUNTIME_KEY, JSON.stringify(toSave));
  } catch (_) {}
  saveSaveMeta();
}
function saveSaveMeta() {
  try {
    var now = new Date().toISOString();
    var existing = loadSaveMeta();
    var meta = { appId: 'looptrain', saveSchemaVersion: LT_SAVE_SCHEMA_VERSION, runtimeVersion: LT_RUNTIME_VERSION, storyVersion: LT_STORY_VERSION, createdAt: (existing && existing.createdAt) || now, updatedAt: now };
    localStorage.setItem(LT_SAVE_META_KEY, JSON.stringify(meta));
  } catch (_) {}
}
function loadSaveMeta() { try { var raw = localStorage.getItem(LT_SAVE_META_KEY); return raw ? JSON.parse(raw) : null; } catch (_) { return null; } }
function loadState() {
  try { var raw = localStorage.getItem(LT_SAVE_RUNTIME_KEY); if (raw) state = JSON.parse(raw); } catch (_) {}
  if (!state) { state = clone(START_STATE); return; }
  if (state.mode === 'dialogue') { state.mode = 'explore'; state.active_npc = null; }
  if (!state._goalData && state._goal) state._goalData = state._goal;
  if (!state._goal && state._goalData) state._goal = state._goalData;
}

// ── Legacy detection & cleanup ──
function detectLegacyKeys() { var legacy = []; try { for (var i = 0; i < localStorage.length; i++) { var key = localStorage.key(i); if (key === 'looptrain.standalone.v1' && !localStorage.getItem(LT_SAVE_META_KEY)) legacy.push(key); } } catch (_) {} return legacy; }
function archiveLegacyData(legacyKeys) { var ts = Date.now(); legacyKeys.forEach(function(key) { try { var raw = localStorage.getItem(key); if (raw) localStorage.setItem('lt:legacy:' + ts, raw); localStorage.removeItem(key); } catch (e) {} }); }
function clearLtKeys() { try { var toRemove = []; for (var i = 0; i < localStorage.length; i++) { var key = localStorage.key(i); if (key.indexOf(LT_KEY_PREFIX) === 0 && key.indexOf('lt:legacy:') !== 0 && key !== LT_SETTINGS_KEY) toRemove.push(key); } toRemove.forEach(function(key) { localStorage.removeItem(key); }); } catch (_) {} }
function clearOldIndexedDBs() { if (!window.indexedDB || !window.indexedDB.deleteDatabase) return; ['LoopTrainDB','LoopTrainRuntimeDB','LoopTrainMemoryDB'].forEach(function(dbName) { try { window.indexedDB.deleteDatabase(dbName); } catch (e) {} }); }
function initNewSave() { state = clone(START_STATE); state.flags.intro_seen = false; saveState(); prevAudioState = null; }
function migrateAudioSettings() { try { var oldMuted = localStorage.getItem('looptrain.audio.muted'); if (oldMuted === 'true' || oldMuted === 'false') { localStorage.setItem(LT_SETTINGS_KEY, JSON.stringify({ muted: oldMuted === 'true' })); } } catch (_) {} }

// ── Reset modal ──
function showResetModal(reason) { var overlay = document.getElementById('lt-reset-modal'); if (!overlay) return; var bodyEl = overlay.querySelector('.lt-reset-body'); if (bodyEl) bodyEl.textContent = reason === 'legacy' ? '《寒灯初醒》试玩是一次全面重构。旧存档无法兼容，需要重新开始。' : '检测到旧版本存档。需要重新开始。'; overlay.style.display = 'flex'; var intro = document.getElementById('overlay-intro'); if (intro) intro.classList.remove('lt-show'); }
function hideResetModal() { var overlay = document.getElementById('lt-reset-modal'); if (overlay) overlay.style.display = 'none'; }
function handleReset() { var legacyKeys = detectLegacyKeys(); if (legacyKeys.length) archiveLegacyData(legacyKeys); clearLtKeys(); initNewSave(); hideResetModal(); var intro = document.getElementById('overlay-intro'); if (intro) intro.classList.add('lt-show'); state.flags.intro_seen = false; eventFeed.clear(); dialogueFocusSheet.close(); var ng = document.getElementById('overlay-ng'); if (ng) ng.classList.remove('lt-show'); inputEl.value = ''; autoSizeInput(); gameShell.setState(state); }

// ── Audio events ──
function deriveAudioEvents(prevState, nextState, res) {
  const events = [];
  if ((nextState.known_clues?.length || 0) > (prevState.known_clues?.length || 0)) events.push({ action: 'play', id: 'clue_found' });
  if (prevState.ap_remaining > 3 && nextState.ap_remaining <= 3) events.push({ action: 'fadeIn', id: 'faint_ticking_loop' });
  if (prevState.ap_remaining <= 3 && nextState.ap_remaining > 3) events.push({ action: 'fadeOut', id: 'faint_ticking_loop' });
  if (res.loop_failure_outcome) { events.push({ action: 'fadeOut', id: 'faint_ticking_loop' }); events.push({ action: 'play', id: 'explosion_muffled' }); }
  if (res.trial_success) events.push({ action: 'fadeOut', id: 'faint_ticking_loop' });
  return events;
}

// ── UI helpers ──
var inputEl, phone;
function autoSizeInput() { if (inputEl) { inputEl.style.height = 'auto'; inputEl.style.height = Math.min(96, inputEl.scrollHeight) + 'px'; } }
function toast(text) { var t = document.createElement('div'); t.className = 'lt-toast'; t.textContent = text; phone.appendChild(t); setTimeout(function() { t.remove(); }, 2200); }
function showClueBadge(count) { var badge = document.createElement('div'); badge.className = 'lt-clue-badge'; badge.textContent = '🧩 线索 +' + count; phone.appendChild(badge); setTimeout(function() { badge.remove(); }, 3000); }

// ── Goal feedback ──
function showGoalFeedback(prevTitle, newTitle, memoryNote) {
  if (!prevTitle || prevTitle === newTitle) return;
  var fb = document.getElementById('overlay-goal-feedback');
  if (!fb) return;
  fb.querySelector('.lt-fb-title').textContent = '✅ 目标完成';
  fb.querySelector('.lt-fb-desc').textContent = prevTitle || '';
  fb.querySelector('.lt-fb-memory').textContent = memoryNote || '🧠 该信息已加入下一轮记忆';
  fb.querySelector('.lt-fb-next').textContent = newTitle ? '📋 新目标：' + newTitle : '';
  fb.style.display = '';
  fb.classList.add('lt-fb-show');
  setTimeout(function() { fb.classList.remove('lt-fb-show'); setTimeout(function() { fb.style.display = 'none'; }, 400); }, 4000);
}

// ── Commands ──
function matchLocalCommand(text) {
  const t = (text || '').trim(); if (!t) return null;
  const tl = t.toLowerCase();
  for (const cmd of COMMANDS) { for (const trigger of cmd.triggers) { if (trigger.toLowerCase() === tl) return cmd; } }
  for (const cmd of COMMANDS) { for (const trigger of cmd.triggers) { if (tl.includes(trigger.toLowerCase())) return cmd; } }
  return null;
}
function handleCommand(text) {
  const cmd = matchLocalCommand(text);
  if (!cmd) { eventFeed.appendMessage('system', '未知指令。输入"帮助"查看可用指令。'); return true; }
  switch (cmd.id) {
    case 'view_clues': archiveSheet.open('clues'); return true;
    case 'view_characters': archiveSheet.open('characters'); return true;
    case 'view_status': eventFeed.appendMessage('system', state.clock + '｜AP ' + state.ap_remaining + '｜第 ' + state.loop + ' 轮｜' + (state.mode === 'dialogue' ? '对话：' + npcName(state.active_npc) : '探索')); return true;
    case 'view_goal': eventFeed.appendMessage('system', '当前目标：' + (state._goal || '')); return true;
    case 'view_memory': archiveSheet.open('memory'); return true;
    case 'view_timeline': case 'view_npc_timeline': case 'view_gray_timeline': case 'view_xiaoning_timeline': archiveSheet.open('timeline'); return true;
    case 'view_beliefs': eventFeed.appendMessage('system', '推测功能将在后续版本开放。'); return true;
    case 'end_dialogue': if (state.mode === 'dialogue') endDialogue(); else eventFeed.appendMessage('system', '当前不在对话中。'); return true;
    case 'next_loop': if (lastFailure) nextLoop(); else eventFeed.appendMessage('system', '只有失败结算后才能进入下一轮。'); return true;
    case 'reset_loop': resetLoop(); return true;
    case 'reset_game': if (confirm('确定要重置游戏吗？所有进度将丢失。')) resetGame(); return true;
    case 'ask_xu': showXuPanel(); return true;
    default: return false;
  }
}

function showXuPanel() {
  var helpText = '';
  if (XU_DIALOGUES && XU_DIALOGUES.templates) { var helpTpl = XU_DIALOGUES.templates.find(function(t) { return t.intent === 'command_help'; }); if (helpTpl) helpText = helpTpl.text; }
  if (!helpText) helpText = '你可以随时使用下面的指令。\n\n📋 信息查询：查看线索、查看人物、查看状态、查看任务\n🧠 记忆系统：查看记忆、查看时间线、查看推测\n⚡ 行动指令：结束对话、进入下一轮、重置本轮、重置游戏';
  eventFeed.appendHtml('system', '<div class="lt-msg-title">调查助手：许知微</div><div>' + esc(helpText) + '</div>');
}

// ── Game actions ──
async function submitInput() {
  const text = inputEl.value.trim();
  if (!text) return;
  inputEl.value = '';
  autoSizeInput();
  var sendBtn = document.getElementById('btn-send');
  if (sendBtn) { sendBtn.disabled = true; sendBtn.textContent = '...'; }

  if (text.indexOf('__OBSERVE_') === 0) {
    AudioManager.play('message_sent');
    var obsLabel = text.indexOf('__OBSERVE_NPC__') === 0 ? '盯住 ' + (text.split(':')[1] || '') : text.indexOf('__OBSERVE_LOCATION__') === 0 ? '守点观察 ' + (text.split(':')[1] || '') : '观察当前场景';
    eventFeed.appendMessage('player', obsLabel);
    await handleObserveAction(text);
    if (sendBtn) { sendBtn.disabled = false; sendBtn.textContent = '发送'; }
    return;
  }

  if (text.indexOf('__OBSERVE_') === 0 || text.indexOf('__DIALOGUE__:') === 0 || text.indexOf('__END_DIALOGUE__') === 0) {
    // Internal template — skip command matching
  } else if (matchLocalCommand(text)) { handleCommand(text); if (sendBtn) { sendBtn.disabled = false; sendBtn.textContent = '发送'; } return; }

  // High-risk action confirmation
  var hr = isHighRisk(text);
  if (hr) {
    var confirmOverlay = document.getElementById('overlay-confirm');
    if (confirmOverlay) {
      confirmOverlay.querySelector('.lt-confirm-body').textContent = '你要执行：' + hr.label + '。这可能改变 NPC 态度或导致失败。';
      var evidenceEl = confirmOverlay.querySelector('.lt-confirm-evidence');
      if (hr.requiresEvidence) {
        var count = (state.known_clues || []).length;
        evidenceEl.innerHTML = '<div>当前可用证据：' + count + ' 条</div>';
      } else { evidenceEl.innerHTML = ''; }
      confirmOverlay.style.display = 'flex';
      _pendingAction = text;
      if (sendBtn) { sendBtn.disabled = false; sendBtn.textContent = '发送'; }
      return;
    }
  }

  if (text.indexOf('__OBSERVE_') === 0) {
    AudioManager.play('message_sent');
    var obsLabel = text.indexOf('__OBSERVE_NPC__') === 0 ? '盯住 ' + (text.split(':')[1] || '') : text.indexOf('__OBSERVE_LOCATION__') === 0 ? '守点观察 ' + (text.split(':')[1] || '') : '观察当前场景';
    eventFeed.appendMessage('player', obsLabel);
    await handleObserveAction(text);
    if (sendBtn) { sendBtn.disabled = false; sendBtn.textContent = '发送'; }
    return;
  }

  if (dialogueFocusSheet.isActive()) {
    dialogueFocusSheet.appendMsg('player', text);
  } else {
    eventFeed.appendMessage('player', text);
  }
  AudioManager.play('message_sent');

  if (state.mode === 'dialogue') {
    if (/结束|离开|不聊了/.test(text)) { endDialogue(); if (sendBtn) { sendBtn.disabled = false; sendBtn.textContent = '发送'; } return; }
    let llmReply = '';
    if (llmEnabled && llmMode) { const llmRes = await api('/llm/npc-reply', { npc_id: state.active_npc, player_text: text, state }); if (llmRes?.reply) llmReply = llmRes.reply; }
    const res = await api('/dialogue/message', { npc_id: state.active_npc, player_text: text, state, llm_reply: llmReply });
    handleResponse(res, true);
  } else {
    const res = await api('/action/commit', { text, state });
    handleResponse(res, false);
  }
  if (sendBtn) { sendBtn.disabled = false; sendBtn.textContent = '发送'; }
}

var _pendingAction = null;

async function handleObserveAction(template) {
  var params = { type: 'scene' };
  if (template.indexOf('__OBSERVE_NPC__:') === 0) { params.type = 'npc'; params.npc_id = template.split(':')[1] || ''; }
  else if (template.indexOf('__OBSERVE_LOCATION__:') === 0) { params.type = 'location'; params.location = template.split(':')[1] || ''; }
  var res = await api('/action/observe', { type: params.type, npc_id: params.npc_id, location: params.location, state: state });
  if (!res) { eventFeed.appendMessage('system', '观察失败，请稍后重试。'); return; }
  handleObserveResponse(res, template);
}

function handleObserveResponse(res, template) {
  if (!res) return;
  var prevStateForCard = state ? clone(state) : null;
  var prevState = prevAudioState ? clone(prevAudioState) : null;
  if (res.state) {
    if (prevState) { var events = deriveAudioEvents(prevState, res.state, res); if (events.length) AudioManager.dispatchAll(events); }
    state = res.state; saveState(); prevAudioState = clone(state);
  }
  if (res.suggestions !== undefined) state._suggestions = res.suggestions;
  if (res.goal !== undefined) { state._goalData = res.goal; state._goal = res.goal; }

  // Build and append ActionResultCard
  var card = buildActionResultCard(res, prevStateForCard, 'observe', '观察结果');
  eventFeed.appendCard(card);

  if (res.observation_result) {
    if (res.observation_result.nothing_found) toast('没有发现异常');
    if (res.observation_result.discovered && res.observation_result.discovered.length > 0) {
      var firstTitle = clueName(res.observation_result.discovered[0].entry.public_clue_id) || clueName(res.observation_result.discovered[0].entry.source_id) || '';
      toast(firstTitle ? '发现: ' + firstTitle : '注意到了一些细节');
    }
    if (res.observation_result.conflict_detected) toast('⚠ 发现线索矛盾');
  }

  // Start FocusWatch if observe NPC
  if (template && template.indexOf('__OBSERVE_NPC__:') === 0) {
    var npcId = template.split(':')[1];
    if (npcId) focusWatchBar.startWatch('npc', npcId);
  }

  gameShell.setState(state);
}

async function endDialogue() {
  const res = await api('/dialogue/end', { state });
  handleResponse(res, false);
}

async function failLoop() {
  const res = await api('/loop/fail', { state, failure_type: 'time_out_explosion' });
  handleResponse(res, false);
}

async function nextLoop() {
  const res = await api('/loop/next', { state, loop_failure_outcome: lastFailure });
  var ng = document.getElementById('overlay-ng'); if (ng) ng.classList.remove('lt-show');
  lastFailure = null;
  if (res?.state) state = res.state;
  if (res?.opening) eventFeed.appendMessage('system', res.opening);
  else eventFeed.appendMessage('system', '你回到了 14:00。');
  focusWatchBar.stopWatch();
  toast(APP_STRINGS.nextLoopToast || '进入下一轮');
  gameShell.setState(state);
  setTimeout(function() { showXuWelcome(state.loop); }, 1000);
}

async function resetGame() {
  PortraitIntro.reset();
  lastFailure = null;
  var legacyKeys = detectLegacyKeys(); if (legacyKeys.length) archiveLegacyData(legacyKeys);
  clearLtKeys(); initNewSave();
  state.flags.intro_seen = false;
  eventFeed.clear(); dialogueFocusSheet.close();
  var ng = document.getElementById('overlay-ng'); if (ng) ng.classList.remove('lt-show');
  focusWatchBar.stopWatch();
  inputEl.value = ''; autoSizeInput();
  eventFeed.appendMessage('system', APP_STRINGS.resetToast || '已重置试玩版。');
  gameShell.setState(state);
}

async function resetLoop() {
  PortraitIntro.reset();
  const res = await api('/session/init', { state: clone(START_STATE) });
  if (res?.state) {
    res.state.flags.intro_seen = true;
    res.state._goal = res.goal || '';
    res.state._suggestions = res.suggestions || [];
    state = res.state;
    eventFeed.clear(); dialogueFocusSheet.close();
    var ng = document.getElementById('overlay-ng'); if (ng) ng.classList.remove('lt-show');
    focusWatchBar.stopWatch();
    inputEl.value = ''; autoSizeInput();
    eventFeed.appendMessage('system', '本轮已重置。');
    gameShell.setState(state);
  }
}

async function startDialogue(npcId) {
  const loop = state.loop || 1;
  const npc = NPC_INFO[npcId];
  if (npc) {
    var portraitSrc = ASSET_BASE + (npc.portrait || 'xiaoning_portrait.png');
    if (PortraitIntro.shouldPlay(npcId, loop)) {
      try { await PortraitIntro.play({ src: portraitSrc, alt: npc.name || npcId }); } catch (_) { document.querySelectorAll('div[style*="z-index:9999"]').forEach(function(el) { el.remove(); }); }
      PortraitIntro.markPlayed(npcId, loop);
    } else { PortraitIntro.setImage({ src: portraitSrc, alt: npc.name || npcId }); }
  }
  const res = await api('/dialogue/start', { state, npc_id: npcId });
  // Open DialogueFocusSheet
  dialogueFocusSheet.open(npcId);
  focusWatchBar.setPaused(true);
  handleResponse(res, true);
}

function handleResponse(res, inDialogue) {
  if (!res) { toast('操作失败，请稍后重试。'); return; }
  var prevStateForCard = state ? clone(state) : null;
  var prevState = prevAudioState ? clone(prevAudioState) : null;
  if (res.state) {
    state = res.state; saveState();
    if (prevState) { var events = deriveAudioEvents(prevState, state, res); if (events.length) AudioManager.dispatchAll(events); }
    prevAudioState = clone(state);
  }
  if (res.suggestions !== undefined) state._suggestions = res.suggestions;
  if (res.goal !== undefined) {
    var prevTitle = state._goalData && state._goalData.goals && state._goalData.goals.length ? state._goalData.goals[0].title : '';
    state._goalData = res.goal; state._goal = res.goal;
    var newTitle = state._goalData && state._goalData.goals && state._goalData.goals.length ? state._goalData.goals[0].title : '';
    if (prevTitle && newTitle && prevTitle !== newTitle) showGoalFeedback(prevTitle, newTitle, '🧠 该信息已加入下一轮记忆');
  }

  // Messages to dialogue or event feed
  if (res.messages) {
    for (const m of res.messages) {
      if (m.type === 'npc' && dialogueFocusSheet.isActive()) dialogueFocusSheet.appendMsg('npc', m.text || '');
      else if (m.type === 'outcome' && m.html) eventFeed.appendHtml('outcome', m.html);
      else eventFeed.appendMessage(m.type || 'system', m.text || '');
    }
  }

  // Dialogue outcome → summary card
  if (res.dialogue_outcome) {
    if (res.dialogue_outcome.clues_gained && res.dialogue_outcome.clues_gained.length) showClueBadge(res.dialogue_outcome.clues_gained.length);
    var card = buildActionResultCard(res, prevStateForCard, 'dialogue', '对话摘要：' + npcName(res.dialogue_outcome.npc_id || state.active_npc));
    eventFeed.appendCard(card);
    dialogueFocusSheet.close();
    focusWatchBar.setPaused(false);
  }

  // Failure outcome
  if (res.loop_failure_outcome) renderFailureOutcome(res.loop_failure_outcome);
  if (res.trial_success) toast(APP_STRINGS.trialSuccessToast || '试玩版成功');
  if (res.memory_node) { eventFeed.appendMessage('system', '💭 触发隐藏记忆：' + (res.memory_node.title || '')); }

  gameShell.setState(state);
}

function renderFailureOutcome(out) {
  lastFailure = out;
  var ng = document.getElementById('overlay-ng');
  if (!ng) return;
  var ngBg = ng.querySelector('.lt-ng-bg');
  var ngCard = ng.querySelector('.lt-ng-card');
  if (ngBg) ngBg.style.backgroundImage = 'url(' + ASSET_BASE + 'train_explosion_landscape_concept.png)';
  var facts = (out.confirmed_facts || []).map(function(x) { return '<li>' + esc(x.text) + '</li>'; }).join('') || '<li>没有确认事实</li>';
  var sus = (out.suspicions || []).map(function(x) { return '<li>' + esc(x.text) + '</li>'; }).join('');
  var sug = (out.next_loop_suggestions || []).map(function(x) { return '<li>' + esc(x.label) + '</li>'; }).join('') || '<li>重新规划路线</li>';
  if (ngCard) ngCard.innerHTML = '<div class="lt-ng-title">循环失败</div><div>' + esc(out.failure_reason || '你没能阻止爆炸。') + '</div><div class="lt-subtitle">带入下一轮的记忆</div><ul>' + facts + '</ul>' + (sus ? '<div class="lt-subtitle">疑点</div><ul>' + sus + '</ul>' : '') + '<div class="lt-subtitle">下一轮建议</div><ul>' + sug + '</ul><button class="lt-btn lt-next" id="btn-next-loop">进入第 ' + (Number(out.loop || state.loop) + 1) + ' 轮</button>';
  ng.classList.add('lt-show');
}

// ── Xu Zhiwei welcome ──
async function showXuWelcome(loop) {
  if (state.mode === 'dialogue') return;
  var text = '';
  if (XU_DIALOGUES && XU_DIALOGUES.templates) {
    var tpl;
    if (loop === 1) tpl = XU_DIALOGUES.templates.find(function(t) { return t.intent === 'welcome_first'; });
    else if (loop === 2) tpl = XU_DIALOGUES.templates.find(function(t) { return t.intent === 'welcome_loop2'; });
    else tpl = XU_DIALOGUES.templates.find(function(t) { return t.intent === 'welcome_loop3'; });
    if (tpl) text = tpl.text;
  }
  if (!text) text = '我是许知微。有什么需要帮助的吗？';
  eventFeed.appendHtml('system', '<div class="lt-msg-title">许知微</div><div>' + esc(text) + '</div>');
}

// ── Intro rendering ──
function renderIntro(data) {
  if (!data) return;
  INTRO_DATA = data;
  var kickerEl = document.querySelector('.lt-intro-kicker');
  var titleEl = document.querySelector('.lt-intro-title');
  var stepsEl = document.querySelector('.lt-intro-steps');
  var memoryEl = document.querySelector('.lt-intro-memory');
  var btnEl = document.getElementById('intro-start-btn');
  var skipEl = document.querySelector('.lt-intro-skip');
  if (kickerEl) kickerEl.textContent = data.kicker || '';
  if (titleEl) titleEl.textContent = data.title || '';
  if (stepsEl && Array.isArray(data.steps)) stepsEl.innerHTML = data.steps.map(function(s) { return '<div><strong>' + esc(s.role) + '</strong><span>' + esc(s.text) + '</span></div>'; }).join('');
  if (memoryEl) memoryEl.textContent = data.memory || '';
  if (btnEl) btnEl.textContent = data.buttonLabel || '进入游戏';
  if (skipEl) skipEl.textContent = data.skipLabel || '点击任意位置跳过';
}

// ── Content boot ──
async function bootContent() {
  try {
    const [scenesRes, npcsRes, sessionRes] = await Promise.all([api('/scenes'), api('/npcs'), api('/session/init', {})]);
    if (scenesRes?.scenes) SCENES = scenesRes.scenes;
    if (npcsRes) { if (npcsRes.npc_info) NPC_INFO = npcsRes.npc_info; npcCache = npcsRes; }
    if (sessionRes?.state) { START_STATE = clone(sessionRes.state); START_STATE._goal = sessionRes.goal || ''; START_STATE._goalData = sessionRes.goal || ''; START_STATE._suggestions = sessionRes.suggestions || []; }
    const [introRes, stringsRes, configRes, commandsRes] = await Promise.all([api('/intro'), api('/app-strings'), api('/config'), api('/commands')]);
    if (introRes) renderIntro(introRes);
    if (stringsRes) APP_STRINGS = stringsRes;
    if (configRes?.llm_enabled) llmEnabled = true;
    if (commandsRes?.commands) COMMANDS = commandsRes.commands;
    api('/xu-dialogue').then(function(d) { if (d) XU_DIALOGUES = d; }).catch(function() {});
  } catch (_) {}
}

// ── Init ──
async function init() {
  await bootContent();
  await AudioManager.init();
  migrateAudioSettings();

  // ── DOM refs ──
  phone = $('.lt-phone');
  inputEl = $('.lt-input');

  // ── Initialize GameShell + Components ──
  gameShell = new GameShell();
  statusBar = gameShell.register(new StatusBar(document.getElementById('region-status-bar')));
  timelineMiniBar = gameShell.register(new TimelineMiniBar(document.getElementById('region-timeline-mini')));
  objectiveCard = gameShell.register(new ObjectiveCard(document.getElementById('region-objective')));
  sceneStateCard = gameShell.register(new SceneStateCard(document.getElementById('region-scene'), { scenes: SCENES, npcInfo: NPC_INFO, clueName: clueName }));
  eventFeed = gameShell.register(new EventFeed(document.getElementById('region-event-feed')));
  actionDock = gameShell.register(new ActionDock(document.getElementById('region-action-dock'), { getScenes: function() { return SCENES; }, getNpcInfo: function() { return NPC_INFO; } }));
  moreActionsSheet = gameShell.register(new MoreActionsSheet(document.getElementById('overlay-more-actions')));
  focusWatchBar = gameShell.register(new FocusWatchBar(document.getElementById('region-focus-watch'), {
    npcName: npcName,
    onNewEntry: function(entry) {
      var card = { id: 'watch-' + entry.id, actionType: 'timeline', title: '持续观察', time: entry.time || '', cost: { ap: 0, minutes: 0 }, narrative: entry.description || entry.source_label || '观察到新动态', timelineEvents: [{ entryId: entry.id, time: entry.time, actor: entry.actor, action: entry.action, source_type: entry.source_type, contradicts: entry.contradicts || [] }] };
      eventFeed.appendCard(card);
    }
  }));
  archiveSheet = gameShell.register(new ArchiveSheet(document.getElementById('overlay-archive'), { getState: function() { return state; }, npcCache: npcCache, npcInfo: NPC_INFO, clueName: clueName }));
  dialogueFocusSheet = gameShell.register(new DialogueFocusSheet(document.getElementById('overlay-dialogue-focus'), { npcInfo: NPC_INFO, getState: function() { return state; }, assetBase: ASSET_BASE, npcName: npcName }));
  commandInput = gameShell.register(new CommandInput(document.getElementById('region-bottom'), { npcName: npcName }));

  // ── Save bootstrap ──
  var urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('reset') === '1') {
    handleReset();
    if (window.history && window.history.replaceState) window.history.replaceState(null, '', window.location.pathname);
  } else {
    var meta = loadSaveMeta();
    var legacyKeys = detectLegacyKeys();
    if (legacyKeys.length > 0) { showResetModal('legacy'); }
    else if (meta) {
      if (meta.storyVersion !== LT_STORY_VERSION || meta.saveSchemaVersion < LT_MIN_COMPATIBLE_SCHEMA_VERSION) showResetModal('incompatible');
      else { loadState(); gameShell.setState(state); }
    } else { initNewSave(); gameShell.setState(state); }
  }
  clearOldIndexedDBs();

  // ── Event bindings ──

  // Mute toggle
  var muteBtn = document.getElementById('btn-audio-mute');
  if (muteBtn) {
    muteBtn.addEventListener('click', function() {
      var nowMuted = !AudioManager.isMuted();
      AudioManager.setMuted(nowMuted);
      muteBtn.textContent = nowMuted ? '🔇' : '🔊';
      muteBtn.setAttribute('aria-label', nowMuted ? '开启声音' : '关闭声音');
    });
    if (AudioManager.isMuted()) { muteBtn.textContent = '🔇'; muteBtn.setAttribute('aria-label', '开启声音'); }
  }

  // Reset modal confirm
  var resetConfirm = document.getElementById('lt-reset-confirm');
  if (resetConfirm) resetConfirm.addEventListener('click', handleReset);

  // Send button + input
  document.getElementById('btn-send').addEventListener('click', submitInput);
  inputEl.addEventListener('keydown', function(ev) { if (ev.key === 'Enter' && !ev.shiftKey) { ev.preventDefault(); submitInput(); } });
  inputEl.addEventListener('input', autoSizeInput);

  // Archive button
  document.getElementById('btn-archive').addEventListener('click', function() { archiveSheet.open('clues'); });
  // Xu button
  document.getElementById('btn-xu').addEventListener('click', function() { showXuPanel(); });
  // More menu
  var moreMenuBtn = document.getElementById('btn-more-menu');
  var moreMenu = document.getElementById('overlay-more-menu');
  if (moreMenuBtn && moreMenu) {
    moreMenuBtn.addEventListener('click', function(e) { e.stopPropagation(); moreMenu.style.display = moreMenu.style.display === 'none' ? 'block' : 'none'; });
    document.addEventListener('click', function() { moreMenu.style.display = 'none'; });
    var resetBtn = document.getElementById('btn-reset-game');
    if (resetBtn) resetBtn.addEventListener('click', function() { if (confirm('确定要重新开始吗？当前进度将清除。')) resetGame(); });
  }

  // Archive close + tab switching (delegated)
  document.getElementById('overlay-archive').addEventListener('click', function(e) {
    if (e.target.id === 'lt-archive-close') archiveSheet.close();
    if (e.target.dataset && e.target.dataset.tab) archiveSheet.openTab(e.target.dataset.tab);
  });

  // MoreActionsSheet close
  document.getElementById('overlay-more-actions').addEventListener('click', function(e) {
    if (e.target.id === 'lt-more-close') moreActionsSheet.close();
  });

  // ActionDock: more actions button + action button clicks
  document.getElementById('region-action-dock').addEventListener('click', function(e) {
    if (e.target.id === 'lt-action-more-btn') { moreActionsSheet.open(actionDock.getMoreActions()); return; }
    var btn = e.target.closest('[data-template]');
    if (btn) {
      var t = btn.dataset.template;
      if (t === '__END_DIALOGUE__') { if (state.mode === 'dialogue') endDialogue(); return; }
      if (t.indexOf('__DIALOGUE__:') === 0) { var npcId = t.split(':')[1]; if (npcId) startDialogue(npcId); return; }
      inputEl.value = t; autoSizeInput(); submitInput();
    }
  });

  // MoreActionsSheet action clicks
  document.getElementById('overlay-more-actions').addEventListener('click', function(e) {
    var btn = e.target.closest('[data-template]');
    if (btn) {
      moreActionsSheet.close();
      var t = btn.dataset.template;
      if (t.indexOf('__DIALOGUE__:') === 0) { var npcId = t.split(':')[1]; if (npcId) startDialogue(npcId); return; }
      if (t === '__END_DIALOGUE__') { if (state.mode === 'dialogue') endDialogue(); return; }
      inputEl.value = t; autoSizeInput(); submitInput();
    }
  });

  // FocusWatchBar stop button
  document.getElementById('region-focus-watch').addEventListener('click', function(e) {
    if (e.target.id === 'lt-focus-stop') focusWatchBar.stopWatch();
  });

  // DialogueFocusSheet events
  var dfEl = document.getElementById('overlay-dialogue-focus');
  dfEl.addEventListener('click', function(e) {
    if (e.target.id === 'lt-df-back' || e.target.id === 'lt-df-end') { if (state.mode === 'dialogue') endDialogue(); return; }
    var btn = e.target.closest('[data-template]');
    if (btn) { var t = btn.dataset.template; if (t === '__END_DIALOGUE__') { endDialogue(); return; } inputEl.value = t; autoSizeInput(); submitInput(); }
  });

  // Mode tabs
  document.querySelector('.lt-mode-tabs').addEventListener('click', async function(ev) {
    var tab = ev.target.closest('[data-mode]'); if (!tab) return;
    var mode = tab.dataset.mode;
    if (mode === 'action') {
      if (state.mode === 'dialogue') await endDialogue();
      document.querySelectorAll('.lt-mode-tab').forEach(function(t) { t.classList.remove('lt-active'); });
      tab.classList.add('lt-active');
      if (actionDock && actionDock.setFilter) actionDock.setFilter(null);
    } else if (mode === 'dialogue') {
      document.querySelectorAll('.lt-mode-tab').forEach(function(t) { t.classList.remove('lt-active'); });
      tab.classList.add('lt-active');
      if (actionDock && actionDock.setFilter) actionDock.setFilter('dialogue');
    }
  });

  // High-risk confirm
  document.getElementById('lt-confirm-cancel').addEventListener('click', function() { document.getElementById('overlay-confirm').style.display = 'none'; _pendingAction = null; });
  document.getElementById('lt-confirm-ok').addEventListener('click', function() {
    document.getElementById('overlay-confirm').style.display = 'none';
    if (_pendingAction) { var action = _pendingAction; _pendingAction = null; inputEl.value = action; autoSizeInput(); submitInput(); }
  });

  // TimelineMiniBar click → open timeline archive
  document.getElementById('region-timeline-mini').addEventListener('click', function() { archiveSheet.open('timeline'); });

  // Global click delegation for intro, next-loop, unlocked actions
  document.getElementById('lt-root').addEventListener('click', async function(ev) {
    // Intro start button
    if (ev.target.id === 'intro-start-btn') {
      state.flags.intro_seen = true; saveState();
      AudioManager.unlock();
      setTimeout(function() { AudioManager.play('rail_loop_low'); }, 200);
      var intro = document.getElementById('overlay-intro');
      if (intro) intro.classList.remove('lt-show');
      setTimeout(function() { showXuWelcome(state.loop); }, 2000);
      var startMsg = (INTRO_DATA && INTRO_DATA.gameStartMessage) || '1939 年冬，江城号列车。窗外夜色流动，车厢灯光昏黄。你醒来，不记得自己是谁——但你知道：14:15，这列火车会爆炸。许知微合上笔记本抬起头："你又醒了。"';
      eventFeed.appendMessage('system', startMsg);
      toast(APP_STRINGS.gameStartToast || '第 1 轮开始');
      gameShell.setState(state);
      return;
    }
    // Intro skip
    var introLayer = document.getElementById('overlay-intro');
    if (introLayer && introLayer.classList.contains('lt-show') && ev.target.closest('.lt-intro') && !ev.target.closest('.lt-intro-card')) {
      state.flags.intro_seen = true; saveState();
      introLayer.classList.remove('lt-show');
      gameShell.setState(state);
      return;
    }
    // Next loop button
    if (ev.target.id === 'btn-next-loop') { AudioManager.dispatch({ action: 'play', id: 'loop_rewind' }); await nextLoop(); return; }
    // Unlocked action buttons in event feed
    var unlockBtn = ev.target.closest('.lt-unlock-btn');
    if (unlockBtn) { inputEl.value = unlockBtn.dataset.template; autoSizeInput(); submitInput(); return; }
  });

  api('/npcs').then(function(data) { if (data) npcCache = data; });
  api('/health');
}

document.addEventListener('DOMContentLoaded', init);
