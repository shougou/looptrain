/**
 * goal_engine.test.ts — v0.7 Goal Engine test suite.
 * Tests: GoalEvaluator condition DSL, GoalEngine lifecycle (newlyCompleted once-only).
 */
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require('assert');
const runtime = require('..');
// ── Minimal RuntimeState helper ───────────────────────────────
function mkState(overrides = {}) {
    return {
        events: overrides.events || [],
        knownClues: overrides.knownClues || [],
        confirmedFacts: overrides.confirmedFacts || [],
        state: overrides.state || {},
    };
}
// ── Test 1: clueKnown leaf ────────────────────────────────────
{
    const result = runtime.evaluateCondition({ clueKnown: 'test' }, mkState({ knownClues: ['test'] }));
    assert.strictEqual(result, true, 'clueKnown: true when clue is known');
}
{
    const result = runtime.evaluateCondition({ clueKnown: 'missing' }, mkState({ knownClues: ['other'] }));
    assert.strictEqual(result, false, 'clueKnown: false when clue is missing');
}
// ── Test 2: factConfirmed leaf ─────────────────────────────────
{
    const result = runtime.evaluateCondition({ factConfirmed: 'fact_a' }, mkState({ confirmedFacts: ['fact_a'] }));
    assert.strictEqual(result, true, 'factConfirmed: true when fact confirmed');
}
// ── Test 3: stateEquals leaf ───────────────────────────────────
{
    const result = runtime.evaluateCondition({ stateEquals: { key: 'loop', value: 1 } }, mkState({ state: { loop: 1 } }));
    assert.strictEqual(result, true, 'stateEquals: true when value matches');
}
// ── Test 4: all combinator ─────────────────────────────────────
{
    const result = runtime.evaluateCondition({ all: [{ clueKnown: 'a' }, { clueKnown: 'b' }] }, mkState({ knownClues: ['a', 'b'] }));
    assert.strictEqual(result, true, 'all: true when both clues known');
}
{
    const result = runtime.evaluateCondition({ all: [{ clueKnown: 'a' }, { clueKnown: 'b' }] }, mkState({ knownClues: ['a'] }));
    assert.strictEqual(result, false, 'all: false when one clue missing');
}
{
    const result = runtime.evaluateCondition({ all: [] }, mkState());
    assert.strictEqual(result, true, 'all: vacuous truth for empty array');
}
// ── Test 5: any combinator ─────────────────────────────────────
{
    const result = runtime.evaluateCondition({ any: [{ clueKnown: 'a' }, { clueKnown: 'b' }] }, mkState({ knownClues: ['a'] }));
    assert.strictEqual(result, true, 'any: true when at least one matches');
}
{
    const result = runtime.evaluateCondition({ any: [{ clueKnown: 'x' }, { clueKnown: 'y' }] }, mkState({ knownClues: ['a'] }));
    assert.strictEqual(result, false, 'any: false when none match');
}
{
    const result = runtime.evaluateCondition({ any: [] }, mkState());
    assert.strictEqual(result, false, 'any: false for empty array');
}
// ── Test 6: not combinator ─────────────────────────────────────
{
    const result = runtime.evaluateCondition({ not: { clueKnown: 'missing' } }, mkState({ knownClues: ['other'] }));
    assert.strictEqual(result, true, 'not: true when inner is false');
}
{
    const result = runtime.evaluateCondition({ not: { clueKnown: 'present' } }, mkState({ knownClues: ['present'] }));
    assert.strictEqual(result, false, 'not: false when inner is true');
}
// ── Test 7: nested combinators ─────────────────────────────────
{
    const result = runtime.evaluateCondition({ all: [
            { any: [{ clueKnown: 'a' }, { clueKnown: 'b' }] },
            { factConfirmed: 'f1' },
        ] }, mkState({ knownClues: ['a'], confirmedFacts: ['f1'] }));
    assert.strictEqual(result, true, 'nested all+any: true when both groups match');
}
// ── Test 8: eventOccurred leaf ─────────────────────────────────
{
    const result = runtime.evaluateCondition({ eventOccurred: { type: 'dialogue_end', npcId: 'xiaoning' } }, mkState({ events: [{ type: 'dialogue_end', payload: { npcId: 'xiaoning' } }] }));
    assert.strictEqual(result, true, 'eventOccurred: true when event matches');
}
{
    const result = runtime.evaluateCondition({ eventOccurred: { type: 'dialogue_end', npcId: 'zhao_police' } }, mkState({ events: [{ type: 'dialogue_end', payload: { npcId: 'xiaoning' } }] }));
    assert.strictEqual(result, false, 'eventOccurred: false when npcId differs');
}
// ── Test 9: GoalEngine newlyCompleted triggers only once ───────
{
    const def = {
        id: 'goal.test_once',
        title: 'Test Once',
        completionCondition: { clueKnown: 'key_clue' },
        loopRange: [1, 5],
    };
    const engine = new runtime.GoalEngine([def]);
    // First evaluation: not completed yet
    const r1 = engine.evaluate(mkState({ knownClues: [] }));
    assert.strictEqual(r1.newlyCompleted.length, 0, 'no completion when clue missing');
    // Second evaluation: clue acquired → newlyCompleted triggers
    const r2 = engine.evaluate(mkState({ knownClues: ['key_clue'] }));
    assert.strictEqual(r2.newlyCompleted.length, 1, 'newlyCompleted fires on first completion');
    assert.strictEqual(r2.newlyCompleted[0].goalId, 'goal.test_once');
    // Third evaluation: already completed → no newlyCompleted
    const r3 = engine.evaluate(mkState({ knownClues: ['key_clue'] }));
    assert.strictEqual(r3.newlyCompleted.length, 0, 'newlyCompleted does not re-fire');
    assert.strictEqual(r3.completedGoals.length, 1, 'still marked as completed');
}
// ── Test 10: activationCondition gate ──────────────────────────
{
    const def = {
        id: 'goal.test_activation',
        title: 'Activation Gated',
        activationCondition: { clueKnown: 'unlock' },
        completionCondition: { clueKnown: 'key_clue' },
    };
    const engine = new runtime.GoalEngine([def]);
    // Before activation: goal is ignored
    const r1 = engine.evaluate(mkState({ knownClues: ['key_clue'] }));
    assert.strictEqual(Object.keys(r1.goalStates).length, 0, 'not evaluated before activation');
    // After activation: goal is evaluated
    const r2 = engine.evaluate(mkState({ knownClues: ['unlock', 'key_clue'] }));
    assert.strictEqual(r2.completedGoals.length, 1, 'completed after activation');
}
// ── Test 11: loopRange gate ────────────────────────────────────
{
    const def = {
        id: 'goal.test_loop_range',
        title: 'Loop Range Test',
        completionCondition: { clueKnown: 'key_clue' },
        loopRange: [3, 5],
    };
    const engine = new runtime.GoalEngine([def]);
    // Loop 1: outside range
    const r1 = engine.evaluate(mkState({ knownClues: ['key_clue'], state: { loop: 1 } }));
    assert.strictEqual(Object.keys(r1.goalStates).length, 0, 'skipped when loop < range');
    // Loop 3: inside range
    const r2 = engine.evaluate(mkState({ knownClues: ['key_clue'], state: { loop: 3 } }));
    assert.strictEqual(r2.completedGoals.length, 1, 'evaluated when loop in range');
}
console.log('Goal Engine verification OK');
