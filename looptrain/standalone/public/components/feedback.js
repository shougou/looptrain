'use strict';
var EventFeed = (function() {
  function EventFeed(el) { this.el = el; }
  EventFeed.prototype = {
    appendCard: function(card) {
      if (!this.el) return;
      var cardEl = ActionResultCard.create(card);
      this.el.appendChild(cardEl);
      var self = this;
      requestAnimationFrame(function() { self.el.scrollTop = self.el.scrollHeight; });
    },
    appendMessage: function(type, text) {
      if (!this.el) return;
      var div = document.createElement('div');
      div.className = 'lt-msg lt-msg-' + type;
      div.textContent = text;
      this.el.appendChild(div);
      var self = this;
      requestAnimationFrame(function() { self.el.scrollTop = self.el.scrollHeight; });
    },
    appendHtml: function(type, html) {
      if (!this.el) return;
      var div = document.createElement('div');
      div.className = 'lt-msg lt-msg-' + type;
      div.innerHTML = html;
      this.el.appendChild(div);
      var self = this;
      requestAnimationFrame(function() { self.el.scrollTop = self.el.scrollHeight; });
    },
    clear: function() { if (this.el) this.el.innerHTML = ''; },
    update: function() {},
    show: function() { if (this.el) this.el.style.display = ''; },
    hide: function() { if (this.el) this.el.style.display = 'none'; }
  };
  return EventFeed;
})();

var ActionResultCard = {
  create: function(card) {
    var div = document.createElement('div');
    div.className = 'lt-action-card lt-action-' + (card.actionType || 'system');
    if (card.conflictDetected) div.classList.add('lt-action-conflict');
    var html = '<div class="lt-action-header">';
    html += '<span class="lt-action-time">' + esc(card.time || '') + '</span>';
    html += '<span class="lt-action-type">' + esc(this._typeLabel(card.actionType)) + '</span>';
    html += '</div>';
    if (card.title) html += '<div class="lt-action-title">' + esc(card.title) + '</div>';
    if (card.cost && (card.cost.ap || card.cost.minutes))
      html += '<div class="lt-action-cost">' + esc(formatCost(card.cost.ap, card.cost.minutes)) + '</div>';
    if (card.narrative)
      html += '<div class="lt-action-narrative">' + esc(card.narrative) + '</div>';
    if (card.cluesAdded && card.cluesAdded.length) {
      html += '<div class="lt-action-clues">';
      for (var i = 0; i < card.cluesAdded.length; i++)
        html += '<div class="lt-clue-line lt-clue-add">+ ' + esc(card.cluesAdded[i].title) + '</div>';
      html += '</div>';
    }
    if (card.npcStateChanges && card.npcStateChanges.length) {
      html += '<div class="lt-action-npc-changes">';
      for (var j = 0; j < card.npcStateChanges.length; j++) {
        var ch = card.npcStateChanges[j], parts = [];
        if (ch.trust) parts.push('信任 ' + (ch.trust > 0 ? '+' : '') + ch.trust);
        if (ch.fear) parts.push('恐惧 ' + (ch.fear > 0 ? '+' : '') + ch.fear);
        if (ch.suspicion) parts.push('怀疑 ' + (ch.suspicion > 0 ? '+' : '') + ch.suspicion);
        html += '<div class="lt-change-line">' + esc(actorName(ch.npcName)) + '：' + parts.join('，') + '</div>';
      }
      html += '</div>';
    }
    if (card.conflictDetected)
      html += '<div class="lt-action-conflict-warning">⚠ 发现线索矛盾</div>';
    if (card.unlockedActions && card.unlockedActions.length) {
      html += '<div class="lt-action-unlocked"><span class="lt-unlock-label">解锁行动：</span>';
      for (var k = 0; k < card.unlockedActions.length; k++)
        html += '<button class="lt-unlock-btn" data-template="' + esc(card.unlockedActions[k].template) + '">' + esc(card.unlockedActions[k].label) + '</button>';
      html += '</div>';
    }
    div.innerHTML = html;
    return div;
  },
  _typeLabel: function(t) {
    var labels = { observe: '观察结果', dialogue: '对话摘要', move: '移动', high_risk: '高风险行动', system: '系统', clue: '线索解锁', timeline: '时间线变化' };
    return labels[t] || '事件';
  }
};
