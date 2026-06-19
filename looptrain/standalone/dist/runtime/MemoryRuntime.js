"use strict";
/**
 * MemoryRuntime — main Narrative State Runtime class.
 *
 * Composes InMemoryMemoryStorage, MemoryProjector, and MemoryEventDraftAppender.
 * This is the single entry point for all runtime state operations.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemoryRuntime = void 0;
const InMemoryMemoryStorage_1 = require("./storage/InMemoryMemoryStorage");
const MemoryProjector_1 = require("./memory/MemoryProjector");
const MemoryEventDraftAppender_1 = require("./memory/MemoryEventDraftAppender");
const RuntimeIdGenerator_1 = require("./ids/RuntimeIdGenerator");
class MemoryRuntime {
    constructor(storage) {
        this.storage = storage ?? new InMemoryMemoryStorage_1.InMemoryMemoryStorage();
        this.projector = new MemoryProjector_1.MemoryProjector();
        this.appender = null;
        this.snapshotSeq = 0;
    }
    initialize(runId, chapterId, episodeId) {
        const playerId = (0, RuntimeIdGenerator_1.generatePlayerId)();
        const loopId = (0, RuntimeIdGenerator_1.generateLoopId)(1, runId.replace(/^run_/, '').slice(0, 8));
        const sceneId = 'scene-current';
        const now = new Date().toISOString();
        const profile = {
            version: 'v1',
            playerId,
            createdAt: now,
            updatedAt: now,
            settings: {},
        };
        this.storage.profile.set(profile);
        const drafts = [
            {
                type: 'LOOP_STARTED',
                runId,
                loopId,
                chapterId,
                episodeId,
                sceneId,
                payload: { playerId, chapterId, episodeId, runId },
            },
            {
                type: 'LOOP_STARTED',
                runId,
                loopId,
                chapterId,
                episodeId,
                sceneId,
                payload: { loopIndex: 1, loopId },
            },
        ];
        this.appender = new MemoryEventDraftAppender_1.MemoryEventDraftAppender(0, null);
        const events = this.appender.append(drafts);
        this.storage.events.push(...events);
    }
    appendEvents(drafts) {
        if (!this.appender) {
            this.appender = new MemoryEventDraftAppender_1.MemoryEventDraftAppender(this.storage.events.length > 0
                ? this.storage.events[this.storage.events.length - 1].eventSeq
                : 0, this.storage.events.length > 0
                ? this.storage.events[this.storage.events.length - 1].eventId
                : null);
        }
        const events = this.appender.append(drafts);
        this.storage.events.push(...events);
        return events;
    }
    project() {
        return this.projector.project(this.storage.events);
    }
    getState() {
        const projected = this.project();
        return {
            events: this.storage.events,
            knowledge: projected.knowledge,
            beliefs: projected.beliefs,
            relationships: projected.relationships,
            timeline: projected.timeline,
            archive: projected.archive,
        };
    }
    takeSnapshot() {
        this.snapshotSeq++;
        const projected = this.project();
        const runId = this.storage.events.length > 0
            ? this.storage.events[0].runId
            : 'run_unknown';
        const runShortId = runId.replace(/^run_/, '').slice(0, 8);
        const loopId = this.storage.events.length > 0
            ? this.storage.events[this.storage.events.length - 1].loopId
            : 'loop_0000_unknown';
        const snapshot = {
            snapshotId: (0, RuntimeIdGenerator_1.generateSnapshotId)(this.snapshotSeq, runShortId),
            runId,
            loopId,
            eventSeq: this.appender ? this.appender.getEventSeq() : this.storage.events.length,
            timestamp: new Date().toISOString(),
            knowledge: projected.knowledge,
            beliefs: projected.beliefs,
            relationships: projected.relationships,
            timeline: projected.timeline,
            archive: projected.archive,
        };
        this.storage.snapshots.push(snapshot);
        return snapshot;
    }
    applySnapshot(snapshot) {
        this.storage.events = [];
        this.storage.snapshots = [];
        this.appender = null;
        for (const k of snapshot.knowledge) {
            this.storage.knowledge.add(k);
        }
        for (const b of snapshot.beliefs) {
            this.storage.belief.add(b);
        }
        for (const r of snapshot.relationships) {
            this.storage.relationship.set(r.npcId, r);
        }
        for (const t of snapshot.timeline) {
            this.storage.timeline.add(t);
        }
        for (const a of snapshot.archive) {
            this.storage.archive.add(a);
        }
        this.storage.snapshots.push(snapshot);
        this.appender = new MemoryEventDraftAppender_1.MemoryEventDraftAppender(snapshot.eventSeq, null);
    }
}
exports.MemoryRuntime = MemoryRuntime;
