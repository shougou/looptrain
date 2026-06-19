/**
 * GoalTypes — v0.7 Goal Engine type definitions.
 * All exports are named (no default exports).
 */

import type { MemoryEvent } from '../memory/MemoryEvent';

/** Runtime state interface used by GoalEngine for condition evaluation. */
export interface GoalRuntimeState {
  events: MemoryEvent[];
  knownClues: string[];
  confirmedFacts: string[];
  state: Record<string, unknown>;
}

/** Recursive DSL condition for goal activation/completion. */
export type GoalCondition =
  | { all: GoalCondition[] }
  | { any: GoalCondition[] }
  | { not: GoalCondition }
  | { eventOccurred: { type: string; npcId?: string; topic?: string; result?: string } }
  | { clueKnown: string }
  | { factConfirmed: string }
  | { stateEquals: { key: string; value: unknown } };

/** Declaration of a single goal, loaded from materials/runtime/goals/ JSON. */
export interface GoalDefinition {
  id: string;
  title: string;
  description?: string;
  activationCondition?: GoalCondition;
  completionCondition: GoalCondition;
  loopRange?: [number, number];
  priority?: number;
  scope?: 'current_loop' | 'cross_loop' | 'global';
  feedback?: {
    completedTitle: string;
    completedSummary: string;
    carryoverNote?: string;
    nextGoalTitle?: string;
  };
  derivedClue?: string;
  /** Internal tracking — set by GoalEngine on first completion. */
  feedbackDelivered?: boolean;
}

/** Per-instance runtime state of a single goal. */
export interface GoalInstanceState {
  goalId: string;
  title: string;
  status: 'inactive' | 'active' | 'completed';
  completedAt?: string;
  feedbackDelivered?: boolean;
}

/** Result of one GoalEngine.evaluate() call. */
export interface GoalEngineResult {
  goalStates: Record<string, GoalInstanceState>;
  activeGoals: GoalInstanceState[];
  completedGoals: GoalInstanceState[];
  newlyCompleted: GoalInstanceState[];
}

/** Structured feedback returned when a goal completes. */
export interface GoalFeedback {
  title: string;
  summary: string;
  carryover?: string;
  nextGoal?: string;
}
