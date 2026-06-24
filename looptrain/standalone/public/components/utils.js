'use strict';

/* LT UI v0.11.0 — Component utilities and base class
 * Provides: Component base, parseTime, formatCost, classifyAction, diffNpcStates,
 *           diffSuggestions, buildActionResultCard, esc, HIGH_RISK_ACTIONS, OBJECTIVE_STEPS
 */

// ── Component base class ──
class Component {
  constructor(el) { this.el = el; this._dirty = {}; }
  update(state) { /* override in subclass */ }
  show() { if (this.el) this.el.style.display = ''; }
  hide() { if (this.el) this.el.style.display = 'none'; }
}

// ── Utilities ──
function parseTime(hhmm) {
  if (!hhmm || typeof hhmm !== 'string') return 0;
  var parts = hhmm.split(':');
  return parseInt(parts[0], 10) * 60 + parseInt(parts[1] || '0', 10);
}

function formatCost(ap, minutes) {
  var parts = [];
  if (ap) parts.push(ap + ' AP');
  if (minutes) parts.push(minutes + ' 分钟');
  return '消耗：' + (parts.join(' / ') || '0');
}

function esc(s) {
  var div = document.createElement('div');
  div.textContent = String(s == null ? '' : s);
  return div.innerHTML;
}

function classifyAction(template) {
  if (!template) return { actionType: 'system', priority: 99 };
  if (template.indexOf('__OBSERVE_SCENE__') === 0) return { actionType: 'observe', priority: 2, label: '观察当前场景' };
  if (template.indexOf('__OBSERVE_NPC__') === 0) return { actionType: 'observe', priority: 2, label: '盯住' + (template.split(':')[1] || '') };
  if (template.indexOf('__OBSERVE_LOCATION__') === 0) return { actionType: 'observe', priority: 2, label: '守点观察' };
  if (template.indexOf('__END_DIALOGUE__') === 0) return { actionType: 'system', priority: 99 };
  if (template.indexOf('__DIALOGUE__:') === 0) return { actionType: 'dialogue', priority: 3 };
  if (/检查|查看|调查|搜索/.test(template)) return { actionType: 'observe', priority: 2 };
  if (/询问|对话|交谈|试探/.test(template)) return { actionType: 'dialogue', priority: 3 };
  if (/前往|返回|走到|穿过/.test(template)) return { actionType: 'move', priority: 4 };
  for (var i = 0; i < HIGH_RISK_ACTIONS.length; i++) {
    if (HIGH_RISK_ACTIONS[i].pattern.test(template)) return { actionType: 'high_risk', priority: 5 };
  }
  return { actionType: 'dialogue', priority: 3 };
}

function diffNpcStates(prevState, newState) {
  if (!prevState || !prevState.npc_states || !newState.npc_states) return [];
  var changes = [];
  var npcIds = Object.keys(newState.npc_states);
  for (var i = 0; i < npcIds.length; i++) {
    var id = npcIds[i];
    var prev = prevState.npc_states[id] || {};
    var next = newState.npc_states[id] || {};
    var delta = {};
    if (prev.trust !== next.trust) delta.trust = (next.trust || 0) - (prev.trust || 0);
    if (prev.fear !== next.fear) delta.fear = (next.fear || 0) - (prev.fear || 0);
    if (prev.suspicion !== next.suspicion) delta.suspicion = (next.suspicion || 0) - (prev.suspicion || 0);
    if (Object.keys(delta).length > 0) {
      changes.push({ npcId: id, npcName: id, trust: delta.trust, fear: delta.fear, suspicion: delta.suspicion });
    }
  }
  return changes;
}

function diffSuggestions(prevSugg, newSugg) {
  if (!prevSugg || !newSugg) return newSugg || [];
  var prevTemplates = prevSugg.map(function(s) { return s.template; });
  return newSugg.filter(function(s) { return prevTemplates.indexOf(s.template) === -1; });
}

