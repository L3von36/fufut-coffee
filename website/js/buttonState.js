/* ============================================================
   FU FUT COFFEE — Button State Utility
   Centralized button lifecycle: idle → loading → success/error → reset
   Apply to any button with data-btn-action attribute
   ============================================================ */

(function initButtonStates() {
  'use strict';

  const SUCCESS_DURATION = 2000; // ms to show success before reset

  // Map action names to lifecycle labels
  const LABELS = {
    save:        { loading: 'Saving...',     success: 'Saved ✓',       error: 'Save Failed' },
    submit:      { loading: 'Submitting...',  success: 'Submitted ✓',   error: 'Submit Failed' },
    send:        { loading: 'Sending...',     success: 'Sent ✓',       error: 'Send Failed' },
    upload:      { loading: 'Uploading...',   success: 'Uploaded ✓',   error: 'Upload Failed' },
    download:    { loading: 'Downloading...', success: 'Downloaded ✓', error: 'Download Failed' },
    delete:      { loading: 'Deleting...',    success: 'Deleted ✓',    error: 'Delete Failed' },
    update:      { loading: 'Updating...',    success: 'Updated ✓',    error: 'Update Failed' },
    create:      { loading: 'Creating...',    success: 'Created ✓',    error: 'Create Failed' },
    publish:     { loading: 'Publishing...',  success: 'Published ✓',  error: 'Publish Failed' },
    login:       { loading: 'Signing in...',  success: 'Signed In ✓',  error: 'Login Failed' },
    register:    { loading: 'Creating Account...', success: 'Account Created ✓', error: 'Registration Failed' },
    'reset-pw':  { loading: 'Resetting...',   success: 'Password Reset ✓', error: 'Reset Failed' },
    verify:      { loading: 'Verifying...',   success: 'Verified ✓',   error: 'Verification Failed' },
    pay:         { loading: 'Processing Payment...', success: 'Payment Successful ✓', error: 'Payment Failed' },
    checkout:    { loading: 'Processing...',  success: 'Order Placed ✓', error: 'Checkout Failed' },
    book:        { loading: 'Booking...',     success: 'Booked ✓',     error: 'Booking Failed' },
    reserve:     { loading: 'Reserving...',   success: 'Reserved ✓',   error: 'Reservation Failed' },
    invite:      { loading: 'Sending Invite...', success: 'Invitation Sent ✓', error: 'Invite Failed' },
    approve:     { loading: 'Approving...',   success: 'Approved ✓',   error: 'Approval Failed' },
    reject:      { loading: 'Rejecting...',   success: 'Rejected ✓',   error: 'Rejection Failed' },
    archive:     { loading: 'Archiving...',   success: 'Archived ✓',   error: 'Archive Failed' },
    restore:     { loading: 'Restoring...',   success: 'Restored ✓',   error: 'Restore Failed' },
    copy:        { loading: 'Copying...',     success: 'Copied ✓',     error: 'Copy Failed' },
    export:      { loading: 'Exporting...',   success: 'Exported ✓',   error: 'Export Failed' },
    import:      { loading: 'Importing...',   success: 'Imported ✓',   error: 'Import Failed' },
    sync:        { loading: 'Syncing...',     success: 'Synced ✓',     error: 'Sync Failed' },
    refresh:     { loading: 'Refreshing...',  success: 'Updated ✓',    error: 'Refresh Failed' }
  };

  // Default labels for unknown actions
  function getLabels(action) {
    return LABELS[action] || {
      loading: action ? action.charAt(0).toUpperCase() + action.slice(1) + '...' : 'Loading...',
      success: 'Done ✓',
      error: 'Try Again'
    };
  }

  // State management
  const states = new Map();

  function getState(btn) {
    if (!states.has(btn)) {
      states.set(btn, { state: 'idle', originalText: btn.textContent.trim() });
    }
    return states.get(btn);
  }

  function setLoading(btn, labels) {
    const s = getState(btn);
    s.state = 'loading';
    btn.classList.add('btn-loading');
    btn.classList.remove('btn-success-state', 'btn-error-state');
    btn.disabled = true;
    btn.setAttribute('aria-busy', 'true');
    btn.innerHTML = `<span class="btn-spinner" aria-hidden="true"></span> ${labels.loading}`;
  }

  function setSuccess(btn, labels) {
    const s = getState(btn);
    s.state = 'success';
    btn.classList.remove('btn-loading', 'btn-error-state');
    btn.classList.add('btn-success-state');
    btn.disabled = false;
    btn.setAttribute('aria-busy', 'false');
    btn.innerHTML = `<span class="btn-check" aria-hidden="true">✓</span> ${labels.success}`;
    // Auto-reset
    clearTimeout(btn._resetTimer);
    btn._resetTimer = setTimeout(function() {
      reset(btn);
    }, SUCCESS_DURATION);
  }

  function setError(btn, labels) {
    const s = getState(btn);
    s.state = 'error';
    btn.classList.remove('btn-loading', 'btn-success-state');
    btn.classList.add('btn-error-state');
    btn.disabled = false;
    btn.setAttribute('aria-busy', 'false');
    btn.innerHTML = `<span class="btn-error-icon" aria-hidden="true">!</span> ${labels.error}`;
  }

  function reset(btn) {
    const s = getState(btn);
    s.state = 'idle';
    btn.classList.remove('btn-loading', 'btn-success-state', 'btn-error-state');
    btn.disabled = false;
    btn.setAttribute('aria-busy', 'false');
    btn.innerHTML = '';
    btn.textContent = s.originalText;
  }

  // Expose a global API for programmatic use
  window.buttonState = {
    /**
     * Wrap an async function with button state transitions.
     * @param {HTMLElement} btn - The button element
     * @param {Function} asyncFn - The async function to execute
     * @param {string} [action] - Action name for labels (e.g., 'save', 'delete')
     * @param {object} [customLabels] - Custom label overrides
     */
    wrap: async function(btn, asyncFn, action, customLabels) {
      const labels = { ...getLabels(action), ...customLabels };
      setLoading(btn, labels);
      try {
        await asyncFn();
        setSuccess(btn, labels);
      } catch (e) {
        setError(btn, labels);
        throw e;
      }
    },

    setLoading: setLoading,
    setSuccess: setSuccess,
    setError: setError,
    reset: reset
  };

  // Auto-attach to buttons with data-btn-action
  document.addEventListener('click', function(e) {
    const btn = e.target.closest('[data-btn-action]');
    if (!btn) return;

    const action = btn.getAttribute('data-btn-action');
    const handler = btn._btnAsyncHandler;
    if (!handler) return;

    e.preventDefault();
    window.buttonState.wrap(btn, handler, action);
  });

  /**
   * Register an async handler for a button with data-btn-action.
   * @param {string|HTMLElement} selector - CSS selector or element
   * @param {Function} asyncFn - The async function to run on click
   */
  window.registerButtonAction = function(selector, asyncFn) {
    var btn = typeof selector === 'string' ? document.querySelector(selector) : selector;
    if (btn) {
      btn._btnAsyncHandler = asyncFn;
    }
  };

})();