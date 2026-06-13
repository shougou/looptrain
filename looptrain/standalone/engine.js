// LoopTrain Standalone MVP - engine.js
// ATTRIBUTION: Copied from looptrain/st-server-plugin/looptrain/engine.js
// Original source: LoopTrain-ST v0.4.3
// This is the core game engine — pure Node.js, no SillyTavern dependencies.
'use strict';

// v0.4-alpha: engine remains the裁判; optional llm_reply is treated as NPC performance text only.

const START_STATE = {
  episode_id: 'trial_001',
  mode: 'explore',
  input_channel: 'roleplay',
  loop: 1,
  clock: '08:45',
  ap_remaining: 10,
  location: 'carriage_7',
  active_npc: null,
  known_clues: ['gray_coat_note_pressure'],
  carried_memory: [],
  unlocked_actions: [],
  dialogue_session: null,
  last_outcome: null,
  npc_states: {
    xiaoning: { trust: 20, fear: 45, suspicion: 0 },
    zhao_police: { trust: 0, suspicion: 15, requires_evidence: true },
    shen_mohan: { trust: -10, suspicion: 35, composure: 80 },
    xiaoning_mother_hidden: { trust: 0, fear: 0, visibility: 'hidden' },
  },
  flags: {
    intro_seen: false,
    roleplay_hint_seen: false,
    command_hint_seen: false,
    zhao_checked_floor: false,
    trial_success: false,
    xiaoning_mother_memory_triggered: false,
    shen_connector_hint_seen: false,
    visible_hidden_npcs: [],
  },
};

const NPCS = {
  xiaoning: {
    name: '小宁',
    cost: 3,
    turn_limit: 10,
    near_limit_hint_at: 8,
    turn_limit_policy: 'soft_close',
    portrait: 'xiaoning_portrait.png',
    role: 'clue_source',
    location: 'carriage_7',
    opening: '小宁把旧布娃娃抱得更紧，眼神躲开你。她很轻地说：“你……也听见了吗？”',
    near_limit_hint: '小宁低头看了看窗外，像是不想再说太久。你感觉接下来最好问关键问题。',
    limit_message: '小宁把布娃娃抱得更紧，轻轻摇了摇头。她暂时不愿意再说了。',
    suggestions: [
      { label: '温和询问', template: '我压低声音，温和地问她：你刚才是不是听到了什么？' },
      { label: '提到滴答声', template: '我轻声说：我也听见了那个滴答声，它是不是从下面传来的？' },
      { label: '问布娃娃', template: '我看着她怀里的布娃娃，轻声问：这是你妈妈给你的吗？' },
      { label: '结束对话', template: '__END_DIALOGUE__' },
    ],
  },
  zhao_police: {
    name: '赵乘警',
    cost: 3,
    turn_limit: 8,
    near_limit_hint_at: 6,
    turn_limit_policy: 'evidence_gate',
    portrait: 'zhao_police_portrait.png',
    role: 'authority_gatekeeper',
    location: 'carriage_7',
    opening: '赵乘警看向你，手搭在警棍旁边：“你最好想清楚再说。列车上散布恐慌，是要负责的。”',
    near_limit_hint: '赵乘警看了一眼怀表：“我不能一直听你讲推测。你最好拿出能查证的证据。”',
    limit_message: '赵乘警打断你：“如果没有新的证据，我不能继续陪你浪费时间。”',
    suggestions: [
      { label: '报告异常', template: '我压低声音告诉赵乘警：第七节车厢有异常声音，我需要你检查地板。' },
      { label: '展示证据', template: '我把目前获得的线索逐条告诉赵乘警，请他亲自听一听地板下方的声音。' },
      { label: '请求检查地板', template: '我请求赵乘警不要惊动乘客，只检查第七节车厢地板和连接处。' },
      { label: '结束对话', template: '__END_DIALOGUE__' },
    ],
  },
  shen_mohan: {
    name: '沈墨寒',
    cost: 3,
    turn_limit: 8,
    near_limit_hint_at: 6,
    turn_limit_policy: 'risk_escalation',
    portrait: 'shen_mohan_portrait.png',
    role: 'misdirection_pressure',
    location: 'connector_7_8',
    opening: '沈墨寒把视线从窗外移到你身上，像是早就等着你开口：“你终于注意到我了。”',
    near_limit_hint: '沈墨寒的眼神冷了下来。你意识到，他不是在回答你，而是在反过来确认你的身份。',
    limit_message: '沈墨寒微微侧过身，声音很低：“你问得太多了。”',
    suggestions: [
      { label: '反问试探', template: '我看着沈墨寒的眼睛，反问他：你刚才为什么一直盯着第七节车厢的连接处？' },
      { label: '提到灰大衣纸条', template: '我没有拿出纸条，只试探地说：有人提醒我，不要相信灰大衣。' },
      { label: '提到口琴声', template: '我故意说：餐车那段口琴声，你也听见了吧？' },
      { label: '结束对话', template: '__END_DIALOGUE__' },
    ],
  },
  xiaoning_mother_hidden: {
    name: '小宁妈妈',
    cost: 0,
    turn_limit: 2,
    near_limit_hint_at: 1,
    turn_limit_policy: 'memory_once',
    portrait: 'xiaoning_mother_portrait.png',
    role: 'hidden_memory',
    hidden: true,
    location: 'carriage_7',
    opening: '你听见小宁怀里的布娃娃里，像有一个温柔的声音隔着旧布料传来：“别吓着她。”',
    near_limit_hint: '那个温柔的声音渐渐变轻，像一段快要散去的记忆。',
    limit_message: '布娃娃安静下来，车厢里的铁轨声重新盖过一切。',
    suggestions: [{ label: '结束对话', template: '__END_DIALOGUE__' }],
  },
};