function buildActionResultCard(res, prevState, actionType, title) {
  var card = {
    id: 'card-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6),
    actionType: actionType || 'system',
    title: title || '行动',
    time: res.state ? res.state.clock : '',
    cost: { ap: 0, minutes: 0 },
    narrative: '',
  };
  if (prevState && res.state) {
    card.cost.ap = (prevState.ap_remaining || 0) - (res.state.ap_remaining || 0);
    card.cost.minutes = parseTime(res.state.clock) - parseTime(prevState.clock || '14:00');
  }
  var narrativeParts = [];
  if (res.messages) {
    for (var i = 0; i < res.messages.length; i++) {
      var m = res.messages[i];
      if (m.type === 'system' || m.type === 'npc') narrativeParts.push(m.text || '');
      else if (m.type === 'outcome' && m.html) narrativeParts.push(m.html);
    }
  }
  // If no messages but observation_result exists, build narrative from it
  if (narrativeParts.length === 0 && res.observation_result) {
    var obs = res.observation_result;
    if (obs.nothing_found) {
      narrativeParts.push('你仔细观察周围，没有发现异常。');
    }
    if (obs.discovered && obs.discovered.length > 0) {
      for (var d = 0; d < obs.discovered.length; d++) {
        var entry = obs.discovered[d].entry;
        var title = entry.description || entry.source_label || '新发现';
        narrativeParts.push('你注意到：' + title);
      }
    }
    if (obs.conflict_detected) {
      narrativeParts.push('⚠ 这与你已知的某条线索存在矛盾');
    }
  }
  card.narrative = narrativeParts.join('\n');
  if (res.dialogue_outcome && res.dialogue_outcome.clues_gained) {
    card.cluesAdded = res.dialogue_outcome.clues_gained.map(function(c) {
      return { id: c.id || c, title: c.title || c.id || c, source_type: c.source_type || 'claim' };
    });
  }
  if (res.observation_result && res.observation_result.discovered) {
    card.cluesAdded = res.observation_result.discovered.map(function(d) {
      return {
        id: d.entry.public_clue_id || d.entry.source_id || d.entry.id,
        title: d.entry.description || d.entry.source_label || '新发现',
        source_type: d.entry.source_type || 'observation',
      };
    });
    card.conflictDetected = res.observation_result.conflict_detected || false;
    card.timelineEvents = res.observation_result.discovered.map(function(d) {
      return { entryId: d.entry.id, time: d.entry.time || '', actor: d.entry.actor || '', action: d.entry.action || '', source_type: d.entry.source_type || 'observation', contradicts: d.entry.contradicts || [] };
    });
  }
  if (prevState && res.state) card.npcStateChanges = diffNpcStates(prevState, res.state);
  if (res.suggestions && prevState && prevState._suggestions) {
    var newSugg = diffSuggestions(prevState._suggestions, res.suggestions);
    card.unlockedActions = newSugg.map(function(s) {
      var c = classifyAction(s.template);
      return { label: s.label, template: s.template, actionType: c.actionType };
    });
  }
  return card;
}

var HIGH_RISK_ACTIONS = [
  { pattern: /提醒赵乘警|报告赵乘警|说服赵乘警/, label: '提醒赵乘警', requiresEvidence: true },
  { pattern: /强行检查|检查地板/, label: '强行检查地板', requiresEvidence: false },
  { pattern: /抢走|拿走.*布娃娃/, label: '抢走小宁布娃娃', requiresEvidence: false },
  { pattern: /喊|大声|公开.*炸弹/, label: '公开喊有炸弹', requiresEvidence: false },
];

function isHighRisk(text) {
  for (var i = 0; i < HIGH_RISK_ACTIONS.length; i++) {
    if (HIGH_RISK_ACTIONS[i].pattern.test(text)) return HIGH_RISK_ACTIONS[i];
  }
  return null;
}

var OBJECTIVE_STEPS = [
  { match: /证明.*异常/, steps: [
    { label: '找到可疑证据', check: function(s) { return (s.known_clues || []).length >= 2; } },
    { label: '说服赵乘警检查地板', check: function(s) { return s.flags && s.flags.trial_success; } },
  ]},
  { match: /证据已足够/, steps: [
    { label: '找到证据', check: function() { return true; } },
    { label: '形成证据链', check: function(s) { return (s.known_clues || []).length >= 3; } },
    { label: '说服赵乘警', check: function(s) { return s.flags && s.flags.trial_success; } },
  ]},
  { match: /已完成/, steps: [] },
];

function getObjectiveSteps(goalText, state) {
  for (var i = 0; i < OBJECTIVE_STEPS.length; i++) {
    if (OBJECTIVE_STEPS[i].match.test(goalText || '')) {
      return OBJECTIVE_STEPS[i].steps.map(function(step) { return { label: step.label, done: step.check(state) }; });
    }
  }
  return [];
}

function npcStateDesc(npcId, npcStates) {
  var st = npcStates && npcStates[npcId];
  if (!st) return '';
  var parts = [];
  if (st.trust != null) { if (st.trust < 30) parts.push('不信任'); else if (st.trust < 60) parts.push('警惕'); else parts.push('信任'); }
  if (st.fear != null && st.fear > 60) parts.push('恐惧');
  if (st.suspicion != null && st.suspicion > 60) parts.push('怀疑你');
  return parts.join('，');
}

function timelineProgress(clock) {
  var start = parseTime('14:00'), end = parseTime('14:15'), now = parseTime(clock);
  return Math.max(0, Math.min(100, ((now - start) / (end - start)) * 100));
}

var ACTOR_NAMES = { gray_passenger: '灰衣乘客', xiaoning: '小宁', zhao_police: '赵乘警', scene: '场景事件', xu_zhiwei: '许知微' };
function actorName(actor) { return ACTOR_NAMES[actor] || actor || '未知'; }
