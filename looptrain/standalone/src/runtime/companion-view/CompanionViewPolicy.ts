/**
 * CompanionViewPolicy - governs what the Assistant is allowed to access and do.
 *
 * hiddenTruthAccessible MUST always be false in v1.
 *
 * Spec reference: Section 10.4
 */

export type AssistantPhase =
  | 'pre_contact'
  | 'onboarding'
  | 'guided'
  | 'normal'
  | 'minimal'
  | 'locked';

export type GuidanceLevel = 0 | 1 | 2 | 3;

export type SpoilerLevel = 0 | 1 | 2 | 3 | 4 | 5;

export interface CompanionViewPolicy {
  assistantPhase: AssistantPhase;
  guidanceLevel: GuidanceLevel;
  maxSpoilerLevel: SpoilerLevel;

  canReferenceBeliefs: boolean;
  canCompareLoops: boolean;
  canReferenceArchive: boolean;
  canRecommendActions: boolean;

  locale: 'zh-CN';
  hiddenTruthAccessible: false;
}