const CLUE_DETAILS = {
  gray_coat_note_pressure: {
    id: 'gray_coat_note_pressure',
    title: '不要相信灰大衣',
    source: '开场纸条',
    confidence: 'medium',
    usable_with: ['shen_mohan', 'self_reasoning'],
    carry_to_next_loop: true,
  },
  xiaoning_heard_ticking: {
    id: 'xiaoning_heard_ticking',
    title: '小宁也听见过声音',
    source: '小宁对话',
    confidence: 'high',
    usable_with: ['zhao_police', 'xiaoning'],
    carry_to_next_loop: true,
  },
  ticking_under_floor: {
    id: 'ticking_under_floor',
    title: '地板下方的滴答声',
    source: '小宁对话',
    confidence: 'high',
    usable_with: ['zhao_police', 'shen_mohan', 'connector'],
    carry_to_next_loop: true,
  },
  sound_not_from_seat: {
    id: 'sound_not_from_seat',
    title: '声音不来自座位下方',
    source: '玩家检查',
    confidence: 'high',
    usable_with: ['zhao_police'],
    carry_to_next_loop: true,
  },
  suspicious_connector_movement: {
    id: 'suspicious_connector_movement',
    title: '连接处有人停留过',
    source: '沈墨寒对话',
    confidence: 'medium',
    usable_with: ['zhao_police', 'shen_mohan'],
    carry_to_next_loop: true,
  },
  mother_doll_memory: {
    id: 'mother_doll_memory',
    title: '小宁妈妈与布娃娃',
    source: '隐藏记忆节点',
    confidence: 'high',
    usable_with: ['xiaoning'],
    carry_to_next_loop: true,
  },
  harmonica_from_dining_car: {
    id: 'harmonica_from_dining_car',
    title: '餐车方向的口琴声',
    source: '世界事件',
    confidence: 'low',
    usable_with: ['shen_mohan', 'self_reasoning'],
    carry_to_next_loop: true,
  },
  zhao_requires_evidence: {
    id: 'zhao_requires_evidence',
    title: '赵乘警需要证据才会行动',
    source: '赵乘警反馈',
    confidence: 'high',
    usable_with: ['zhao_police', 'self_planning'],
    carry_to_next_loop: true,
  },
};

const CLUE_TITLES = Object.fromEntries(Object.values(CLUE_DETAILS).map(x => [x.id, x.title]));

