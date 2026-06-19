'use strict';

/* PortraitIntro — v0.7.1 NPC portrait entrance animation.
 * Web Animations API + CSS transform. No dependencies.
 * Plays once per NPC per loop.
 */

const PortraitIntro = (function () {
  var playedByLoop = {};

  function shouldPlay(npcId, loopNo) {
    var key = loopNo + ':' + npcId;
    return !playedByLoop[key];
  }

  function markPlayed(npcId, loopNo) {
    playedByLoop[loopNo + ':' + npcId] = true;
  }

  function reset() {
    playedByLoop = {};
  }

  /* Set dock portrait image without animation (fallback when intro already played). */
  function setImage(options) {
    var dockSelector = options.dockSelector || '.lt-portrait-dock';
    var dock = document.querySelector(dockSelector);
    if (!dock) return;

    var src = options.src;
    var alt = options.alt || '';

    var img = document.createElement('img');
    img.src = src;
    img.alt = alt;
    img.style.cssText = 'width:100%;height:100%;object-fit:cover;object-position:top center;';
    dock.innerHTML = '';
    dock.appendChild(img);
  }

  async function play(options) {
    var src = options.src;
    var dockSelector = options.dockSelector || '.lt-portrait-dock';
    var alt = options.alt || '';
    var holdMs = options.holdMs || 400;
    var durationMs = options.durationMs || 700;

    var dock = document.querySelector(dockSelector);
    if (!dock) { console.warn('[PortraitIntro] dock not found:', dockSelector); return; }

    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Pre-load dock image
    var dockImg = document.createElement('img');
    dockImg.src = src;
    dockImg.alt = alt;
    dockImg.style.opacity = '0';
    dockImg.style.width = '100%';
    dockImg.style.height = '100%';
    dockImg.style.objectFit = 'cover';
    dockImg.style.objectPosition = 'top center';
    dock.innerHTML = '';
    dock.appendChild(dockImg);

    if (reduceMotion) {
      dockImg.style.opacity = '1';
      return;
    }

    // Fullscreen layer
    var layer = document.createElement('div');
    layer.style.cssText = 'position:fixed;inset:0;z-index:9999;pointer-events:none;background:rgba(0,0,0,0.55);backdrop-filter:blur(3px);';
    document.body.appendChild(layer);

    // Fullscreen portrait
    var img = document.createElement('img');
    img.src = src;
    img.alt = alt;
    img.style.cssText = 'position:fixed;transform-origin:top left;object-fit:contain;will-change:transform,opacity;filter:drop-shadow(0 18px 42px rgba(0,0,0,.65));';
    layer.appendChild(img);

    // Wait for image to be ready
    if (!(img.complete && img.naturalWidth > 0)) {
      await new Promise(function (r) { img.onload = r; img.onerror = r; });
    }

    // Calculate fullscreen rect
    var vw = window.innerWidth;
    var vh = window.innerHeight;
    var naturalW = img.naturalWidth || 512;
    var naturalH = img.naturalHeight || 768;
    var ratio = naturalW / naturalH;
    var height = Math.min(vh * 0.65, 520);
    var width = height * ratio;
    if (width > vw * 0.82) { width = vw * 0.82; height = width / ratio; }
    var left = (vw - width) / 2;
    var top = Math.max(80, (vh - height) * 0.3);

    img.style.left = left + 'px';
    img.style.top = top + 'px';
    img.style.width = width + 'px';
    img.style.height = height + 'px';

    // Fade in layer
    await layer.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 180, easing: 'ease-out', fill: 'forwards' }).finished;

    // Hold
    await new Promise(function (r) { setTimeout(r, holdMs); });

    // Shrink to dock
    var dockRect = dock.getBoundingClientRect();
    var dx = dockRect.left - left;
    var dy = dockRect.top - top;
    var scaleX = dockRect.width / width;
    var scaleY = dockRect.height / height;
    var scale = Math.min(scaleX, scaleY);

    var anim = img.animate(
      [{ transform: 'translate(0px, 0px) scale(1)', opacity: 1 },
       { transform: 'translate(' + dx + 'px, ' + dy + 'px) scale(' + scale + ')', opacity: 1 }],
      { duration: durationMs, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'forwards' }
    );
    var fade = layer.animate(
      [{ background: 'rgba(0,0,0,0.55)' }, { background: 'rgba(0,0,0,0)' }],
      { duration: durationMs, easing: 'ease-out', fill: 'forwards' }
    );

    await Promise.all([anim.finished, fade.finished]);
    dockImg.style.opacity = '1';
    layer.remove();
  }

  return { play: play, setImage: setImage, shouldPlay: shouldPlay, markPlayed: markPlayed, reset: reset };
})();
