'use strict';

var RuntimeDB = {
  _db: null,
  _ready: false,
  _runId: null,

  async init(runId, storyVersion, appVersion) {
    this._runId = runId;
    if (!window.indexedDB) {
      console.warn('[RuntimeDB] IndexedDB not available, replay disabled');
      return null;
    }
    try {
      this._db = await this._openDB();
      this._ready = true;
      await this._writeMeta(runId, storyVersion, appVersion);
      console.log('[RuntimeDB] initialized, runId:', runId);
      return this._db;
    } catch (e) {
      console.warn('[RuntimeDB] init failed:', e.message);
      this._ready = false;
      return null;
    }
  },

  _openDB() {
    var self = this;
    return new Promise(function(resolve, reject) {
      var req = indexedDB.open('LoopTrainRuntimeDB', 2);
      req.onupgradeneeded = function(e) {
        var db = e.target.result;
        if (!db.objectStoreNames.contains('meta')) db.createObjectStore('meta', { keyPath: 'key' });
        if (!db.objectStoreNames.contains('runs')) db.createObjectStore('runs', { keyPath: 'runId' });
        if (!db.objectStoreNames.contains('events')) db.createObjectStore('events', { keyPath: 'eventId' });
        if (!db.objectStoreNames.contains('snapshots')) db.createObjectStore('snapshots', { keyPath: 'snapshotId' });
        if (!db.objectStoreNames.contains('replayAnchors')) db.createObjectStore('replayAnchors', { keyPath: 'anchorId' });
      };
      req.onsuccess = function(e) { resolve(e.target.result); };
      req.onerror = function(e) { reject(e.target.error); };
    });
  },

  _writeMeta(runId, storyVersion, appVersion) {
    var self = this;
    return new Promise(function(resolve, reject) {
      if (!self._db) { resolve(); return; }
      var tx = self._db.transaction(['meta', 'runs'], 'readwrite');
      tx.objectStore('meta').put({ key: 'runId', value: runId });
      tx.objectStore('meta').put({ key: 'storyVersion', value: storyVersion });
      tx.objectStore('meta').put({ key: 'appVersion', value: appVersion });
      tx.objectStore('runs').put({
        runId: runId,
        createdAt: new Date().toISOString(),
        storyVersion: storyVersion,
        appVersion: appVersion
      });
      tx.oncomplete = function() { resolve(); };
      tx.onerror = function(e) { reject(e.target.error); };
    });
  },

  async addEvent(event) {
    if (!this._db) return;
    return new Promise(function(resolve) {
      var tx = this._db.transaction(['events'], 'readwrite');
      tx.objectStore('events').put(event);
      tx.oncomplete = function() { resolve(); };
      tx.onerror = function() { resolve(); };
    }.bind(this));
  },

  async addSnapshot(snapshot) {
    if (!this._db) return;
    return new Promise(function(resolve) {
      var tx = this._db.transaction(['snapshots'], 'readwrite');
      tx.objectStore('snapshots').put(snapshot);
      tx.oncomplete = function() { resolve(); };
      tx.onerror = function() { resolve(); };
    }.bind(this));
  },

  async addAnchor(anchor) {
    if (!this._db) return;
    return new Promise(function(resolve) {
      var tx = this._db.transaction(['replayAnchors'], 'readwrite');
      tx.objectStore('replayAnchors').put(anchor);
      tx.oncomplete = function() { resolve(); };
      tx.onerror = function() { resolve(); };
    }.bind(this));
  },

  async getAnchorsByLoop(loopNo) {
    if (!this._db) return [];
    return new Promise(function(resolve) {
      var tx = this._db.transaction(['replayAnchors'], 'readonly');
      var req = tx.objectStore('replayAnchors').getAll();
      req.onsuccess = function(e) {
        var all = e.target.result || [];
        var filtered = [];
        for (var i = 0; i < all.length; i++) {
          if (all[i].loopNo === loopNo && all[i].replayable) {
            filtered.push(all[i]);
          }
        }
        resolve(filtered);
      };
      req.onerror = function() { resolve([]); };
    }.bind(this));
  },

  async getAnchorById(anchorId) {
    if (!this._db) return null;
    return new Promise(function(resolve) {
      var tx = this._db.transaction(['replayAnchors'], 'readonly');
      var req = tx.objectStore('replayAnchors').get(anchorId);
      req.onsuccess = function(e) { resolve(e.target.result || null); };
      req.onerror = function() { resolve(null); };
    }.bind(this));
  },

  async checkStoryVersionCompatibility(currentStoryVersion) {
    if (!this._db) return;
    return new Promise(function(resolve) {
      var tx = this._db.transaction(['replayAnchors'], 'readwrite');
      var req = tx.objectStore('replayAnchors').getAll();
      req.onsuccess = function(e) {
        var all = e.target.result || [];
        for (var i = 0; i < all.length; i++) {
          if (all[i].storyVersion !== currentStoryVersion) {
            all[i].replayable = false;
            tx.objectStore('replayAnchors').put(all[i]);
          }
        }
        resolve();
      };
      req.onerror = function() { resolve(); };
    }.bind(this));
  },

  isReady() { return this._ready; },
  getRunId() { return this._runId; }
};

if (typeof window !== 'undefined') window.RuntimeDB = RuntimeDB;