const SCENES = {
    carriage_7: { name: '第七节车厢', npcs: ['xiaoning','zhao_police'], text: '列车第七节车厢灯光昏黄。窗外，重庆方向的火光已经渐远。乘客们神色紧张，各自拥着行李。小宁抱着旧布娃娃坐在靠窗位置，赵乘警正在过道里查票。地板下方似乎藏着很轻的滴答声。' },
    connector_7_8: { name: '连接处', npcs: ['shen_mohan'], text: '第七节车厢与第八节车厢之间的连接处。冷风从缝隙中灌入，列车晃动时铁板发出沉闷的声响。灰大衣的沈墨寒站在这里，像是在等人，又像是在观察着什么。远处偶尔还能听见防空警报的余音。' },
};

function clone(x) { return JSON.parse(JSON.stringify(x)); }
function unique(arr) { return [...new Set((arr || []).filter(Boolean))]; }
function normalize(state) {
  const s = Object.assign(clone(START_STATE), state || {});
  s.npc_states = Object.assign(clone(START_STATE.npc_states), state?.npc_states || {});
  s.flags = Object.assign(clone(START_STATE.flags), state?.flags || {});
  s.flags.visible_hidden_npcs = unique(s.flags.visible_hidden_npcs);
  if (s.flags.xiaoning_mother_memory_triggered) unlockHiddenNpc(s, 'xiaoning_mother_hidden');
  s.known_clues = unique(s.known_clues);
  s.carried_memory = unique(s.carried_memory);
  s.unlocked_actions = s.unlocked_actions || [];
  s.input_channel = s.input_channel || 'roleplay';
  s.location = s.location || 'carriage_7';
  return s;
}
function addClue(s, id) { if (id && !s.known_clues.includes(id)) s.known_clues.push(id); }
function advanceClock(s, minutes) {
  const [h, m] = String(s.clock || '08:45').split(':').map(Number);
  const total = h * 60 + m + minutes;
  s.clock = String(Math.floor(total / 60)).padStart(2, '0') + ':' + String(total % 60).padStart(2, '0');
}
function countValidEvidence(s) {
  const valid = ['ticking_under_floor','xiaoning_heard_ticking','sound_not_from_seat','suspicious_connector_movement'];
  return unique(s.known_clues).filter(x => valid.includes(x)).length;
}
function clueName(id) { return CLUE_DETAILS[id]?.title || id; }
function clueDetail(id) { return clone(CLUE_DETAILS[id] || { id, title: id, source: '未知', confidence: 'unknown', usable_with: [], carry_to_next_loop: false }); }
function npcName(id) { return NPCS[id]?.name || id; }
function sceneName(id) { return SCENES[id]?.name || id; }
function isHiddenNpcVisible(s, npcId) { return unique(s.flags?.visible_hidden_npcs).includes(npcId) || !!s.flags?.xiaoning_mother_memory_triggered; }
function unlockHiddenNpc(s, npcId) { s.flags.visible_hidden_npcs = unique([...(s.flags.visible_hidden_npcs || []), npcId]); }

function currentGoal(s) {
  s = normalize(s);
  const evidence = countValidEvidence(s);
  if (s.flags.trial_success) return '试玩版已完成：你证明了第七节车厢存在异常。';
  if (evidence >= 2) return '证据已足够。现在可以尝试说服赵乘警检查地板。';
  if (evidence === 1) return '你已经获得 1 条有效证据，还需要更多证据说服赵乘警。';
  return '证明第七节车厢存在异常，并说服赵乘警检查地板。';
}

function parseAction(text) {
  const t = String(text || '').trim();
  if (!t) return { intent: 'empty', confidence: 0 };
      if (/回到第七节|返回第七节|回到车厢|返回车厢|回车厢/.test(t)) return { intent: 'move_to_carriage_7', confidence: 0.88 };
      if (/前往连接处|去连接处|到连接处|走向.*连接处/.test(t)) return { intent: 'move_to_connector', confidence: 0.88 };
  if (/赵|乘警|警察/.test(t) && /检查|证据|地板|说服|异常|请他|报告/.test(t)) return { intent: 'convince_zhao', target_npc: 'zhao_police', confidence: 0.9 };
  if (/赵|乘警|警察/.test(t)) return { intent: 'start_dialogue', target_npc: 'zhao_police', confidence: 0.82 };
  if (/沈|灰大衣|墨寒/.test(t)) return { intent: 'start_dialogue', target_npc: 'shen_mohan', confidence: 0.84 };
  if (/小宁|女孩|布娃娃/.test(t) && /对话|说话|问|靠近|蹲|安抚|确认/.test(t)) return { intent: 'start_dialogue', target_npc: 'xiaoning', confidence: 0.95 };
  if (/座位|下面|地板|声音|滴答|观察|检查|系鞋带/.test(t)) return { intent: 'observe_under_seat', confidence: 0.86 };
  if (/失败|爆炸|下一轮|重开/.test(t)) return { intent: 'force_fail', confidence: 0.8 };
  return { intent: 'unknown', confidence: 0.2 };
}

