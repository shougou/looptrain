'use strict';

/* LT UI v0.11.0 — GameShell + Layout Components
 * StatusBar, TimelineMiniBar, ObjectiveCard, SceneStateCard, CommandInput
 * + GameShell orchestrator
 */

// ── GameShell: root orchestrator ──
class GameShell {
  constructor() { this.components = []; this.state = null; this.prevState = null; }
  register(comp) { this.components.push(comp); return comp; }
  setState(newState) {
    this.prevState = this.state ? JSON.parse(JSON.stringify(this.state)) : null;
    this.state = newState;
    this.updateAll();
  }
  updateAll() {
    if (!this.state) return;
    for (var i = 0; i < this.components.length; i++) {
      try { this.components[i].update(this.state); } catch(e) { console.warn('[LT] Component update:', e); }
    }
  }
}

// ── StatusBar ──
class StatusBar extends Component {
  constructor(el) { super(el); this._loop = null; this._clock = null; this._ap = null; }
  update(state) {
    if (this._loop !== state.loop) { var e = this.el && this.el.querySelector('.lt-status-loop'); if (e) e.textContent = '第 ' + state.loop + ' 轮'; this._loop = state.loop; }
    if (this._clock !== state.clock) { var e2 = this.el && this.el.querySelector('.lt-status-clock'); if (e2) e2.textContent = state.clock; this._clock = state.clock; }
    if (this._ap !== state.ap_remaining) { var e3 = this.el && this.el.querySelector('.lt-status-ap'); if (e3) { e3.textContent = 'AP ' + state.ap_remaining; e3.classList.toggle('lt-ap-low', state.ap_remaining <= 3); } this._ap = state.ap_remaining; }
  }
}

// ── TimelineMiniBar ──
class TimelineMiniBar extends Component {
  constructor(el) { super(el); this._clock = null; this._entries = 0; }
  update(state) {
    var progress = timelineProgress(state.clock);
    var bar = this.el && this.el.querySelector('.lt-tl-progress');
    if (bar) bar.style.width = progress + '%';
    var entries = (state.player_timeline && state.player_timeline.entries) || [];
    var currentLoopEntries = entries.filter(function(e) { return e.loop_observed === state.loop && e.time; });
    if (this._entries !== currentLoopEntries.length || this._clock !== state.clock) {
      var track = this.el && this.el.querySelector('.lt-tl-track');
      if (track) {
        track.querySelectorAll('.lt-tl-marker').forEach(function(m) { m.remove(); });
        for (var i = 0; i < currentLoopEntries.length; i++) {
          var e = currentLoopEntries[i];
          var pct = timelineProgress(e.time);
          var marker = document.createElement('div');
          marker.className = 'lt-tl-marker lt-tl-marker-' + (e.source_type || 'observation');
          marker.style.left = pct + '%';
          marker.title = (e.time || '') + ' ' + (e.source_label || '');
          track.appendChild(marker);
        }
      }
      this._entries = currentLoopEntries.length;
      this._clock = state.clock;
    }
  }
}

// ── ObjectiveCard ──
class ObjectiveCard extends Component {
  constructor(el) { super(el); this._goalText = null; this._stepsHash = ''; }
  update(state) {
    var goalText = '';
    if (state._goalData) { if (typeof state._goalData === 'string') goalText = state._goalData; else if (state._goalData.goals && state._goalData.goals.length) goalText = state._goalData.goals[0].title || ''; }
    if (!goalText) goalText = state._goal || '证明二号车厢存在异常';
    var steps = getObjectiveSteps(goalText, state);
    var stepsHash = steps.map(function(s) { return s.label + (s.done ? '1' : '0'); }).join('|');
    if (this._goalText === goalText && this._stepsHash === stepsHash) return;
    this._goalText = goalText; this._stepsHash = stepsHash;
    if (!this.el) return;
    var html = '<div class="lt-objective-title">当前目标</div>';
    html += '<div class="lt-objective-text">' + esc(goalText) + '</div>';
    if (steps.length > 0) {
      html += '<ul class="lt-objective-steps">';
      for (var i = 0; i < steps.length; i++) {
        html += '<li class="lt-step ' + (steps[i].done ? 'lt-step-done' : 'lt-step-pending') + '">' + (steps[i].done ? '✓ ' : '□ ') + esc(steps[i].label) + '</li>';
      }
      html += '</ul>';
    }
    this.el.innerHTML = html;
  }
}

// ── SceneStateCard ──
class SceneStateCard extends Component {
  constructor(el, opts) { super(el); this.opts = opts || {}; this._location = null; this._npcHash = ''; }
  update(state) {
    var scene = (this.opts.scenes && this.opts.scenes[state.location]) || {};
    var locationName = scene.name || state.location;
    var mem = state.loop > 1 && state.carried_memory && state.carried_memory.length
      ? '你记得上一轮留下的信息：' + state.carried_memory.map(this.opts.clueName || function(id){return id;}).join('、') + '。' : '';
    var sceneText = mem + (scene.text || '列车灯光昏黄，窗外夜色流动。');
    var npcs = (scene.npcs || []).slice();
    var npcInfo = this.opts.npcInfo || {};
    Object.keys(npcInfo).forEach(function(id) {
      if (npcInfo[id].hidden && npcInfo[id].location === state.location && (state.flags.visible_hidden_npcs || []).indexOf(id) !== -1 && npcs.indexOf(id) === -1) npcs.push(id);
    });
    var npcHash = npcs.join(',') + '|' + JSON.stringify(state.npc_states || {});
    if (this._location === state.location && this._npcHash === npcHash) return;
    this._location = state.location; this._npcHash = npcHash;
    if (!this.el) return;
    var html = '<div class="lt-scene-location">' + esc(locationName) + '</div>';
    html += '<div class="lt-scene-text">' + esc(sceneText) + '</div>';
    var statusHtml = '';
    for (var i = 0; i < npcs.length; i++) {
      var npcId = npcs[i];
      var info = npcInfo[npcId] || {};
      var desc = npcStateDesc(npcId, state.npc_states);
      if (desc || info.name) statusHtml += '<div class="lt-status-line"><span class="lt-status-label">' + esc(info.name || npcId) + '</span> ' + esc(desc || '在场') + '</div>';
    }
    if (statusHtml) html += '<div class="lt-scene-status">' + statusHtml + '</div>';
    this.el.innerHTML = html;
  }
}

// ── CommandInput ──
class CommandInput extends Component {
  constructor(el, opts) { super(el); this.opts = opts || {}; this._mode = null; this._activeNpc = null; this.inputEl = el && el.querySelector('.lt-input'); this.sendBtn = el && el.querySelector('#btn-send'); this.tabsEl = el && el.querySelector('.lt-mode-tabs'); }
  update(state) {
    var isDialogue = state.mode === 'dialogue';
    if (this._mode !== state.mode) {
      if (this.el) this.el.classList.toggle('lt-dialogue-mode', isDialogue);
      if (this.tabsEl) { this.tabsEl.querySelectorAll('[data-mode]').forEach(function(tab) { tab.classList.toggle('lt-active', tab.dataset.mode === (isDialogue ? 'dialogue' : 'action')); }); }
      this._mode = state.mode;
    }
    if (this._activeNpc !== state.active_npc) {
      if (this.inputEl) { var name = this.opts.npcName ? this.opts.npcName(state.active_npc) : (state.active_npc || ''); this.inputEl.placeholder = isDialogue && name ? '和' + name + '说些什么……' : '你要做什么？'; }
      this._activeNpc = state.active_npc;
    }
  }
}
