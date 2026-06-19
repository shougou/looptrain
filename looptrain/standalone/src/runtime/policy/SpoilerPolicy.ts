/**
 * SpoilerPolicy - anti-spoiler content gating.
 * Spec reference: Section 15.2
 */

import type { SpoilerLevel } from '../companion-view/CompanionViewPolicy';

export interface SpoilerPolicyRule {
  contentId: string;
  contentType: 'clue' | 'identity' | 'plot' | 'thought' | 'score' | 'branch' | 'solution';
  requiredSpoilerLevel: SpoilerLevel;
  description: string;
}

export interface SpoilerPolicy {
  chapterId: string;
  version: number;
  rules: SpoilerPolicyRule[];
}

export function checkSpoilerAccess(
  rule: SpoilerPolicyRule,
  currentSpoilerLevel: SpoilerLevel
): boolean {
  return currentSpoilerLevel >= rule.requiredSpoilerLevel;
}

export function filterBySpoilerPolicy<T extends { contentId: string; spoilerLevel: SpoilerLevel }>(
  items: T[],
  policy: SpoilerPolicy,
  currentSpoilerLevel: SpoilerLevel
): T[] {
  const restrictedIds = new Set(
    policy.rules.filter((r) => !checkSpoilerAccess(r, currentSpoilerLevel)).map((r) => r.contentId)
  );
  return items.filter((item) => !restrictedIds.has(item.contentId));
}