function suggestions(s) {
  s = normalize(s);
  const out = [];
  const loc = s.location || 'carriage_7';
  if (loc === 'carriage_7') {
    if (countValidEvidence(s) >= 2) out.push({ label: '说服赵乘警检查地板', template: '我找到赵乘警，说明小宁听见过声音，而且我也确认声音不来自座位，请他检查地板。' });
    if (s.carried_memory.includes('xiaoning_heard_ticking')) out.push({ label: '直接安抚小宁', template: '我蹲到小宁面前，温和地说：我知道你听见了地板下面的声音，别怕，我只是想确认它。' });
    out.push(
      { label: '检查座位下方', template: '我假装系鞋带，低头检查座位下方，判断滴答声来自哪里。' },
      { label: '和小宁对话', template: '我走到小宁身边，蹲下来和她说话。' },
      { label: '找赵乘警', template: '我找到赵乘警，压低声音报告第七节车厢的异常。' },
    );
  }
  if (loc === 'connector_7_8') {
    out.push(
      { label: '试探沈墨寒', template: '我走向沈墨寒，试探他是否知道连接处发生过什么。' },
    );
  }
  if (loc === 'carriage_7') {
    out.push({ label: '前往连接处', template: '我起身穿过过道，走向第七节车厢和第八节车厢之间的连接处。' });
  } else if (loc === 'connector_7_8') {
    out.push({ label: '返回第七节车厢', template: '我从连接处回到第七节车厢。' });
  }
  out.push({ label: '强制失败测试', template: '我错过了关键时机，进入失败结算。' });
  return out.slice(0, 7);
}
function dialogueSuggestions(s) {
  const npc = NPCS[s.active_npc];
  return npc?.suggestions || [];
}
function maybeFail(s) {
  if (s.ap_remaining <= 0 || String(s.clock) >= '09:00') return failLoop(s, 'time_out_explosion');
  return null;
}

function successHtml() {
  return `<div class="lt-msg-title">试玩版结束</div>
<div>赵乘警用警棍敲了敲地板。咚。声音是空的。</div>
<div>他的脸色终于变了：“你到底是谁？”</div>
<div>你还没回答，餐车方向传来一小段口琴声。</div>
<div class="lt-subtitle">你证明了</div>
<ul>
<li>第七节车厢存在异常。</li>
<li>小宁听见的声音是真的。</li>
<li>赵乘警开始相信你。</li>
<li>地板下方确实有夹层。</li>
</ul>
<div class="lt-subtitle">但你还不知道</div>
<ul>
<li>炸弹在哪里。</li>
<li>谁是真正敌人。</li>
<li>口琴声来自谁。</li>
<li>灰大衣男人到底站在哪一边。</li>
</ul>
<div class="lt-subtitle">正式版目标</div>
<div>活下去，找到炸弹，猜出敌人，留下扣子。</div>`;
}

