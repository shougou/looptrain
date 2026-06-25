'use strict';

/* LoopTrain Loading State Manager
 * Manages loading indicators for buttons and global state.
 */

var LoadingState = {
  activeElements: {},
  
  show: function(elementId, text) {
    var el = document.getElementById(elementId);
    if (!el) return;
    
    this.activeElements[elementId] = {
      originalText: el.textContent || el.innerText,
      originalHTML: el.innerHTML
    };
    
    el.classList.add('lt-btn-loading');
    el.disabled = true;
    
    if (text) {
      el.innerHTML = '<span class="lt-loading-spinner"></span> ' + esc(text);
    } else {
      el.innerHTML = '<span class="lt-loading-spinner"></span>';
    }
  },
  
  hide: function(elementId) {
    var el = document.getElementById(elementId);
    if (!el) return;
    
    var data = this.activeElements[elementId];
    if (!data) {
      el.classList.remove('lt-btn-loading');
      el.disabled = false;
      return;
    }
    
    el.classList.remove('lt-btn-loading');
    el.disabled = false;
    el.innerHTML = data.originalHTML;
    
    delete this.activeElements[elementId];
  },
  
  showGlobal: function(text) {
    var overlay = document.getElementById('lt-global-loading');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'lt-global-loading';
      overlay.className = 'lt-global-loading';
      overlay.innerHTML = '<div class="lt-loading"><span class="lt-loading-spinner"></span><span class="lt-loading-text">处理中...</span></div>';
      document.body.appendChild(overlay);
    }
    
    if (text) {
      var textEl = overlay.querySelector('.lt-loading-text');
      if (textEl) textEl.textContent = text;
    }
    
    overlay.style.display = 'flex';
  },
  
  hideGlobal: function() {
    var overlay = document.getElementById('lt-global-loading');
    if (overlay) overlay.style.display = 'none';
  }
};

function esc(s) {
  if (!s) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = LoadingState;
}