'use strict';

/* LoopTrain CaseBoard Renderer
 * Renders the case board with confirmed facts, NPC statements, and contradictions.
 */

function renderCaseBoard(state) {
  if (!state) return emptyCaseBoard();
  
  var facts = extractConfirmedFacts(state);
  var statements = extractNpcStatements(state);
  var pending = extractPendingQuestions(state);
  var contradictions = state.contradictions || [];
  
  return {
    confirmedFacts: facts,
    npcStatements: statements,
    pendingVerification: pending,
    contradictions: contradictions,
    nextSuggestions: generateSuggestions(state)
  };
}

function emptyCaseBoard() {
  return {
    confirmedFacts: [],
    npcStatements: [],
    pendingVerification: [],
    contradictions: [],
    nextSuggestions: []
  };
}

function extractConfirmedFacts(state) {
  var facts = [];
  var clues = state.known_clues || [];
  
  for (var i = 0; i < clues.length; i++) {
    var clue = clues[i];
    if (clue.type === 'fact' || clue.type === 'observation') {
      facts.push(clue.description || clue.name || '未知线索');
    }
  }
  
  if (facts.length === 0) {
    facts.push('暂无已确认的事实');
  }
  
  return facts;
}

function extractNpcStatements(state) {
  var statements = [];
  var history = state.history || [];
  
  for (var i = 0; i < history.length; i++) {
    var h = history[i];
    if (h.type === 'dialogue' && h.npc_statement) {
      statements.push({
        npc: h.npc_name || h.npc_id || '未知',
        text: h.npc_statement,
        time: h.clock || ''
      });
    }
  }
  
  return statements;
}

function extractPendingQuestions(state) {
  var pending = [];
  var clues = state.known_clues || [];
  
  for (var i = 0; i < clues.length; i++) {
    var clue = clues[i];
    if (clue.type === 'suspicion' || clue.type === 'unverified') {
      pending.push(clue.description || '待验证的怀疑');
    }
  }
  
  if (pending.length === 0) {
    pending.push('暂无待验证的怀疑');
  }
  
  return pending;
}

function generateSuggestions(state) {
  var suggestions = [];
  var ap = state.ap_remaining || 0;
  
  if (ap > 5) {
    suggestions.push('继续深入调查');
  } else if (ap > 0) {
    suggestions.push('行动力有限，谨慎选择');
  } else {
    suggestions.push('行动力耗尽，准备进入下一轮');
  }
  
  var contradictions = state.contradictions || [];
  if (contradictions.length > 0) {
    suggestions.push('存在矛盾需要判定');
  }
  
  return suggestions;
}

function buildCaseBoardHTML(data) {
  var html = '<div class="lt-caseboard">';
  
  html += '<div class="lt-caseboard-section">';
  html += '<h3 class="lt-caseboard-section-title">本轮确认</h3>';
  html += '<ul class="lt-caseboard-list">';
  for (var i = 0; i < data.confirmedFacts.length; i++) {
    html += '<li>' + esc(data.confirmedFacts[i]) + '</li>';
  }
  html += '</ul></div>';
  
  if (data.npcStatements.length > 0) {
    html += '<div class="lt-caseboard-section">';
    html += '<h3 class="lt-caseboard-section-title">NPC 说法</h3>';
    html += '<ul class="lt-caseboard-list">';
    for (var j = 0; j < data.npcStatements.length; j++) {
      var s = data.npcStatements[j];
      html += '<li><strong>' + esc(s.npc) + '</strong>：' + esc(s.text) + '</li>';
    }
    html += '</ul></div>';
  }
  
  html += '<div class="lt-caseboard-section">';
  html += '<h3 class="lt-caseboard-section-title">待验证</h3>';
  html += '<ul class="lt-caseboard-list">';
  for (var k = 0; k < data.pendingVerification.length; k++) {
    html += '<li class="lt-caseboard-pending">' + esc(data.pendingVerification[k]) + '</li>';
  }
  html += '</ul></div>';
  
  if (data.contradictions.length > 0) {
    html += '<div class="lt-caseboard-section lt-caseboard-contradictions">';
    html += '<h3 class="lt-caseboard-section-title">关键矛盾</h3>';
    html += '<ul class="lt-caseboard-list">';
    for (var c = 0; c < data.contradictions.length; c++) {
      html += '<li class="lt-caseboard-contradiction">' + esc(data.contradictions[c].description || '矛盾') + '</li>';
    }
    html += '</ul></div>';
  }
  
  html += '<div class="lt-caseboard-section">';
  html += '<h3 class="lt-caseboard-section-title">下一步建议</h3>';
  html += '<ul class="lt-caseboard-list">';
  for (var n = 0; n < data.nextSuggestions.length; n++) {
    html += '<li class="lt-caseboard-suggestion">' + esc(data.nextSuggestions[n]) + '</li>';
  }
  html += '</ul></div>';
  
  html += '</div>';
  return html;
}

function esc(s) {
  if (!s) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { renderCaseBoard, buildCaseBoardHTML, emptyCaseBoard };
}