function startDialogue(state, npcId) {
  const s = normalize(state);
  const npc = NPCS[npcId];
  if (!npc) return { state: s, messages: [{ type: 'system', text: '这个人现在不在第七节车厢。' }], suggestions: suggestions(s), goal: currentGoal(s) };
  if (npc.hidden && !isHiddenNpcVisible(s, npcId)) return { state: s, messages: [{ type: 'system', text: '这个人现在还只存在于小宁的记忆里。' }], suggestions: suggestions(s), goal: currentGoal(s) };
  if (npc.location && npc.location !== s.location) return { state: s, messages: [{ type: 'system', text: `${npc.name}不在这里。` }], suggestions: suggestions(s), goal: currentGoal(s) };
  if (s.ap_remaining < npc.cost) return failLoop(s, 'ap_not_enough');
  s.mode = 'dialogue';
  s.active_npc = npcId;
  s.dialogue_session = {
    npc_id: npcId,
    started_at: s.clock,
    ap_cost: npc.cost,
    turns: [],
    turns_used: 0,
    turn_limit: npc.turn_limit,
    near_limit_hint_at: npc.near_limit_hint_at,
    near_limit_hint_shown: false,
    pending_clues: [],
    pending_events: [],
  };
  return {
    state: s,
    ui: { mode: 'dialogue', portrait: npc.portrait, placeholder: `对${npc.name}说些什么……` },
    messages: [{ type: 'npc', npc_id: npcId, text: npc.opening }],
    suggestions: dialogueSuggestions(s),
    goal: currentGoal(s),
  };
}

function commitAction(text, state) {
  const s = normalize(state);
  const action = parseAction(text || '');
  if (action.intent === 'move_to_connector') {
    s.ap_remaining -= 1; advanceClock(s, 1); s.location = 'connector_7_8';
    const failure = maybeFail(s); if (failure) return failure;
    return { state: s, messages: [{ type: 'system', text: '你起身穿过过道，走到第七节车厢和第八节车厢之间的连接处。列车晃动让铁板发出沉闷的声响。灰大衣的沈墨寒站在这里。' }], suggestions: suggestions(s), goal: currentGoal(s) };
  }
  if (action.intent === 'move_to_carriage_7') {
    s.ap_remaining -= 1; advanceClock(s, 1); s.location = 'carriage_7';
    const failure = maybeFail(s); if (failure) return failure;
    return { state: s, messages: [{ type: 'system', text: '你从连接处回到第七节车厢。过道里灯光明暗不定，小宁还在靠窗的位置，赵乘警仍在查票。地板下方的滴答声依然隐约可闻。' }], suggestions: suggestions(s), goal: currentGoal(s) };
  }
  if (action.intent === 'start_dialogue') return startDialogue(s, action.target_npc);
  if (action.intent === 'force_fail') return failLoop(s, 'time_out_explosion');
  if (action.intent === 'observe_under_seat') {
    s.ap_remaining -= 1; advanceClock(s, 1); addClue(s, 'sound_not_from_seat');
    const failure = maybeFail(s); if (failure) return failure;
    return { state: s, messages: [{ type: 'system', text: '你假装系鞋带，低头靠近座位下方。声音仍在，但不像来自座位底部。你确认：它更像来自地板夹层。\n【获得线索】声音不来自座位下方' }], suggestions: suggestions(s), goal: currentGoal(s) };
  }
  if (action.intent === 'convince_zhao') return convinceZhao(s);
    return { state: s, messages: [{ type: 'system', text: '你需要更明确地描述你的行动。观察车厢，寻找线索，与周围的人交谈。' }], suggestions: suggestions(s), goal: currentGoal(s) };
}

function convinceZhao(s) {
  s = normalize(s);
  if (countValidEvidence(s) >= 2) {
    s.ap_remaining -= 2; advanceClock(s, 2); s.flags.zhao_checked_floor = true; s.flags.trial_success = true;
    return { state: s, messages: [{ type: 'outcome', html: successHtml() }], trial_success: true, suggestions: [], goal: currentGoal(s) };
  }
  s.ap_remaining -= 1; s.npc_states.zhao_police.suspicion += 10; addClue(s, 'zhao_requires_evidence');
  const failure = maybeFail(s); if (failure) return failure;
  return { state: s, messages: [{ type: 'system', text: '赵乘警没有行动：“证据不够。你不能只凭感觉让我封锁车厢。”\n【获得信息】赵乘警需要证据才会行动。' }], suggestions: suggestions(s), goal: currentGoal(s) };
}

