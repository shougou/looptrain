"use strict";
/**
 * LegacyStandaloneStateMigrator — converts LegacyStandaloneState into MemoryEventDraft[].
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.LegacyStandaloneStateMigrator = void 0;
class LegacyStandaloneStateMigrator {
    migrate(legacy, runId, chapterId = 'chapter-01', episodeId = 'trial-001', sceneId = 'scene-current') {
        const loopId = `loop_${String(legacy.loop).padStart(4, '0')}_${runId.replace(/^run_/, '').slice(0, 8)}`;
        const drafts = [];
        drafts.push({
            type: 'LOOP_STARTED',
            runId, loopId, chapterId, episodeId, sceneId,
            payload: { loopIndex: legacy.loop, loopId, clock: legacy.clock },
        });
        for (const clueId of legacy.known_clues) {
            drafts.push({
                type: 'CLUE_UNLOCKED',
                runId, loopId, chapterId, episodeId, sceneId,
                payload: { clueId, title: clueId, summary: `Migrated clue: ${clueId}`, confidence: 1.0 },
            });
            drafts.push({
                type: 'KNOWLEDGE_CONFIRMED',
                runId, loopId, chapterId, episodeId, sceneId,
                payload: { clueId, title: clueId, summary: `Confirmed from migration: ${clueId}`, confidence: 1.0 },
            });
        }
        if (legacy.carried_memory && legacy.carried_memory.length > 0) {
            for (const mem of legacy.carried_memory) {
                drafts.push({
                    type: 'CARRYOVER_MEMORY_RECORDED',
                    runId, loopId, chapterId, episodeId, sceneId,
                    payload: { content: mem, title: `Carryover: ${mem}`, summary: mem },
                });
            }
        }
        if (legacy.npc_states) {
            for (const [npcId, state] of Object.entries(legacy.npc_states)) {
                const s = state;
                drafts.push({
                    type: 'RELATIONSHIP_UPDATED',
                    runId, loopId, chapterId, episodeId, sceneId,
                    payload: {
                        npcId,
                        trust: s.trust ?? 50,
                        tension: s.tension ?? 50,
                        label: s.label || npcId,
                        note: s.note || '',
                        visibleNote: `Migrated relationship for ${npcId}`,
                    },
                });
            }
        }
        if (legacy.location) {
            drafts.push({
                type: 'SCENE_ENTERED',
                runId, loopId, chapterId, episodeId,
                sceneId: legacy.location,
                payload: { sceneId: legacy.location, previousSceneId: sceneId },
            });
        }
        return drafts;
    }
}
exports.LegacyStandaloneStateMigrator = LegacyStandaloneStateMigrator;
