/**
 * LegacyEngineAdapter - server Engine / MemoryRuntime bridge.
 *
 * This is the ONLY bridge layer between the current standalone engine
 * and the new Memory Runtime. It does NOT write IndexedDB or persist
 * MemoryRuntime state directly.
 *
 * Each method takes clientState input and returns { engineResult, memoryEventDrafts[] }.
 *
 * Spec reference: Section 9
 */

import type { RuntimeClientState } from '../memory/RuntimeClientState';
import type { EngineResult } from './EngineResult';
import type { MemoryEventDraft } from './MemoryEventDraft';

// ── commitAction ──────────────────────────────────────────────

export interface CommitActionInput {
  clientState: RuntimeClientState;
  actionId: string;
  playerText?: string;
  selectedActionRef?: string;
}

export interface CommitActionOutput {
  engineResult: EngineResult;
  memoryEventDrafts: MemoryEventDraft[];
}

// ── endDialogue ───────────────────────────────────────────────

export interface EndDialogueInput {
  clientState: RuntimeClientState;
  dialogueId: string;
  npcId: string;
}

export interface EndDialogueOutput {
  engineResult: EngineResult;
  memoryEventDrafts: MemoryEventDraft[];
}

// ── failLoop ──────────────────────────────────────────────────

export interface FailLoopInput {
  clientState: RuntimeClientState;
  failReasonCode: string;
}

export interface FailLoopOutput {
  engineResult: EngineResult;
  memoryEventDrafts: MemoryEventDraft[];
}

// ── nextLoop ──────────────────────────────────────────────────

export interface NextLoopInput {
  clientState: RuntimeClientState;
}

export interface NextLoopOutput {
  engineResult: EngineResult;
  memoryEventDrafts: MemoryEventDraft[];
}

// ── Adapter Interface ─────────────────────────────────────────

export interface LegacyEngineAdapter {
  commitAction(input: CommitActionInput): Promise<CommitActionOutput>;
  endDialogue(input: EndDialogueInput): Promise<EndDialogueOutput>;
  failLoop(input: FailLoopInput): Promise<FailLoopOutput>;
  nextLoop(input: NextLoopInput): Promise<NextLoopOutput>;
}