function applyDialogueTurnLimitIfNeeded(s, npcId, response) {
  const npc = NPCS[npcId] || {};
  const session = s.dialogue_session || {};
  const turnsUsed = session.turns_used || (session.turns || []).length || 0;
  const limit = session.turn_limit || npc.turn_limit || 8;
  if (!session.near_limit_hint_shown && turnsUsed >= (session.near_limit_hint_at || Math.max(1, limit - 2)) && turnsUsed < limit) {
    session.near_limit_hint_shown = true;
    response.messages.push({ type: 'system', text: npc.near_limit_hint || '这段对话接近尾声，最好问关键问题。' });
  }
  if (turnsUsed >= limit) {
    if (npc.turn_limit_policy === 'risk_escalation' && s.npc_states[npcId]) {
      s.npc_states[npcId].suspicion = (s.npc_states[npcId].suspicion || 0) + 15;
      response.messages.push({ type: 'system', text: `${npc.limit_message || '对方不再继续回答。'}\n【警觉上升】` });
    } else {
      response.messages.push({ type: 'system', text: npc.limit_message || '这次对话已经无法继续获得更多信息。' });
    }
    const ended = endDialogue(s);
    return {
      state: ended.state,
      messages: response.messages.concat(ended.messages || []),
      dialogue_outcome: ended.dialogue_outcome,
      suggestions: ended.suggestions,
      trial_success: ended.trial_success,
      goal: currentGoal(ended.state),
    };
  }
  s.dialogue_session = session;
  response.state = s;
  response.suggestions = npc.suggestions || [];
  response.goal = currentGoal(s);
  return response;
}

function cleanLlmReply(text) {
  return String(text || '')
    .replace(/【\s*(获得线索|AP\s*[-+]?\d+|试玩版成功|循环失败|游戏结束)[^】]*】/g, '')
    .replace(/^(系统|旁白|裁判)[:：].*$/gm, '')
    .trim();
}

