"use strict";
/**
 * PromptMemoryContext — the SAFE, filtered view of runtime state for LLM prompt input.
 *
 * MUST NOT contain: raw event log, hidden truth, dialogue_session, future plot, NPC private thoughts.
 */
Object.defineProperty(exports, "__esModule", { value: true });
