/* ============================================================
   FU FUT COFFEE — Toast Notification System
   Simple, reliable toast notifications with auto-dismiss
   ============================================================ */

(function initToastSystem() {
  'use strict';

  var ANIM_MS = 300;

  var CONFIG = {
    duration: 3000,
    position: 'top-right',
    maxVisible: 5,
    gap: 12
  };

  var TYPES = {
    success: {
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
      bg: 'rgba(46, 125, 50, 0.95)',
      border: 'rgba(46, 125, 50, 0.3)'
    },
    error: {
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
      bg: 'rgba(211, 47, 47, 0.95)',
      border: 'rgba(211, 47, 47, 0.3)'
    },
    info: {
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
      bg: 'rgba(15, 123, 120, 0.95)',
      border: 'rgba(15, 123, 120, 0.3)'
    },
    warning: {
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
      bg: 'rgba(217, 119, 6, 0.95)',
      border: 'rgba(217, 119, 6, 0.3)'
    }
  };

  var container = null;
  var queue = [];
  var visible = [];

  function initContainer() {
    if (container) return;
    container = document.createElement('div');
    container.className = 'toast-container toast-container--' + CONFIG.position;
    container.setAttribute('aria-live', 'polite');
    document.body.appendChild(container);

    if (!document.querySelector('style[data-toast-styles]')) {
      var s = document.createElement('style');
      s.setAttribute('data-toast-styles', 'true');
      s.textContent = getStyles();
      document.head.appendChild(s);
    }
  }

  function getStyles() {
    return '
      .toast-container {
        position: fixed; pointer-events: none; z-index: 9999;
        display: flex; flex-direction: column; gap: ' + CONFIG.gap + 'px; padding: 16px;
        max-width: 100%; box-sizing: border-box;
      }
      .toast-container--top-right { top: 0; right: 0; align-items: flex-end; }
      .toast-container--top-left  { top: 0; left: 0;  align-items: flex-start; }
      .toast-container--bottom-right { bottom: 0; right: 0; align-items: flex-end; }
      .toast-container--bottom-left  { bottom: 0; left: 0;  align-items: flex-start; }

      .toast-notification {
        position: relative; pointer-events: auto;
        width: 100%; max-width: 360px; min-width: 240px;
        padding: 14px 16px; border-radius: var(--r-md, 8px);
        display: flex; align-items: center; gap: 12px;
        box-shadow: 0 8px 24px rgba(0,0,0,0.18);
        backdrop-filter: blur(10px);
        opacity: 0; transform: translateX(100%);
        transition: opacity ' + ANIM_MS + 'ms ease, transform ' + ANIM_MS + 'ms ease;
      }
      .toast-notification.toast-visible {
        opacity: 1; transform: translateX(0);
      }
      .toast-notification.toast-exit {
        opacity: 0; transform: translateX(100%);
      }

      .toast-notification .toast-icon {
        flex-shrink: 0; width: 28px; height: 28px;
        display: flex; align-items: center; justify-content: center;
        border-radius: 50%; background: rgba(255,255,255,0.15); color: #fff;
      }
      .toast-notification .toast-icon svg { width: 16px; height: 16px; }

      .toast-notification .toast-content { flex: 1; min-width: 0; }
      .toast-notification .toast-title {
        font-weight: 600; font-size: 13px; line-height: 1.3;
        color: #fff; margin-bottom: 2px;
      }
      .toast-notification .toast-message {
        font-size: 13px; line-height: 1.4; color: rgba(255,255,255,0.9);
      }

      .toast-notification .toast-dismiss {
        flex-shrink: 0; background: none; border: none;
        color: rgba(255,255,255,0.7); cursor: pointer;
        padding: 6px; margin: -6px -6px -6px auto;
        border-radius: 4px; transition: opacity 0.15s, color 0.15s;
      }
      .toast-notification .toast-dismiss:hover { opacity: 1; color: #fff; }
      .toast-notification .toast-dismiss svg { width: 16px; height: 16px; display: block; }

      .toast-notification.toast-success { background: ' + TYPES.success.bg + '; border: 1px solid ' + TYPES.success.border + '; }
      .toast-notification.toast-error   { background: ' + TYPES.error.bg   + '; border: 1px solid ' + TYPES.error.border   + '; }
      .toast-notification.toast-info    { background: ' + TYPES.info.bg    + '; border: 1px solid ' + TYPES.info.border    + '; }
      .toast-notification.toast-warning { background: ' + TYPES.warning.bg + '; border: 1px solid ' + TYPES.warning.border + '; }

      @media (prefers-reduced-motion: reduce) {
        .toast-notification { transition: none !important; }
      }
      @media (max-width: 480px) {
        .toast-notification { max-width: calc(100vw - 32px); min-width: auto; }
      }
    ';
  }

  function escapeHtml(text) {
    if (typeof text !== 'string') return text;
    var d = document.createElement('div');
    d.textContent = text;
    return d.innerHTML;
  }

  function removeToast(id) {
    var idx = -1;
    for (var i = 0; i < visible.length; i++) {
      if (visible[i].id === id) { idx = i; break; }
    }
    if (idx === -1) return;
    var toast = visible[idx];
    if (!toast.el || !toast.el.parentNode) return;
    if (toast.timer) clearTimeout(toast.timer);
    toast.el.classList.remove('toast-visible');
    toast.el.classList.add('toast-exit');
    // Guaranteed removal — don't rely on transitionend
    setTimeout(function() {
      if (toast.el && toast.el.parentNode) toast.el.remove();
    }, ANIM_MS + 50);
    visible.splice(idx, 1);
    processQueue();
  }

  function showOne(type, message, options) {
    options = options || {};
    initContainer();
    var typeDef = TYPES[type] || TYPES.info;
    var title = options.title || type.charAt(0).toUpperCase() + type.slice(1);
    var duration = options.duration !== undefined ? options.duration : CONFIG.duration;
    var id = 'toast-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6);

    var el = document.createElement('div');
    el.id = id;
    el.className = 'toast-notification toast-' + type;
    el.setAttribute('role', 'alert');

    var titleHtml = title ? '<div class="toast-title">' + escapeHtml(title) + '</div>' : '';
    el.innerHTML =
      '<div class="toast-icon">' + (typeDef.icon || '') + '</div>' +
      '<div class="toast-content">' + titleHtml +
      '<div class="toast-message">' + escapeHtml(message) + '</div></div>' +
      '<button class="toast-dismiss" aria-label="Dismiss">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">' +
      '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>' +
      '</svg></button>';

    el.querySelector('.toast-dismiss').addEventListener('click', function(e) {
      e.stopPropagation();
      removeToast(id);
    });

    var toastObj = { id: id, el: el, timer: null };
    toastObj.timer = setTimeout(function() { removeToast(id); }, duration);

    queue.push(toastObj);
    processQueue();
    return id;
  }

  function processQueue() {
    visible = visible.filter(function(t) { return t.el && t.el.parentNode; });
    while (queue.length > 0 && visible.length < CONFIG.maxVisible) {
      var toast = queue.shift();
      container.appendChild(toast.el);
      visible.push(toast);
      // Trigger slide-in on next frame
      requestAnimationFrame(function() {
        toast.el.classList.add('toast-visible');
      });
    }
  }

  // Public API
  window.toast = {
    show:    function(type, msg, opts) { return showOne(type, msg, opts); },
    success: function(msg, opts) { return showOne('success', msg, opts); },
    error:   function(msg, opts) { return showOne('error', msg, opts); },
    info:    function(msg, opts) { return showOne('info', msg, opts); },
    warning: function(msg, opts) { return showOne('warning', msg, opts); },
    dismiss:  removeToast,
    dismissAll: function() {
      var ids = visible.map(function(t) { return t.id; });
      ids.forEach(removeToast);
      queue = [];
    },
    config: function(c) { Object.assign(CONFIG, c); }
  };

  // Backwards compat
  if (typeof window.showToast === 'function') window.oldShowToast = window.showToast;
  window.showToast = function(message, duration) {
    window.toast.info(message, { duration: duration });
  };
})();
