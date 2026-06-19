"use strict";
/**
 * ForbiddenRevealPolicy - permanently forbidden content.
 * Spec reference: Section 15.2
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.isPermanentlyForbidden = isPermanentlyForbidden;
exports.filterForbiddenContent = filterForbiddenContent;
function isPermanentlyForbidden(contentId, policy) {
    return policy.rules.some((r) => r.contentId === contentId);
}
function filterForbiddenContent(items, policy) {
    const forbiddenIds = new Set(policy.rules.map((r) => r.contentId));
    return items.filter((item) => !forbiddenIds.has(item.contentId));
}