function dialogueMessage(npcId, playerText, state, options = {}) {
  const s = normalize(state);
  npcId = npcId || s.active_npc;
  const npc = NPCS[npcId];
  if (!npc || s.mode !== 'dialogue') return { state: s, messages: [{ type: 'system', text: '当前没有正在进行的对话。' }], suggestions: suggestions(s), goal: currentGoal(s) };
  const session = s.dialogue_session || {
    npc_id: npcId, turns: [], turns_used: 0, turn_limit: npc.turn_limit, near_limit_hint_at: npc.near_limit_hint_at,
    pending_clues: [], pending_events: [], ap_cost: npc.cost || 3, started_at: s.clock,
  };
  if (!session.turn_limit) session.turn_limit = npc.turn_limit || 8;
  if (!session.near_limit_hint_at) session.near_limit_hint_at = npc.near_limit_hint_at || Math.max(1, session.turn_limit - 2);
  let reply = '';
  const t = String(playerText || '');
  const response = { state: s, messages: [], suggestions: npc.suggestions };

  if (npcId === 'xiaoning') {
    const gentle = /别怕|帮你|温和|轻声|压低|我也听见|蹲|相信|保护/.test(t);
    if (gentle) { s.npc_states.xiaoning.trust += 12; s.npc_states.xiaoning.fear = Math.max(0, s.npc_states.xiaoning.fear - 6); }
    const motherTopic = /(你妈妈|妈妈.*(布娃娃|娃娃|玩偶)|布娃娃.*(妈妈|母亲|家人)|娃娃.*(妈妈|母亲|家人)|一个人.*(坐车|上车|害怕)|等谁|谁给你的)/.test(t);
    const emotionalKey = /(别怕|相信|保护|帮你|我会帮你|我会保护你|我也听见)/.test(t);
    if (motherTopic && emotionalKey && s.npc_states.xiaoning.trust >= 36 && s.npc_states.xiaoning.fear <= 55) {
      session.pending_clues = unique([...(session.pending_clues || []), 'mother_doll_memory']);
      s.flags.xiaoning_mother_memory_triggered = true;
      unlockHiddenNpc(s, 'xiaoning_mother_hidden');
      reply = '小宁低头看着怀里的布娃娃，声音轻得像怕惊醒什么：“妈妈说，坐火车的时候，不要和陌生人讲话……可是你不像坏人。”';
      response.memory_node = { id: 'xiaoning_mother_memory', npc_id: 'xiaoning_mother_hidden', portrait: NPCS.xiaoning_mother_hidden.portrait, title: '隐藏记忆：小宁妈妈' };
    } else if (/滴答|声音|下面|地板|听见/.test(t) || gentle) {
      session.pending_clues = unique([...(session.pending_clues || []), 'ticking_under_floor', 'xiaoning_heard_ticking']);
      reply = '小宁抬头看了你一眼，又很快低下头。她用鞋尖轻轻碰了碰地板：“不是座位下面……是下面在响。”';
    } else {
      reply = '小宁抱紧布娃娃，只用很小的幅度摇了摇头。她还没有完全相信你。';
    }
  } else if (npcId === 'zhao_police') {
    if (/证据|地板|检查|声音|小宁|滴答/.test(t) && countValidEvidence(s) >= 2) {
      reply = '赵乘警听完你的证据，脸色终于沉下来：“你带我过去。别惊动其他乘客。”';
      session.pending_events.push('zhao_ready_to_check_floor');
    } else {
      addClue(s, 'zhao_requires_evidence');
      reply = '赵乘警没有立刻行动：“你需要给我能查证的东西。谁听见了？你看见了什么？”';
    }
  } else if (npcId === 'shen_mohan') {
    if (/连接处|08:48|餐车|口琴|离开|去了哪里/.test(t)) {
      session.pending_clues = unique([...(session.pending_clues || []), 'suspicious_connector_movement', 'harmonica_from_dining_car']);
      s.flags.shen_connector_hint_seen = true;
      reply = '沈墨寒的手指在打火机上停了一瞬：“你关心的是我，还是连接处？”他没有否认自己离开过座位。';
    } else if (/灰大衣|纸条|相信|不相信/.test(t)) {
      s.npc_states.shen_mohan.suspicion += 8;
      reply = '沈墨寒低头看了一眼自己的袖口，笑意很淡：“提醒你的人，也许更不值得相信。”';
    } else {
      reply = '沈墨寒看着你，像是在衡量你究竟记得多少：“你问得太急了。”';
    }
  } else if (npcId === 'xiaoning_mother_hidden') {
    reply = /小宁|孩子|她/.test(t)
      ? '那个温柔的声音像从旧布料深处传来：“她一直很怕声音。你若真想帮她，就别急着逼她说出全部。”'
      : '布娃娃轻轻晃了一下。那个声音低低地说：“有些话，她不是不记得，只是不敢记得。”';
  }

  const llmReply = cleanLlmReply(options.llm_reply || options.llmReply || '');
  if (llmReply) reply = llmReply;
  session.turns.push({ player: t, npc: reply });
  session.turns_used = session.turns.length;
  s.dialogue_session = session;
  response.state = s;
  response.messages.unshift({ type: 'npc', npc_id: npcId, text: reply });
  return applyDialogueTurnLimitIfNeeded(s, npcId, response);
}

function endDialogue(state) {
  const s = normalize(state);
  const npcId = s.active_npc;
  if (!npcId) return { state: s, messages: [{ type: 'system', text: '当前没有需要结束的对话。' }], suggestions: suggestions(s), goal: currentGoal(s) };
  const npc = NPCS[npcId] || { name: npcId, cost: 3 };
  const session = s.dialogue_session || { pending_clues: [], pending_events: [], ap_cost: npc.cost || 3, started_at: s.clock, turns: [] };
  const pending = unique(session.pending_clues || []);
  pending.forEach(id => addClue(s, id));
  if (npcId === 'xiaoning' && pending.includes('ticking_under_floor')) addClue(s, 'harmonica_from_dining_car');
  const cost = session.ap_cost || npc.cost || 3;
  const from = session.started_at || s.clock;
  s.ap_remaining -= cost;
  advanceClock(s, cost);
  const world_events = [];
  if (npcId === 'xiaoning') world_events.push('沈墨寒已经离开第七节车厢。', '餐车方向传来一小段口琴声。');
  if (npcId === 'shen_mohan') world_events.push('沈墨寒重新看向窗外，不再主动开口。');
  if ((session.pending_events || []).includes('zhao_ready_to_check_floor')) {
    s.flags.zhao_checked_floor = true;
    if (countValidEvidence(s) >= 2) s.flags.trial_success = true;
  }
  const outcome = {
    npc_id: npcId,
    npc_name: npc.name,
    summary: `${npc.name}的对话结束。`,
    time_advance: { from, to: s.clock },
    ap_cost: cost,
    turns_used: session.turns_used || (session.turns || []).length || 0,
    turn_limit: session.turn_limit || npc.turn_limit || null,
    clues_gained: pending.map(id => clueDetail(id)),
    world_events,
    unlocked_actions: suggestions(s).slice(0, 3),
  };
  s.mode = 'explore'; s.active_npc = null; s.dialogue_session = null; s.last_outcome = outcome;
  const failure = maybeFail(s); if (failure) return failure;
  const res = { state: s, dialogue_outcome: outcome, suggestions: suggestions(s), goal: currentGoal(s) };
  if (s.flags.trial_success) {
    res.messages = [{ type: 'outcome', html: successHtml() }];
    res.trial_success = true;
  }
  return res;
}

