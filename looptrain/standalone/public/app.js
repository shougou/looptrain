'use strict';

/* LoopTrain Standalone v0.6.0 Content Extraction — app.js
 * Content loaded from /api/intro and /api/app-strings.
 * Scene-driven layout. Pure vanilla JS. No SillyTavern.
 */

const API_BASE = '/api';
const ASSET_BASE = '/assets/';

// ── Content loaded dynamically ──
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
const goalBarEl = $('.lt-goal-bar');
const goalBarText = $('.lt-goal-bar-text');
const goalBarLoop = $('.lt-goal-bar-loop');
const commandBarEl = $('.lt-command-bar');

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

function s(key) { return (APP_STRINGS && APP_STRINGS[key]) || key; }

// ── Render ──
function render() {
  const s = state;
  const isDialogue = s.mode === 'dialogue';

  document.body.classList.toggle('dialogue-active', isDialogue);

  // Clean up portrait dock when not in dialogue
  if (!isDialogue) {
    var dock = document.querySelector('.lt-portrait-dock');
    if (dock) dock.style.display = '';
  }

  // Topbar: time / loop / location
  topLeft.innerHTML = `第 ${s.loop} 轮 · ${esc(s.clock)}`;
  topRight.innerHTML = `${sceneName(s.location)} · AP ${s.ap_remaining}`;

  // Scene card
  locationEl.textContent = sceneName(s.location);
  sceneText.textContent = getSceneText();
  goalEl.textContent = '当前目标：' + goalDisplayText();

  // Goal bar (v0.7)
  renderGoalBar();
  renderCommandBar();
  let npcsHtml = getSceneNpcs().map(id => {
    const n = NPC_INFO[id];
    if (!n) return '';
    const cls = n.hidden ? ' lt-hidden-npc-chip' : '';
    const verbLabel = id === 'xiaoning' ? '询问小宁' :
                      id === 'zhao_police' ? '说服赵乘警' :
                      id === 'shen_mohan' ? '试探沈墨寒' : n.name;
    return `<button class="lt-npc-chip${cls}" data-npc-id="${id}" data-type="person">${verbLabel}</button>`;
  }).join('');
  if (s.location === 'carriage_2') {
    npcsHtml += '<button class="lt-scene-chip" data-template="我起身穿过过道，走向二号车厢和三号车厢之间的连接处。" data-type="move">前往连接处</button>';
  } else if (s.location === 'connector_2_3') {
    npcsHtml += '<button class="lt-scene-chip" data-template="我从连接处回到二号车厢。" data-type="move">返回二号车厢</button>';
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
    btn.addEventListener('click', function () {
      logDrawer.classList.add('lt-show');
      requestAnimationFrame(() => {
        const log = document.querySelector('.lt-log-drawer .lt-log');
        if (log) {
          if (!log.children.length) {
            const hint = document.createElement('div');
            hint.className = 'lt-msg lt-msg-system';
            hint.textContent = APP_STRINGS.noDialogueRecord || '当前没有对话记录';
            log.appendChild(hint);
          }
          log.scrollTop = log.scrollHeight;
        }
      });
    });
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
  const isDialogue = state.mode === 'dialogue';
  if (playerMsgs.length && !isDialogue) {
    const last = playerMsgs[playerMsgs.length - 1];
    latestMsg.innerHTML = last.outerHTML;
    latestMsg.classList.add('lt-show');
  } else {
    latestMsg.classList.remove('lt-show');
  }
}

function inputPlaceholder() {
  if (state.mode === 'dialogue') {
    return `和${npcName(state.active_npc)}说些什么……`;
  }
  return '你要做什么？例如：检查座位下方';
}

// ── Goal display helpers (v0.7) ──
function goalDisplayText() {
  if (!state._goalData) return state._goal || '证明二号车厢存在异常，并说服赵乘警检查地板。';
  const g = state._goalData;
  if (typeof g === 'string') return g;
  if (g.goals && g.goals.length) return g.goals[0].title || '';
  return state._goal || '';
}

function renderGoalBar() {
  if (!goalBarText || !goalBarLoop) return;
  const text = goalDisplayText();
  goalBarText.textContent = '📋 ' + (text || '当前目标');
  const s = state;
  goalBarLoop.textContent = s.loop > 1 ? '第 ' + s.loop + ' 轮' : '';

  var progressEl = document.querySelector('.lt-goal-progress');
  if (progressEl) {
    var gd = s._goalData;
    if (gd && gd.goals && gd.goals.length) {
      var total = gd.goals.length;
      var checked = gd.goals.filter(function(g) { return g.checked || g.done; }).length;
      if (checked >= 0 && total > 0) {
        progressEl.textContent = checked + '/' + total;
        progressEl.style.display = '';
      } else {
        progressEl.textContent = '';
        progressEl.style.display = 'none';
      }
    } else {
      progressEl.textContent = '';
      progressEl.style.display = 'none';
    }
  }

  // Loop 1 highlight animation
  var loop = s.loop || 1;
  goalBarEl.classList.toggle('lt-goal-highlight', loop === 1);
}

function renderCommandBar() {
  if (!commandBarEl) return;
  const loop = state.loop || 1;
  // 3-loop learning curve: visible loops 1-3, hidden loop 4+
  if (loop <= 3) {
    commandBarEl.style.display = '';
    commandBarEl.classList.toggle('lt-cmd-highlight', loop === 1);
  } else {
    commandBarEl.style.display = 'none';
  }
}

function showGoalFeedback(prevTitle, newTitle, memoryNote) {
  if (!prevTitle || prevTitle === newTitle) return;
  const fb = document.querySelector('.lt-goal-feedback');
  if (!fb) return;

  const titleEl = fb.querySelector('.lt-fb-title');
  const descEl = fb.querySelector('.lt-fb-desc');
  const memoryEl = fb.querySelector('.lt-fb-memory');
  const nextEl = fb.querySelector('.lt-fb-next');

  if (titleEl) titleEl.textContent = '✅ 目标完成';
  if (descEl) descEl.textContent = prevTitle || '';
  if (memoryEl) memoryEl.textContent = memoryNote || '🧠 该信息已加入下一轮记忆';
  if (nextEl) nextEl.textContent = newTitle ? '📋 新目标：' + newTitle : '';

  fb.style.display = '';
  fb.classList.add('lt-fb-show');
  setTimeout(function () {
    fb.classList.remove('lt-fb-show');
    setTimeout(function () { fb.style.display = 'none'; }, 400);
  }, 4000);
}

// ── Commands (v0.7.0 command registry) ──
function matchLocalCommand(text) {
  const t = (text || '').trim();
  if (!t) return null;
  const tl = t.toLowerCase();
  for (const cmd of COMMANDS) {
    for (const trigger of cmd.triggers) {
      if (trigger.toLowerCase() === tl) return cmd;
    }
  }
  for (const cmd of COMMANDS) {
    for (const trigger of cmd.triggers) {
      if (tl.includes(trigger.toLowerCase())) return cmd;
    }
  }
  return null;
}

function handleCommand(text) {
  const t = text.trim();
  const inDialogue = state.mode === 'dialogue';
  const target = inDialogue ? dialogueLog : contentEl;
  const cmd = matchLocalCommand(t);

  if (!cmd) { appendMsg('system', '未知指令。输入"帮助"查看可用指令。', target); return true; }

  switch (cmd.id) {
    case 'view_clues': showClues(target); return true;
    case 'view_characters': showCharacters(target); return true;
    case 'view_status': showStatus(target); return true;
    case 'view_goal': showGoal(target); return true;
    case 'view_memory': showMemory(target); return true;
    case 'view_timeline': showTimeline(target); return true;
    case 'view_beliefs': showBeliefs(target); return true;
    case 'end_dialogue': if (inDialogue) endDialogue(); else appendMsg('system', '当前不在对话中。', target); return true;
    case 'next_loop': if (lastFailure) nextLoop(); else appendMsg('system', '只有失败结算后才能进入下一轮。', target); return true;
    case 'reset_loop': resetLoop(); return true;
    case 'reset_game': if (confirm('确定要重置游戏吗？所有进度将丢失。')) resetGame(); return true;
    case 'ask_xu': showXuPanel(target); return true;
    default: return false;
  }
}

function showClues(target) {
  const clues = state.known_clues.length
    ? state.known_clues.map(id => '<li><strong>' + esc((npcCache?.clue_titles || {})[id] || id) + '</strong></li>').join('')
    : '<li>' + (APP_STRINGS.noClueText || '暂无线索') + '</li>';
  appendHtml('system', '<div class="lt-msg-title">已获得线索</div><ul>' + clues + '</ul>', target);
}

function showCharacters(target) {
  const summaries = APP_STRINGS.npcSummaries || {};
  appendHtml('system', '<div class="lt-msg-title">人物</div><ul><li>' + (summaries.xiaoning || '小宁：线索来源') + '</li><li>' + (summaries.zhao || '赵乘警：证据门槛') + '</li><li>' + (summaries.shen || '沈墨寒：灰大衣男人') + '</li><li>' + (summaries.mother || '小宁妈妈：隐藏记忆节点') + '</li></ul>', target);
}

function showStatus(target) {
  appendHtml('system', '<div class="lt-msg-title">当前状态</div><div>' + esc(state.clock) + '｜AP ' + state.ap_remaining + '｜第 ' + state.loop + ' 轮｜' + (state.mode === 'dialogue' ? '对话：' + npcName(state.active_npc) : '探索') + '</div><div class="lt-subtitle">当前目标</div><div>' + esc(state._goal || '证明二号车厢存在异常，并说服赵乘警检查地板。') + '</div>', target);
}

function showGoal(target) {
  appendHtml('system', '<div class="lt-msg-title">当前任务</div><div>' + esc(state._goal || '证明二号车厢存在异常，并说服赵乘警检查地板。') + '</div>', target);
}

function showMemory(target) {
  if (state.carried_memory && state.carried_memory.length) {
    const items = state.carried_memory.map(function(id) { return '<li>' + esc(clueName(id)) + '</li>'; }).join('');
    appendHtml('system', '<div class="lt-msg-title">跨循环记忆</div><ul>' + items + '</ul>', target);
  } else {
    appendMsg('system', APP_STRINGS.noClueText || '暂无跨循环记忆。', target);
  }
}

function showTimeline(target) {
  appendMsg('system', '时间线功能将在后续版本开放。当前为第 ' + state.loop + ' 轮。', target);
}

function showBeliefs(target) {
  appendMsg('system', '推测功能将在后续版本开放。', target);
}

function showXuPanel(target) {
  var helpText = '';
  if (XU_DIALOGUES && XU_DIALOGUES.templates) {
    var helpTpl = XU_DIALOGUES.templates.find(function(t) { return t.intent === 'command_help'; });
    if (helpTpl) helpText = helpTpl.text;
  }
  if (!helpText) {
    helpText = '你可以随时使用下面的指令。\n\n📋 信息查询：查看线索、查看人物、查看状态、查看任务\n🧠 记忆系统：查看记忆、查看时间线、查看推测\n⚡ 行动指令：结束对话、进入下一轮、重置本轮、重置游戏';
  }
  appendHtml('system', '<div class="lt-msg-title">调查助手：许知微</div><div>' + esc(helpText) + '</div>', target);
}

async function resetLoop() {
  PortraitIntro.reset();
  const res = await api('/session/init', { state: clone(START_STATE) });
  if (res?.state) {
    res.state.flags.intro_seen = true;
    res.state._goal = res.goal || '';
    res.state._suggestions = res.suggestions || [];
    state = res.state;
    logEl.innerHTML = '';
    dialogueLog.innerHTML = '';
    ngLayer.classList.remove('lt-show');
    portraitLayer.classList.remove('lt-show');
    dialoguePanel.classList.remove('lt-show');
    latestMsg.classList.remove('lt-show');
    inputEl.value = '';
    autoSizeInput();
    appendMsg('system', '本轮已重置。', logEl);
    render();
  }
}

// ── Game actions ──
async function submitInput() {
  const text = inputEl.value.trim();
  if (!text) return;
  inputEl.value = '';
  autoSizeInput();

  const inDialogue = state.mode === 'dialogue';
  appendMsg('player', text, inDialogue ? dialogueLog : logEl);

  AudioManager.play('message_sent');

  if (matchLocalCommand(text)) { handleCommand(text); return; }

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
  toast(APP_STRINGS.nextLoopToast || '进入下一轮');
  render();
  setTimeout(function () { showXuWelcome(state.loop); }, 1000);
}

async function resetGame() {
  PortraitIntro.reset();
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
  appendMsg('system', APP_STRINGS.resetToast || '已重置试玩版。开场背景将重新显示。', logEl);
  render();
}

async function startDialogue(npcId) {
  const loop = state.loop || 1;
  const npc = NPC_INFO[npcId];
  if (npc) {
    var portraitSrc = ASSET_BASE + (npc.portrait || 'xiaoning_portrait.png');
    if (PortraitIntro.shouldPlay(npcId, loop)) {
      await PortraitIntro.play({ src: portraitSrc, alt: npc.name || npcId });
      PortraitIntro.markPlayed(npcId, loop);
    } else {
      PortraitIntro.setImage({ src: portraitSrc, alt: npc.name || npcId });
    }
  }
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
  if (res.goal !== undefined) {
    const prevTitle = state._goalData && state._goalData.goals && state._goalData.goals.length
      ? state._goalData.goals[0].title : '';
    state._goalData = res.goal;
    state._goal = res.goal;
    const newTitle = state._goalData && state._goalData.goals && state._goalData.goals.length
      ? state._goalData.goals[0].title : '';
    if (prevTitle && newTitle && prevTitle !== newTitle) {
      showGoalFeedback(prevTitle, newTitle, '🧠 该信息已加入下一轮记忆');
    }
  }
  if (res.messages) {
    const target = inDialogue || state.mode === 'dialogue' ? dialogueLog : logEl;
    for (const m of res.messages) {
      if (m.type === 'outcome' && m.html) appendHtml('outcome', m.html, logEl);
      else appendMsg(m.type || 'system', m.text || '', target);
    }
  }
  if (res.dialogue_outcome) {
    if (res.dialogue_outcome.clues_gained && res.dialogue_outcome.clues_gained.length) {
      showClueBadge(res.dialogue_outcome.clues_gained.length);
    }
    renderDialogueOutcome(res.dialogue_outcome);
  }
  if (res.loop_failure_outcome) renderFailureOutcome(res.loop_failure_outcome);
  if (res.trial_success) toast(APP_STRINGS.trialSuccessToast || '试玩版成功');
  if (res.memory_node) {
    appendMsg('system', '💭 触发隐藏记忆：' + (res.memory_node.title || ''), dialogueLog);
    showMemoryPortrait(res.memory_node);
  }
  render();
}

function showMemoryPortrait(node) {
  if (!node.portrait) return;
  PortraitIntro.setImage({ src: ASSET_BASE + node.portrait, alt: node.name || '' });
  var dockImg = document.querySelector('.lt-portrait-dock img');
  if (!dockImg) return;
  dockImg.style.filter = 'sepia(.3) saturate(.8) brightness(1.15)';
  dockImg.style.opacity = '0';
  requestAnimationFrame(function () {
    dockImg.style.transition = 'opacity .5s ease';
    dockImg.style.opacity = '1';
  });
  setTimeout(function () {
    dockImg.style.opacity = '0';
    setTimeout(function () {
      dockImg.style.filter = '';
      dockImg.style.transition = '';
      dockImg.style.opacity = '';
    }, 500);
  }, 2000);
}

function renderDialogueOutcome(out) {
  const clues = (out.clues_gained || []).map(x => {
    const c = x.source ? x : {};
    return '<li><strong>' + esc(c.title || clueName(x.id)) + '</strong><br><span class="lt-muted">来源：' + esc(c.source || '未知') + '｜可信度：' + esc(c.confidence || 'unknown') + '</span></li>';
  }).join('') || '<li>' + (APP_STRINGS.noNewClues || '没有获得新线索') + '</li>';
  const events = (out.world_events || []).map(x => '<li>' + esc(x) + '</li>').join('') || '<li>' + (APP_STRINGS.noWorldEvents || '世界仍在继续推进') + '</li>';
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

function showClueBadge(count) {
  const badge = document.createElement('div');
  badge.className = 'lt-clue-badge';
  badge.textContent = '🧩 线索 +' + count;
  phone.appendChild(badge);
  setTimeout(function () { badge.remove(); }, 3000);
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
  if (!state._goalData && state._goal) state._goalData = state._goal;
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

// ── Intro rendering ──
function renderIntro(data) {
  if (!data) return;
  INTRO_DATA = data;
  const kickerEl = document.querySelector('.lt-intro-kicker');
  const titleEl = document.querySelector('.lt-intro-title');
  const stepsEl = document.querySelector('.lt-intro-steps');
  const memoryEl = document.querySelector('.lt-intro-memory');
  const btnEl = document.getElementById('intro-start-btn');
  const skipEl = document.querySelector('.lt-intro-skip');

  if (kickerEl) kickerEl.textContent = data.kicker || '';
  if (titleEl) titleEl.textContent = data.title || '';
  if (stepsEl && Array.isArray(data.steps)) {
    stepsEl.innerHTML = data.steps.map(function(s) {
      return '<div><strong>' + esc(s.role) + '</strong><span>' + esc(s.text) + '</span></div>';
    }).join('');
  }
  if (memoryEl) memoryEl.textContent = data.memory || '';
  if (btnEl) btnEl.textContent = data.buttonLabel || '进入二号车厢';
  if (skipEl) skipEl.textContent = data.skipLabel || '点击任意位置跳过';
}

// ── Content boot ──
async function bootContent() {
  try {
    // Load game data
    const [scenesRes, npcsRes, sessionRes] = await Promise.all([
      api('/scenes'), api('/npcs'), api('/session/init', {}),
    ]);
    if (scenesRes?.scenes) SCENES = scenesRes.scenes;
    if (npcsRes) { if (npcsRes.npc_info) NPC_INFO = npcsRes.npc_info; npcCache = npcsRes; }
    if (sessionRes?.state) {
      START_STATE = clone(sessionRes.state);
      START_STATE._goal = sessionRes.goal || '';
      START_STATE._goalData = sessionRes.goal || '';
      START_STATE._suggestions = sessionRes.suggestions || [];
    }
    // Load content strings
    const [introRes, stringsRes, configRes, commandsRes] = await Promise.all([
      api('/intro'), api('/app-strings'), api('/config'), api('/commands'),
    ]);
    if (introRes) renderIntro(introRes);
    if (stringsRes) APP_STRINGS = stringsRes;
    if (configRes?.llm_enabled) llmEnabled = true;
    if (commandsRes?.commands) COMMANDS = commandsRes.commands;
    // Xu Zhiwei dialogue (non-blocking)
    api('/xu-dialogue').then(function(d) { if (d) XU_DIALOGUES = d; }).catch(function() {});
  } catch (_) {}
}

// ── Utilities ──
function esc(s) {
  const div = document.createElement('div');
  div.textContent = String(s || '');
  return div.innerHTML;
}

async function showXuWelcome(loop) {
  var text = '';
  if (XU_DIALOGUES && XU_DIALOGUES.templates) {
    var tpl;
    if (loop === 1) tpl = XU_DIALOGUES.templates.find(function(t) { return t.intent === 'welcome_first'; });
    else if (loop === 2) tpl = XU_DIALOGUES.templates.find(function(t) { return t.intent === 'welcome_loop2'; });
    else tpl = XU_DIALOGUES.templates.find(function(t) { return t.intent === 'welcome_loop3'; });
    if (tpl) text = tpl.text;
  }
  if (!text) text = '我是许知微。有什么需要帮助的吗？';

  // Play portrait intro animation before showing text
  var dock = document.querySelector('.lt-portrait-dock');
  if (dock) dock.style.display = 'block';
  await PortraitIntro.play({
    src: ASSET_BASE + 'xuzhiwei_portrait.png',
    alt: '许知微',
    holdMs: 400,
    durationMs: 700,
  });
  if (dock) dock.style.display = '';

  appendHtml('system', '<div class="lt-msg-title">许知微</div><div>' + esc(text) + '</div>', contentEl);
  scrollBottom(contentEl);
}

// ── Event bindings ──
async function init() {
  await bootContent();
  await AudioManager.init();
  loadState();
  render();

  // Xu Zhiwei proactive welcome triggers when intro is dismissed (see intro-start-btn handler)

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

  // Command bar buttons (v0.7)
  if (commandBarEl) {
    commandBarEl.addEventListener('click', function (ev) {
      const btn = ev.target.closest('.lt-cmd-btn');
      if (!btn) return;
      const cmdId = btn.dataset.cmd;
      const cmdMap = { view_clues: '查看线索', view_characters: '查看人物', view_memory: '查看记忆', ask_xu: '帮助' };
      const triggerText = cmdMap[cmdId] || cmdId;
      inputEl.value = triggerText;
      autoSizeInput();
      submitInput();
    });
  }

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
      setTimeout(function () { showXuWelcome(state.loop); }, 2000);
      const startMsg = (INTRO_DATA && INTRO_DATA.gameStartMessage) || '1939 年冬，重庆。日机连日轰炸，渝江线 307 次夜行列车成了离开这座燃烧之城的最后窗口。你在二号车厢醒来，表面是普通乘客，真实身份是打入敌人内部的地下工作者。口袋里有半张车票、一张写着"不要相信灰大衣"的纸条，以及一枚银色扣子。09:00 前，列车会在北江铁桥前爆炸。';
      appendMsg('system', startMsg, logEl);
      toast(APP_STRINGS.gameStartToast || '第 1 轮开始');
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
