"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
