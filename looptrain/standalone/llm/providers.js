'use strict';

async function generateMockReply(npcId) {
  const engine = require('../engine');
  const npc = engine.NPCS[npcId];
  if (!npc) return null;
  return npc.limit_message || `${npc.name}暂时没有回应。`;
}

async function generateDeepSeekReply(systemPrompt, userPrompt, config) {
  const url = `${config.DEEPSEEK_BASE_URL}/v1/chat/completions`;
  const body = JSON.stringify({
    model: config.DEEPSEEK_MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    max_tokens: parseInt(config.LLM_MAX_TOKENS) || 512,
    temperature: parseFloat(config.LLM_TEMPERATURE) || 0.7,
  });

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.DEEPSEEK_API_KEY}`,
    },
    body,
    signal: AbortSignal.timeout(30000),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`DeepSeek API error ${res.status}: ${text.slice(0, 200)}`);
  }

  const data = await res.json();
  const reply = data?.choices?.[0]?.message?.content;
  if (!reply) throw new Error('DeepSeek API returned empty response');
  return reply;
}

function cleanLlmReply(text) {
  if (!text) return '';
  return text
    .replace(/【[^】]+】/g, '')
    .replace(/^[（(][^)）]*[）)]\s*/gm, '')
    .replace(/^\s*(系统|旁白|裁判|GM|System|Narrator)[：:]\s*.*$/gim, '')
    .trim();
}

function guardLlmEchoReply(reply, npcId, state) {
  if (!reply) return reply;
  var ns = (state && state.npc_states && state.npc_states[npcId]) || {};
  if (!ns.memory_echo) return reply;

  var forbidden = ['上一轮', '循环', '轮回', '我记得你', '上次你', '你又来了'];
  for (var i = 0; i < forbidden.length; i++) {
    if (reply.indexOf(forbidden[i]) >= 0) return null;
  }

  var forbiddenReveals = [
    { key: 'bomb_location', keywords: ['炸弹', '爆炸物', '炸弹位置'] },
    { key: 'player_identity', keywords: ['你是间谍', '你是特工', '情报员'] },
    { key: 'loop_mechanic', keywords: ['时间循环', '你被困在', '循环里'] }
  ];
  for (var j = 0; j < forbiddenReveals.length; j++) {
    var fr = forbiddenReveals[j];
    for (var k = 0; k < fr.keywords.length; k++) {
      if (reply.indexOf(fr.keywords[k]) >= 0) return null;
    }
  }

  return reply;
}

module.exports = { generateMockReply, generateDeepSeekReply, cleanLlmReply, guardLlmEchoReply };
