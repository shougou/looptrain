'use strict';

/* LoopTrain Assistant Hint Generator
 * Generates contextual hints from 许知微 based on game state and UIStage.
 */

function generateHint(state, stage) {
  if (!state) return defaultHint();
  
  switch (stage) {
    case 'intro': return getIntroHint(state);
    case 'first_observation': return getObservationHint(state);
    case 'first_dialogue': return getDialogueHint(state);
    case 'loop_memory_intro': return getMemoryHint(state);
    case 'caseboard_intro': return getCaseboardHint(state);
    case 'contradiction_intro': return getContradictionHint(state);
    case 'normal_play': return getNormalHint(state);
    default: return defaultHint();
  }
}

function defaultHint() {
  return {
    speaker: '许知微',
    text: '先观察周围，确认车厢里有没有异常。',
    recommendedActions: ['观察当前车厢']
  };
}

function getIntroHint(state) {
  return {
    speaker: '许知微',
    text: '先别急着问所有人。你刚醒来，先确认车厢里有没有异常。时间不多，15分钟内必须找到线索。',
    recommendedActions: ['观察当前车厢']
  };
}

function getObservationHint(state) {
  var hasFoundAnomaly = !!(state.known_clues && state.known_clues.length > 0);
  
  if (hasFoundAnomaly) {
    return {
      speaker: '许知微',
      text: '发现了异常。可以先问相关人员，看看他们怎么解释。',
      recommendedActions: ['询问小宁', '继续观察']
    };
  }
  
  return {
    speaker: '许知微',
    text: '继续观察，注意细节。车厢里的每个人都可能藏着线索。',
    recommendedActions: ['继续观察', '询问小宁']
  };
}

function getDialogueHint(state) {
  var activeNpc = state.active_npc;
  var npcName = activeNpc === 'xiaoning' ? '小宁' : activeNpc === 'zhao' ? '赵乘警' : '目标';
  
  return {
    speaker: '许知微',
    text: '注意，' + npcName + '说的是"说法"，还不是事实。需要观察验证。',
    recommendedActions: ['继续追问', '结束对话']
  };
}

function getMemoryHint(state) {
  return {
    speaker: '许知微',
    text: '上一轮的记忆还在。这次你可以提前布局，验证之前的怀疑。',
    recommendedActions: ['盯住小宁', '守在三号车厢']
  };
}

function getCaseboardHint(state) {
  return {
    speaker: '许知微',
    text: '线索已经足够整理案件板了。看看已发现的证据能拼凑出什么。',
    recommendedActions: ['查看案件板', '继续调查']
  };
}

function getContradictionHint(state) {
  var contradictions = state.contradictions || [];
  var first = contradictions[0] || {};
  
  return {
    speaker: '许知微',
    text: '发现矛盾了！' + (first.description || '这里有明显的时间线冲突') + '。需要做出判断。',
    recommendedActions: ['判定矛盾', '继续调查']
  };
}

function getNormalHint(state) {
  var ap = state.ap_remaining || 0;
  if (ap <= 3) {
    return {
      speaker: '许知微',
      text: '行动力不足了，小心选择下一步。',
      recommendedActions: ['查看线索', '结束本轮']
    };
  }
  
  return {
    speaker: '许知微',
    text: '继续调查，保持警惕。',
    recommendedActions: ['继续调查']
  };
}

function getStageTransitionMessage(prevStage, newStage) {
  if (prevStage === 'intro' && newStage === 'first_observation') {
    return '第一次观察完成。许知微提示：现在可以尝试对话了。';
  }
  if (prevStage === 'first_observation' && newStage === 'first_dialogue') {
    return '第一次对话开始。注意验证对方的说法。';
  }
  if (prevStage === 'first_dialogue' && newStage === 'loop_memory_intro') {
    return '进入第二轮循环。许知微提示：利用上一轮的记忆。';
  }
  return null;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { generateHint, getStageTransitionMessage, defaultHint };
}