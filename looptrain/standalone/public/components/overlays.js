'use strict';

/* LT UI v0.11.0 — Overlay components: ArchiveSheet, DialogueFocusSheet */

// ── ArchiveSheet ──
class ArchiveSheet extends Component {
  constructor(el, opts) { super(el); this.opts = opts || {}; this._tab = null; }
  open(tab) {
    this._tab = tab || 'clues';
    if (this.el) this.el.classList.add('lt-show');
    this._render();
  }
  close() { if (this.el) this.el.classList.remove('lt-show'); }
  openTab(tab) { this._tab = tab; this._render(); }
  _render() {
    if (!this.el || !this.opts.getState) return;
    var state = this.opts.getState();
    var tab = this._tab;
    var html = '<div class="lt-archive-header"><span>档案</span><button class="lt-archive-close" id="lt-archive-close">✕</button></div>';
    html += '<div class="lt-archive-tabs">';
    var tabs = [['clues','线索'],['characters','人物'],['timeline','时间线'],['memory','记忆']];
    for (var i = 0; i < tabs.length; i++) {
      html += '<button class="lt-tab' + (tab === tabs[i][0] ? ' lt-active' : '') + '" data-tab="' + tabs[i][0] + '">' + tabs[i][1] + '</button>';
    }
    html += '</div><div class="lt-archive-content">';
    if (tab === 'clues') html += this._renderClues(state);
    else if (tab === 'characters') html += this._renderCharacters(state);
    else if (tab === 'timeline') html += this._renderTimeline(state);
    else if (tab === 'memory') html += this._renderMemory(state);
    html += '</div>';
    this.el.innerHTML = html;
  }
  _renderClues(state) {
    var clueTitles = (this.opts.npcCache && this.opts.npcCache.clue_titles) || {};
    var clues = state.known_clues || [];
    if (!clues.length) return '<p class="lt-archive-empty">暂无线索</p>';
    var groups = { physical: [], claim: [], observation: [], inference: [], ambiguous_clue: [], confirmed_fact: [], suspicion: [], emotional_memory: [] };
    for (var i = 0; i < clues.length; i++) {
      var id = clues[i];
      var title = clueTitles[id] || id;
      // We don't have source_type in clue_titles, so group by pattern
      var type = 'physical';
      if (id.indexOf('claim_') === 0) type = 'claim';
      else if (id.indexOf('obs_') === 0) type = 'observation';
      else if (id.indexOf('inf_') === 0) type = 'inference';
      if (!groups[type]) groups[type] = [];
      groups[type].push({ id: id, title: title });
    }
    var labels = { physical: '物理线索', claim: 'NPC主张', observation: '观察记录', inference: '推理结论', ambiguous_clue: '其他', confirmed_fact: '确认事实', suspicion: '疑点', emotional_memory: '记忆' };
    var html = '';
    var keys = Object.keys(groups);
    for (var k = 0; k < keys.length; k++) {
      if (!groups[keys[k]].length) continue;
      html += '<div class="lt-archive-group"><div class="lt-archive-group-label">' + (labels[keys[k]] || keys[k]) + '</div><ul>';
      for (var j = 0; j < groups[keys[k]].length; j++) {
        html += '<li>' + esc(groups[keys[k]][j].title) + '</li>';
      }
      html += '</ul></div>';
    }
    return html || '<p class="lt-archive-empty">暂无线索</p>';
  }
  _renderCharacters(state) {
    var npcInfo = this.opts.npcInfo || {};
    var npcStates = state.npc_states || {};
    var html = '';
    var ids = Object.keys(npcInfo).filter(function(id) { return !npcInfo[id].hidden; });
    for (var i = 0; i < ids.length; i++) {
      var id = ids[i];
      var info = npcInfo[id] || {};
      var st = npcStates[id] || {};
      html += '<div class="lt-char-card">';
      html += '<div class="lt-char-name">' + esc(info.name || id) + '</div>';
      html += '<div class="lt-char-state">';
      if (st.trust != null) html += '<div class="lt-stat"><span>信任</span><div class="lt-stat-bar"><div class="lt-stat-fill lt-stat-trust" style="width:' + st.trust + '%"></div></div><span>' + st.trust + '</span></div>';
      if (st.fear != null) html += '<div class="lt-stat"><span>恐惧</span><div class="lt-stat-bar"><div class="lt-stat-fill lt-stat-fear" style="width:' + st.fear + '%"></div></div><span>' + st.fear + '</span></div>';
      if (st.suspicion != null) html += '<div class="lt-stat"><span>怀疑</span><div class="lt-stat-bar"><div class="lt-stat-fill lt-stat-suspicion" style="width:' + st.suspicion + '%"></div></div><span>' + st.suspicion + '</span></div>';
      html += '</div>';
      var desc = npcStateDesc(id, npcStates);
      if (desc) html += '<div class="lt-char-desc">' + esc(desc) + '</div>';
      html += '</div>';
    }
    return html || '<p class="lt-archive-empty">无可查看人物</p>';
  }
  _renderTimeline(state) {
    var entries = (state.player_timeline && state.player_timeline.entries) || [];
    if (!entries.length) return '<p class="lt-archive-empty">时间线暂为空。通过观察场景、盯住NPC或守点观察来收集时间信息。</p>';
    var groups = {};
    for (var i = 0; i < entries.length; i++) {
      var e = entries[i];
      var actor = e.actor || 'scene';
      if (!groups[actor]) groups[actor] = [];
      groups[actor].push(e);
    }
    var html = '';
    var keys = Object.keys(groups);
    for (var a = 0; a < keys.length; a++) {
      html += '<div class="lt-tl-group"><div class="lt-tl-group-header">' + esc(actorName(keys[a])) + '</div>';
      for (var j = 0; j < groups[keys[a]].length; j++) {
        var entry = groups[keys[a]][j];
        var time = entry.time || (entry.time_range ? entry.time_range[0] : '??:??');
        var tag = '', tagClass = '';
        if (entry.source_type === 'observation') { tag = '[观察]'; tagClass = 'lt-tl-tag-observation'; }
        else if (entry.source_type === 'claim') { tag = '[自述]'; tagClass = 'lt-tl-tag-claim'; }
        else if (entry.source_type === 'inference') { tag = '[推理]'; tagClass = 'lt-tl-tag-inference'; }
        else if (entry.source_type === 'memory') { tag = '[记忆]'; tagClass = 'lt-tl-tag-memory'; }
        var hasConflict = entry.contradicts && entry.contradicts.length > 0;
        if (hasConflict) { tag += ' [矛盾]'; tagClass = 'lt-tl-tag-conflict'; }
        var verifiedClass = entry.current_loop_verified ? ' lt-tl-verified' : '';
        var content = entry.description || (this.opts.clueName ? this.opts.clueName(entry.source_id) : '') || (this.opts.clueName ? this.opts.clueName(entry.public_clue_id) : '') || entry.source_label || '';
        html += '<div class="lt-timeline-entry' + verifiedClass + '"><span class="lt-tl-time">' + esc(time) + '</span><span class="' + tagClass + '">' + esc(tag) + '</span><span class="lt-tl-content">' + esc(content) + '</span></div>';
      }
      html += '</div>';
    }
    return html;
  }
  _renderMemory(state) {
    var memory = state.carried_memory || [];
    var entries = (state.player_timeline && state.player_timeline.entries) || [];
    var memEntries = entries.filter(function(e) { return e.source_type === 'memory'; });
    if (!memory.length && !memEntries.length) return '<p class="lt-archive-empty">暂无跨循环记忆</p>';
    var html = '';
    if (memory.length) {
      html += '<div class="lt-archive-group"><div class="lt-archive-group-label">继承线索</div><ul>';
      for (var i = 0; i < memory.length; i++) {
        var name = (this.opts.clueName ? this.opts.clueName(memory[i]) : memory[i]);
        html += '<li>' + esc(name) + '</li>';
      }
      html += '</ul></div>';
    }
    if (memEntries.length) {
      html += '<div class="lt-archive-group"><div class="lt-archive-group-label">时间线记忆</div><ul>';
      for (var j = 0; j < memEntries.length; j++) {
        html += '<li>' + esc(memEntries[j].source_label || memEntries[j].time || '') + ' ' + esc(memEntries[j].description || '') + '</li>';
      }
      html += '</ul></div>';
    }
    return html;
  }
  update(state) { /* passive — content rendered on open */ }
}

