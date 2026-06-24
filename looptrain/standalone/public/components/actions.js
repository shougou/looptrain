'use strict';

/* LT UI v0.11.0 — Action components: ActionDock, MoreActionsSheet, FocusWatchBar */

// ── ActionDock ──
class ActionDock extends Component {
  constructor(el, opts) {
    super(el);
    this.opts = opts || {};
    this._suggHash = '';
    this.moreSheet = null;
  }
  update(state) {
    var suggestions = state._suggestions || [];
    var scenes = this.opts.getScenes ? this.opts.getScenes() : {};
    var sceneNpcs = (scenes[state.location] && scenes[state.location].npcs) || [];
    var npcInfo = this.opts.getNpcInfo ? this.opts.getNpcInfo() : {};
    var npcButtons = [];
    for (var n = 0; n < sceneNpcs.length; n++) {
      var nid = sceneNpcs[n];
      var ninfo = npcInfo[nid];
      if (ninfo && !ninfo.hidden) npcButtons.push({ label: '询问' + ninfo.name, template: '__DIALOGUE__:' + nid, actionType: 'dialogue', priority: 3, npcId: nid });
    }
    Object.keys(npcInfo).forEach(function(id) {
      if (npcInfo[id].hidden && npcInfo[id].location === state.location && (state.flags.visible_hidden_npcs || []).indexOf(id) !== -1)
        npcButtons.push({ label: '询问' + npcInfo[id].name, template: '__DIALOGUE__:' + id, actionType: 'dialogue', priority: 3, npcId: id });
    });
    var allItems = npcButtons.concat(suggestions.filter(function(s) { return s.template && s.template.indexOf('__END_') !== 0; })
      .map(function(s) { var c = classifyAction(s.template); return { label: s.label, template: s.template, actionType: c.actionType, priority: c.priority }; }));
    var seen = {};
    allItems = allItems.filter(function(item) { if (seen[item.template]) return false; seen[item.template] = true; return true; });
    allItems.sort(function(a, b) { return a.priority - b.priority; });
    var recommended = allItems.slice(0, 3);
    var more = allItems.slice(3);
    var suggHash = allItems.map(function(s) { return s.template; }).join('|');
    if (this._suggHash === suggHash) return;
    this._suggHash = suggHash;
    if (!this.el) return;
    var html = '<div class="lt-action-recommended">';
    for (var i = 0; i < recommended.length; i++) {
      var npcAttr = recommended[i].npcId ? ' data-npc-id="' + esc(recommended[i].npcId) + '"' : '';
      html += '<button class="lt-action-btn lt-btn-' + recommended[i].actionType + '" data-template="' + esc(recommended[i].template) + '"' + npcAttr + '>' + esc(recommended[i].label) + '</button>';
    }
    html += '</div>';
    if (more.length > 0) html += '<button class="lt-action-more" id="lt-action-more-btn">更多行动 (' + more.length + ')</button>';
    this.el.innerHTML = html;
    this._moreActions = more;
  }
  getMoreActions() { return this._moreActions || []; }
}

// ── MoreActionsSheet ──
class MoreActionsSheet extends Component {
  constructor(el) { super(el); this._actions = []; }
  open(actions) {
    this._actions = actions || [];
    if (!this.el) return;
    var groups = { observe: [], dialogue: [], move: [], high_risk: [] };
    for (var i = 0; i < this._actions.length; i++) {
      var a = this._actions[i];
      if (groups[a.actionType]) groups[a.actionType].push(a);
    }
    var html = '<div class="lt-more-header"><span>更多行动</span><button class="lt-more-close" id="lt-more-close">✕</button></div>';
    var labels = { observe: '观察', dialogue: '对话', move: '移动', high_risk: '高风险' };
    var keys = ['observe', 'dialogue', 'move', 'high_risk'];
    for (var g = 0; g < keys.length; g++) {
      var key = keys[g];
      if (groups[key].length === 0) continue;
      html += '<div class="lt-more-section"><div class="lt-more-label">' + labels[key] + '</div>';
      for (var j = 0; j < groups[key].length; j++) {
        var cls = key === 'high_risk' ? 'lt-btn-high_risk lt-btn-danger' : 'lt-btn-' + key;
        html += '<button class="lt-action-btn ' + cls + '" data-template="' + esc(groups[key][j].template) + '">' + esc(groups[key][j].label) + '</button>';
      }
      html += '</div>';
    }
    html += '</div>';
    this.el.innerHTML = html;
    this.el.classList.add('lt-show');
  }
  close() { if (this.el) { this.el.classList.remove('lt-show'); this.el.innerHTML = ''; } }
  update(state) { /* passive */ }
}

// ── FocusWatchBar ──
class FocusWatchBar extends Component {
  constructor(el, opts) {
    super(el);
    this.opts = opts || {};
    this.focus = null;
    this.paused = false;
    this._shownEntryIds = new Set();
  }
  startWatch(type, target) {
    this.focus = { type: type, target: target };
    if (this.el) {
      var label = type === 'npc' ? '正在盯住：' + (this.opts.npcName ? this.opts.npcName(target) : target) : '正在守点观察：' + target;
      this.el.innerHTML = '<div class="lt-focus-icon">👁</div><div class="lt-focus-info"><div class="lt-focus-target">' + esc(label) + '</div><div class="lt-focus-hint">持续观察中 · 下一次异常动作可能被捕捉</div></div><button class="lt-focus-stop" id="lt-focus-stop">停止</button>';
      this.el.classList.add('lt-show');
    }
  }
  stopWatch() {
    this.focus = null;
    this._shownEntryIds.clear();
    if (this.el) { this.el.classList.remove('lt-show'); this.el.innerHTML = ''; }
  }
  setPaused(p) { this.paused = p; }
  update(state) {
    if (!this.focus || this.paused) return;
    var entries = (state.player_timeline && state.player_timeline.entries) || [];
    var self = this;
    var newEntries = entries.filter(function(e) {
      if (e.source_type !== 'observation' && e.source_type !== 'memory') return false;
      if (e.loop_observed !== state.loop) return false;
      if (self._shownEntryIds.has(e.id)) return false;
      if (self.focus.type === 'npc') return e.actor === self.focus.target;
      if (self.focus.type === 'location') return e.location === self.focus.target;
      return false;
    });
    for (var i = 0; i < newEntries.length; i++) {
      this._shownEntryIds.add(newEntries[i].id);
      if (this.opts.onNewEntry) this.opts.onNewEntry(newEntries[i]);
    }
  }
}
