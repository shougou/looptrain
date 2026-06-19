/**
 * GoalFeedback — generates structured feedback when a goal completes.
 * Uses goal.feedback fields with sensible defaults.
 */

import type { GoalDefinition, GoalFeedback } from './GoalTypes';

/**
 * Generate completion feedback for a goal.
 * Falls back to defaults when goal.feedback is undefined or missing fields.
 */
export function generateFeedback(goal: GoalDefinition): GoalFeedback {
  const fb = goal.feedback;

  if (!fb) {
    return {
      title: '目标完成',
      summary: goal.title + ' 已完成。',
      carryover: undefined,
      nextGoal: undefined,
    };
  }

  return {
    title: fb.completedTitle || '目标完成',
    summary: fb.completedSummary || goal.title + ' 已完成。',
    carryover: fb.carryoverNote || undefined,
    nextGoal: fb.nextGoalTitle || undefined,
  };
}
