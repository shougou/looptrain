'use strict';

/* LoopTrain Standalone v0.5.1 UX Refresh — app.js
 * Scene-driven layout. Pure vanilla JS. No SillyTavern.
 */

const API_BASE = '/api';
const ASSET_BASE = '/assets/';

// ── Content loaded from engine API ──
let START_STATE = null;
let SCENES = {};
let NPC_INFO = {};

// ── State ──
let state = null;
let llmEnabled = false;
let llmMode = true;
let lastFailure = null;
let npcCache = null;
let prevAudioState = null;

function clone(x) { return JSON.parse(JSON.stringify(x)); }

// ── DOM refs ──
const $ = (sel) => document.querySelector(sel);
const phone = $('.lt-phone');
const topLeft = $('.lt-topbar-left');
const topRight = $('.lt-topbar-right');
const locationEl = $('.lt-location');
const sceneText = $('.lt-scene-text');
const goalEl = $('.lt-current-goal');
const npcWrap = $('.lt-visible-npcs');
const logEl = $('.lt-log-drawer .lt-log');
const dialogueLog = $('.lt-dialogue-log');
const portraitLayer = $('.lt-portrait-layer');
const portraitImg = $('.lt-portrait');
const dialoguePanel = $('.lt-dialogue-panel');
const dialogueNpc = $('.lt-dialogue-npc');
const latestMsg = $('.lt-latest-msg');
const logDrawer = $('.lt-log-drawer');
const inputEl = $('.lt-input');
const modeTabs = $('.lt-mode-tabs');
const ngLayer = $('.lt-ng');
const ngBg = $('.lt-ng-bg');
const ngCard = $('.lt-ng-card');
const introLayer = $('.lt-intro');
const contentEl = $('.lt-content');
const bottomEl = $('.lt-bottom');

