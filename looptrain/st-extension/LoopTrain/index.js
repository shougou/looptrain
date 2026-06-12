/* LoopTrain Game Mode for SillyTavern
 * v0.4.3 - LLM raw bridge and fixed extension asset path.
 * It keeps ST core endpoints intact. Game state is stored in chatMetadata.looptrain when available.
 */
(function () {
  'use strict';

  const EXT = 'LoopTrain';
  const VERSION = '0.4.3';
  const API_BASE = '/api/plugins/looptrain';
  // ST dynamically loads extensions; document.currentScript is unreliable here.
  // Third-party extensions are served from this stable URL path.
  const ASSET_BASE = '/scripts/extensions/third-party/LoopTrain/';
  const NG_BG = 'train_explosion_landscape_concept.png';
  const MODULE_NAME = 'looptrain';
  const DEFAULT_SETTINGS = Object.freeze({
    llm_reply_source: 'st_llm', // mock | st_llm
    st_quiet_prompt: true,
    sanitize_llm_output: true,
    game_shell: false,
    auto_open_game_shell: false,
  });
  let settings = { ...DEFAULT_SETTINGS };
  let stGenerateRaw = null;


  const local = {
    startState: {
      episode_id: 'trial_001', mode: 'explore', input_channel: 'roleplay', loop: 1, clock: '08:45', ap_remaining: 10,
      location: 'carriage_7', active_npc: null, known_clues: ['gray_coat_note_pressure'], carried_memory: [], unlocked_actions: [], dialogue_session: null,
      npc_states: {
        xiaoning: { trust: 20, fear: 45, suspicion: 0 },
        zhao_police: { trust: 0, suspicion: 15, requires_evidence: true },
        shen_mohan: { trust: -10, suspicion: 35, composure: 80 },
        xiaoning_mother_hidden: { trust: 0, fear: 0, visibility: 'hidden' },
      },
      flags: { intro_seen: false, roleplay_hint_seen: false, command_hint_seen: false, zhao_checked_floor: false, trial_success: false, xiaoning_mother_memory_triggered: false, shen_connector_hint_seen: false, visible_hidden_npcs: [] },
    },
    npcs: {
      xiaoning: { name: '小宁', cost: 3, turnLimit: 10, nearLimitHintAt: 8, turnLimitPolicy: 'soft_close', portrait: 'xiaoning_portrait.png', nearLimitHint: '小宁低头看了看窗外，像是不想再说太久。你感觉接下来最好问关键问题。', limitMessage: '小宁把布娃娃抱得更紧，轻轻摇了摇头。她暂时不愿意再说了。', suggestions: [
        ['温和询问', '我压低声音，温和地问她：你刚才是不是听到了什么？'],
        ['提到滴答声', '我轻声说：我也听见了那个滴答声，它是不是从下面传来的？'],
        ['问布娃娃', '我看着她怀里的布娃娃，轻声问：这是你妈妈给你的吗？'],
        ['结束对话', '__END_DIALOGUE__'],
      ] },
      zhao_police: { name: '赵乘警', cost: 3, turnLimit: 8, nearLimitHintAt: 6, turnLimitPolicy: 'evidence_gate', portrait: 'zhao_police_portrait.png', nearLimitHint: '赵乘警看了一眼怀表：“我不能一直听你讲推测。你最好拿出能查证的证据。”', limitMessage: '赵乘警打断你：“如果没有新的证据，我不能继续陪你浪费时间。”', suggestions: [
        ['报告异常', '我压低声音告诉赵乘警：第七节车厢有异常声音，我需要你检查地板。'],
        ['展示证据', '我把目前获得的线索逐条告诉赵乘警，请他亲自听一听地板下方的声音。'],
        ['请求检查地板', '我请求赵乘警不要惊动乘客，只检查第七节车厢地板和连接处。'],
        ['结束对话', '__END_DIALOGUE__'],
      ] },
      shen_mohan: { name: '沈墨寒', cost: 3, turnLimit: 8, nearLimitHintAt: 6, turnLimitPolicy: 'risk_escalation', portrait: 'shen_mohan_portrait.png', nearLimitHint: '沈墨寒的眼神冷了下来。你意识到，他不是在回答你，而是在反过来确认你的身份。', limitMessage: '沈墨寒微微侧过身，声音很低：“你问得太多了。”', suggestions: [
        ['反问试探', '我看着沈墨寒的眼睛，反问他：你刚才为什么一直盯着第七节车厢的连接处？'],
        ['提到灰大衣纸条', '我没有拿出纸条，只试探地说：有人提醒我，不要相信灰大衣。'],
        ['提到口琴声', '我故意说：餐车那段口琴声，你也听见了吧？'],
        ['结束对话', '__END_DIALOGUE__'],
      ] },
      xiaoning_mother_hidden: { name: '小宁妈妈', cost: 0, turnLimit: 2, nearLimitHintAt: 1, turnLimitPolicy: 'memory_once', portrait: 'xiaoning_mother_portrait.png', hidden: true, opening: '你听见小宁怀里的布娃娃里，像有一个温柔的声音隔着旧布料传来：“别吓着她。”', suggestions: [['结束对话', '__END_DIALOGUE__']] },
    },
    clueDetails: {
      gray_coat_note_pressure: { id: 'gray_coat_note_pressure', title: '不要相信灰大衣', source: '开场纸条', confidence: 'medium', usable_with: ['shen_mohan','self_reasoning'], carry_to_next_loop: true },
      xiaoning_heard_ticking: { id: 'xiaoning_heard_ticking', title: '小宁也听见过声音', source: '小宁对话', confidence: 'high', usable_with: ['zhao_police','xiaoning'], carry_to_next_loop: true },
      ticking_under_floor: { id: 'ticking_under_floor', title: '地板下方的滴答声', source: '小宁对话', confidence: 'high', usable_with: ['zhao_police','shen_mohan','connector'], carry_to_next_loop: true },
      sound_not_from_seat: { id: 'sound_not_from_seat', title: '声音不来自座位下方', source: '玩家检查', confidence: 'high', usable_with: ['zhao_police'], carry_to_next_loop: true },
      suspicious_connector_movement: { id: 'suspicious_connector_movement', title: '连接处有人停留过', source: '沈墨寒对话', confidence: 'medium', usable_with: ['zhao_police','shen_mohan'], carry_to_next_loop: true },
      mother_doll_memory: { id: 'mother_doll_memory', title: '小宁妈妈与布娃娃', source: '隐藏记忆节点', confidence: 'high', usable_with: ['xiaoning'], carry_to_next_loop: true },
      harmonica_from_dining_car: { id: 'harmonica_from_dining_car', title: '餐车方向的口琴声', source: '世界事件', confidence: 'low', usable_with: ['shen_mohan','self_reasoning'], carry_to_next_loop: true },
      zhao_requires_evidence: { id: 'zhao_requires_evidence', title: '赵乘警需要证据才会行动', source: '赵乘警反馈', confidence: 'high', usable_with: ['zhao_police','self_planning'], carry_to_next_loop: true },
    },
  };
  local.scenes = {
    carriage_7: { name: '第七节车厢', npcs: ['xiaoning','zhao_police'], text: '列车第七节车厢灯光昏黄。窗外，重庆方向的火光已经渐远。乘客们神色紧张，各自拥着行李。小宁抱着旧布娃娃坐在靠窗位置，赵乘警正在过道里查票。地板下方似乎藏着很轻的滴答声。' },
    connector_7_8: { name: '连接处', npcs: ['shen_mohan'], text: '第七节车厢与第八节车厢之间的连接处。冷风从缝隙中灌入，列车晃动时铁板发出沉闷的声响。灰大衣的沈墨寒站在这里，像是在等人，又像是在观察着什么。远处偶尔还能听见防空警报的余音。' },
  };
  // Assign NPC locations
  local.npcs.xiaoning.location = 'carriage_7';
  local.npcs.zhao_police.location = 'carriage_7';
  local.npcs.shen_mohan.location = 'connector_7_8';
  local.npcs.xiaoning_mother_hidden.location = 'carriage_7';

  local.clueTitles = Object.fromEntries(Object.values(local.clueDetails).map(x => [x.id, x.title]));

  let root, phone, log, dialogueLog, portraitImg, input, suggestions, topbar, ngLayer, sceneText, npcWrap, goalEl, channelTabs, introLayer, locationEl, micBtn;
  let useRemote = false;
  let lastFailure = null;
  let memoryPortraitTimer = null;
  let thinkingEl = null;
  let introRollingTimer = null;
  let csrfToken = null;
  let recognition = null;
  let voiceInputBase = '';
  let state = clone(local.startState);

  function clone(x) { return JSON.parse(JSON.stringify(x)); }
  function unique(arr) { return [...new Set((arr || []).filter(Boolean))]; }
  function hasST() { return !!(window.SillyTavern && window.SillyTavern.getContext); }
  function ctx() { try { return hasST() ? window.SillyTavern.getContext() : null; } catch (_) { return null; } }
  function loadSettings() {
    const c = ctx();
    const ext = c?.extensionSettings;
    if (ext) {
      ext[MODULE_NAME] = Object.assign({}, DEFAULT_SETTINGS, ext[MODULE_NAME] || {});
      settings = ext[MODULE_NAME];
    } else {
      try { settings = Object.assign({}, DEFAULT_SETTINGS, JSON.parse(localStorage.getItem('looptrain.settings') || '{}')); }
      catch (_) { settings = { ...DEFAULT_SETTINGS }; }
    }
    // Force ST LLM as the only reply source. Previous 'mock' values are not supported in player UI.
    settings.llm_reply_source = 'st_llm';
    // Game Shell is runtime-only. Do not restore it from previous sessions.
    // Otherwise / would keep covering ST after a previous game run.
    settings.game_shell = false;
    settings.auto_open_game_shell = false;
    return settings;
  }
  function saveSettings() {
    const c = ctx();
    const persistable = Object.assign({}, settings, { game_shell: false, auto_open_game_shell: false });
    if (c?.extensionSettings) {
      c.extensionSettings[MODULE_NAME] = persistable;
      if (typeof c.saveSettingsDebounced === 'function') c.saveSettingsDebounced();
    } else {
      localStorage.setItem('looptrain.settings', JSON.stringify(persistable));
    }
    render();
  }

  function isGameShellRequested() {
    const q = new URLSearchParams(window.location.search || '');
    return q.get('looptrain') === 'game' || window.location.hash === '#looptrain' || window.location.hash === '#looptrain-game';
  }

  function applyGameShell(enabled) {
    const on = !!enabled;
    settings.game_shell = on;
    document.body.classList.toggle('lt-game-shell', on);
    if (root) {
      root.classList.toggle('lt-game-shell-root', on);
      if (on) root.classList.remove('lt-hidden');
    }
    if (on && phone) {
      phone.style.height = window.innerHeight + 'px';
    }
    render();
  }

  function openLoopTrain(manual = true) {
    if (!root) return;
    if (manual) root.dataset.manuallyOpened = 'true';
    root.classList.remove('lt-hidden');
    applyGameShell(true);
    render();
  }

  function closeToAdminSetup() {
    settings.game_shell = false;
    document.body.classList.remove('lt-game-shell');
    if (root) {
      root.classList.remove('lt-game-shell-root');
      root.classList.add('lt-hidden');
      delete root.dataset.manuallyOpened;
    }
    saveSettings();
    toast('已退出 LoopTrain Game Shell。现在可以操作 SillyTavern 设置。');
  }
  function getMeta() {
    const c = ctx();
    if (!c || !c.chatMetadata) return null;
    c.chatMetadata.looptrain = c.chatMetadata.looptrain || clone(local.startState);
    return c.chatMetadata.looptrain;
  }
  function saveState(next, options = {}) {
    state = normalizeState(next || state);
    const c = ctx();
    if (c && c.chatMetadata) {
      c.chatMetadata.looptrain = state;
      if (!options.skipPersist && typeof c.saveMetadata === 'function') c.saveMetadata();
    }
    render();
  }
  function loadState() {
    const meta = getMeta();
    state = normalizeState(meta || clone(local.startState));
  }
  function normalizeState(s) {
    const merged = Object.assign(clone(local.startState), s || {});
    merged.npc_states = Object.assign(clone(local.startState.npc_states), s?.npc_states || {});
    merged.flags = Object.assign(clone(local.startState.flags), s?.flags || {});
    merged.flags.visible_hidden_npcs = unique(merged.flags.visible_hidden_npcs);
    if (merged.flags.xiaoning_mother_memory_triggered) unlockHiddenNpc(merged, 'xiaoning_mother_hidden');
    merged.known_clues = unique(merged.known_clues || []);
    merged.carried_memory = unique(merged.carried_memory || []);
    merged.unlocked_actions = merged.unlocked_actions || [];
    merged.input_channel = merged.input_channel || 'roleplay';
    return merged;
  }
  function clueName(id) { return local.clueDetails?.[id]?.title || local.clueTitles?.[id] || id; }
  function clueDetail(id) { return local.clueDetails?.[id] || { id, title: clueName(id), source: '未知', confidence: 'unknown', usable_with: [], carry_to_next_loop: false }; }
  function currentGoal() { const evidence = countValidEvidence(state); if (state.flags.trial_success) return '试玩版已完成：你证明了第七节车厢存在异常。'; if (evidence >= 2) return '证据已足够。现在可以尝试说服赵乘警检查地板。'; if (evidence === 1) return '你已经获得 1 条有效证据，还需要更多证据说服赵乘警。'; return '证明第七节车厢存在异常，并说服赵乘警检查地板。'; }
  function npcName(id) { return local.npcs[id]?.name || id; }
  function portraitFor(npcId) { return local.npcs[npcId]?.portrait || local.npcs.xiaoning.portrait; }
  function assetUrl(name) { return ASSET_BASE + name; }
  function sceneName(id) { return local.scenes[id]?.name || id; }
  function isHiddenNpcVisible(s, npcId) { return unique(s.flags?.visible_hidden_npcs).includes(npcId) || !!s.flags?.xiaoning_mother_memory_triggered; }
  function unlockHiddenNpc(s, npcId) { s.flags.visible_hidden_npcs = unique([...(s.flags.visible_hidden_npcs || []), npcId]); }
  function sceneNpcs() {
    const base = local.scenes[state.location]?.npcs || [];
    const hidden = Object.keys(local.npcs).filter(id => local.npcs[id]?.hidden && local.npcs[id]?.location === state.location && isHiddenNpcVisible(state, id));
    return unique([...base, ...hidden]);
  }

  async function checkRemote() {
    try {
      const r = await fetch(`${API_BASE}/health`, { cache: 'no-store' });
      const j = await r.json();
      useRemote = !!j.ok;
    } catch (_) { useRemote = false; }
  }
  async function getCsrfToken() {
    if (csrfToken) return csrfToken;
    try {
      const r = await fetch('/csrf-token', { credentials: 'same-origin' });
      if (r.ok) {
        const j = await r.json();
        csrfToken = j.token;
        return csrfToken;
      }
    } catch (_) { /* no CSRF endpoint — server may have it disabled */ }
    return null;
  }
  async function api(route, body) {
    if (!useRemote) return null;
    try {
      const headers = { 'Content-Type': 'application/json' };
      const token = await getCsrfToken();
      if (token) headers['X-CSRF-Token'] = token;
      const r = await fetch(`${API_BASE}${route}`, {
        method: 'POST', credentials: 'same-origin', headers, body: JSON.stringify(body || {}),
      });
      // Retry once with fresh token on 403
      if (r.status === 403) {
        csrfToken = null;
        const token2 = await getCsrfToken();
        if (token2) {
          headers['X-CSRF-Token'] = token2;
          const r2 = await fetch(`${API_BASE}${route}`, {
            method: 'POST', credentials: 'same-origin', headers, body: JSON.stringify(body || {}),
          });
          if (!r2.ok) throw new Error(`${r2.status}`);
          return await r2.json();
        }
        throw new Error('403');
      }
      if (!r.ok) throw new Error(`${r.status}`);
      return await r.json();
    } catch (e) {
      console.warn(`[${EXT}] remote API failed, fallback local`, e);
      useRemote = false;
      return null;
    }
  }

  function createUI() {
    if (document.getElementById('looptrain-root')) return;
    root = document.createElement('div');
    root.id = 'looptrain-root';
    root.classList.add('lt-hidden');
    root.innerHTML = `
      <div class="lt-shell">
        <div class="lt-phone">
          <div class="lt-stage"></div>
          <div class="lt-topbar"></div>
          <div class="lt-content">
            <div class="lt-card lt-scene-card">
              <div class="lt-location">第七节车厢</div>
              <div class="lt-scene-text"></div>
              <div class="lt-current-goal"></div>
              <div class="lt-visible-npcs"></div>
            </div>
            <div class="lt-log"></div>
          </div>
          <div class="lt-portrait-layer"><img class="lt-portrait" alt="NPC portrait" /></div>
          <div class="lt-dialogue-panel"><div class="lt-log lt-dialogue-log"></div><div class="lt-dialogue-end"><button class="lt-end-dialogue-btn" data-lt-action="end-dialogue">结束对话</button></div></div>
          <div class="lt-ng"><div class="lt-ng-bg"></div><div class="lt-ng-card"></div></div>
          <div class="lt-intro">
            <div class="lt-intro-card">
              <div class="lt-intro-kicker">渝江线 307 次｜1939 年冬</div>
              <div class="lt-intro-title">第七节车厢</div>
              <div class="lt-intro-steps">
                <div><strong>重庆</strong><span>日机轰炸不断。渝江线 307 次夜行列车，是离开这座燃烧之城最后的窗口。</span></div>
                <div><strong>身份</strong><span>普通乘客只是伪装，你携带绝密情报前往江城。</span></div>
                <div><strong>接头</strong><span>代号"扣子"的同志会在列车上出现。</span></div>
                <div><strong>危机</strong><span>09:00 前，列车将在北江铁桥前爆炸。</span></div>
              </div>
              <p class="lt-intro-memory">你只记得爆炸前最后听见的声音——第七节车厢地板下方，传来一阵极轻的滴答声。</p>
              <button class="lt-intro-btn" data-lt-action="intro-start">进入第七节车厢</button>
            </div>
            <div class="lt-intro-skip">点击任意位置跳过</div>
          </div>
          <div class="lt-bottom">
            <div class="lt-channel-tabs">
              <button class="lt-channel-tab" data-channel="roleplay">扮演<span>对话</span></button>
              <button class="lt-channel-tab" data-channel="command">指令<span>行动</span></button>
            </div>
            <div class="lt-suggestions"></div>
            <div class="lt-input-row">
              <textarea class="lt-input" rows="1"></textarea>
              <button class="lt-btn lt-btn-mic" title="语音输入">🎙️</button>
              <button class="lt-btn lt-btn-send">发送</button>
            </div>
          </div>
        </div>
      </div>`;
    document.body.appendChild(root);
    phone = root.querySelector('.lt-phone');
    log = root.querySelector('.lt-content .lt-log');
    dialogueLog = root.querySelector('.lt-dialogue-log');
    portraitImg = root.querySelector('.lt-portrait');
    input = root.querySelector('.lt-input');
    suggestions = root.querySelector('.lt-suggestions');
    topbar = root.querySelector('.lt-topbar');
    ngLayer = root.querySelector('.lt-ng');
    locationEl = root.querySelector('.lt-location');
    sceneText = root.querySelector('.lt-scene-text');
    npcWrap = root.querySelector('.lt-visible-npcs');
    goalEl = root.querySelector('.lt-current-goal');
    channelTabs = root.querySelector('.lt-channel-tabs');
    introLayer = root.querySelector('.lt-intro');
    micBtn = root.querySelector('.lt-btn-mic');

    initVoiceInput();

    root.querySelector('.lt-btn-send').addEventListener('click', submitInput);
    input.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter' && !ev.shiftKey) { ev.preventDefault(); submitInput(); }
    });
    root.addEventListener('click', async (ev) => {
      const npcChip = ev.target.closest('[data-npc-id]');
      if (npcChip) {
        const res = await api('/dialogue/start', { state, npc_id: npcChip.dataset.npcId }) || localStartDialogue(state, npcChip.dataset.npcId);
        handleEngineResponse(res, true);
        return;
      }
      const chip = ev.target.closest('[data-template]');
      if (chip) {
        const t = chip.dataset.template;
        if (t === '__END_DIALOGUE__') return endDialogue();
        input.value = t;
        autoSizeInput();
        // Action chips are game commands, not text snippets. Execute immediately.
        await submitInput();
        return;
      }
      const tab = ev.target.closest('[data-channel]');
      if (tab) {
        state.input_channel = tab.dataset.channel === 'command' ? 'command' : 'roleplay';
        if (state.input_channel === 'command' && !state.flags.command_hint_seen) {
          state.flags.command_hint_seen = true;
          toast('指令不会被 NPC 听见，可用于查看线索、结束对话或进入下一轮。');
        }
        if (state.input_channel === 'roleplay' && !state.flags.roleplay_hint_seen) {
          state.flags.roleplay_hint_seen = true;
          toast('扮演输入会进入故事：探索时描述行动，对话时就是你的台词。');
        }
        saveState(state);
        input.focus();
        return;
      }
      if (introLayer && introLayer.classList.contains('lt-intro-rolling') && ev.target.closest('.lt-intro')) {
        introLayer.classList.remove('lt-intro-rolling');
        clearTimeout(introRollingTimer);
        introRollingTimer = null;
        return;
      }
      const mini = ev.target.closest('[data-lt-action]');
      if (mini) {
        if (mini.dataset.ltAction === 'end-dialogue') {
          if (state.mode === 'dialogue') endDialogue();
          return;
        }
        if (mini.dataset.ltAction === 'intro-start') {
          state.flags.intro_seen = true;
          saveState(state);
          appendMessage('system', openingSceneText(), log);
          toast('第 1 轮开始');
        }
      }
      const next = ev.target.closest('[data-lt-next-loop]');
      if (next) nextLoop();
    });
    input.addEventListener('input', autoSizeInput);

    const showBtn = document.createElement('button');
    showBtn.textContent = '进入 LoopTrain';
    showBtn.id = 'looptrain-show-btn';
    showBtn.style.cssText = 'position:fixed;right:12px;bottom:12px;z-index:4999;border:1px solid rgba(214,168,90,.45);background:rgba(10,12,18,.85);color:#f0dfb7;border-radius:999px;padding:8px 12px;cursor:pointer;';
    showBtn.onclick = () => openLoopTrain(true);
    document.body.appendChild(showBtn);
  }

  function autoSizeInput() {
    if (!input) return;
    input.style.height = 'auto';
    input.style.height = Math.min(96, input.scrollHeight) + 'px';
  }

  function render() {
    if (!root) return;
    phone.classList.toggle('lt-dialogue', state.mode === 'dialogue');
    phone.classList.toggle('lt-command-mode', state.input_channel === 'command');
    topbar.innerHTML = `<span><strong>${escapeHtml(state.clock)}</strong>｜AP ${state.ap_remaining}｜第 ${state.loop} 轮</span><span class="lt-mode-pill">${state.mode === 'dialogue' ? '对话：' + npcName(state.active_npc) : '探索'}｜${state.input_channel === 'command' ? '指令' : '扮演'}</span>`;
    document.body.classList.toggle('lt-game-shell', !!settings.game_shell);
    if (root) root.classList.toggle('lt-game-shell-root', !!settings.game_shell);
    if (channelTabs) {
      channelTabs.querySelectorAll('[data-channel]').forEach(btn => btn.classList.toggle('lt-active', btn.dataset.channel === state.input_channel));
    }
    if (introLayer) {
      const showIntro = !state.flags.intro_seen;
      introLayer.classList.toggle('lt-show', showIntro);
      if (showIntro) {
        introLayer.classList.add('lt-intro-rolling');
        const card = introLayer.querySelector('.lt-intro-card');
        clearTimeout(introRollingTimer);
        const finish = () => {
          introLayer.classList.remove('lt-intro-rolling');
          introRollingTimer = null;
        };
        card.onanimationend = finish;
        introRollingTimer = setTimeout(finish, 8000);
      } else {
        introLayer.classList.remove('lt-intro-rolling');
        clearTimeout(introRollingTimer);
        introRollingTimer = null;
      }
    }
    sceneText.textContent = getSceneText();
    if (locationEl) locationEl.textContent = sceneName(state.location);
    if (goalEl) goalEl.textContent = '当前目标：' + currentGoal();
    npcWrap.innerHTML = sceneNpcs().map(npcId => {
      const n = local.npcs[npcId];
      if (!n) return '';
      const hiddenClass = n.hidden ? ' lt-hidden-npc-chip' : '';
      return `<button class="lt-npc-chip${hiddenClass}" data-npc-id="${npcId}">${n.name}</button>`;
    }).join('') + getSceneTransitions();
    input.placeholder = inputPlaceholder();
    renderSuggestions();
    renderPortrait();
  }

  function openingSceneText() {
    return '1939 年冬，重庆。日机连日轰炸，渝江线 307 次夜行列车成了离开这座燃烧之城的最后窗口。你在第七节车厢醒来，表面是普通乘客，真实身份是打入敌人内部的地下工作者。口袋里有半张车票、一张写着"不要相信灰大衣"的纸条，以及一枚银色扣子。09:00 前，列车会在北江铁桥前爆炸。';
  }

  function inputPlaceholder() {
    if (state.input_channel === 'command') {
      return state.mode === 'dialogue'
        ? '输入指令：结束对话 / 查看线索 / 查看状态……'
        : '输入指令：查看线索 / 查看人物 / 进入下一轮 / 重置本轮……';
    }
    return state.mode === 'dialogue' ? `对${npcName(state.active_npc)}说些什么……` : '描述你的行动……';
  }

  function getSceneText() {
    if (state.mode === 'dialogue') return `你正在与${npcName(state.active_npc)}交谈。世界没有停下，你必须从对话里得到可行动的信息。`;
    const scene = local.scenes[state.location] || {};
    const mem = state.loop > 1 && state.carried_memory.length ? `你记得上一轮留下的信息：${state.carried_memory.map(clueName).join('、')}。` : '';
    return `${mem}${scene.text || '1939 年冬，渝江线 307 次夜行列车从重庆驶向江城。窗外远方的火光渐远，车厢里灯光昏黄。'}`;
  }
  function getSceneTransitions() {
    const loc = state.location || 'carriage_7';
    if (loc === 'carriage_7') {
      return '<button class="lt-scene-chip" data-template="我起身穿过过道，走向第七节车厢和第八节车厢之间的连接处。">前往连接处</button>';
    }
    return '<button class="lt-scene-chip" data-template="我从连接处回到第七节车厢。">返回第七节车厢</button>';
  }

  function renderSuggestions() {
    const arr = getSuggestions();
    suggestions.innerHTML = arr.map(s => `<button class="lt-chip ${s.template === '__END_DIALOGUE__' ? 'lt-end' : ''}" data-template="${escapeAttr(s.template)}">${escapeHtml(s.label)}</button>`).join('');
  }
  function getSuggestions() { return []; }

  function renderPortrait() {
    if (!portraitImg) return;
    const show = state.mode === 'dialogue' && state.active_npc;
    phone.classList.toggle('lt-has-portrait', !!show);
    if (show) {
      const src = assetUrl(portraitFor(state.active_npc));
      if (portraitImg.dataset.src !== src) {
        portraitImg.dataset.src = src;
        portraitImg.src = src;
      }
      portraitImg.alt = npcName(state.active_npc);
      portraitImg.onerror = () => {
        portraitImg.onerror = null;
        portraitImg.src = assetUrl('xiaoning_portrait.png');
      };
    } else {
      portraitImg.removeAttribute('src');
      delete portraitImg.dataset.src;
    }
  }

  function isLoopTrainCommand(text) {
    return state.input_channel === 'command' || /^\/lt\b/i.test(text) || /^(查看|打开|结束|进入|重置|失败测试|显示)/.test(text);
  }
  function normalizeCommand(text) {
    const t = String(text || '').trim().replace(/^\/lt\s*/i, '');
    if (/结束|end/.test(t)) return 'end_dialogue';
    if (/线索|clue/.test(t)) return 'show_clues';
    if (/人物|npc|角色/.test(t)) return 'show_npcs';
    if (/状态|status/.test(t)) return 'show_status';
    if (/下一轮|next/.test(t)) return 'next_loop';
    if (/重置|reset/.test(t)) return 'reset';
    if (/失败|fail|ng/i.test(t)) return 'fail';
    if (/帮助|help/.test(t)) return 'help';
    return 'help';
  }
  function executeCommand(text) {
    const cmd = normalizeCommand(text);
    if (cmd === 'end_dialogue') {
      if (state.mode === 'dialogue') endDialogue();
      else appendMessage('system', '当前不在对话中。', log);
      return true;
    }
    if (cmd === 'show_clues') {
      const clues = state.known_clues.length ? state.known_clues.map(id => { const c = clueDetail(id); return `<li><strong>${escapeHtml(c.title)}</strong><br><span class="lt-muted">来源：${escapeHtml(c.source)}｜可信度：${escapeHtml(c.confidence)}｜可用于：${escapeHtml((c.usable_with || []).join('、') || '自我推理')}</span></li>`; }).join('') : '<li>暂无线索</li>';
      appendHtml('system', `<div class="lt-msg-title">已获得线索</div><ul>${clues}</ul>`, state.mode === 'dialogue' ? dialogueLog : log);
      return true;
    }
    if (cmd === 'show_npcs') {
      appendHtml('system', `<div class="lt-msg-title">人物</div><ul><li>小宁：线索来源，害怕但敏感。</li><li>赵乘警：证据门槛，需要至少两条有效证据。</li><li>沈墨寒：灰大衣男人，制造压力与误导。</li><li>小宁妈妈：隐藏记忆节点，不推进主线。</li></ul>`, state.mode === 'dialogue' ? dialogueLog : log);
      return true;
    }
    if (cmd === 'show_status') {
      appendHtml('system', `<div class="lt-msg-title">当前状态</div><div>${escapeHtml(state.clock)}｜AP ${state.ap_remaining}｜第 ${state.loop} 轮｜${state.mode === 'dialogue' ? '对话：' + npcName(state.active_npc) : '探索'}｜${state.input_channel === 'command' ? '指令' : '扮演'}</div><div class="lt-subtitle">当前目标</div><div>${escapeHtml(currentGoal())}</div>`, state.mode === 'dialogue' ? dialogueLog : log);
      return true;
    }
    if (cmd === 'next_loop') { if (lastFailure) nextLoop(); else appendMessage('system', '只有失败结算后才能进入下一轮。', log); return true; }
    if (cmd === 'reset') { resetGame(); return true; }
    if (cmd === 'fail') { failLoop(); return true; }
    appendHtml('system', '<div class="lt-msg-title">指令帮助</div><div>可用指令：查看线索、查看人物、查看状态、结束对话、进入下一轮、重置本轮。</div>', state.mode === 'dialogue' ? dialogueLog : log);
    return true;
  }


  async function importStGenerator() {
    if (stGenerateRaw) return stGenerateRaw;

    // Prefer getContext().generateRaw. It does not require a current chat file.
    try {
      const c = ctx();
      if (typeof c?.generateRaw === 'function') {
        stGenerateRaw = c.generateRaw.bind(c);
        return stGenerateRaw;
      }
    } catch (e) {
      console.warn(`[${EXT}] failed to read generateRaw from ST context`, e);
    }

    // Fallback: import from /script.js as documented by SillyTavern.
    try {
      const mod = await import('/script.js');
      stGenerateRaw = mod.generateRaw || null;
    } catch (e) {
      console.warn(`[${EXT}] failed to import ST generateRaw`, e);
    }

    return stGenerateRaw;
  }

  function buildNpcRawPrompt(npcId, playerText) {
    const npc = local.npcs[npcId] || {};
    const session = state.dialogue_session || {};
    const turns = (session.turns || [])
      .slice(-6)
      .map((x, i) => `第${i + 1}轮\n玩家：${x.player || ''}\n${npcName(npcId)}：${x.npc || ''}`)
      .join('\n');

    const clues = (state.known_clues || []).map(clueName).join('、') || '暂无';
    const goal = currentGoal();

    const npcProfiles = {
      xiaoning: '小宁：十岁左右的女孩，抱着旧布娃娃，害怕、敏感，不会用成人推理语言。她可以表达听见地板下方滴答声，但不能说出炸弹真相。',
      zhao_police: '赵乘警：列车乘警，谨慎、讲证据，不能被空泛推测说服。证据足够时可以表现出动摇和开始行动。',
      shen_mohan: '沈墨寒：灰大衣男人，冷静、危险、带有压迫感。他不会直接承认身份，也不会主动剧透。',
      xiaoning_mother_hidden: '小宁妈妈：只存在于小宁的记忆中，语气温柔克制，不推进主线。'
    };

    const systemPrompt =
      `你正在参与一个名为《第七节车厢》的互动谍战故事。\n\n` +
      `【你的唯一任务】\n` +
      `你只扮演当前 NPC：${npcName(npcId)}。只输出这个 NPC 的一句或一小段回复，可以包含轻微动作描写。\n\n` +
      `【绝对禁止】\n` +
      `1. 不要替玩家行动。\n` +
      `2. 不要宣布玩家获得线索。\n` +
      `3. 不要扣 AP，不要推进时间。\n` +
      `4. 不要宣布成功、失败、结算或进入下一轮。\n` +
      `5. 不要剧透炸弹位置、敌人身份或隐藏真相。\n` +
      `6. 不要输出“【获得线索】”“【AP -】”“【试玩版成功】”这类系统裁判文本。\n` +
      `7. 不要输出推理过程、reasoning、分析说明或系统提示。\n\n` +
      `【当前 NPC 设定】\n${npcProfiles[npcId] || npcName(npcId)}\n`;

    const prompt =
      `【当前场景】\n` +
      `1939 年冬，重庆连日遭日机轰炸。渝江线 307 次夜行列车从重庆驶向江城，第七节车厢。09:00 前列车可能在北江铁桥前爆炸。\n\n` +
      `【当前游戏状态】\n` +
      `时间：${state.clock}\n` +
      `AP：${state.ap_remaining}\n` +
      `轮次：${state.loop}\n` +
      `当前目标：${goal}\n` +
      `已知线索：${clues}\n` +
      `对话轮数：${session.turns_used || 0}/${session.turn_limit || npc.turnLimit || '?'}\n\n` +
      `【最近对话】\n${turns || '这是本次对话开头。'}\n\n` +
      `【玩家刚刚说】\n${playerText}\n\n` +
      `请以 ${npcName(npcId)} 的身份回复，保持沉浸感，80字以内。`;

    return { systemPrompt, prompt };
  }

  function sanitizeLlmReply(text) {
    return String(text || '')
      .replace(/【\\s*(获得线索|AP\\s*[-+]?\\d+|试玩版成功|循环失败|游戏结束)[^】]*】/g, '')
      .replace(/^(系统|旁白|裁判)[:：].*$/gm, '')
      .trim();
  }

  async function generateNpcReplyWithST(npcId, playerText) {
    const fn = await importStGenerator();
    if (!fn) throw new Error('无法获取 SillyTavern generateRaw。请确认当前在真实 ST 页面中运行。');

    const { systemPrompt, prompt } = buildNpcRawPrompt(npcId, playerText);
    const result = await fn({ systemPrompt, prompt });

    const text =
      typeof result === 'string'
        ? result
        : (result?.message?.content || result?.message || result?.text || result?.content || '');

    const cleaned = sanitizeLlmReply(text);
    console.log(`[${EXT}] generateRaw result`, { raw: result, cleaned });
    if (!cleaned) throw new Error('ST generateRaw 返回为空。');
    return cleaned;
  }

  async function submitInput() {
    const text = input.value.trim();
    if (!text) return;
    input.value = ''; autoSizeInput();
    appendMessage('player', text, state.mode === 'dialogue' ? dialogueLog : log);
    if (isLoopTrainCommand(text)) {
      executeCommand(text);
      return;
    }
    if (state.mode === 'dialogue') {
      if (/结束|离开|不聊了/.test(text)) return endDialogue();
      let llmReply = '';
      if (settings.llm_reply_source === 'st_llm') {
        showThinkingIndicator(dialogueLog);
        try {
          llmReply = await generateNpcReplyWithST(state.active_npc, text);
        } catch (e) {
          console.warn(`[${EXT}] ST LLM generation failed, fallback to local`, e);
          appendMessage('system', '模型回复暂不可用，已使用本地回复继续流程。', dialogueLog);
        }
        removeThinkingIndicator();
      }
      const res = await api('/dialogue/message', { npc_id: state.active_npc, player_text: text, state, llm_reply: llmReply }) || localDialogueMessage(state.active_npc, text, state, llmReply);
      handleEngineResponse(res, true);
    } else {
      const res = await api('/action/commit', { text, state }) || localCommitAction(text, state);
      handleEngineResponse(res, false);
    }
  }
  function handleEngineResponse(res, inDialogue) {
    if (!res) return;
    if (res.state) saveState(res.state);
    if (res.memory_node) showMemoryPortrait(res.memory_node);
    if (res.messages) renderEngineMessages(res.messages, state.mode === 'dialogue' || inDialogue ? dialogueLog : log);
    if (res.dialogue_outcome) renderDialogueOutcome(res.dialogue_outcome);
    if (res.loop_failure_outcome) renderFailureOutcome(res.loop_failure_outcome);
    if (res.trial_success) toast('试玩版成功');
    render();
  }
  function renderEngineMessages(messages, target) {
    for (const m of messages) {
      if (m.type === 'outcome' && m.html) appendHtml('outcome', m.html, log);
      else appendMessage(m.type || 'system', m.text || '', target || log);
    }
  }
  async function endDialogue() {
    const res = await api('/dialogue/end', { state }) || localEndDialogue(state);
    handleEngineResponse(res, false);
  }
  async function failLoop() {
    const res = await api('/loop/fail', { state, failure_type: 'time_out_explosion' }) || localFailLoop(state);
    handleEngineResponse(res, false);
  }
  async function nextLoop() {
    const res = await api('/loop/next', { state, loop_failure_outcome: lastFailure }) || localNextLoop({ state, loop_failure_outcome: lastFailure });
    ngLayer.classList.remove('lt-show');
    if (res.state) saveState(res.state);
    appendMessage('system', res.opening || '你回到了 08:45。', log);
    dialogueLog.innerHTML = '';
    toast('进入下一轮');
  }
  async function resetGame() {
    lastFailure = null;
    saveState(clone(local.startState));
    log.innerHTML = '';
    dialogueLog.innerHTML = '';
    ngLayer.classList.remove('lt-show');
    state.flags.intro_seen = false;
    saveState(state);
    appendMessage('system', '已重置试玩版。开场背景将重新显示。', log);
  }
  function showMemoryPortrait(node) {
    clearTimeout(memoryPortraitTimer);
    const oldSrc = portraitImg.src;
    portraitImg.src = assetUrl(node.portrait || local.npcs.xiaoning_mother_hidden.portrait);
    phone.classList.add('lt-memory-portrait');
    appendMessage('system', `【${node.title || '隐藏记忆'}】这段记忆不会推进主线，但改变了你和小宁之间的距离。`, dialogueLog);
    memoryPortraitTimer = setTimeout(() => {
      phone.classList.remove('lt-memory-portrait');
      if (state.mode === 'dialogue' && state.active_npc) portraitImg.src = assetUrl(portraitFor(state.active_npc));
      else if (oldSrc) portraitImg.src = oldSrc;
    }, 3200);
  }
  function renderDialogueOutcome(out) {
    const clues = (out.clues_gained || []).map(x => { const c = x.source ? x : clueDetail(x.id); return `<li><strong>${escapeHtml(c.title || clueName(c.id))}</strong><br><span class="lt-muted">来源：${escapeHtml(c.source || '未知')}｜可信度：${escapeHtml(c.confidence || 'unknown')}</span></li>`; }).join('') || '<li>没有获得新线索</li>';
    const events = (out.world_events || []).map(x => `<li>${escapeHtml(x)}</li>`).join('') || '<li>世界仍在继续推进</li>';
    const actions = (out.unlocked_actions || []).slice(0, 3).map(x => `<li>${escapeHtml(x.label || '')}</li>`).join('') || '<li>继续观察车厢</li>';
    const turnLine = out.turn_limit ? `｜对话 ${out.turns_used || 0}/${out.turn_limit} 轮` : '';
    appendHtml('outcome', `<div class="lt-msg-title">对话结算：${escapeHtml(out.npc_name || npcName(out.npc_id))}</div><div>AP -${out.ap_cost || 0}｜${escapeHtml(out.time_advance?.from || '')} → ${escapeHtml(out.time_advance?.to || '')}${turnLine}</div><div class="lt-subtitle">获得线索</div><ul>${clues}</ul><div class="lt-subtitle">世界推进</div><ul>${events}</ul><div class="lt-subtitle">下一步可行动</div><ul>${actions}</ul>`, log);
    dialogueLog.innerHTML = '';
  }
  function renderFailureOutcome(out) {
    lastFailure = out;
    const facts = (out.confirmed_facts || []).map(x => `<li>${escapeHtml(x.text)}</li>`).join('') || '<li>没有确认事实</li>';
    const sus = (out.suspicions || []).map(x => `<li>${escapeHtml(x.text)}</li>`).join('');
    const suggestions = (out.next_loop_suggestions || []).map(x => `<li>${escapeHtml(x.label)}</li>`).join('') || '<li>重新规划路线</li>';
    ngLayer.querySelector('.lt-ng-bg').style.backgroundImage = `url(${assetUrl(NG_BG)})`;
    ngLayer.querySelector('.lt-ng-card').innerHTML = `<div class="lt-ng-title">循环失败</div><div>${escapeHtml(out.failure_reason || '你没能阻止爆炸。')}</div><div class="lt-subtitle">带入下一轮的记忆</div><ul>${facts}</ul>${sus ? `<div class="lt-subtitle">疑点</div><ul>${sus}</ul>` : ''}<div class="lt-subtitle">下一轮建议</div><ul>${suggestions}</ul><button class="lt-btn lt-next" data-lt-next-loop="1">进入第 ${Number(out.loop || state.loop) + 1} 轮</button>`;
    ngLayer.classList.add('lt-show');
  }

  function appendMessage(type, text, target) {
    if (!target) target = log;
    const div = document.createElement('div');
    div.className = `lt-msg lt-msg-${type}`;
    div.textContent = text;
    target.appendChild(div);
    scrollToBottom(target);
  }
  function appendHtml(type, html, target) {
    const div = document.createElement('div');
    div.className = `lt-msg lt-msg-${type}`;
    div.innerHTML = html;
    target.appendChild(div);
    scrollToBottom(target);
  }
  function scrollToBottom(target) {
    if (!target) return;
    const containers = [target];
    const dialoguePanel = target.closest?.('.lt-dialogue-panel');
    if (dialoguePanel && dialoguePanel !== target) containers.push(dialoguePanel);
    const apply = () => {
      containers.forEach(el => { el.scrollTop = el.scrollHeight; });
    };
    requestAnimationFrame(() => {
      apply();
      requestAnimationFrame(apply);
      setTimeout(apply, 80);
    });
  }
  function showThinkingIndicator(target) {
    removeThinkingIndicator();
    const div = document.createElement('div');
    div.className = 'lt-msg lt-msg-system lt-thinking';
    div.innerHTML = '思考中<span class="lt-dot">.</span><span class="lt-dot">.</span><span class="lt-dot">.</span>';
    target.appendChild(div);
    thinkingEl = div;
    scrollToBottom(target);
  }
  function removeThinkingIndicator() {
    if (thinkingEl) {
      thinkingEl.remove();
      thinkingEl = null;
    }
  }
  function toast(text) {
    const t = document.createElement('div');
    t.className = 'lt-toast';
    t.textContent = text;
    phone.appendChild(t);
    setTimeout(() => t.remove(), 2200);
  }
  function initVoiceInput() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const isChrome = /Chrome/i.test(navigator.userAgent) && !/Edg/i.test(navigator.userAgent);

    // Android Chrome: Web Speech is broken (Chrome bug crbug.com/41297427)
    if (isMobile) {
      if (!micBtn) return;
      micBtn.addEventListener('click', () => {
        toast('请使用键盘上的语音输入键（🎤）来输入文字。');
      });
      return;
    }

    // Desktop Chrome: redirect to Edge
    if (isChrome && !isMobile) {
      if (!micBtn) return;
      micBtn.addEventListener('click', () => {
        toast('Chrome 语音识别不稳定，建议使用 Edge 浏览器打开此页面。');
      });
      return;
    }

    if (!SR) {
      if (micBtn) micBtn.style.display = 'none';
      return;
    }
    recognition = new SR();
    recognition.lang = 'zh-CN';
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onresult = (ev) => {
      let transcript = '';
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        transcript += ev.results[i][0].transcript;
      }
      input.value = (voiceInputBase + ' ' + transcript).trim();
      autoSizeInput();
    };

    recognition.onerror = (ev) => {
      if (ev.error === 'not-allowed') toast('请允许麦克风权限后重试。');
      else if (ev.error === 'no-speech') toast('未识别到语音。');
      else if (ev.error !== 'aborted') toast('语音识别出现问题，请重试。');
      if (micBtn) micBtn.classList.remove('lt-mic-listening');
    };

    recognition.onend = () => {
      if (micBtn) micBtn.classList.remove('lt-mic-listening');
    };

    micBtn.addEventListener('click', () => {
      if (!recognition) { toast('语音识别不可用，请使用 Chrome 浏览器。'); return; }
      if (micBtn.classList.contains('lt-mic-listening')) {
        stopVoiceInput();
        return;
      }
      voiceInputBase = input.value.trimEnd();
      // Android Chrome often needs an explicit getUserMedia call to trigger the permission dialog.
      // We fire it without awaiting — if it succeeds, the permission is granted in the background.
      // recognition.start() triggers its own permission flow on desktop Chrome.
      if (navigator.mediaDevices?.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ audio: true })
          .then(s => s.getTracks().forEach(t => t.stop()))
          .catch(() => {});
      }
      try {
        recognition.start();
        micBtn.classList.add('lt-mic-listening');
      } catch (e) {
        toast('麦克风启动失败，请检查权限设置。');
        console.warn('[LoopTrain] speech start error', e);
      }
    });
  }

  function stopVoiceInput() {
    try { recognition.stop(); } catch (_) { /* not running */ }
    if (micBtn) micBtn.classList.remove('lt-mic-listening');
  }


  function successHtml() {
    return `<div class="lt-msg-title">试玩版结束</div>
<div>赵乘警用警棍敲了敲地板。咚。声音是空的。</div>
<div>他的脸色终于变了：“你到底是谁？”</div>
<div>你还没回答，餐车方向传来一小段口琴声。</div>
<div class="lt-subtitle">你证明了</div>
<ul><li>第七节车厢存在异常。</li><li>小宁听见的声音是真的。</li><li>赵乘警开始相信你。</li><li>地板下方确实有夹层。</li></ul>
<div class="lt-subtitle">但你还不知道</div>
<ul><li>炸弹在哪里。</li><li>谁是真正敌人。</li><li>口琴声来自谁。</li><li>灰大衣男人到底站在哪一边。</li></ul>
<div class="lt-subtitle">正式版目标</div><div>活下去，找到炸弹，猜出敌人，留下扣子。</div>`;
  }

  // Local mock engine for mock-harness or ST without server plugin.
  function addClue(s, id) { if (!s.known_clues.includes(id)) s.known_clues.push(id); }
  function advanceClock(s, n) { const [h,m]=s.clock.split(':').map(Number); const total=h*60+m+n; s.clock=String(Math.floor(total/60)).padStart(2,'0')+':'+String(total%60).padStart(2,'0'); }
  function countValidEvidence(s) { return s.known_clues.filter(x => ['ticking_under_floor','xiaoning_heard_ticking','sound_not_from_seat','suspicious_connector_movement'].includes(x)).length; }
  function localParseAction(text) {
      if (/回到第七节|返回第七节|回到车厢|返回车厢|回车厢/.test(text)) return { intent:'move_to_carriage_7' };
      if (/前往连接处|去连接处|到连接处|走向.*连接处/.test(text)) return { intent:'move_to_connector' };
    if (/赵|乘警|警察/.test(text) && /检查|证据|地板|说服|异常|请他|报告/.test(text)) return { intent:'convince_zhao' };
    if (/赵|乘警|警察/.test(text)) return { intent:'start_dialogue', target_npc:'zhao_police' };
    if (/沈|灰大衣|墨寒/.test(text)) return { intent:'start_dialogue', target_npc:'shen_mohan' };
    if (/小宁|女孩|布娃娃/.test(text) && /对话|说话|问|靠近|蹲|安抚/.test(text)) return { intent:'start_dialogue', target_npc:'xiaoning' };
    if (/座位|下面|地板|声音|滴答|观察|检查/.test(text)) return { intent:'observe_under_seat' };
    if (/失败|爆炸/.test(text)) return { intent:'force_fail' };
    return { intent:'unknown' };
  }
  function localCommitAction(text, st) {
    const s = normalizeState(st); const action = localParseAction(text);
    if (action.intent === 'move_to_connector') { s.ap_remaining -= 1; advanceClock(s,1); s.location = 'connector_7_8'; return { state:s, messages:[{type:'system', text:'你起身穿过过道，走到第七节车厢和第八节车厢之间的连接处。列车晃动让铁板发出沉闷的声响。灰大衣的沈墨寒站在这里。'}] }; }
    if (action.intent === 'move_to_carriage_7') { s.ap_remaining -= 1; advanceClock(s,1); s.location = 'carriage_7'; return { state:s, messages:[{type:'system', text:'你从连接处回到第七节车厢。过道里灯光明暗不定，小宁还在靠窗的位置，赵乘警仍在查票。地板下方的滴答声依然隐约可闻。'}] }; }
    if (action.intent === 'start_dialogue') return localStartDialogue(s, action.target_npc);
    if (action.intent === 'force_fail') return localFailLoop(s);
    if (action.intent === 'observe_under_seat') { s.ap_remaining -= 1; advanceClock(s,1); addClue(s,'sound_not_from_seat'); return { state:s, messages:[{type:'system', text:'你假装系鞋带，低头靠近座位下方。声音仍在，但不像来自座位底部。\n【获得线索】声音不来自座位下方'}] }; }
    if (action.intent === 'convince_zhao') {
      if (countValidEvidence(s) >= 2) { s.ap_remaining -= 2; advanceClock(s,2); s.flags.trial_success = true; return { state:s, trial_success:true, messages:[{type:'outcome', html:'<div class="lt-msg-title">试玩版成功</div><div>赵乘警用警棍敲了敲地板。咚。声音是空的。</div><div>餐车方向，传来一小段口琴声。</div>'}] }; }
      addClue(s,'zhao_requires_evidence'); s.ap_remaining -= 1; return { state:s, messages:[{type:'system', text:'赵乘警没有行动：“证据不够。”\n【获得信息】赵乘警需要证据才会行动。'}] };
    }
      return { state:s, messages:[{type:'system', text:'你需要更明确地描述你的行动。观察车厢，寻找线索，与周围的人交谈。'}] };
  }
  function localStartDialogue(s, npcId) {
    const npc = local.npcs[npcId];
    if (!npc) return { state:s, messages:[{type:'system', text:'这个人现在不在第七节车厢。'}] };
    if (npc.hidden && !isHiddenNpcVisible(s, npcId)) return { state:s, messages:[{type:'system', text:'这个人现在还只存在于小宁的记忆里。'}] };
    if (npc.location && npc.location !== s.location) return { state:s, messages:[{type:'system', text:`${npc.name}不在这里。`}] };
    s.mode='dialogue'; s.active_npc=npcId;
    s.dialogue_session={npc_id:npcId, started_at:s.clock, ap_cost:npc.cost, turns:[], turns_used:0, turn_limit:npc.turnLimit||8, near_limit_hint_at:npc.nearLimitHintAt||Math.max(1,(npc.turnLimit||8)-2), near_limit_hint_shown:false, pending_clues:[], pending_events:[]};
    const openings = { xiaoning:'小宁把旧布娃娃抱得更紧，眼神躲开你。她很轻地说：“你……也听见了吗？”', zhao_police:'赵乘警看向你：“你最好想清楚再说。”', shen_mohan:'沈墨寒把视线从窗外移到你身上：“你终于注意到我了。”', xiaoning_mother_hidden: local.npcs.xiaoning_mother_hidden.opening };
    return { state:s, messages:[{type:'npc', text:openings[npcId] || ''}] };
  }
  function localApplyTurnLimit(s, npcId, res) {
    const npc = local.npcs[npcId] || {};
    const sess = s.dialogue_session || {};
    const used = sess.turns_used || (sess.turns || []).length || 0;
    const limit = sess.turn_limit || npc.turnLimit || 8;
    if (!sess.near_limit_hint_shown && used >= (sess.near_limit_hint_at || Math.max(1, limit - 2)) && used < limit) {
      sess.near_limit_hint_shown = true;
      res.messages.push({type:'system', text:npc.nearLimitHint || '这段对话接近尾声，最好问关键问题。'});
    }
    if (used >= limit) {
      if (npc.turnLimitPolicy === 'risk_escalation' && s.npc_states[npcId]) {
        s.npc_states[npcId].suspicion = (s.npc_states[npcId].suspicion || 0) + 15;
        res.messages.push({type:'system', text:(npc.limitMessage || '对方不再继续回答。') + '\n【警觉上升】'});
      } else {
        res.messages.push({type:'system', text:npc.limitMessage || '这次对话已经无法继续获得更多信息。'});
      }
      const ended = localEndDialogue(s);
      return { state:ended.state, messages:res.messages.concat(ended.messages || []), dialogue_outcome:ended.dialogue_outcome, trial_success:ended.trial_success };
    }
    s.dialogue_session = sess; res.state = s; return res;
  }
  function localDialogueMessage(npcId, text, st, llmReply = '') {
    const s = normalizeState(st); const npc=local.npcs[npcId]||{}; const sess=s.dialogue_session || {pending_clues:[], pending_events:[], turns:[], turns_used:0, turn_limit:npc.turnLimit||8, near_limit_hint_at:npc.nearLimitHintAt||Math.max(1,(npc.turnLimit||8)-2), ap_cost: npc.cost || 3, started_at:s.clock}; let reply=''; const res={state:s,messages:[]};
    if (npcId==='xiaoning') {
      const gentle=/别怕|帮你|温和|轻声|我也听见|蹲|相信|保护/.test(text); if(gentle){s.npc_states.xiaoning.trust+=12;s.npc_states.xiaoning.fear=Math.max(0,s.npc_states.xiaoning.fear-6);} 
      const motherTopic=/(你妈妈|妈妈.*(布娃娃|娃娃|玩偶)|布娃娃.*(妈妈|母亲|家人)|娃娃.*(妈妈|母亲|家人)|一个人.*(坐车|上车|害怕)|等谁|谁给你的)/.test(text);
      const emotionalKey=/(别怕|相信|保护|帮你|我会帮你|我会保护你|我也听见)/.test(text);
      if(motherTopic&&emotionalKey&&s.npc_states.xiaoning.trust>=36&&s.npc_states.xiaoning.fear<=55){sess.pending_clues=unique([...sess.pending_clues,'mother_doll_memory']);s.flags.xiaoning_mother_memory_triggered=true;unlockHiddenNpc(s,'xiaoning_mother_hidden');reply='小宁低头看着布娃娃：“妈妈说，坐火车的时候，不要和陌生人讲话……可是你不像坏人。”'; res.memory_node={id:'xiaoning_mother_memory', npc_id:'xiaoning_mother_hidden', portrait:'xiaoning_mother_portrait.png', title:'隐藏记忆：小宁妈妈'};}
      else if(/滴答|声音|下面|地板|听见/.test(text)||gentle){sess.pending_clues=unique([...sess.pending_clues,'ticking_under_floor','xiaoning_heard_ticking']);reply='小宁用鞋尖轻轻碰了碰地板：“不是座位下面……是下面在响。”';}
      else reply='小宁抱紧布娃娃，只用很小的幅度摇了摇头。';
    } else if (npcId==='zhao_police') { if(/证据|地板|检查|声音|小宁|滴答/.test(text)&&countValidEvidence(s)>=2){reply='赵乘警听完你的证据：“你带我过去。别惊动其他乘客。”'; sess.pending_events.push('zhao_ready_to_check_floor');} else {addClue(s,'zhao_requires_evidence'); reply='赵乘警没有立刻行动：“你需要给我能查证的东西。”';} }
    else if (npcId==='shen_mohan') { if(/连接处|08:48|餐车|口琴|离开/.test(text)){sess.pending_clues=unique([...sess.pending_clues,'suspicious_connector_movement','harmonica_from_dining_car']);reply='沈墨寒的手指在打火机上停了一瞬：“你关心的是我，还是连接处？”';} else if(/灰大衣|纸条|相信|不相信/.test(text)){s.npc_states.shen_mohan.suspicion+=8; reply='沈墨寒低头看了一眼自己的袖口，笑意很淡：“提醒你的人，也许更不值得相信。”';} else reply='沈墨寒看着你：“你问得太急了。”'; }
    else if (npcId==='xiaoning_mother_hidden') { reply=/小宁|孩子|她/.test(text)?'那个温柔的声音像从旧布料深处传来：“她一直很怕声音。你若真想帮她，就别急着逼她说出全部。”':'布娃娃轻轻晃了一下。那个声音低低地说：“有些话，她不是不记得，只是不敢记得。”'; }
    const cleanedLlmReply = sanitizeLlmReply(llmReply); if (cleanedLlmReply) reply = cleanedLlmReply; sess.turns.push({player:text,npc:reply}); sess.turns_used=sess.turns.length; s.dialogue_session=sess; res.state=s; res.messages.unshift({type:'npc', text:reply}); return localApplyTurnLimit(s, npcId, res);
  }
  function localEndDialogue(st) {
    const s=normalizeState(st); const npcId=s.active_npc; const sess=s.dialogue_session || {pending_clues:[],pending_events:[],ap_cost:3,started_at:s.clock,turns:[]}; const pending=unique(sess.pending_clues||[]); pending.forEach(id=>addClue(s,id)); if(npcId==='xiaoning'&&pending.includes('ticking_under_floor')) addClue(s,'harmonica_from_dining_car'); const from=sess.started_at||s.clock; const cost=sess.ap_cost||3; s.ap_remaining-=cost; advanceClock(s,cost); if((sess.pending_events||[]).includes('zhao_ready_to_check_floor')&&countValidEvidence(s)>=2){s.flags.trial_success=true;} const out={npc_id:npcId,npc_name:npcName(npcId),ap_cost:cost,time_advance:{from,to:s.clock},turns_used:sess.turns_used||(sess.turns||[]).length||0,turn_limit:sess.turn_limit||local.npcs[npcId]?.turnLimit,clues_gained:pending.map(id=>clueDetail(id)),world_events:npcId==='xiaoning'?['沈墨寒已经离开第七节车厢。','餐车方向传来一小段口琴声。']:[],unlocked_actions:getSuggestions().slice(0,3)}; s.mode='explore'; s.active_npc=null; s.dialogue_session=null; const res={state:s,dialogue_outcome:out}; if(s.flags.trial_success){res.trial_success=true; res.messages=[{type:'outcome',html:successHtml()}];} return res;
  }
  function localFailLoop(st) { const s=normalizeState(st); const carry=s.known_clues.filter(x=>x!=='gray_coat_note_pressure' && clueDetail(x).carry_to_next_loop); return {state:s, loop_failure_outcome:{loop:s.loop, failed_at:s.clock, failure_reason:'你没能在爆炸前证明异常。', confirmed_facts:carry.map(id=>Object.assign(clueDetail(id),{text:clueName(id),carry_to_next_loop:true})), next_loop_suggestions:getSuggestions().slice(0,3)}}; }
  function notifyGameReady() {
    requestAnimationFrame(() => {
      const rootEl = document.getElementById('looptrain-root');
      const ready = !!(
        rootEl &&
        document.querySelector('.lt-phone') &&
        document.querySelector('.lt-content') &&
        !rootEl.classList.contains('lt-hidden') &&
        document.body.classList.contains('lt-game-shell')
      );
      if (ready) {
        window.dispatchEvent(new CustomEvent('looptrain:game-ready', { detail: { version: VERSION, readyAt: Date.now() } }));
        return;
      }
      window.dispatchEvent(new CustomEvent('looptrain:game-error', {
        detail: {
          reason: 'LoopTrain root not visible or game shell not active',
          rootClass: rootEl?.className || '',
          bodyClass: document.body.className || '',
        },
      }));
    });
  }

  function localNextLoop(previous) { const carry=unique(previous?.loop_failure_outcome?.confirmed_facts?.map(x=>x.id) || []); const s=normalizeState(local.startState); s.loop=(previous?.state?.loop||1)+1; s.flags.intro_seen=true; s.carried_memory=carry; s.known_clues=unique(['gray_coat_note_pressure',...carry]); let opening='你猛地睁开眼。\\n\\n第七节车厢，08:45。'; if(carry.length){opening+=`\\n\\n你记得上一轮留下的信息：${carry.map(clueName).join('、')}。`; if(carry.includes('xiaoning_heard_ticking')||carry.includes('ticking_under_floor')) opening+='\\n\\n小宁还坐在靠窗的位置，抱着那只旧布娃娃。你知道，她听见过地板下方的声音。'; if(carry.includes('zhao_requires_evidence')) opening+='\\n\\n你也记得，赵乘警不会相信没有证据的报警。';} else opening+='\\n\\n你只记得上一轮的失败。'; return {state:s, opening}; }

  function escapeHtml(s) { return String(s ?? '').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
  function escapeAttr(s) { return escapeHtml(s).replace(/'/g, '&#39;'); }

  function bindSTEvents() {
    const c = ctx();
    if (!c || !c.eventSource || !c.event_types) return;
    const reload = () => { loadState(); render(); };
    try {
      if (c.event_types.CHAT_CHANGED) c.eventSource.on(c.event_types.CHAT_CHANGED, reload);
      if (c.event_types.CHARACTER_MESSAGE_RENDERED) c.eventSource.on(c.event_types.CHARACTER_MESSAGE_RENDERED, reload);
    } catch (_) { /* ST event API can vary by version. Overlay still works without events. */ }
  }
  async function init() {
    document.title = 'LoopTrain';
    loadSettings();
    const requestedGameShell = isGameShellRequested();
    settings.game_shell = requestedGameShell;
    createUI();
    loadState();

    if (requestedGameShell) {
      openLoopTrain(false);
      applyGameShell(true);
    } else if (root) {
      root.classList.add('lt-hidden');
      document.body.classList.remove('lt-game-shell');
      root.classList.remove('lt-game-shell-root');
    }

    await checkRemote();
    const initRes = await api('/session/init', { state });
    if (initRes?.state) saveState(initRes.state, { skipPersist: true });
    bindSTEvents();
    render();

    if (requestedGameShell) {
      notifyGameReady();
    }

    if (requestedGameShell) {
      appendMessage('system', `LoopTrain v${VERSION} 已启动。${useRemote ? '已连接 Server Plugin。' : '未连接 Server Plugin，使用本地控制层。'} 可在输入区切换“扮演 / 指令”。`, log);
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  window.LoopTrain = {
    resetGame,
    getState: () => clone(state),
    failLoop,
    nextLoop,
    openLoopTrain,
    closeToAdminSetup,
    getDiagnostics: () => ({
      version: VERSION,
      assetBase: ASSET_BASE,
      portraitSrc: document.querySelector('.lt-portrait')?.src || '',
      portraitNaturalWidth: document.querySelector('.lt-portrait')?.naturalWidth || 0,
      replySource: settings.llm_reply_source,
      hasGenerateRaw: typeof ctx()?.generateRaw === 'function',
      hasGenerateQuietPrompt: typeof ctx()?.generateQuietPrompt === 'function',
      rootClass: document.querySelector('#looptrain-root')?.className || '',
      bodyClass: document.body.className || '',
    }),
    version: VERSION
  };
})();
