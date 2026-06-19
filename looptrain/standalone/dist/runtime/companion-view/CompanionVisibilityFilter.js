"use strict";
/**
 * CompanionVisibilityFilter - filters a CompanionView according to policy.
 *
 * Filter rules (Section 10.5):
 *   - locked clue not in view
 *   - hidden identity not in view
 *   - future plot not in view
 *   - NPC private thoughts not in view
 *   - raw relationship scores not in view
 *   - hidden branch conditions not in view
 *   - full mystery solution not in view
 *
 * All ambiguous visibility MUST deny by default.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyVisibilityFilter = applyVisibilityFilter;
/**
 * Applies visibility filters to a CompanionView based on policy.
 *
 * In Slice 0, returns the view unchanged (skeleton).
 * Full filter logic will be implemented alongside the content policy system
 * in later slices.
 */
function applyVisibilityFilter(view, _policy) {
    return view;
}
