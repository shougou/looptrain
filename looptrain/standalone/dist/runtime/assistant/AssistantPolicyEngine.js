"use strict";
/**
 * AssistantPolicyEngine - determines the current AssistantPolicy.
 * Progression table from spec Section 11.5.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPolicy = getPolicy;
function getPolicy(_clientState, loopCount, hasFirstContact, failureCount) {
    let phase = 'pre_contact';
    let guidance = 3;
    let spoiler = 0;
    if (!hasFirstContact && loopCount <= 0) {
        phase = 'pre_contact';
        guidance = 3;
        spoiler = 0;
    }
    else if (hasFirstContact && loopCount <= 1) {
        phase = 'onboarding';
        guidance = 3;
        spoiler = 1;
    }
    else if (loopCount === 2) {
        phase = 'guided';
        guidance = 2;
        spoiler = 1;
    }
    else if (loopCount === 3) {
        phase = 'guided';
        guidance = 2;
        spoiler = 2;
    }
    else {
        phase = 'normal';
        guidance = 1;
        spoiler = 2;
    }
    if (failureCount >= 3) {
        guidance = Math.max(guidance, 2);
        spoiler = (spoiler + 1);
        if (spoiler > 3)
            spoiler = 3;
    }
    else if (failureCount >= 2) {
        guidance = Math.max(guidance, 2);
    }
    if (spoiler > 3)
        spoiler = 3;
    const canRecommend = phase !== 'pre_contact' && phase !== 'minimal';
    return {
        assistantPhase: phase,
        guidanceLevel: guidance,
        maxSpoilerLevel: spoiler,
        canRecommendActions: canRecommend,
        canCompareLoops: loopCount >= 1,
        canReferenceBeliefs: phase !== 'pre_contact',
        canReferenceArchive: loopCount >= 2,
        canTriggerActions: false,
        maxActionCount: 3,
        llmProvider: 'disabled',
    };
}
