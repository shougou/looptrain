/**
 * GoalEngine — v0.7 modular goal evaluation engine.
 * Evaluates GoalDefinitions against runtime state each tick,
 * tracking activation, completion, and newly-completed feedback.
 */

import type {
  GoalDefinition,
  GoalInstanceState,
  GoalEngineResult,
  GoalRuntimeState,
} from './GoalTypes';
import { evaluateCondition } from './GoalEvaluator';

export class GoalEngine {
  private definitions: GoalDefinition[];
  /** Tracks the last known status of each goal to detect transitions. */
  private previousStates: Map<string, string> = new Map(); // goalId → status

  constructor(definitions: GoalDefinition[]) {
    this.definitions = definitions;
  }

  /**
   * Evaluate all goal definitions against the current runtime state.
   *
   * @param runtime — snapshot of events, knownClues, confirmedFacts, and game state
   * @returns GoalEngineResult with active, completed, and newly-completed goals
   */
  evaluate(runtime: GoalRuntimeState): GoalEngineResult {
    const result: GoalEngineResult = {
      goalStates: {},
      activeGoals: [],
      completedGoals: [],
      newlyCompleted: [],
    };

    for (const def of this.definitions) {
      // ── Gate: activation condition ─────────────────────────
      if (def.activationCondition && !evaluateCondition(def.activationCondition, runtime)) {
        continue;
      }

      // ── Gate: loop range ───────────────────────────────────
      if (def.loopRange) {
        const currentLoop = (runtime.state.loop as number) || 1;
        if (currentLoop < def.loopRange[0] || currentLoop > def.loopRange[1]) {
          continue;
        }
      }

      // ── Check completion ───────────────────────────────────
      const completed = evaluateCondition(def.completionCondition, runtime);
      const prevStatus = this.previousStates.get(def.id) || 'inactive';

      const status: GoalInstanceState['status'] = completed
        ? 'completed'
        : def.activationCondition
          ? 'active'
          : 'inactive';

      const instance: GoalInstanceState = {
        goalId: def.id,
        title: def.title,
        status,
      };

      // Track newly-completed goals (first-time completion)
      if (completed && !def.feedbackDelivered) {
        instance.completedAt = new Date().toISOString();
        instance.feedbackDelivered = true;
        if (prevStatus !== 'completed') {
          result.newlyCompleted.push(instance);
        }
        def.feedbackDelivered = true;
      }

      // Populate result
      result.goalStates[def.id] = instance;
      if (status === 'active') result.activeGoals.push(instance);
      if (status === 'completed') result.completedGoals.push(instance);

      this.previousStates.set(def.id, status);
    }

    return result;
  }
}