// ── API ──
async function api(route, body) {
  const opts = { method: body ? 'POST' : 'GET', headers: { 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);
  try {
    const r = await fetch(`${API_BASE}${route}`, opts);
    if (!r.ok) throw new Error(`${r.status}`);
    return await r.json();
  } catch (e) {
    console.warn('[LT] API error:', route, e);
    return null;
  }
}

// ── Render ──
function render() {
  const s = state;
  const isDialogue = s.mode === 'dialogue';

  // Topbar: time / loop / location
  topLeft.innerHTML = `第 ${s.loop} 轮 · ${esc(s.clock)}`;
  topRight.innerHTML = `${sceneName(s.location)} · AP ${s.ap_remaining}`;

  // Scene card
  locationEl.textContent = sceneName(s.location);
  sceneText.textContent = getSceneText();
  goalEl.textContent = '当前目标：' + (state._goal || '证明第七节车厢存在异常，并说服赵乘警检查地板。');

  // NPC chips
  let npcsHtml = getSceneNpcs().map(id => {
    const n = NPC_INFO[id];
    if (!n) return '';
    const cls = n.hidden ? ' lt-hidden-npc-chip' : '';
    return `<button class="lt-npc-chip${cls}" data-npc-id="${id}">${n.name}</button>`;
  }).join('');
  if (s.location === 'carriage_7') {
    npcsHtml += '<button class="lt-scene-chip" data-template="我起身穿过过道，走向第七节车厢和第八节车厢之间的连接处。">前往连接处</button>';
  } else if (s.location === 'connector_7_8') {
    npcsHtml += '<button class="lt-scene-chip" data-template="我从连接处回到第七节车厢。">返回第七节车厢</button>';
  }
  npcWrap.innerHTML = npcsHtml;

  // Portrait & dialogue panel
  if (isDialogue) {
    renderPortrait();
    portraitLayer.classList.add('lt-show');
    dialoguePanel.classList.add('lt-show');
    dialogueNpc.textContent = npcName(s.active_npc);
  } else {
    portraitLayer.classList.remove('lt-show');
    dialoguePanel.classList.remove('lt-show');
  }

  // Latest message
  updateLatestMsg();

  // Log drawer toggle button
  if (!document.getElementById('log-toggle')) {
    const btn = document.createElement('button');
    btn.id = 'log-toggle';
    btn.className = 'lt-log-toggle';
    btn.textContent = '📋 对话记录';
    btn.addEventListener('click', function () { logDrawer.classList.add('lt-show'); });
    latestMsg.after(btn);
  }

  // Input placeholder
  inputEl.placeholder = inputPlaceholder();

  // Mode tab active state
  modeTabs.querySelectorAll('[data-mode]').forEach(tab => {
    tab.classList.toggle('lt-active', tab.dataset.mode === (isDialogue ? 'dialogue' : 'action'));
  });

  // Intro overlay
  const showIntro = !s.flags.intro_seen;
  introLayer.classList.toggle('lt-show', showIntro);
  contentEl.style.display = showIntro ? 'none' : '';
  bottomEl.style.display = showIntro ? 'none' : '';
}

function getSceneText() {
  const scene = SCENES[state.location] || {};
  const mem = state.loop > 1 && state.carried_memory.length
    ? `你记得上一轮留下的信息：${state.carried_memory.map(clueName).join('、')}。` : '';
  return `${mem}${scene.text || '1939 年冬，渝江线 307 次夜行列车从重庆驶向江城。窗外远方的火光渐远，车厢里灯光昏黄。'}`;
}

function getSceneNpcs() {
  const base = (SCENES[state.location] || {}).npcs || [];
  const hidden = Object.keys(NPC_INFO).filter(id =>
    NPC_INFO[id].hidden && NPC_INFO[id].location === state.location &&
    (state.flags.visible_hidden_npcs || []).includes(id)
  );
  return [...new Set([...base, ...hidden])];
}

function renderPortrait() {
  if (state.mode === 'dialogue' && state.active_npc) {
    const npc = NPC_INFO[state.active_npc];
    const src = ASSET_BASE + (npc?.portrait || 'xiaoning_portrait.png');
    portraitImg.src = src;
    portraitImg.alt = npc?.name || '';
    portraitImg.onerror = () => { portraitImg.src = ASSET_BASE + 'xiaoning_portrait.png'; };
  }
}

function updateLatestMsg() {
  const playerMsgs = document.querySelectorAll('.lt-dialogue-log .lt-msg-player, .lt-dialogue-log .lt-msg-npc');
  if (playerMsgs.length) {
    const last = playerMsgs[playerMsgs.length - 1];
    latestMsg.innerHTML = last.outerHTML;
    latestMsg.classList.add('lt-show');
  } else if (state.mode !== 'dialogue') {
    latestMsg.classList.remove('lt-show');
  }
}

function inputPlaceholder() {
  if (state.mode === 'dialogue') {
    return `和${npcName(state.active_npc)}说些什么……`;
  }
  return '你要做什么？例如：检查座位下方';
}

// ── Commands ──
function isCommand(text) {
  return /^(查看|打开|结束|进入|重置|失败测试|显示)/.test(text);
}

function handleCommand(text) {
  const t = text.trim();
  const inDialogue = state.mode === 'dialogue';
  const target = inDialogue ? dialogueLog : logEl;

  if (/结束|end/.test(t)) {
    if (inDialogue) endDialogue(); else appendMsg('system', '当前不在对话中。', target);
    return true;
  }
  if (/线索|clue/.test(t)) { showClues(target); return true; }
  if (/人物|npc|角色/.test(t)) {
    appendHtml('system', '<div class="lt-msg-title">人物</div><ul><li>小宁：线索来源，害怕但敏感。</li><li>赵乘警：证据门槛，需要至少两条有效证据。</li><li>沈墨寒：灰大衣男人，制造压力与误导。</li><li>小宁妈妈：隐藏记忆节点，不推进主线。</li></ul>', target);
    return true;
  }
  if (/状态|status/.test(t)) {
    appendHtml('system', `<div class="lt-msg-title">当前状态</div><div>${esc(state.clock)}｜AP ${state.ap_remaining}｜第 ${state.loop} 轮｜${state.mode === 'dialogue' ? '对话：' + npcName(state.active_npc) : '探索'}</div><div class="lt-subtitle">当前目标</div><div>${esc(state._goal || '证明第七节车厢存在异常，并说服赵乘警检查地板。')}</div>`, target);
    return true;
  }
  if (/下一轮|next/.test(t)) {
    if (lastFailure) nextLoop(); else appendMsg('system', '只有失败结算后才能进入下一轮。', target);
    return true;
  }
  if (/重置|reset/.test(t)) { resetGame(); return true; }
  if (/失败|fail|ng/.test(t)) { failLoop(); return true; }
  appendHtml('system', '<div class="lt-msg-title">指令帮助</div><div>可用指令：查看线索、查看人物、查看状态、结束对话、进入下一轮、重置本轮。</div>', target);
  return true;
}

function showClues(target) {
  const clues = state.known_clues.length
    ? state.known_clues.map(id => '<li><strong>' + esc((npcCache?.clue_titles || {})[id] || id) + '</strong></li>').join('')
    : '<li>暂无线索</li>';
  appendHtml('system', '<div class="lt-msg-title">已获得线索</div><ul>' + clues + '</ul>', target);
}

// ── Game actions ──
async function submitInput() {
  const text = inputEl.value.trim();
  if (!text) return;
  inputEl.value = '';
  autoSizeInput();

  const inDialogue = state.mode === 'dialogue';
  appendMsg('player', text, inDialogue ? dialogueLog : logEl);

  if (isCommand(text)) { handleCommand(text); return; }

  if (inDialogue) {
    if (/结束|离开|不聊了/.test(text)) { endDialogue(); return; }
    let llmReply = '';
    if (llmEnabled && llmMode) {
      const llmRes = await api('/llm/npc-reply', { npc_id: state.active_npc, player_text: text, state });
      if (llmRes?.reply) llmReply = llmRes.reply;
    }
    const res = await api('/dialogue/message', { npc_id: state.active_npc, player_text: text, state, llm_reply: llmReply });
    handleResponse(res, true);
  } else {
    const res = await api('/action/commit', { text, state });
    handleResponse(res, false);
  }
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
  ngLayer.classList.remove('lt-show');
  lastFailure = null;
  if (res?.state) state = res.state;
  appendMsg('system', res?.opening || '你回到了 08:45。', logEl);
  dialogueLog.innerHTML = '';
  toast('进入下一轮');
  render();
}

async function resetGame() {
  lastFailure = null;
  state = clone(START_STATE);
  state.flags.intro_seen = false;
  logEl.innerHTML = '';
  dialogueLog.innerHTML = '';
  ngLayer.classList.remove('lt-show');
  portraitLayer.classList.remove('lt-show');
  dialoguePanel.classList.remove('lt-show');
  logDrawer.classList.remove('lt-show');
  latestMsg.classList.remove('lt-show');
  document.activeElement?.blur();
  inputEl.value = '';
  autoSizeInput();
  appendMsg('system', '已重置试玩版。开场背景将重新显示。', logEl);
  render();
}

async function startDialogue(npcId) {
  const res = await api('/dialogue/start', { state, npc_id: npcId });
  handleResponse(res, true);
}

function handleResponse(res, inDialogue) {
  if (!res) return;
  if (res.state) {
    const prevState = prevAudioState || null;
    state = res.state;
    saveState();
    if (prevState) {
      const events = deriveAudioEvents(prevState, state, res);
      if (events.length) AudioManager.dispatchAll(events);
    }
    prevAudioState = clone(state);
  }
  if (res.suggestions !== undefined) state._suggestions = res.suggestions;
  if (res.goal !== undefined) state._goal = res.goal;
  if (res.messages) {
    const target = inDialogue || state.mode === 'dialogue' ? dialogueLog : logEl;
    for (const m of res.messages) {
      if (m.type === 'outcome' && m.html) appendHtml('outcome', m.html, logEl);
      else appendMsg(m.type || 'system', m.text || '', target);
    }
  }
  if (res.dialogue_outcome) renderDialogueOutcome(res.dialogue_outcome);
  if (res.loop_failure_outcome) renderFailureOutcome(res.loop_failure_outcome);
  if (res.trial_success) toast('试玩版成功');
  if (res.memory_node) {
    appendMsg('system', '💭 触发隐藏记忆：' + (res.memory_node.title || ''), dialogueLog);
    showMemoryPortrait(res.memory_node);
  }
  render();
}

function showMemoryPortrait(node) {
  if (!node.portrait) return;
  const prev = portraitImg.src;
  portraitImg.src = ASSET_BASE + node.portrait;
  portraitImg.style.filter = 'sepia(.3) saturate(.8) brightness(1.15)';
  portraitImg.style.opacity = '0';
  requestAnimationFrame(() => {
    portraitImg.style.transition = 'opacity .5s ease';
    portraitImg.style.opacity = '1';
  });
  setTimeout(() => {
    portraitImg.style.opacity = '0';
    setTimeout(() => {
      portraitImg.src = prev;
      portraitImg.style.filter = '';
      portraitImg.style.transition = '';
      portraitImg.style.opacity = '';
    }, 500);
  }, 2000);
}

function renderDialogueOutcome(out) {
  const clues = (out.clues_gained || []).map(x => {
    const c = x.source ? x : {};
    return '<li><strong>' + esc(c.title || clueName(x.id)) + '</strong><br><span class="lt-muted">来源：' + esc(c.source || '未知') + '｜可信度：' + esc(c.confidence || 'unknown') + '</span></li>';
  }).join('') || '<li>没有获得新线索</li>';
  const events = (out.world_events || []).map(x => '<li>' + esc(x) + '</li>').join('') || '<li>世界仍在继续推进</li>';
  const actions = (out.unlocked_actions || []).slice(0, 3).map(x => '<li>' + esc(x.label || '') + '</li>').join('') || '<li>继续观察车厢</li>';
  const turnLine = out.turn_limit ? '｜对话 ' + (out.turns_used || 0) + '/' + out.turn_limit + ' 轮' : '';
  appendHtml('outcome', '<div class="lt-msg-title">对话结算：' + esc(out.npc_name || npcName(out.npc_id)) + '</div><div>AP -' + (out.ap_cost || 0) + '｜' + esc(out.time_advance?.from || '') + ' → ' + esc(out.time_advance?.to || '') + turnLine + '</div><div class="lt-subtitle">获得线索</div><ul>' + clues + '</ul><div class="lt-subtitle">世界推进</div><ul>' + events + '</ul><div class="lt-subtitle">下一步可行动</div><ul>' + actions + '</ul>', logEl);
  dialogueLog.innerHTML = '';
}

function renderFailureOutcome(out) {
  lastFailure = out;
  const facts = (out.confirmed_facts || []).map(x => '<li>' + esc(x.text) + '</li>').join('') || '<li>没有确认事实</li>';
  const sus = (out.suspicions || []).map(x => '<li>' + esc(x.text) + '</li>').join('');
  const sug = (out.next_loop_suggestions || []).map(x => '<li>' + esc(x.label) + '</li>').join('') || '<li>重新规划路线</li>';
  ngBg.style.backgroundImage = 'url(' + ASSET_BASE + 'train_explosion_landscape_concept.png)';
  ngCard.innerHTML = '<div class="lt-ng-title">循环失败</div><div>' + esc(out.failure_reason || '你没能阻止爆炸。') + '</div><div class="lt-subtitle">带入下一轮的记忆</div><ul>' + facts + '</ul>' + (sus ? '<div class="lt-subtitle">疑点</div><ul>' + sus + '</ul>' : '') + '<div class="lt-subtitle">下一轮建议</div><ul>' + sug + '</ul><button class="lt-btn lt-next" id="btn-next-loop">进入第 ' + (Number(out.loop || state.loop) + 1) + ' 轮</button>';
  ngLayer.classList.add('lt-show');
}

// ── UI helpers ──
function appendMsg(type, text, target) {
  const div = document.createElement('div');
  div.className = 'lt-msg lt-msg-' + type;
  div.textContent = text;
  target.appendChild(div);
  scrollBottom(target);
}

function appendHtml(type, html, target) {
  const div = document.createElement('div');
  div.className = 'lt-msg lt-msg-' + type;
  div.innerHTML = html;
  target.appendChild(div);
  scrollBottom(target);
}

function scrollBottom(target) {
  requestAnimationFrame(() => {
    if (target) { target.scrollTop = target.scrollHeight; }
  });
}

function toast(text) {
  const t = document.createElement('div');
  t.className = 'lt-toast';
  t.textContent = text;
  phone.appendChild(t);
  setTimeout(() => t.remove(), 2200);
}

function autoSizeInput() {
  inputEl.style.height = 'auto';
  inputEl.style.height = Math.min(96, inputEl.scrollHeight) + 'px';
}

// ── Engine helpers ──
function clueName(id) { return (npcCache?.clue_titles || {})[id] || id; }
function npcName(id) { return NPC_INFO[id]?.name || id; }
function sceneName(id) { return SCENES[id]?.name || id; }

// ── Persistence ──
const STORAGE_KEY = 'looptrain.standalone.v1';
function saveState() { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (_) {} }
function loadState() {
  try { const raw = localStorage.getItem(STORAGE_KEY); if (raw) state = JSON.parse(raw); } catch (_) {}
  if (!state) { state = clone(START_STATE); return; }
  if (state.mode === 'dialogue') { state.mode = 'explore'; state.active_npc = null; }
}

// ── Audio event mapping ──
function knownCluesIncreased(prev, next) { return (next.known_clues?.length || 0) > (prev.known_clues?.length || 0); }
function crossedLowApThreshold(prev, next) { return (prev.ap_remaining > 3 && next.ap_remaining <= 3); }
function recoveredFromLowAp(prev, next) { return (prev.ap_remaining <= 3 && next.ap_remaining > 3); }
function deriveAudioEvents(prevState, nextState, res) {
  const events = [];
  if (knownCluesIncreased(prevState, nextState)) events.push({ action: 'play', id: 'clue_found' });
  if (crossedLowApThreshold(prevState, nextState)) events.push({ action: 'fadeIn', id: 'faint_ticking_loop' });
  if (recoveredFromLowAp(prevState, nextState)) events.push({ action: 'fadeOut', id: 'faint_ticking_loop' });
  if (res.loop_failure_outcome) {
    events.push({ action: 'fadeOut', id: 'faint_ticking_loop' });
    events.push({ action: 'play', id: 'explosion_muffled' });
  }
  if (res.trial_success) events.push({ action: 'fadeOut', id: 'faint_ticking_loop' });
  return events;
}

// ── Content boot ──
async function bootContent() {
  try {
    const [scenesRes, npcsRes, sessionRes] = await Promise.all([
      api('/scenes'), api('/npcs'), api('/session/init', {}),
    ]);
    if (scenesRes?.scenes) SCENES = scenesRes.scenes;
    if (npcsRes) { if (npcsRes.npc_info) NPC_INFO = npcsRes.npc_info; npcCache = npcsRes; }
    if (sessionRes?.state) {
      START_STATE = clone(sessionRes.state);
      START_STATE._goal = sessionRes.goal || '';
      START_STATE._suggestions = sessionRes.suggestions || [];
    }
    const configRes = await api('/config');
    if (configRes?.llm_enabled) llmEnabled = true;
  } catch (_) {}
}

// ── Utilities ──
function esc(s) {
  const div = document.createElement('div');
  div.textContent = String(s || '');
  return div.innerHTML;
}

// ── Event bindings ──
async function init() {
  await bootContent();
  await AudioManager.init();
  loadState();
  render();

  // Mute toggle
  const muteBtn = document.getElementById('btn-audio-mute');
  if (muteBtn) {
    muteBtn.addEventListener('click', function () {
      const nowMuted = !AudioManager.isMuted();
      AudioManager.setMuted(nowMuted);
      muteBtn.textContent = nowMuted ? '🔇' : '🔊';
      muteBtn.setAttribute('aria-label', nowMuted ? '开启声音' : '关闭声音');
    });
    if (AudioManager.isMuted()) {
      muteBtn.textContent = '🔇';
      muteBtn.setAttribute('aria-label', '开启声音');
    }
  }

  // Input
  $('#btn-send').addEventListener('click', submitInput);
  inputEl.addEventListener('keydown', (ev) => {
    if (ev.key === 'Enter' && !ev.shiftKey) { ev.preventDefault(); submitInput(); }
  });
  inputEl.addEventListener('input', autoSizeInput);

  // Mode tabs (2-tab: 对话 / 行动)
  modeTabs.addEventListener('click', async (ev) => {
    const tab = ev.target.closest('[data-mode]');
    if (!tab) return;

    logDrawer.classList.remove('lt-show');

    const mode = tab.dataset.mode;
    if (mode === 'dialogue') {
      if (state.mode === 'dialogue') return;
      modeTabs.querySelectorAll('[data-mode]').forEach(t => t.classList.toggle('lt-active', t.dataset.mode === 'action'));
      return;
    }

    if (mode === 'action') {
      if (state.mode === 'dialogue') await endDialogue();
      modeTabs.querySelectorAll('[data-mode]').forEach(t => t.classList.toggle('lt-active', t.dataset.mode === 'action'));
      return;
    }
  });

  // Log drawer close
  const logClose = document.getElementById('log-close');
  if (logClose) logClose.addEventListener('click', () => logDrawer.classList.remove('lt-show'));

  // Global click delegation
  document.getElementById('lt-root').addEventListener('click', async (ev) => {
    const npcChip = ev.target.closest('[data-npc-id]');
    if (npcChip) { await startDialogue(npcChip.dataset.npcId); return; }

    const chip = ev.target.closest('[data-template]');
    if (chip) {
      const t = chip.dataset.template;
      if (t === '__END_DIALOGUE__') { await endDialogue(); return; }
      inputEl.value = t;
      autoSizeInput();
      await submitInput();
      return;
    }

    if (ev.target.id === 'intro-start-btn') {
      state.flags.intro_seen = true;
      saveState(state);
      AudioManager.unlock();
      setTimeout(function () { AudioManager.play('rail_loop_low'); }, 200);
      contentEl.style.display = '';
      bottomEl.style.display = '';
      appendMsg('system', '1939 年冬，重庆。日机连日轰炸，渝江线 307 次夜行列车成了离开这座燃烧之城的最后窗口。你在第七节车厢醒来，表面是普通乘客，真实身份是打入敌人内部的地下工作者。口袋里有半张车票、一张写着"不要相信灰大衣"的纸条，以及一枚银色扣子。09:00 前，列车会在北江铁桥前爆炸。', logEl);
      toast('第 1 轮开始');
      render();
      return;
    }

    if (introLayer.classList.contains('lt-show') && ev.target.closest('.lt-intro') && !ev.target.closest('.lt-intro-card')) {
      state.flags.intro_seen = true;
      saveState(state);
      contentEl.style.display = '';
      bottomEl.style.display = '';
      render();
      return;
    }

    if (ev.target.id === 'end-dialogue-btn' || ev.target.closest('#end-dialogue-btn')) {
      if (state.mode === 'dialogue') await endDialogue();
      return;
    }

    if (ev.target.id === 'btn-next-loop') {
      AudioManager.dispatch({ action: 'play', id: 'loop_rewind' });
      await nextLoop();
      return;
    }
  });

  api('/npcs').then(data => { if (data) npcCache = data; });
  api('/health');
}

document.addEventListener('DOMContentLoaded', init);
