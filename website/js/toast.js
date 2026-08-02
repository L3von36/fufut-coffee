/* ============================================================
   FU FUT COFFEE — Toast Notification System
   Global toast notifications with multiple types, icons, colors, and queuing
   ============================================================ */

(function initToastSystem() {
  'use strict';

  // Configuration
  const CONFIG = {
    duration: 4000,           // Auto-dismiss after 4 seconds
    position: 'top-right',    // Position on screen
    maxVisible: 5,           // Maximum visible toasts at once
    gap: 12,                 // Gap between toasts in pixels
    animationDuration: 320  // Animation duration in ms
  };

  // Toast types with their configurations
  const TOAST_TYPES = {
    success: {
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
      color: 'var(--c-success)',
      bg: 'rgba(46, 125, 50, 0.95)',
      border: 'rgba(46, 125, 50, 0.3)'
    },
    error: {
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
      color: 'var(--c-error)',
      bg: 'rgba(211, 47, 47, 0.95)',
      border: 'rgba(211, 47, 47, 0.3)'
    },
    info: {
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
      color: 'var(--c-primary)',
      bg: 'rgba(15, 123, 120, 0.95)',
      border: 'rgba(15, 123, 120, 0.3)'
    },
    warning: {
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
      color: '#D97706',
      bg: 'rgba(217, 119, 6, 0.95)',
      border: 'rgba(217, 119, 6, 0.3)'
    }
  };

  // Toast container
  let container = null;

  // Queue of pending toasts
  let queue = [];

  // Currently visible toasts
  let visibleToasts = [];

  // Initialize the toast container
  function initContainer() {
    if (container) return;

    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    container.setAttribute('aria-live', 'polite');
    container.setAttribute('aria-atomic', 'true');

    // Set position based on config
    container.classList.add('toast-container--' + CONFIG.position);

    document.body.appendChild(container);

    // Add container styles dynamically if not already in CSS
    if (!document.querySelector('style[data-toast-styles]')) {
      const style = document.createElement('style');
      style.setAttribute('data-toast-styles', 'true');
      style.textContent = getContainerStyles();
      document.head.appendChild(style);
    }
  }

  // Get container CSS styles
  function getContainerStyles() {
    return `
      .toast-container {
        position: fixed;
        pointer-events: none;
        z-index: 9999;
        display: flex;
        flex-direction: column;
        gap: ${CONFIG.gap}px;
        padding: 16px;
        max-width: 100%;
        box-sizing: border-box;
      }
      .toast-container.toast-container--top-right {
        top: 0;
        right: 0;
        align-items: flex-end;
      }
      .toast-container.toast-container--top-left {
        top: 0;
        left: 0;
        align-items: flex-start;
      }
      .toast-container.toast-container--bottom-right {
        bottom: 0;
        right: 0;
        align-items: flex-end;
      }
      .toast-container.toast-container--bottom-left {
        bottom: 0;
        left: 0;
        align-items: flex-start;
      }
      .toast-notification {
        position: relative;
        pointer-events: auto;
        width: 100%;
        max-width: 320px;
        min-width: 240px;
        padding: 10px 14px;
        border-radius: var(--r-md);
        display: flex;
        align-items: flex-start;
        gap: 10px;
        box-shadow: var(--e-3);
        backdrop-filter: blur(10px);
        animation: toastSlideIn ${CONFIG.animationDuration}ms var(--ease-soft) both;
        will-change: transform, opacity;
        overflow: hidden;
      }
      .toast-notification.hidden {
        animation: toastSlideOut ${CONFIG.animationDuration}ms var(--ease-soft) both;
      }
      @keyframes toastSlideIn {
        from {
          opacity: 0;
          transform: translateX(100%);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }
      @keyframes toastSlideOut {
        from {
          opacity: 1;
          transform: translateX(0);
        }
        to {
          opacity: 0;
          transform: translateX(100%);
        }
      }
      .toast-notification .toast-icon {
        flex-shrink: 0;
        width: 18px;
        height: 18px;
        color: currentColor;
      }
      .toast-notification .toast-content {
        flex: 1;
        min-width: 0;
      }
      .toast-notification .toast-title {
        font-weight: 600;
        font-size: var(--fs-13);
        line-height: 1.3;
        color: #fff;
        margin-bottom: 2px;
      }
      .toast-notification .toast-message {
        font-size: var(--fs-13);
        line-height: 1.4;
        color: rgba(255, 255, 255, 0.9);
      }
      .toast-notification .toast-dismiss {
        flex-shrink: 0;
        background: none;
        border: none;
        color: rgba(255, 255, 255, 0.7);
        cursor: pointer;
        padding: 8px;
        margin: -8px -8px -8px auto;
        opacity: 0.7;
        transition: opacity var(--dur-1);
      }
      .toast-notification .toast-dismiss:hover {
        opacity: 1;
        color: #fff;
      }
      .toast-notification .toast-dismiss:focus {
        outline: none;
        opacity: 1;
        color: #fff;
      }
      .toast-notification .toast-dismiss svg {
        width: 16px;
        height: 16px;
        display: block;
      }
      .toast-notification.toast-success {
        background: var(--toast-success-bg, ${TOAST_TYPES.success.bg});
        border: 1px solid var(--toast-success-border, ${TOAST_TYPES.success.border});
        color: var(--toast-success-color, ${TOAST_TYPES.success.color});
      }
      .toast-notification.toast-error {
        background: var(--toast-error-bg, ${TOAST_TYPES.error.bg});
        border: 1px solid var(--toast-error-border, ${TOAST_TYPES.error.border});
        color: var(--toast-error-color, ${TOAST_TYPES.error.color});
      }
      .toast-notification.toast-info {
        background: var(--toast-info-bg, ${TOAST_TYPES.info.bg});
        border: 1px solid var(--toast-info-border, ${TOAST_TYPES.info.border});
        color: var(--toast-info-color, ${TOAST_TYPES.info.color});
      }
      .toast-notification.toast-warning {
        background: var(--toast-warning-bg, ${TOAST_TYPES.warning.bg});
        border: 1px solid var(--toast-warning-border, ${TOAST_TYPES.warning.border});
        color: var(--toast-warning-color, ${TOAST_TYPES.warning.color});
      }
      @media (prefers-reduced-motion: reduce) {
        .toast-notification {
          animation: none !important;
          opacity: 1 !important;
          transform: none !important;
        }
        .toast-notification.hidden {
          animation: none !important;
        }
      }
      @media (max-width: 480px) {
        .toast-notification {
          max-width: calc(100vw - 32px);
          min-width: auto;
        }
        .toast-container.toast-container--top-right,
        .toast-container.toast-container--bottom-right {
          align-items: flex-end;
        }
        .toast-container.toast-container--top-left,
        .toast-container.toast-container--bottom-left {
          align-items: flex-start;
        }
      }
    `;
  }

  // Create a toast element
  function createToast(type, message, title, duration) {
    const toastId = 'toast-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    const toastType = TOAST_TYPES[type] || TOAST_TYPES.info;

    const toastEl = document.createElement('div');
    toastEl.id = toastId;
    toastEl.className = 'toast-notification toast-' + type;
    toastEl.setAttribute('role', 'alert');
    toastEl.setAttribute('aria-live', 'assertive');

    // Build toast content
    let iconHtml = toastType.icon || '';
    let titleHtml = '';
    let messageHtml = '';

    if (title) {
      titleHtml = '<div class="toast-title">' + escapeHtml(title) + '</div>';
    }
    messageHtml = '<div class="toast-message">' + escapeHtml(message) + '</div>';

    // Dismiss button
    const dismissBtn = '<button class="toast-dismiss" aria-label="Dismiss notification">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">' +
      '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>' +
      '</svg>' +
      '</button>';

    toastEl.innerHTML = iconHtml + '<div class="toast-content">' + titleHtml + messageHtml + '</div>' + dismissBtn;

    // Add dismiss handler
    const dismissEl = toastEl.querySelector('.toast-dismiss');
    dismissEl.addEventListener('click', function(e) {
      e.stopPropagation();
      dismissToast(toastId);
    });

    // Auto-dismiss
    const autoDuration = duration !== undefined ? duration : CONFIG.duration;
    toastEl._autoDismissTimer = setTimeout(function() {
      dismissToast(toastId);
    }, autoDuration);

    return {
      id: toastId,
      element: toastEl,
      type: type
    };
  }

  // Show a toast
  function showToast(type, message, options) {
    options = options || {};

    initContainer();

    const title = options.title || getDefaultTitle(type);
    const duration = options.duration !== undefined ? options.duration : CONFIG.duration;

    const toast = createToast(type, message, title, duration);

    // Add to queue
    queue.push(toast);

    // Process queue
    processQueue();

    return toast.id;
  }

  // Get default title for toast type
  function getDefaultTitle(type) {
    const titles = {
      success: 'Success',
      error: 'Error',
      info: 'Info',
      warning: 'Warning'
    };
    return titles[type] || 'Notification';
  }

  // Process the toast queue
  function processQueue() {
    // Remove any toasts that have been dismissed
    visibleToasts = visibleToasts.filter(function(toast) {
      if (toast.element && toast.element.parentNode) {
        return true;
      }
      return false;
    });

    // While we have queue items and space for more
    while (queue.length > 0 && visibleToasts.length < CONFIG.maxVisible) {
      const toast = queue.shift();
      displayToast(toast);
    }
  }

  // Display a toast in the container
  function displayToast(toast) {
    if (!container) return;

    container.appendChild(toast.element);
    visibleToasts.push(toast);

    // Add hidden class initially for exit animation
    toast.element.classList.add('hidden');

    // Trigger animation
    requestAnimationFrame(function() {
      toast.element.classList.remove('hidden');
    });

    // Listen for animation end to remove from DOM
    toast.element.addEventListener('animationend', function onAnimationEnd(e) {
      if (e.animationName === 'toastSlideOut') {
        toast.element.remove();
        visibleToasts = visibleToasts.filter(function(t) { return t.id !== toast.id; });
        processQueue();
      }
    });
  }

  // Dismiss a toast by ID
  function dismissToast(toastId) {
    const toastIndex = visibleToasts.findIndex(function(t) { return t.id === toastId; });
    if (toastIndex === -1) return;

    const toast = visibleToasts[toastIndex];
    if (!toast.element) return;

    // Clear auto-dismiss timer
    if (toast.element._autoDismissTimer) {
      clearTimeout(toast.element._autoDismissTimer);
    }

    // Trigger exit animation
    toast.element.classList.add('hidden');
  }

  // Dismiss all toasts
  function dismissAll() {
    visibleToasts.forEach(function(toast) {
      if (toast.element && toast.element._autoDismissTimer) {
        clearTimeout(toast.element._autoDismissTimer);
      }
      if (toast.element) {
        toast.element.classList.add('hidden');
      }
    });
    visibleToasts = [];
    queue = [];
  }

  // Escape HTML to prevent XSS
  function escapeHtml(text) {
    if (typeof text !== 'string') return text;
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Public API
  window.toast = {
    show: showToast,
    success: function(message, options) { return showToast('success', message, options); },
    error: function(message, options) { return showToast('error', message, options); },
    info: function(message, options) { return showToast('info', message, options); },
    warning: function(message, options) { return showToast('warning', message, options); },
    dismiss: dismissToast,
    dismissAll: dismissAll,
    config: function(newConfig) {
      Object.assign(CONFIG, newConfig);
    }
  };

  // Backwards compatibility with existing showToast
  if (typeof window.showToast === 'function') {
    window.oldShowToast = window.showToast;
  }
  window.showToast = function(message, duration) {
    window.toast.info(message, { duration: duration });
  };
})();
