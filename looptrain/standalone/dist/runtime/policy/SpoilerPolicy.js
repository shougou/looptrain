"use strict";
/**
 * SpoilerPolicy - anti-spoiler content gating.
 * Spec reference: Section 15.2
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkSpoilerAccess = checkSpoilerAccess;
exports.filterBySpoilerPolicy = filterBySpoilerPolicy;
function checkSpoilerAccess(rule, currentSpoilerLevel) {
    return currentSpoilerLevel >= rule.requiredSpoilerLevel;
}
function filterBySpoilerPolicy(items, policy, currentSpoilerLevel) {
    const restrictedIds = new Set(policy.rules.filter((r) => !checkSpoilerAccess(r, currentSpoilerLevel)).map((r) => r.contentId));
    return items.filter((item) => !restrictedIds.has(item.contentId));
}
