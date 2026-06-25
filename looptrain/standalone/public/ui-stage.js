'use strict';

/* LoopTrain UIStage State Machine
 * Controls progressive UI unlock based on game state.
 * Pure logic, no DOM operations.
 */

const UIStage = {
  INTRO: 'intro',
  FIRST_OBSERVATION: 'first_observation',
  FIRST_DIALOGUE: 'first_dialogue',
  LOOP_MEMORY_INTRO: 'loop_memory_intro',
  CASEBOARD_INTRO: 'caseboard_intro',
  CONTRADICTION_INTRO: 'contradiction_intro',
  NORMAL_PLAY: 'normal_play'
};

function getUIStage(state) {
  if (!state) return UIStage.INTRO;

  var loop = state.loop || 1;
  var ap = state.ap_remaining || 10;
  var clues = state.known_clues || [];
  var isDialogue = state.mode === 'dialogue';
  var hasContradiction = !!(state.contradictions && state.contradictions.length > 0);
  var caseboardSeen = !!(state.flags && state.flags.caseboard_seen);

  if (loop >= 3 || caseboardSeen) {
    return hasContradiction ? UIStage.CONTRADICTION_INTRO : UIStage.NORMAL_PLAY;
  }

  if (loop === 2) {
    if (clues.length >= 3) return UIStage.CASEBOARD_INTRO;
    return UIStage.LOOP_MEMORY_INTRO;
  }

  if (loop === 1) {
    if (isDialogue) return UIStage.FIRST_DIALOGUE;
    if (ap < 10) return UIStage.FIRST_OBSERVATION;
    return UIStage.INTRO;
  }

  return UIStage.NORMAL_PLAY;
}

function getVisibleControls(stage) {
  var map = {};
  map[UIStage.INTRO] = ['status', 'scene', 'assistant', 'primary_action', 'settings'];
  map[UIStage.FIRST_OBSERVATION] = ['status', 'scene', 'last_result', 'assistant', 'two_actions', 'settings', 'input', 'caseboard_button'];
  map[UIStage.FIRST_DIALOGUE] = ['dialogue_focus', 'recommended_questions', 'settings'];
  map[UIStage.LOOP_MEMORY_INTRO] = ['status', 'scene', 'memory_hint', 'assistant', 'watch_action', 'settings'];
  map[UIStage.CASEBOARD_INTRO] = ['caseboard_button', 'scene', 'assistant', 'actions', 'settings'];
  map[UIStage.CONTRADICTION_INTRO] = ['assistant_verdict', 'caseboard_button', 'actions', 'settings'];
  map[UIStage.NORMAL_PLAY] = ['status', 'scene', 'feed', 'action_dock', 'caseboard', 'settings', 'input'];
  return map[stage] || map[UIStage.NORMAL_PLAY];
}

function getActionCount(stage) {
  if (stage === UIStage.INTRO) return 1;
  if (stage === UIStage.FIRST_OBSERVATION || stage === UIStage.FIRST_DIALOGUE) return 2;
  if (stage === UIStage.LOOP_MEMORY_INTRO) return 2;
  return 3;
}

function shouldShowControl(stage, controlName) {
  var controls = getVisibleControls(stage);
  return controls.indexOf(controlName) >= 0;
}

function getStageLabel(stage) {
  var labels = {};
  labels[UIStage.INTRO] = '初次醒来';
  labels[UIStage.FIRST_OBSERVATION] = '初步调查';
  labels[UIStage.FIRST_DIALOGUE] = '对话取证';
  labels[UIStage.LOOP_MEMORY_INTRO] = '循环记忆';
  labels[UIStage.CASEBOARD_INTRO] = '案件整理';
  labels[UIStage.CONTRADICTION_INTRO] = '矛盾推理';
  labels[UIStage.NORMAL_PLAY] = '自由探索';
  return labels[stage] || '探索中';
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { UIStage, getUIStage, getVisibleControls, getActionCount, shouldShowControl, getStageLabel };
}
