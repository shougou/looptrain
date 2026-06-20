'use strict';

/* AudioManager — LoopTrain v0.5.1
 * Pure vanilla JS. HTMLAudioElement-based, degrade-safe.
 * No Web Audio API. No game judgment. Audio-only.
 */

const AudioManager = (function () {
  var SETTINGS_KEY = 'lt:settings';
  var MANIFEST_PATH = '/assets/audio/manifest.json';
  const AUDIO_BASE = '/assets/audio/';

  let manifest = null;
  let tracks = {};
  let trackMeta = {};
  let busVolumes = {};
  let masterVolume = 1;
  let muted = false;
  let disabled = true;   // disabled until init() succeeds
  let unlocked = false;
  let fadeTimers = {};

  // ── Init ──

  async function init(manifestUrl) {
    const url = manifestUrl || MANIFEST_PATH;
    try {
      const resp = await fetch(url);
      if (!resp.ok) throw new Error('manifest fetch ' + resp.status);
      manifest = await resp.json();
    } catch (e) {
      console.warn('[AudioManager] manifest load failed, audio disabled:', e.message);
      disabled = true;
      return;
    }

    busVolumes = {};
    if (manifest.buses) {
      for (const [name, cfg] of Object.entries(manifest.buses)) {
        busVolumes[name] = cfg.volume != null ? cfg.volume : 1;
      }
    }
    masterVolume = (manifest.buses?.master?.volume != null) ? manifest.buses.master.volume : 1;

    if (manifest.tracks) {
      for (const [id, cfg] of Object.entries(manifest.tracks)) {
        trackMeta[id] = cfg;
        try { buildTrack(id, cfg); } catch (_) {}
      }
    }

    muted = readMuted();
    disabled = false;
  }

  function buildTrack(id, cfg) {
    const el = document.createElement('audio');
    el.preload = 'auto';
    el.loop = !!cfg.loop;
    el.volume = computeVolume(id);
    el.src = AUDIO_BASE + cfg.file;
    el.load();
    el.addEventListener('error', function () {
      console.warn('[AudioManager] track load error:', id);
    });
    tracks[id] = el;
  }

  function computeVolume(id) {
    const bus = trackMeta[id]?.bus || 'master';
    const busVol = busVolumes[bus] != null ? busVolumes[bus] : 1;
    return Math.max(0, Math.min(1, masterVolume * busVol));
  }

  // ── Public API ──

  function unlock() {
    if (unlocked || disabled) return;
    unlocked = true;
    // Attempt silent play to satisfy browser autoplay policy (user-gesture required)
    const silent = new Audio();
    silent.volume = 0;
    silent.play().catch(function () {});
    silent.pause();
    silent.remove();
  }

  function play(id) {
    if (disabled || muted) return;
    const el = tracks[id];
    if (!el) { console.warn('[AudioManager] play: unknown track', id); return; }
    el.currentTime = 0;
    el.volume = computeVolume(id);
    el.play().catch(function (e) { console.warn('[AudioManager] play blocked:', id, e.message); });
  }

  function stop(id) {
    const el = tracks[id];
    if (!el) return;
    cancelFade(id);
    el.pause();
    el.currentTime = 0;
  }

  function fadeIn(id) {
    if (disabled || muted) return;
    const el = tracks[id];
    if (!el) { console.warn('[AudioManager] fadeIn: unknown track', id); return; }
    const fadeMs = trackMeta[id]?.fadeInMs || 0;
    if (fadeMs <= 0) {
      el.volume = computeVolume(id);
      el.play().catch(function () {});
      return;
    }
    cancelFade(id);
    el.volume = 0;
    el.play().catch(function () {});
    animateVolume(id, 0, computeVolume(id), fadeMs);
  }

  function fadeOut(id) {
    const el = tracks[id];
    if (!el) return;
    cancelFade(id);
    const fadeMs = trackMeta[id]?.fadeOutMs || 0;
    if (fadeMs <= 0 || el.paused) {
      el.pause();
      el.currentTime = 0;
      return;
    }
    animateVolume(id, el.volume, 0, fadeMs, function () {
      el.pause();
      el.currentTime = 0;
    });
  }

  function setVolume(bus, value) {
    if (bus === 'master') {
      masterVolume = Math.max(0, Math.min(1, value));
    } else {
      busVolumes[bus] = Math.max(0, Math.min(1, value));
    }
    for (const [id, el] of Object.entries(tracks)) {
      if (el && !el.paused) el.volume = computeVolume(id);
    }
  }

  function setMuted(value) {
    muted = !!value;
    writeMuted(muted);
    if (muted) {
      for (const [id, el] of Object.entries(tracks)) {
        if (el) { cancelFade(id); el.pause(); el.currentTime = 0; }
      }
    }
  }

  function isMuted() { return muted; }
  function isDisabled() { return disabled; }

  function dispatch(audioEvent) {
    if (disabled) return;
    switch (audioEvent.action) {
      case 'play':      play(audioEvent.id); break;
      case 'fadeIn':    fadeIn(audioEvent.id); break;
      case 'fadeOut':   fadeOut(audioEvent.id); break;
      case 'stop':      stop(audioEvent.id); break;
      case 'setMuted':  setMuted(audioEvent.value); break;
      default: console.warn('[AudioManager] dispatch: unknown action', audioEvent.action);
    }
  }

  function dispatchAll(events) {
    if (!Array.isArray(events)) return;
    for (const e of events) dispatch(e);
  }

  // ── Fade internals ──

  function cancelFade(id) {
    const t = fadeTimers[id];
    if (t) {
      if (t.raf) cancelAnimationFrame(t.raf);
      if (t.cancel) t.cancel();
      delete fadeTimers[id];
    }
  }

  function animateVolume(id, from, to, ms, onDone) {
    const el = tracks[id];
    if (!el) return;
    const start = performance.now();
    const done = function () {
      delete fadeTimers[id];
      if (onDone) onDone();
    };
    let cancelled = false;
    const step = function (now) {
      if (cancelled) return;
      const elapsed = now - start;
      const t = Math.min(1, elapsed / ms);
      el.volume = from + (to - from) * t;
      if (t < 1) {
        fadeTimers[id] = { raf: requestAnimationFrame(step), cancel: function () { cancelled = true; } };
      } else {
        done();
      }
    };
    fadeTimers[id] = { raf: requestAnimationFrame(step), cancel: function () { cancelled = true; } };
  }

  // ── localStorage ──

  function readSettings() {
    try {
      var raw = localStorage.getItem(SETTINGS_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (_) { return {}; }
  }
  function writeSettings(settings) {
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch (_) {}
  }

  function readMuted() {
    try { return readSettings().muted === true; } catch (_) { return false; }
  }
  function writeMuted(val) {
    try {
      var settings = readSettings();
      settings.muted = !!val;
      writeSettings(settings);
    } catch (_) {}
  }

  // ── Exports ──

  return {
    init: init,
    unlock: unlock,
    play: play,
    stop: stop,
    fadeIn: fadeIn,
    fadeOut: fadeOut,
    setVolume: setVolume,
    setMuted: setMuted,
    isMuted: isMuted,
    isDisabled: isDisabled,
    dispatch: dispatch,
    dispatchAll: dispatchAll,
  };
})();
