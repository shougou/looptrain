'use strict';

export {};

const assert = require('assert');
const runtime = require('..');

// ── InMemoryMemoryStorage ──────────────────────────────────
const storage = new runtime.InMemoryMemoryStorage();
assert.ok(storage, 'storage must instantiate');

// ── MemoryRuntime initialization ───────────────────────────
const mr = new runtime.MemoryRuntime(storage);
mr.initialize('run_test', 'chapter-01', 'trial-001');
assert.strictEqual(mr.getState().events.length, 2);

// ── Legacy migration ───────────────────────────────────────
const migrator = new runtime.LegacyStandaloneStateMigrator();
const legacy = {
  loop: 1, clock: '08:45', ap_remaining: 5,
  known_clues: ['sound_under_seat', 'seat_examined'],
  carried_memory: ['clue_sound_under_seat'],
  npc_states: { xiaoning: { trust: 2 }, zhao: { tension: 1 } },
  flags: { intro_seen: true },
  dialogue_session: null, location: 'carriage_2',
};
const drafts = migrator.migrate(legacy, 'run_test');
assert.ok(drafts.length >= 3);
mr.appendEvents(drafts);
assert.ok(mr.getState().knowledge.length >= 2);

// ── Stores ─────────────────────────────────────────────────
storage.belief.add({ id: 'bel_001', runId: 'run_test', loopId: 'loop_0001', target: 'zhao', statement: 'test', confidence: 0.5, source: 'player_suspicion', status: 'unconfirmed', createdAt: new Date().toISOString() });
assert.strictEqual(storage.belief.getUnconfirmed().length, 1);
storage.relationship.set('xiaoning', { npcId: 'xiaoning', runId: 'run_test', label: '信任', trust: 60, tension: 10, note: '', updatedAt: new Date().toISOString() });
assert.strictEqual(storage.relationship.get('xiaoning')?.trust, 60);
storage.timeline.add({ id: 'tl_001', runId: 'run_test', loopNo: 1, summary: 'test', keyEventIds: [], createdAt: new Date().toISOString() });
assert.strictEqual(storage.timeline.getAll().length, 1);

// ── Snapshot ────────────────────────────────────────────────
const snap = mr.takeSnapshot();
assert.ok(snap.snapshotId.startsWith('snap_'));

// ── Reset ──────────────────────────────────────────────────
const policy = runtime.getResetPolicy();
assert.ok(policy.carries.length >= 4);
const plan = runtime.planReset(mr.getState(), policy, 'run_test', 'chapter-01', 'trial-001', 'scene-carriage-03');
assert.ok(plan.drafts.length >= 3);
runtime.applyReset(mr, plan);
assert.ok(mr.getState().events.length > 6);

// ── Prompt Context ──────────────────────────────────────────
const ctx = runtime.buildPromptContext(mr);
assert.ok(ctx.confirmedClues.length >= 2);
assert.ok(ctx.visibleTimeline.length >= 0, 'timeline may be empty at this stage');

console.log('Slice 1 verification OK');
