"use strict";
/**
 * MemoryEventDraft - server-side event draft contract.
 *
 * The server returns drafts. The browser MemoryRuntime (or legacy state bridge)
 * is responsible for generating formal MemoryEvent records (eventId, eventSeq,
 * prevEventId, createdAt) and persisting them.
 *
 * Spec reference: Section 8.2
 */
Object.defineProperty(exports, "__esModule", { value: true });
