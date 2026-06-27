'use strict';

var RuntimeRecorder = {
  _eventSeq: 0,

  resetSeq() { this._eventSeq = 0; },

  async recordEvent(kind, prevState, input, res, state) {
    if (!RuntimeDB || !RuntimeDB.isReady() || !res || !state) return;

    this._eventSeq++;
    var runId = (state.run_id || RuntimeDB.getRunId() || 'unknown');
    var loopNo = state.loop || 1;

    var eventId = loopNo + '_' + this._eventSeq + '_' + kind;
    var snapshotId = 'snap_' + runId + '_l' + loopNo + '_s' + this._eventSeq;
    var anchorId = 'anchor_l' + loopNo + '_s' + this._eventSeq + '_' + kind;

    var stateHash = JSON.stringify(state).length.toString(36);
    var now = new Date().toISOString();

    var event = {
      eventId: eventId,
      runId: runId,
      loopId: 'loop_' + loopNo,
      seq: this._eventSeq,
      type: kind,
      clockBefore: prevState ? (prevState.clock || '') : '',
      clockAfter: state.clock || '',
      apBefore: prevState ? (prevState.ap_remaining || 0) : 0,
      apAfter: state.ap_remaining || 0,
      locationBefore: prevState ? (prevState.location || '') : '',
      locationAfter: state.location || '',
      input: input || null,
      engineResult: res,
      stateHash: stateHash,
      createdAt: now
    };

    var snapshot = {
      snapshotId: snapshotId,
      runId: runId,
      loopId: 'loop_' + loopNo,
      eventSeq: this._eventSeq,
      state: state,
      stateHash: stateHash,
      createdAt: now
    };

    var anchor = {
      anchorId: anchorId,
      runId: runId,
      loopNo: loopNo,
      clock: state.clock || '',
      location: state.location || '',
      apRemaining: state.ap_remaining || 0,
      label: this._buildLabel(state, kind),
      summary: this._buildSummary(res, kind),
      actionType: this._mapActionType(kind),
      snapshotId: snapshotId,
      eventSeq: this._eventSeq,
      runtimeVersion: (typeof LT_APP_VERSION !== 'undefined') ? LT_APP_VERSION : 'unknown',
      storyVersion: (typeof LT_STORY_VERSION !== 'undefined') ? LT_STORY_VERSION : 'unknown',
      replayable: true,
      risk: 'safe'
    };

    if (typeof LT_STORY_VERSION !== 'undefined' && anchor.storyVersion !== LT_STORY_VERSION) {
      anchor.replayable = false;
    }

    await RuntimeDB.addEvent(event);
    await RuntimeDB.addSnapshot(snapshot);
    await RuntimeDB.addAnchor(anchor);
  },

  _buildLabel(state, kind) {
    var clock = state.clock || '??';
    var loc = state.location === 'connector_2_3' ? '连接处'
            : state.location === 'carriage_2' ? '二号车厢'
            : (state.location || '');
    return clock + ' · ' + loc;
  },

  _buildSummary(res, kind) {
    if (res && res.messages && res.messages.length) {
      var last = res.messages[res.messages.length - 1];
      var text = last.text || '';
      return text.slice(0, 80);
    }
    return kind;
  },

  _mapActionType(kind) {
    var map = {
      'ACTION_COMMITTED': 'move',
      'OBSERVATION_RESOLVED': 'observe',
      'DIALOGUE_ENDED': 'dialogue',
      'DIALOGUE_MESSAGE_RESOLVED': 'dialogue',
      'LOOP_FAILED': 'failure',
      'LOOP_STARTED': 'observe'
    };
    return map[kind] || 'observe';
  }
};

if (typeof window !== 'undefined') window.RuntimeRecorder = RuntimeRecorder;
