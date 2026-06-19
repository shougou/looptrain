/**
 * MemoryEventDraftAppender — converts MemoryEventDraft[] into MemoryEvent[]
 * by appending eventId, eventSeq, prevEventId, and createdAt.
 */

import type { MemoryEventDraft } from '../engine/MemoryEventDraft';
import type { MemoryEvent, MemoryEventType } from '../memory/MemoryEvent';
import { generateEventId } from '../ids/RuntimeIdGenerator';

export class MemoryEventDraftAppender {
  private eventSeq: number;
  private lastEventId: string | null;

  constructor(startSeq: number, lastEventId: string | null) {
    this.eventSeq = startSeq;
    this.lastEventId = lastEventId;
  }

  append(drafts: MemoryEventDraft[]): MemoryEvent[] {
    const now = new Date().toISOString();
    const events: MemoryEvent[] = [];

    for (const draft of drafts) {
      this.eventSeq++;
      const eventId = generateEventId(this.eventSeq);
      const event: MemoryEvent = {
        eventId,
        eventSeq: this.eventSeq,
        type: draft.type as MemoryEventType,
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

  getEventSeq(): number {
    return this.eventSeq;
  }

  getLastEventId(): string | null {
    return this.lastEventId;
  }
}