function failLoop(state, reason) {
  const s = normalize(state);
  const carry = unique(s.known_clues.filter(id => id !== 'gray_coat_note_pressure' && clueDetail(id).carry_to_next_loop));
  return {
    state: s,
    loop_failure_outcome: {
      loop: s.loop,
      failed_at: s.clock,
      failure_type: reason,
      failure_reason: reason === 'time_out_explosion' ? '你没能在爆炸前证明异常。' : '行动值不足，错过了关键时机。',
      confirmed_facts: carry.map(id => Object.assign(clueDetail(id), { text: clueName(id), carry_to_next_loop: true })),
      suspicions: s.known_clues.includes('harmonica_from_dining_car') ? [{ id: 'harmonica_from_dining_car', text: '餐车方向的口琴声出现得过于巧合。', confidence: 'low', carry_to_next_loop: true }] : [],
      mistakes: countValidEvidence(s) < 2 ? [{ id: 'insufficient_evidence', text: '你没能形成足够证据链，赵乘警无法行动。' }] : [],
      next_loop_suggestions: suggestions(s).slice(0, 3),
    },
    goal: currentGoal(s),
  };
}

function nextLoop(previous) {
  const carry = unique(previous?.loop_failure_outcome?.confirmed_facts?.map(x => x.id) || previous?.state?.known_clues?.filter(id => id !== 'gray_coat_note_pressure') || []);
  const s = normalize(START_STATE);
  s.loop = (previous?.state?.loop || 1) + 1;
  s.flags.intro_seen = true;
  s.carried_memory = carry;
  s.known_clues = unique(['gray_coat_note_pressure', ...carry]);
  let opening = '你猛地睁开眼。\n\n第七节车厢，08:45。';
  if (carry.length) {
    opening += `\n\n你记得上一轮留下的信息：${carry.map(clueName).join('、')}。`;
    if (carry.includes('xiaoning_heard_ticking') || carry.includes('ticking_under_floor')) {
      opening += '\n\n小宁还坐在靠窗的位置，抱着那只旧布娃娃。你知道，她听见过地板下方的声音。';
    }
    if (carry.includes('zhao_requires_evidence')) {
      opening += '\n\n你也记得，赵乘警不会相信没有证据的报警。';
    }
  } else {
    opening += '\n\n你只记得上一轮的失败。';
  }
  return { state: s, opening, suggestions: suggestions(s), goal: currentGoal(s) };
}

function getNpcs() { return clone(NPCS); }
function getClueTitles() { return clone(CLUE_TITLES); }
function getClueDetails() { return clone(CLUE_DETAILS); }
function getScenes() { return clone(SCENES); }
function getNpcInfo() {
  return Object.fromEntries(
    Object.entries(NPCS).map(([id, npc]) => [
      id,
      { name: npc.name, portrait: npc.portrait, location: npc.location, hidden: !!npc.hidden },
    ])
  );
}

module.exports = {
  START_STATE, NPCS, SCENES, CLUE_TITLES, CLUE_DETAILS,
  normalize, parseAction, commitAction, startDialogue, dialogueMessage, endDialogue,
  failLoop, nextLoop, suggestions, dialogueSuggestions, countValidEvidence, currentGoal,
  clueDetail, cleanLlmReply, getNpcs, getClueTitles, getClueDetails, getScenes, getNpcInfo, sceneName,
};
