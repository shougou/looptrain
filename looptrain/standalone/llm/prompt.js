'use strict';

var fs = require('fs');
var path = require('path');
var engine = require('../engine');

var _systemPromptTemplate = null;
var _userPromptTemplate = null;

function loadPromptTemplates() {
  var repoRoot = path.resolve(__dirname, '..', '..');
  var promptsDir = path.join(repoRoot, 'looptrain', 'materials', 'runtime', 'prompts');

  try {
    _systemPromptTemplate = fs.readFileSync(path.join(promptsDir, 'npc-system-prompt.txt'), 'utf-8');
  } catch (_) {
    _systemPromptTemplate = null;
  }

  try {
    _userPromptTemplate = fs.readFileSync(path.join(promptsDir, 'npc-user-prompt.txt'), 'utf-8');
  } catch (_) {
    _userPromptTemplate = null;
  }
}

loadPromptTemplates();

function buildNpcPrompt(npcId, playerText, state) {
  var npc = engine.NPCS[npcId];
  if (!npc) return null;
  var scene = engine.SCENES[state.location];
  var clues = (state.known_clues || [])
    .map(function(id) { return (engine.getClueTitles() || {})[id] || id; })
    .filter(Boolean);

  var systemPrompt;
  var userPrompt;

  if (_systemPromptTemplate) {
    var cluesStr = clues.length ? '\n当前已知线索（供你参考，但不要全部复述）：' + clues.join('、') : '';
    systemPrompt = _systemPromptTemplate
      .replace(/\$\{npc\.name}/g, npc.name)
      .replace(/\$\{scene\.name}/g, (scene && scene.name) || state.location)
      .replace(/\$\{state\.clock}/g, state.clock)
      .replace(/\$\{state\.ap_remaining}/g, String(state.ap_remaining))
      .replace(/\$\{npc\.role}/g, npc.role || '对话角色')
      .replace(/\$\{clues}/g, cluesStr);
  } else {
    systemPrompt = [
      '你是 LoopTrain 互动叙事游戏中的 NPC：' + npc.name + '。',
      '当前场景：' + ((scene && scene.name) || state.location) + '。',
      '当前时间：' + state.clock + '，列车将在 14:15 前爆炸。',
      '玩家剩余行动点：' + state.ap_remaining + '。',
      '你的角色定位：' + (npc.role || '对话角色') + '。',
      '',
      '你必须严格遵守以下规则：',
      '1. 你只能用 NPC 的口吻回复玩家的对话，不能跳出角色。',
      '2. 你不能直接决定玩家是否获得线索、是否成功或失败。',
      '3. 你不能输出类似「【获得线索】」、「AP -3」、「试玩版成功」、「循环失败」等系统标记。',
      '4. 你不能以旁白、系统或裁判的口吻说话。',
      '5. 你不能编造游戏中不存在的角色名、地名或事件。',
      '6. 你的回复应保持自然、克制，符合 1939 年冬夜列车悬疑氛围。',
      '7. 如果玩家问的问题超出你的认知范围，你可以表示不知道或不方便回答。',
      clues.length ? '\n当前已知线索（供你参考，但不要全部复述）：' + clues.join('、') : '',
    ].filter(Boolean).join('\n');
  }

  if (_userPromptTemplate) {
    userPrompt = _userPromptTemplate
      .replace(/\$\{scene\.text}/g, (scene && scene.text) || '列车车厢内')
      .replace(/\$\{playerText}/g, playerText)
      .replace(/\$\{npc\.name}/g, npc.name);
  } else {
    userPrompt = [
      '场景：' + ((scene && scene.text) || '列车车厢内'),
      '',
      '玩家对你说：' + playerText,
      '',
      '请以' + npc.name + '的口吻回复玩家。',
    ].join('\n');
  }

  return { systemPrompt: systemPrompt, userPrompt: userPrompt };
}

module.exports = { buildNpcPrompt: buildNpcPrompt };
