/**
 * AssistantPolicyEngine - determines the current AssistantPolicy.
 * Progression table from spec Section 11.5.
 */

import type { RuntimeClientState } from '../memory/RuntimeClientState';
import type { AssistantPolicy } from './AssistantTypes';

export function getPolicy(
  _clientState: RuntimeClientState,
  loopCount: number,
  hasFirstContact: boolean,
  failureCount: number
): AssistantPolicy {
  let phase: AssistantPolicy['assistantPhase'] = 'pre_contact';
  let guidance: AssistantPolicy['guidanceLevel'] = 3;
  let spoiler: AssistantPolicy['maxSpoilerLevel'] = 0;

  if (!hasFirstContact && loopCount <= 0) {
    phase = 'pre_contact'; guidance = 3; spoiler = 0;
  } else if (hasFirstContact && loopCount <= 1) {
    phase = 'onboarding'; guidance = 3; spoiler = 1;
  } else if (loopCount === 2) {
    phase = 'guided'; guidance = 2; spoiler = 1;
  } else if (loopCount === 3) {
    phase = 'guided'; guidance = 2; spoiler = 2;
  } else {
    phase = 'normal'; guidance = 1; spoiler = 2;
  }

  if (failureCount >= 3) {
    guidance = Math.max(guidance, 2) as AssistantPolicy['guidanceLevel'];
    spoiler = (spoiler + 1) as AssistantPolicy['maxSpoilerLevel'];
    if (spoiler > 3) spoiler = 3;
  } else if (failureCount >= 2) {
    guidance = Math.max(guidance, 2) as AssistantPolicy['guidanceLevel'];
  }

  if (spoiler > 3) spoiler = 3;

  const canRecommend = (phase as string) !== 'pre_contact' && (phase as string) !== 'minimal';

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
