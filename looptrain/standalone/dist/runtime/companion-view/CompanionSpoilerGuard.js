"use strict";
/**
 * CompanionSpoilerGuard - ensures content does not exceed allowed spoiler level.
 *
 * Checks whether a piece of content (clue, action, fact, narrative element)
 * exceeds the current maxSpoilerLevel.
 *
 * Spec reference: Section 10.5 (spoilerLevel limit applied)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.isSpoilerSafe = isSpoilerSafe;
exports.filterBySpoilerLevel = filterBySpoilerLevel;
/**
 * Checks whether content with a given spoiler level is safe to reveal.
 */
function isSpoilerSafe(contentSpoilerLevel, maxAllowedLevel) {
    return contentSpoilerLevel <= maxAllowedLevel;
}
/**
 * Filters an array of items by their spoiler level.
 */
function filterBySpoilerLevel(items, maxAllowedLevel) {
    return items.filter((item) => isSpoilerSafe(item.spoilerLevel, maxAllowedLevel));
}
