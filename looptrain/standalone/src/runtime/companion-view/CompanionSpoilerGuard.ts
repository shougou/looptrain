/**
 * CompanionSpoilerGuard - ensures content does not exceed allowed spoiler level.
 *
 * Checks whether a piece of content (clue, action, fact, narrative element)
 * exceeds the current maxSpoilerLevel.
 *
 * Spec reference: Section 10.5 (spoilerLevel limit applied)
 */

import type { SpoilerLevel } from './CompanionViewPolicy';

/**
 * Checks whether content with a given spoiler level is safe to reveal.
 */
export function isSpoilerSafe(
  contentSpoilerLevel: SpoilerLevel,
  maxAllowedLevel: SpoilerLevel
): boolean {
  return contentSpoilerLevel <= maxAllowedLevel;
}

/**
 * Filters an array of items by their spoiler level.
 */
export function filterBySpoilerLevel<T extends { spoilerLevel: SpoilerLevel }>(
  items: T[],
  maxAllowedLevel: SpoilerLevel
): T[] {
  return items.filter((item) => isSpoilerSafe(item.spoilerLevel, maxAllowedLevel));
}