// ── DialogueFocusSheet ──
class DialogueFocusSheet extends Component {
  constructor(el, opts) { super(el); this.opts = opts || {}; this._activeNpc = null; this._logEl = null; }
  open(npcId) {
    this._activeNpc = npcId;
    if (!this.el) return;
    var info = (this.opts.npcInfo || {})[npcId] || {};
    var name = info.name || npcId;
    var state = this.opts.getState ? this.opts.getState() : {};
    var desc = npcStateDesc(npcId, state.npc_states);
    var portraitSrc = (this.opts.assetBase || '/assets/') + (info.portrait || 'xiaoning_portrait.png');
    var html = '<div class="lt-df-header"><button class="lt-df-back" id="lt-df-back">← 返回</button><span class="lt-df-npc">' + esc(name) + '</span><div class="lt-df-portrait"><img src="' + esc(portraitSrc) + '" alt="' + esc(name) + '"></div></div>';
    if (desc) html += '<div class="lt-df-status">' + esc(desc) + '</div>';
    html += '<div class="lt-df-log" id="lt-df-log"></div>';
    // Suggestions from NPC info
    var suggestions = info.suggestions || [];
    if (suggestions.length) {
      html += '<div class="lt-df-suggestions">';
      for (var i = 0; i < suggestions.length; i++) {
        var s = suggestions[i];
        html += '<button class="lt-df-sugg-btn" data-template="' + esc(s.template || '') + '">' + esc(s.label || '') + '</button>';
      }
      html += '</div>';
    }
    html += '<button class="lt-df-end" id="lt-df-end">结束对话</button>';
    this.el.innerHTML = html;
    this.el.classList.add('lt-show');
    this._logEl = this.el.querySelector('#lt-df-log');
  }
  close() { this._activeNpc = null; if (this.el) { this.el.classList.remove('lt-show'); this.el.innerHTML = ''; this._logEl = null; } }
  appendMsg(type, text) {
    if (!this._logEl) return;
    var div = document.createElement('div');
    div.className = 'lt-msg lt-msg-' + type;
    div.textContent = text;
    this._logEl.appendChild(div);
    this._logEl.scrollTop = this._logEl.scrollHeight;
  }
  isActive() { return this._activeNpc !== null; }
  getNpcId() { return this._activeNpc; }
  update(state) { /* passive — content managed via appendMsg */ }
}
