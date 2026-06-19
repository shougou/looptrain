"use strict";
/**
 * MemoryProjector — walks MemoryEvent[] and projects them into
 * Knowledge, Belief, Relationship, Timeline, and Archive records.
 *
 * Engine judges. Runtime records. Memory projects.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemoryProjector = void 0;
class MemoryProjector {
    project(events) {
        const knowledgeMap = new Map();
        const beliefMap = new Map();
        const relationshipMap = new Map();
        const timeline = [];
        const archive = [];
        for (const evt of events) {
            switch (evt.type) {
                case 'KNOWLEDGE_CONFIRMED':
                    this.projectKnowledgeConfirmed(evt, knowledgeMap);
                    break;
                case 'BELIEF_CREATED':
                    this.projectBeliefCreated(evt, beliefMap);
                    break;
                case 'BELIEF_UPDATED':
                    this.projectBeliefUpdated(evt, beliefMap);
                    break;
                case 'BELIEF_CONTRADICTED':
                    this.projectBeliefContradicted(evt, beliefMap);
                    break;
                case 'BELIEF_CONFIRMED':
                    this.projectBeliefConfirmed(evt, beliefMap);
                    break;
                case 'RELATIONSHIP_UPDATED':
                    this.projectRelationshipUpdated(evt, relationshipMap);
                    break;
                case 'LOOP_FAILED':
                case 'LOOP_OUTCOME_RECORDED':
                    this.projectLoopOutcome(evt, timeline);
                    break;
                // TIMELINE_ENTRY_CREATED handled via LOOP_OUTCOME_RECORDED
                // ARCHIVE_ENTRY_CREATED handled via LOOP_OUTCOME_RECORDED
                case 'CARRYOVER_MEMORY_RECORDED':
                    this.projectCarryoverMemory(evt, knowledgeMap);
                    break;
                case 'CLUE_UNLOCKED':
                    this.projectClueUnlocked(evt, knowledgeMap);
                    break;
                default:
                    break;
            }
        }
        return {
            knowledge: Array.from(knowledgeMap.values()),
            beliefs: Array.from(beliefMap.values()),
            relationships: Array.from(relationshipMap.values()),
            timeline,
            archive,
        };
    }
    projectKnowledgeConfirmed(evt, map) {
        const p = evt.payload;
        const rec = {
            id: p.knowledgeId || `know_${evt.eventId}`,
            runId: evt.runId,
            loopId: evt.loopId,
            clueId: p.clueId || '',
            title: p.title || '',
            summary: p.summary || '',
            sourceEventId: evt.eventId,
            confidence: p.confidence ?? 1.0,
            confirmedAt: evt.createdAt,
            visibility: 'player_visible',
        };
        map.set(rec.id, rec);
    }
    projectBeliefCreated(evt, map) {
        const p = evt.payload;
        const rec = {
            id: p.beliefId || `belief_${evt.eventId}`,
            runId: evt.runId,
            loopId: evt.loopId,
            target: p.target || '',
            statement: p.statement || p.content || '',
            confidence: p.confidence ?? 0.5,
            source: p.source || 'player_suspicion',
            status: 'unconfirmed',
            createdAt: evt.createdAt,
        };
        map.set(rec.id, rec);
    }
    projectBeliefUpdated(evt, map) {
        const p = evt.payload;
        const id = p.beliefId || '';
        if (!id)
            return;
        const existing = map.get(id);
        if (existing) {
            map.set(id, {
                ...existing,
                statement: p.statement || p.content || existing.statement,
                confidence: p.confidence ?? existing.confidence,
                status: 'strengthened',
            });
        }
    }
    projectBeliefContradicted(evt, map) {
        const p = evt.payload;
        const id = p.beliefId || '';
        if (!id)
            return;
        const existing = map.get(id);
        if (existing) {
            map.set(id, { ...existing, status: 'contradicted' });
        }
    }
    projectBeliefConfirmed(evt, map) {
        const p = evt.payload;
        const id = p.beliefId || '';
        if (!id)
            return;
        const existing = map.get(id);
        if (existing) {
            map.set(id, { ...existing, status: 'confirmed', confidence: 1.0 });
        }
    }
    projectRelationshipUpdated(evt, map) {
        const p = evt.payload;
        const npcId = p.npcId || '';
        if (!npcId)
            return;
        const existing = map.get(npcId);
        const rec = {
            npcId,
            runId: evt.runId,
            label: p.label || existing?.label || '',
            trust: existing
                ? existing.trust + (p.trustDelta ?? 0)
                : (p.trust ?? 50),
            tension: existing
                ? existing.tension + (p.tensionDelta ?? 0)
                : (p.tension ?? 50),
            note: p.note || p.visibleNote || existing?.note || '',
            updatedAt: evt.createdAt,
        };
        map.set(npcId, rec);
    }
    projectLoopOutcome(evt, timeline) {
        timeline.push({
            id: `tl_${evt.eventId}`,
            runId: evt.runId,
            loopNo: parseInt(evt.loopId.replace(/[^0-9]/g, '').slice(0, 4), 10) || 0,
            summary: `Loop ${evt.type === 'LOOP_FAILED' ? 'failed' : 'outcome recorded'} at ${evt.createdAt}`,
            outcome: evt.type === 'LOOP_FAILED' ? 'failed' : 'recorded',
            keyEventIds: [evt.eventId],
            createdAt: evt.createdAt,
        });
    }
    projectTimelineEntry(evt, timeline) {
        const p = evt.payload;
        timeline.push({
            id: `tl_${evt.eventId}`,
            runId: evt.runId,
            loopNo: parseInt(evt.loopId.replace(/[^0-9]/g, '').slice(0, 4), 10) || 0,
            summary: p.summary || p.eventSummary || '',
            keyEventIds: [evt.eventId],
            createdAt: evt.createdAt,
        });
    }
    projectArchiveEntry(evt, archive) {
        const p = evt.payload;
        archive.push({
            id: `arch_${evt.eventId}`,
            runId: evt.runId,
            title: p.title || `Loop Archive ${evt.loopId}`,
            summary: p.summary || '',
            sourceEventIds: [evt.eventId],
            archivedAt: evt.createdAt,
        });
    }
    projectCarryoverMemory(evt, map) {
        const p = evt.payload;
        const rec = {
            id: `carry_${evt.eventId}`,
            runId: evt.runId,
            loopId: evt.loopId,
            clueId: p.clueId || 'carryover',
            title: p.title || 'Carryover Memory',
            summary: p.summary || p.content || '',
            sourceEventId: evt.eventId,
            confidence: 1.0,
            confirmedAt: evt.createdAt,
            visibility: 'player_visible',
        };
        map.set(rec.id, rec);
    }
    projectClueUnlocked(evt, map) {
        const p = evt.payload;
        const rec = {
            id: `clue_${evt.eventId}`,
            runId: evt.runId,
            loopId: evt.loopId,
            clueId: p.clueId || '',
            title: p.title || p.clueId || '',
            summary: p.summary || '',
            sourceEventId: evt.eventId,
            confidence: p.confidence ?? 1.0,
            confirmedAt: evt.createdAt,
            visibility: 'player_visible',
        };
        map.set(rec.id, rec);
    }
}
exports.MemoryProjector = MemoryProjector;
