'use strict';

/* LoopTrain Standalone MVP — smoke test
 * Verifies engine integrity and basic server health.
 * Run with: npm test (which runs: node tests/smoke_test.js)
 */

const assert = require('assert');
const http = require('http');
const path = require('path');

// ── Engine tests (require engine directly) ──
const engine = require('../engine');

console.log('1. Engine: normalize & commitAction...');
let s = engine.normalize(engine.START_STATE);
assert.strictEqual(s.episode_id, 'trial_001');
assert.strictEqual(s.ap_remaining, 10);
assert.strictEqual(s.location, 'carriage_2');
assert.ok(s.known_clues.includes('clue_gray_note_warning'));
console.log('   OK normalize');

let r = engine.commitAction('我走到小宁身边，蹲下来和她说话。', s);
s = r.state;
assert.strictEqual(s.mode, 'dialogue');
assert.strictEqual(s.active_npc, 'xiaoning');
console.log('   OK start dialogue');

r = engine.dialogueMessage('xiaoning', '别怕，我也听见了那个声音。你刚才是不是看见了什么？', s);
s = r.state;
assert.ok(s.dialogue_session.pending_clues.includes('clue_ticking_under_floor'));
assert.ok(s.dialogue_session.pending_clues.includes('claim_xiaoning_heard_ticking'));
console.log('   OK dialogue message');

r = engine.endDialogue(s);
s = r.state;
assert.strictEqual(s.mode, 'explore');
assert.ok(s.known_clues.includes('clue_ticking_under_floor'));
assert.ok(s.known_clues.includes('claim_xiaoning_heard_ticking'));
assert.strictEqual(s.ap_remaining, 8);  // NPC cost is now 2
console.log('   OK end dialogue');

r = engine.commitAction('我假装系鞋带，低头检查座位下方。', s);
s = r.state;
assert.ok(s.known_clues.includes('clue_sound_not_from_seat'));
// countValidEvidence is deprecated but still works (redirects to evaluateEvidence)
assert.ok(engine.countValidEvidence(s) >= 2);
console.log('   OK observe');

// Convince zhao: first call auto-injects police_context, second call succeeds
r = engine.commitAction('我找到赵乘警，说明小宁听见过声音，而且我也确认声音不来自座位，请他检查地板。', s);
s = r.state;
assert.ok(s.known_clues.includes('claim_zhao_needs_actionable_evidence'));
assert.strictEqual(s.flags.trial_success, false);
console.log('   OK first convince zhao (auto-injects police context)');

r = engine.commitAction('我找到赵乘警，说明已获得的证据，请他检查地板。', s);
s = r.state;
assert.strictEqual(s.flags.trial_success, true);
console.log('   OK second convince zhao -> trial success');

// ── Failure + next loop ──
console.log('\n2. Engine: failLoop & nextLoop...');
s = engine.normalize(engine.START_STATE);
s.known_clues.push('claim_xiaoning_heard_ticking', 'claim_zhao_needs_actionable_evidence');
s.clock = '14:15';
r = engine.failLoop(s, 'time_out_explosion');
assert.ok(r.loop_failure_outcome.confirmed_facts.some(x => x.id === 'claim_xiaoning_heard_ticking'));
r = engine.nextLoop(r);
assert.strictEqual(r.state.loop, 2);
assert.ok(r.state.carried_memory.includes('claim_xiaoning_heard_ticking'));
console.log('   OK fail + next loop memory carry');

// ── Dialogue turn limit ──
console.log('\n3. Engine: dialogue turn limit...');
s = engine.normalize(engine.START_STATE);
r = engine.commitAction('我起身穿过过道，走向二号车厢和三号车厢之间的连接处。', s);
s = r.state;
assert.strictEqual(s.location, 'connector_2_3');
r = engine.commitAction('我走向那个灰衣乘客，试探他。', s);
s = r.state;
assert.strictEqual(s.dialogue_session.turn_limit, 8);
for (let i = 0; i < 8; i++) {
  r = engine.dialogueMessage('gray_passenger', '你刚才去了三号车厢吗？14:05 前后你在什么地方？', s);
  s = r.state;
}
assert.strictEqual(s.mode, 'explore');
assert.ok(s.npc_states.gray_passenger.suspicion >= 50);
console.log('   OK gray passenger turn limit + risk escalation');

// ── Hidden node (removed in v0.8) ──
console.log('\n4. Engine: hidden node removed...');
s = engine.normalize(engine.START_STATE);
assert.ok(!s.flags.visible_hidden_npcs || s.flags.visible_hidden_npcs.length === 0);
console.log('   OK hidden NPCs cleanly removed');

// ── Suggestions ──
console.log('\n5. Engine: suggestions...');
s = engine.normalize(engine.START_STATE);
const sugs = engine.suggestions(s);
assert.ok(sugs.length >= 4, `expected >=4 suggestions, got ${sugs.length}`);
assert.ok(sugs.some(x => x.label.includes('小宁')));
assert.ok(sugs.some(x => x.label.includes('座位')));
console.log('   OK suggestions');

// ── NPCs + Clue details ──
console.log('\n6. Engine: npcs & clue details...');
const npcs = engine.getNpcs();
assert.ok(npcs.xiaoning);
assert.ok(npcs.zhao_police);
assert.ok(npcs.gray_passenger);
const clues = engine.getClueDetails();
assert.ok(clues.clue_gray_note_warning);
assert.ok(clues.clue_ticking_under_floor);
console.log('   OK npcs & clues');

// ── Save version detection tests ──
console.log('\n7. Engine: save version detection...');
// Verify engine START_STATE alignment with save version constants
assert.strictEqual(typeof engine.START_STATE.loop, 'number');
assert.strictEqual(engine.START_STATE.loop, 1);
assert.strictEqual(engine.START_STATE.clock, '14:00');
assert.ok(engine.START_STATE.known_clues.includes('clue_gray_note_warning'));
assert.strictEqual(engine.START_STATE.flags.intro_seen, false);
// Verify reset_game engine command returns normalized START_STATE (AC-12)
var resetResult = engine.executeCommand('reset_game', engine.START_STATE);
assert.strictEqual(resetResult.state.loop, 1);
assert.strictEqual(resetResult.state.clock, '14:00');
assert.ok(resetResult.state.known_clues.includes('clue_gray_note_warning'));
assert.strictEqual(resetResult.state.flags.intro_seen, false);
assert.strictEqual(resetResult.state.ap_remaining, 10);
assert.strictEqual(resetResult.state.location, 'carriage_2');
console.log('   OK save version constants & engine reset');

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('  All engine smoke tests pass ✓');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━');

// ── Optional: server health check (if running) ──
const PORT = process.env.PORT || 3030;

function checkServer() {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${PORT}/api/health`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const j = JSON.parse(data);
          if (j.ok) {
            console.log(`\n  Server health: OK (port ${PORT}, version ${j.version})`);
            resolve(true);
          } else {
            console.log('\n  Server health: unexpected response');
            resolve(false);
          }
        } catch (_) {
          console.log('\n  Server health: invalid JSON');
          resolve(false);
        }
      });
    });
    req.on('error', () => {
      console.log(`\n  Server not running on port ${PORT} (start with: npm start)`);
      resolve(false);
    });
    req.setTimeout(2000, () => { req.destroy(); resolve(false); });
  });
}

checkServer().then(ok => {
  if (!ok) {
    console.log('  Hint: Run "npm start" in another terminal, then re-run this test.\n');
  }
  process.exit(0);
});
