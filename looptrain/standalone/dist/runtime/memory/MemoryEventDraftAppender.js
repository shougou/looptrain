"use strict";
/**
 * MemoryEventDraftAppender — converts MemoryEventDraft[] into MemoryEvent[]
 * by appending eventId, eventSeq, prevEventId, and createdAt.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemoryEventDraftAppender = void 0;
const RuntimeIdGenerator_1 = require("../ids/RuntimeIdGenerator");
class MemoryEventDraftAppender {
    constructor(startSeq, lastEventId) {
        this.eventSeq = startSeq;
        this.lastEventId = lastEventId;
    }
    append(drafts) {
        const now = new Date().toISOString();
        const events = [];
        for (const draft of drafts) {
            this.eventSeq++;
            const eventId = (0, RuntimeIdGenerator_1.generateEventId)(this.eventSeq);
            const event = {
                eventId,
                eventSeq: this.eventSeq,
                type: draft.type,
                runId: draft.runId,
                loopId: draft.loopId,
                chapterId: draft.chapterId,
                episodeId: draft.episodeId,
                sceneId: draft.sceneId,
                prevEventId: this.lastEventId,
                createdAt: now,
                payload: draft.payload,
            };
            this.lastEventId = eventId;
            events.push(event);
        }
        return events;
    }
    getEventSeq() {
        return this.eventSeq;
    }
    getLastEventId() {
        return this.lastEventId;
    }
}
exports.MemoryEventDraftAppender = MemoryEventDraftAppender;
