/* ============================================================
   FU FUT COFFEE — AI Chat Widget
   Floating assistant powered by Cloudflare Workers AI.
   ============================================================ */

(function () {
  'use strict';

  var API_URL = (window.API || '') + '/api/ai-chat';
  var HISTORY_KEY = 'aiChatHistory';
  var MAX_HISTORY = 20;

  // ---------- State ----------
  var isOpen = false;
  var isLoading = false;
  var messages = loadHistory();

  // ---------- Quick suggestions ----------
  var SUGGESTIONS = [
    'What coffees do you have?',
    'Tell me about the coffee ceremony',
    'What food do you serve?',
    'Where are you located?',
  ];

  // ---------- DOM Setup ----------
  function createWidget() {
    // Bubble button
    var bubble = document.createElement('button');
    bubble.id = 'aiChatBubble';
    bubble.setAttribute('aria-label', 'Open AI assistant');
    bubble.innerHTML =
      '<svg class="ai-icon-chat" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>' +
      '<svg class="ai-icon-close" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
    bubble.addEventListener('click', toggle);
    document.body.appendChild(bubble);

    // Chat panel
    var panel = document.createElement('div');
    panel.id = 'aiChatPanel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'Fu Fut Coffee AI assistant');
    panel.innerHTML =
      '<div class="ai-chat-header">' +
        '<div class="ai-chat-header-icon">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2C6.48 2 2 6 2 11c0 2.76 1.36 5.22 3.48 6.88L4 22l4.86-2.42C9.84 19.85 10.88 20 12 20c5.52 0 10-4 10-9s-4.48-9-10-9z"/></svg>' +
        '</div>' +
        '<div class="ai-chat-header-text">' +
          '<h4>Fu Fut Assistant</h4>' +
          '<span>Powered by AI &middot; Ask about our coffee & menu</span>' +
        '</div>' +
      '</div>' +
      '<div class="ai-chat-messages" id="aiChatMessages"></div>' +
      '<div class="ai-suggestions" id="aiChatSuggestions"></div>' +
      '<div class="ai-chat-input">' +
        '<input type="text" id="aiChatInput" placeholder="Ask about our coffee..." autocomplete="off" />' +
        '<button class="ai-chat-send" id="aiChatSend" aria-label="Send message">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>' +
        '</button>' +
      '</div>' +
      '<div class="ai-chat-footer">Fu Fut Coffee &middot; ፉ ፉት ኮፊ &middot; AI may not always be accurate</div>';
    document.body.appendChild(panel);

    // Bind events
    var input = document.getElementById('aiChatInput');
    var sendBtn = document.getElementById('aiChatSend');
    sendBtn.addEventListener('click', sendMessage);
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });

    // Close on Escape
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && isOpen) toggle();
    });

    // Render existing messages
    renderMessages();
    renderSuggestions();
  }

  // ---------- Toggle ----------
  function toggle() {
    isOpen = !isOpen;
    var panel = document.getElementById('aiChatPanel');
    var bubble = document.getElementById('aiChatBubble');
    panel.classList.toggle('open', isOpen);
    bubble.classList.toggle('active', isOpen);
    bubble.setAttribute('aria-label', isOpen ? 'Close AI assistant' : 'Open AI assistant');

    if (isOpen) {
      var input = document.getElementById('aiChatInput');
      setTimeout(function () { input.focus(); }, 300);

      // Show welcome if no messages
      if (messages.length === 0) {
        addBotMessage('Welcome to Fu Fut Coffee! I can help you learn about our Ethiopian coffee, menu, and café. What would you like to know?');
      }
    }
  }

  // ---------- Render ----------
  function renderMessages() {
    var container = document.getElementById('aiChatMessages');
    container.innerHTML = '';
    messages.forEach(function (msg) {
      appendMessageDOM(msg.role, msg.content, false);
    });
    if (messages.length) scrollBottom();
  }

  function renderSuggestions() {
    var container = document.getElementById('aiChatSuggestions');
    // Only show suggestions if fewer than 2 user messages (i.e., conversation is new)
    if (messages.filter(function (m) { return m.role === 'user'; }).length >= 2) {
      container.innerHTML = '';
      return;
    }
    container.innerHTML = SUGGESTIONS
      .map(function (s) {
        return '<button class="ai-suggestion-btn">' + escapeHtml(s) + '</button>';
      })
      .join('');
    container.querySelectorAll('.ai-suggestion-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        document.getElementById('aiChatInput').value = this.textContent;
        sendMessage();
      });
    });
  }

  function appendMessageDOM(role, content, animate) {
    var container = document.getElementById('aiChatMessages');
    var div = document.createElement('div');
    div.className = 'ai-msg ai-msg--' + (role === 'user' ? 'user' : 'bot');
    if (!animate) div.style.animation = 'none';

    var bubble = document.createElement('div');
    bubble.className = 'ai-msg-bubble';
    bubble.textContent = content;

    var time = document.createElement('div');
    time.className = 'ai-msg-time';
    time.textContent = formatTime(new Date());

    div.appendChild(bubble);
    div.appendChild(time);
    container.appendChild(div);
  }

  function showTyping() {
    var container = document.getElementById('aiChatMessages');
    var div = document.createElement('div');
    div.className = 'ai-msg ai-msg--bot';
    div.id = 'aiTypingIndicator';
    div.innerHTML = '<div class="ai-typing"><span></span><span></span><span></span></div>';
    container.appendChild(div);
    scrollBottom();
  }

  function hideTyping() {
    var el = document.getElementById('aiTypingIndicator');
    if (el) el.remove();
  }

  function showError(msg) {
    var container = document.getElementById('aiChatMessages');
    var div = document.createElement('div');
    div.className = 'ai-msg ai-msg--bot';
    var bubble = document.createElement('div');
    bubble.className = 'ai-msg-bubble ai-msg-error';
    bubble.textContent = msg || 'Something went wrong. Please try again.';
    div.appendChild(bubble);
    container.appendChild(div);
    scrollBottom();
  }

  // ---------- Send ----------
  function sendMessage() {
    if (isLoading) return;
    var input = document.getElementById('aiChatInput');
    var text = input.value.trim();
    if (!text) return;

    input.value = '';
    addUserMessage(text);
    renderSuggestions(); // hide suggestions after first real message
    callAI(text);
  }

  function addUserMessage(text) {
    messages.push({ role: 'user', content: text });
    trimHistory();
    saveHistory();
    appendMessageDOM('user', text, true);
    scrollBottom();
  }

  function addBotMessage(text) {
    messages.push({ role: 'assistant', content: text });
    trimHistory();
    saveHistory();
    appendMessageDOM('assistant', text, true);
    scrollBottom();
  }

  // ---------- API Call ----------
  function callAI(userText) {
    isLoading = true;
    updateSendButton();
    showTyping();

    // Build history for context (exclude system, last 10 exchanges)
    var history = messages.slice(-10);

    fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: userText, history: history }),
    })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        hideTyping();
        if (data.ok && data.reply) {
          addBotMessage(data.reply);
        } else if (data.error === 'AI_SERVICE_NOT_CONFIGURED') {
          showError('The AI assistant is almost ready! It just needs Workers AI to be enabled in the Cloudflare Dashboard. Ask the site admin to enable it (one-click under Settings > Functions > AI).');
        } else {
          showError(data.error || 'Could not get a response. Please try again.');
        }
      })
      .catch(function () {
        hideTyping();
        showError('Connection issue. Please check your internet and try again.');
      })
      .finally(function () {
        isLoading = false;
        updateSendButton();
        document.getElementById('aiChatInput').focus();
      });
  }

  function updateSendButton() {
    var btn = document.getElementById('aiChatSend');
    btn.disabled = isLoading;
  }

  // ---------- Helpers ----------
  function scrollBottom() {
    var c = document.getElementById('aiChatMessages');
    if (c) c.scrollTop = c.scrollHeight;
  }

  function formatTime(d) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function escapeHtml(s) {
    var el = document.createElement('span');
    el.textContent = s;
    return el.innerHTML;
  }

  // ---------- Persistence ----------
  function loadHistory() {
    try {
      var raw = localStorage.getItem(HISTORY_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function saveHistory() {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(messages.slice(-MAX_HISTORY)));
    } catch (e) { /* storage full or unavailable */ }
  }

  function trimHistory() {
    if (messages.length > MAX_HISTORY) {
      messages = messages.slice(-MAX_HISTORY);
    }
  }

  // ---------- Init ----------
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createWidget);
  } else {
    createWidget();
  }
})();
