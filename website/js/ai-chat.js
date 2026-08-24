/* ============================================================
   FU FUT COFFEE — AI Chat Widget + In-Chat Ordering
   Floating assistant powered by Cloudflare Workers AI.
   Includes horizontal scrollable menu with images & real cart.
   ============================================================ */

(function () {
  'use strict';

  var API_URL = (window.API || '') + '/api/ai-chat';
  var MENU_API = (window.API || '') + '/api/menus';
  var ORDER_API = (window.API || '') + '/api/orders';
  var CART_KEY = 'fufutChatCart';

  // ---------- State ----------
  var isOpen = false;
  var isLoading = false;
  var messages = [];
  var cart = loadCart();
  var menuData = null;
  var menuLoaded = false;
  var activeCategory = null;
  var chatLang = 'english';
  var unreadCount = 0;
  var autoWelcomed = false;

  // ---------- Order intent keywords ----------
  var ORDER_KEYWORDS = /\b(order|menu|food|coffee|drink|breakfast|lunch|dinner|eat|hungry|want\s+to\s+order|show\s+menu|what\s+do\s+you\s+have|i\s+want|get\s+me|can\s+i\s+(have|get)|ይህን|ልክልኝ|ምን\s+አለዎት|ማዘዣ)\b/i;

  // ---------- Suggestions ----------
  var SUGGESTIONS = [
    '\u2615 What coffees do you have?',
    '\uD83C\uDF3F Coffee ceremony',
    '\uD83C\uDF7D View menu & order',
    '\uD83D\uDCCD Your location',
  ];

  // ---------- DOM Setup ----------
  function createWidget() {
    // Backdrop overlay
    var backdrop = document.createElement('div');
    backdrop.id = 'aiChatBackdrop';
    backdrop.addEventListener('click', toggle);
    document.body.appendChild(backdrop);

    // Bubble (with cart badge)
    var bubble = document.createElement('button');
    bubble.id = 'aiChatBubble';
    bubble.setAttribute('aria-label', 'Open AI assistant');
    bubble.setAttribute('aria-expanded', 'false');
    bubble.innerHTML =
      '<svg class="ai-icon-chat" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>' +
      '<svg class="ai-icon-close" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
      '<span class="ai-cart-badge" id="aiCartBadge" style="display:none">0</span>' +
      '<span class="ai-unread-badge" id="aiUnreadBadge" style="display:none"></span>';
    bubble.addEventListener('click', function (e) { e.stopPropagation(); toggle(); });
    document.body.appendChild(bubble);

    // Panel
    var panel = document.createElement('div');
    panel.id = 'aiChatPanel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'Fu Fut Coffee AI assistant');
    panel.addEventListener('click', function (e) { e.stopPropagation(); });
    panel.innerHTML =
      '<div class="ai-chat-header">' +
        '<div class="ai-chat-header-icon">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1" stroke-width="1.8"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" stroke-width="1.8"/><line x1="6" y1="1" x2="6" y2="4" stroke-width="1.8"/><line x1="10" y1="1" x2="10" y2="4" stroke-width="1.8"/><line x1="14" y1="1" x2="14" y2="4" stroke-width="1.8"/></svg>' +
        '</div>' +
        '<div class="ai-chat-header-text">' +
          '<h4>Fu Fut Assistant</h4>' +
          '<div class="ai-chat-header-sub">' +
            '<span class="ai-status-dot"></span>' +
            '<span>Online &middot; Ask about our coffee & menu</span>' +
          '</div>' +
        '</div>' +
        '<button class="ai-lang-toggle" id="aiLangToggle" aria-label="Switch language">EN</button>' +
        '<button class="ai-chat-header-close" id="aiChatHeaderClose" aria-label="Close chat">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
        '</button>' +
      '</div>' +
      '<div class="ai-chat-messages" id="aiChatMessages" role="log" aria-live="polite" aria-relevant="additions text"></div>' +
      '<div class="ai-suggestions" id="aiChatSuggestions"></div>' +
      '<div class="ai-menu-carousel" id="aiMenuCarousel" style="display:none">' +
        '<div class="ai-menu-carousel-header">' +
          '<span class="ai-menu-carousel-title" id="aiMenuCarouselTitle">Menu</span>' +
          '<div class="ai-menu-cats" id="aiMenuCats"></div>' +
          '<button class="ai-menu-carousel-close" id="aiMenuCarouselClose" aria-label="Close menu">\u2715</button>' +
        '</div>' +
        '<div class="ai-menu-scroll" id="aiMenuScroll"></div>' +
      '</div>' +
      '<div class="ai-cart-bar" id="aiCartBar" style="display:none">' +
        '<div class="ai-cart-bar-top">' +
          '<div class="ai-cart-bar-info">' +
            '<span class="ai-cart-bar-count" id="aiCartBarCount">0 items</span>' +
            '<span class="ai-cart-bar-total" id="aiCartBarTotal">ETB 0</span>' +
          '</div>' +
          '<button class="ai-cart-bar-btn ai-cart-view" id="aiCartView">View Cart</button>' +
        '</div>' +
        '<div class="ai-cart-bar-items" id="aiCartBarItems"></div>' +
        '<div class="ai-cart-bar-actions">' +
          '<button class="ai-cart-bar-btn ai-cart-clear" id="aiCartClear">Clear</button>' +
          '<button class="ai-cart-bar-btn ai-cart-order" id="aiCartOrder">Place Order</button>' +
        '</div>' +
      '</div>' +
      '<div class="ai-chat-bottom-bar">' +
        '<button class="ai-chat-close-btn" id="aiChatCloseBtn" aria-label="Close chat">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
          '<span>Close</span>' +
        '</button>' +
      '</div>' +
      '<div class="ai-chat-input">' +
        '<input type="text" id="aiChatInput" placeholder="Ask about our coffee..." autocomplete="off" aria-label="Type your question" />' +
        '<button class="ai-chat-send" id="aiChatSend" aria-label="Send message" disabled>' +
          '<span class="ai-send-spinner"></span>' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>' +
        '</button>' +
      '</div>';
    document.body.appendChild(panel);

    // Events
    var input = document.getElementById('aiChatInput');
    var sendBtn = document.getElementById('aiChatSend');
    sendBtn.addEventListener('click', sendMessage);
    document.getElementById('aiChatCloseBtn').addEventListener('click', function (e) { e.stopPropagation(); toggle(); });
    document.getElementById('aiChatHeaderClose').addEventListener('click', function (e) { e.stopPropagation(); toggle(); });
    document.getElementById('aiLangToggle').addEventListener('click', toggleLang);
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });
    input.addEventListener('input', updateSendButton);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        toggle();
      }
      if (e.key === 'Tab') trapFocus(e);
    });

    // Scroll shadow on messages
    var msgs = document.getElementById('aiChatMessages');
    msgs.addEventListener('scroll', function () {
      msgs.classList.toggle('scrolled', msgs.scrollTop > 6);
    });

    document.getElementById('aiCartOrder').addEventListener('click', placeOrder);
    document.getElementById('aiCartClear').addEventListener('click', clearCart);
    document.getElementById('aiCartView').addEventListener('click', showCartSummary);
    document.getElementById('aiMenuCarouselClose').addEventListener('click', function () {
      document.getElementById('aiMenuCarousel').style.display = 'none';
      scrollBottom();
    });

    renderMessages();
    renderSuggestions();
    updateCartUI();
  }

  // ---------- Toggle ----------
  function toggle() {
    isOpen = !isOpen;
    var panel = document.getElementById('aiChatPanel');
    var bubble = document.getElementById('aiChatBubble');
    var backdrop = document.getElementById('aiChatBackdrop');
    panel.classList.toggle('open', isOpen);
    bubble.classList.toggle('active', isOpen);
    backdrop.classList.toggle('visible', isOpen);
    bubble.setAttribute('aria-label', isOpen ? 'Close AI assistant' : 'Open AI assistant');
    bubble.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    document.body.style.overflow = isOpen ? 'hidden' : '';

    if (isOpen) {
      hideTooltip();
      if (unreadCount > 0) {
        unreadCount = 0;
        renderUnread();
      }
      setTimeout(function () {
        document.getElementById('aiChatInput').focus();
      }, 350);
      if (messages.length === 0) {
        addBotMessage('Welcome to Fu Fut Coffee! I\u2019m here to help you explore our Ethiopian coffee, traditional dishes, and caf\u00e9 experience. You can also order right here! What would you like to know?');
      }
    } else {
      setTimeout(function () {
        if (!isOpen) bubble.focus();
      }, 50);
      scheduleTooltip();
    }
  }

  // ---------- Toggle Language ----------
  function toggleLang() {
    chatLang = chatLang === 'english' ? 'amharic' : 'english';
    var btn = document.getElementById('aiLangToggle');
    btn.textContent = chatLang === 'english' ? 'EN' : 'አማ';
    var input = document.getElementById('aiChatInput');
    input.placeholder = chatLang === 'english' ? 'Ask about our coffee...' : 'ስለ ኮፊያችን ይጠይቁ...';
  }

  // ---------- Focus trap (keeps Tab navigation inside the panel) ----------
  function trapFocus(e) {
    if (!isOpen) return;
    var panel = document.getElementById('aiChatPanel');
    if (!panel || e.key !== 'Tab') return;
    var focusables = Array.prototype.filter.call(
      panel.querySelectorAll('button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'),
      function (el) { return el.offsetParent !== null; }
    );
    if (!focusables.length) return;
    var first = focusables[0];
    var last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  // ---------- FAB teaser tooltip ----------
  var tooltipTimer = null;

  function showTooltip() {
    hideTooltip();
    if (isOpen) return;
    var tt = document.createElement('button');
    tt.id = 'aiChatTooltip';
    tt.className = 'ai-chat-tooltip';
    tt.setAttribute('aria-label', 'Open AI assistant');
    tt.innerHTML =
      '<span class="ai-chat-tooltip-wave" aria-hidden="true">\u2615</span>' +
      '<span class="ai-chat-tooltip-text">' + (chatLang === 'amharic' ? 'ስለ ቡናዎችን ይጠይቁ' : 'Hi! Ask about our coffee') + '</span>';
    tt.addEventListener('click', function (e) {
      e.stopPropagation();
      toggle();
    });
    document.body.appendChild(tt);
    tooltipTimer = setTimeout(hideTooltip, 12000);
  }

  function hideTooltip() {
    if (tooltipTimer) { clearTimeout(tooltipTimer); tooltipTimer = null; }
    var tt = document.getElementById('aiChatTooltip');
    if (tt) tt.remove();
  }

  function scheduleTooltip() {
    setTimeout(function () {
      if (!isOpen) showTooltip();
    }, 1400);
  }

  // ---------- Unread badge ----------
  function renderUnread() {
    var badge = document.getElementById('aiUnreadBadge');
    if (!badge) return;
    if (unreadCount > 0 && !isOpen) {
      badge.textContent = unreadCount > 9 ? '9+' : unreadCount;
      badge.style.display = '';
    } else {
      badge.style.display = 'none';
    }
  }

  // ---------- Bot avatar + rich text ----------
  function botAvatarHTML() {
    return '<div class="ai-msg-avatar" aria-hidden="true">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>' +
    '</div>';
  }

  function formatBotText(text) {
    var esc = escapeHtml(text);
    esc = esc.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    esc = esc.replace(/\n{2,}/g, '\u0000').replace(/\n/g, '<br>').replace(/\u0000/g, '</p><p>');
    return '<p>' + esc + '</p>';
  }

  // ---------- First-visit welcome ----------
  function maybeAutoWelcome() {
    var visited = false;
    try { visited = !!localStorage.getItem('fufutChatVisited'); } catch (e) {}
    try { localStorage.setItem('fufutChatVisited', '1'); } catch (e) {}

    if (!visited) {
      // Auto-open once for brand-new visitors, after the preloader settles
      setTimeout(function () {
        if (!isOpen) toggle();
      }, 2600);
    } else {
      scheduleTooltip();
    }
  }

  // ---------- Render ----------
  function renderMessages() {
    var container = document.getElementById('aiChatMessages');
    container.innerHTML = '';
    messages.forEach(function (msg) {
      if (msg.type === 'cart-summary') {
        appendCartSummaryDOM(msg.uids, msg.readonly, false, msg.time, msg.snapshot);
      } else {
        appendMessageDOM(msg.role, msg.content, false, msg.time);
      }
    });
    if (messages.length) scrollBottom();
  }

  function renderSuggestions() {
    var container = document.getElementById('aiChatSuggestions');
    if (messages.filter(function (m) { return m.role === 'user'; }).length >= 1) {
      container.innerHTML = '';
      return;
    }
    container.innerHTML = SUGGESTIONS
      .map(function (s) {
        return '<button class="ai-suggestion-btn"><span>' + escapeHtml(s) + '</span></button>';
      })
      .join('');
    container.querySelectorAll('.ai-suggestion-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var text = this.querySelector('span').textContent;
        document.getElementById('aiChatInput').value = text;
        sendMessage();
      });
    });
  }

  function appendMessageDOM(role, content, animate, timeStr) {
    var container = document.getElementById('aiChatMessages');
    var div = document.createElement('div');
    div.className = 'ai-msg ai-msg--' + (role === 'user' ? 'user' : 'bot');
    if (!animate) div.style.animation = 'none';

    var bubble = document.createElement('div');
    var time = document.createElement('div');
    time.className = 'ai-msg-time';
    time.textContent = timeStr || formatTime(new Date());

    if (role !== 'user') {
      var copy = document.createElement('div');
      copy.className = 'ai-msg-copy';
      bubble.className = 'ai-msg-bubble';
      bubble.innerHTML = formatBotText(content);
      copy.appendChild(bubble);
      copy.appendChild(time);
      div.innerHTML = botAvatarHTML();
      div.appendChild(copy);
    } else {
      bubble.className = 'ai-msg-bubble';
      bubble.textContent = content;
      div.appendChild(bubble);
      div.appendChild(time);
    }

    container.appendChild(div);
  }

  function renderCartSummaryInto(bubble, uids, readonly, snapshot) {
    var rows = [];
    var total = 0;
    (uids || []).forEach(function (uid) {
      var item = null;
      if (snapshot) {
        for (var s = 0; s < snapshot.length; s++) {
          if (snapshot[s].uid === uid) { item = snapshot[s]; break; }
        }
      } else {
        for (var i = 0; i < cart.length; i++) {
          if (cart[i].uid === uid) { item = cart[i]; break; }
        }
      }
      if (!item) return;
      var subtotal = item.price * item.qty;
      total += subtotal;
      rows.push(
        '<div class="ai-cart-summary-item">' +
          '<div class="ai-cart-item-left">' +
            '<span class="ai-cart-item-name">' + escapeHtml(item.name) + ' <small>x' + item.qty + '</small></span>' +
            '<span class="ai-cart-item-price">ETB ' + subtotal + '</span>' +
          '</div>' +
          (readonly ? '' : '<button class="ai-cart-item-remove" data-uid="' + uid + '" aria-label="Remove ' + escapeHtml(item.name) + '">&times;</button>') +
        '</div>'
      );
    });

    if (!rows.length) {
      // Empty live-cart summary: drop the message entirely (receipts keep their snapshot)
      var msgEl = bubble.closest('.ai-msg');
      if (msgEl && !readonly) {
        var idx = -1;
        if (bubble._uids && bubble._uids.length) {
          idx = messages.findIndex(function (m) { return m.type === 'cart-summary' && m.uids && m.uids[0] === bubble._uids[0]; });
        }
        if (idx > -1) messages.splice(idx, 1);
        msgEl.remove();
      }
      return;
    }

    bubble._uids = uids;
    bubble._readonly = readonly;
    bubble._snapshot = snapshot || null;
    bubble.innerHTML =
      '<div class="ai-cart-summary-title">' + (readonly ? '\uD83E\uDDED Order Summary' : '\uD83D\uDCE6 Your Cart') + '</div>' +
      rows.join('') +
      '<div class="ai-cart-summary-total"><span>Total</span><span>ETB ' + total + '</span></div>';

    if (!readonly) {
      bubble.querySelectorAll('.ai-cart-item-remove').forEach(function (btn) {
        btn.addEventListener('click', function () {
          removeFromCart(this.getAttribute('data-uid'));
        });
      });
    }
  }

  function refreshCartSummaries() {
    document.querySelectorAll('.ai-cart-summary').forEach(function (bubble) {
      renderCartSummaryInto(bubble, bubble._uids || [], bubble._readonly, bubble._snapshot);
    });
  }

  function appendCartSummaryDOM(uids, readonly, animate, timeStr, snapshot) {
    var container = document.getElementById('aiChatMessages');
    var div = document.createElement('div');
    div.className = 'ai-msg ai-msg--bot';
    if (!animate) div.style.animation = 'none';

    var bubble = document.createElement('div');
    bubble.className = 'ai-msg-bubble ai-cart-summary';
    renderCartSummaryInto(bubble, uids, readonly, snapshot);

    var time = document.createElement('div');
    time.className = 'ai-msg-time';
    time.textContent = timeStr || formatTime(new Date());

    var copy = document.createElement('div');
    copy.className = 'ai-msg-copy';
    copy.appendChild(bubble);
    copy.appendChild(time);
    div.innerHTML = botAvatarHTML();
    div.appendChild(copy);
    container.appendChild(div);
  }

  function showTyping() {
    var container = document.getElementById('aiChatMessages');
    var div = document.createElement('div');
    div.className = 'ai-msg ai-msg--bot';
    div.id = 'aiTypingIndicator';
    div.innerHTML = botAvatarHTML() +
      '<div class="ai-msg-copy"><div class="ai-msg-bubble ai-typing"><span></span><span></span><span></span></div></div>';
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
    bubble.innerHTML = '<p>' + escapeHtml(msg || 'Something went wrong. Please try again.') + '</p>';
    var copy = document.createElement('div');
    copy.className = 'ai-msg-copy';
    copy.appendChild(bubble);
    div.innerHTML = botAvatarHTML();
    div.appendChild(copy);
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
    renderSuggestions();

    // Check if this is an order intent
    if (ORDER_KEYWORDS.test(text) && !menuLoaded) {
      showMenuCarousel();
    }

    callAI(text);
  }

  function addUserMessage(text) {
    messages.push({ role: 'user', content: text, time: formatTime(new Date()) });
    appendMessageDOM('user', text, true);
    scrollBottom();
  }

  function addBotMessage(text) {
    messages.push({ role: 'assistant', content: text, time: formatTime(new Date()) });
    appendMessageDOM('assistant', text, true);
    if (!isOpen) {
      unreadCount++;
      renderUnread();
    }
    scrollBottom();
  }

  // ---------- Menu Carousel ----------
  function showMenuCarousel(categoryName) {
    var carousel = document.getElementById('aiMenuCarousel');
    carousel.style.display = '';

    if (menuLoaded) {
      if (categoryName) switchCategory(categoryName);
      scrollBottom();
      return;
    }

    // Show loading skeleton
    var scroll = document.getElementById('aiMenuScroll');
    var skeleton = '<div class="ai-menu-card-skeleton"><div class="ai-menu-card-skeleton-img"></div><div class="ai-menu-card-skeleton-text"></div><div class="ai-menu-card-skeleton-text short"></div></div>';
    scroll.innerHTML = skeleton + skeleton + skeleton + skeleton;

    fetch(MENU_API)
      .then(function (r) { return r.json(); })
      .then(function (data) {
        menuData = data;
        menuLoaded = true;
        renderCategoryTabs();
        renderMenuItems(categoryName || (data.categories[0] && data.categories[0].name));
        scrollBottom();
      })
      .catch(function () {
        scroll.innerHTML =
          '<div class="ai-menu-error">Could not load the menu. Please check your connection.</div>' +
          '<button class="ai-menu-retry" id="aiMenuRetry" type="button">\u21bb Try again</button>';
        var retry = document.getElementById('aiMenuRetry');
        if (retry) retry.addEventListener('click', function () { showMenuCarousel(activeCategory); });
        scrollBottom();
      });
  }

  function renderCategoryTabs() {
    var container = document.getElementById('aiMenuCats');
    if (!menuData || !menuData.categories) return;
    container.innerHTML = '';
    menuData.categories.forEach(function (cat) {
      if (!cat.items || cat.items.length === 0) return;
      var btn = document.createElement('button');
      btn.className = 'ai-menu-cat-btn' + (activeCategory === cat.name ? ' active' : '');
      btn.textContent = cat.name;
      btn.addEventListener('click', function () { switchCategory(cat.name); });
      container.appendChild(btn);
    });
  }

  function switchCategory(catName) {
    activeCategory = catName;
    // Update tab styles
    var tabs = document.querySelectorAll('.ai-menu-cat-btn');
    tabs.forEach(function (t) {
      t.classList.toggle('active', t.textContent === catName);
    });
    document.getElementById('aiMenuCarouselTitle').textContent = catName;
    renderMenuItems(catName);
  }

  function renderMenuItems(catName) {
    var scroll = document.getElementById('aiMenuScroll');
    scroll.innerHTML = '';
    var cat = null;
    if (menuData && menuData.categories) {
      cat = menuData.categories.find(function (c) { return c.name === catName; });
    }
    if (!cat || !cat.items || cat.items.length === 0) {
      scroll.innerHTML = '<div class="ai-menu-empty">No items in this category.</div>';
      return;
    }

    cat.items.forEach(function (item) {
      if (!item.available) return;
      var card = document.createElement('div');
      card.className = 'ai-menu-card';

      var imgDiv = document.createElement('div');
      imgDiv.className = 'ai-menu-card-img';
      if (item.image) {
        imgDiv.style.backgroundImage = 'url(' + item.image + ')';
      } else {
        imgDiv.classList.add('no-img');
        imgDiv.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>';
      }

      var info = document.createElement('div');
      info.className = 'ai-menu-card-info';
      var desc = item.description ? (item.description.length > 60 ? item.description.slice(0, 60) + '\u2026' : item.description) : '';
      info.innerHTML =
        '<div class="ai-menu-card-name">' + escapeHtml(item.name) + '</div>' +
        (desc ? '<div class="ai-menu-card-desc">' + escapeHtml(desc) + '</div>' : '') +
        '<div class="ai-menu-card-bottom">' +
          '<span class="ai-menu-card-price">ETB ' + item.price + '</span>' +
          '<button class="ai-menu-card-add" aria-label="Add ' + escapeHtml(item.name) + ' to cart">+</button>' +
        '</div>';

      card.appendChild(imgDiv);
      card.appendChild(info);

      card.querySelector('.ai-menu-card-add').addEventListener('click', function (e) {
        e.stopPropagation();
        addToCart(item, this);
      });

      scroll.appendChild(card);
    });

    scrollBottom();
  }

  // ---------- Cart ----------
  function removeFromCart(uid) {
    var idx = -1;
    for (var i = 0; i < cart.length; i++) {
      if (cart[i].uid === uid) { idx = i; break; }
    }
    if (idx > -1) {
      cart.splice(idx, 1);
      saveCart();
      updateCartUI();
      refreshCartSummaries();
      scrollBottom();
    }
  }

  function clearCart() {
    cart = [];
    saveCart();
    updateCartUI();
    refreshCartSummaries();
  }

  // Undo timer for last added item
  var undoTimer = null;
  var undoItem = null;

  function showUndoToast(item) {
    hideUndoToast();
    undoItem = item;
    var toast = document.createElement('div');
    toast.id = 'aiUndoToast';
    toast.className = 'ai-undo-toast';
    toast.innerHTML = '<span class="ai-undo-text">Added ' + escapeHtml(item.name) + '</span>' +
      '<button class="ai-undo-btn" id="aiUndoBtn">Undo</button>';
    // Sit above the cart bar when it is visible so nothing gets covered
    var bar = document.getElementById('aiCartBar');
    var barH = bar && bar.style.display !== 'none' ? bar.offsetHeight : 0;
    toast.style.bottom = (80 + barH) + 'px';
    document.getElementById('aiChatPanel').appendChild(toast);
    document.getElementById('aiUndoBtn').addEventListener('click', function () {
      undoLastAdd();
    });
    // Auto-dismiss after 4 seconds
    undoTimer = setTimeout(hideUndoToast, 4000);
  }

  function hideUndoToast() {
    if (undoTimer) { clearTimeout(undoTimer); undoTimer = null; }
    var toast = document.getElementById('aiUndoToast');
    if (toast) toast.remove();
    undoItem = null;
  }

  function undoLastAdd() {
    if (!undoItem) return;
    // Find and remove the last occurrence of this item
    for (var i = cart.length - 1; i >= 0; i--) {
      if (cart[i].id === undoItem.id) {
        if (cart[i].qty > 1) {
          cart[i].qty--;
        } else {
          cart.splice(i, 1);
        }
        break;
      }
    }
    saveCart();
    updateCartUI();
    refreshCartSummaries();
    hideUndoToast();
  }

  function addToCart(item, addBtnEl) {
    var existing = cart.find(function (c) { return c.id === item.id; });
    if (existing) {
      existing.qty++;
    } else {
      cart.push({ uid: item.id + '-' + Date.now(), id: item.id, name: item.name, price: item.price, image: item.image || '', qty: 1 });
    }
    saveCart();
    updateCartUI();
    refreshCartSummaries();
    showUndoToast(item);

    // Flash the add button
    var btn = addBtnEl || null;
    if (btn) {
      btn.textContent = '\u2713';
      btn.classList.add('added');
      setTimeout(function () { btn.textContent = '+'; btn.classList.remove('added'); }, 800);
    }
  }

  function showCartSummary() {
    if (cart.length === 0) {
      showError('Your cart is empty. Browse the menu above to add items!');
      return;
    }
    var uids = cart.map(function (c) { return c.uid; });
    messages.push({ type: 'cart-summary', uids: uids, readonly: false, time: formatTime(new Date()) });
    appendCartSummaryDOM(uids, false, true);
    scrollBottom();
  }

  function placeOrder() {
    if (cart.length === 0) {
      showError('Your cart is empty!');
      return;
    }

    // Calculate total before clearing
    var total = cart.reduce(function (s, c) { return s + c.price * c.qty; }, 0);
    var totalUnits = cart.reduce(function (s, c) { return s + c.qty; }, 0);
    var itemNames = cart.map(function (c) { return c.name; }).join(', ');
    var orderUids = cart.map(function (c) { return c.uid; });
    // Snapshot for the immutable receipt (cart is cleared after ordering)
    var receiptSnapshot = cart.map(function (c) { return { uid: c.uid, name: c.name, price: c.price, qty: c.qty }; });

    // Build items array with name and price — the backend needs these
    var orderItems = cart.map(function (c) {
      return {
        menu_item_id: c.id,
        name: c.name,
        price: c.price,
        qty: c.qty
      };
    });

    var body = {
      items: orderItems,
      total: total,
      status: 'new'
    };

    // If there's a table context, include it
    if (window.fufutTable) {
      body.table_key = window.fufutTable.key;
    }

    isLoading = true;
    updateSendButton();
    showTyping();

    fetch(ORDER_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
      .then(function (r) {
        if (!r.ok) throw new Error('Server error ' + r.status);
        return r.json();
      })
      .then(function (data) {
        hideTyping();
        if (data.ok) {
          var orderId = data.id || 'placed';
          // Clear cart and update UI FIRST (hides cart bar, frees space)
          cart = [];
          saveCart();
          updateCartUI();
          // Now add confirmation messages into the freed-up space
          addBotMessage('Order ' + orderId + ' placed! ' + String.fromCodePoint(0x1F389) + ' ' +
            totalUnits + ' item' + (totalUnits > 1 ? 's' : '') + ' (' + itemNames + ') totaling ETB ' + total +
            '. Your order is on its way — great choice!');
          messages.push({ type: 'cart-summary', uids: orderUids, readonly: true, snapshot: receiptSnapshot, time: formatTime(new Date()) });
          appendCartSummaryDOM(orderUids, true, true, null, receiptSnapshot);
          // Scroll after layout reflows (cart bar is now hidden)
          setTimeout(function () { scrollBottom(); }, 50);
        } else {
          showError(data.error || 'Could not place order. Please try again or order at the counter.');
        }
      })
      .catch(function (err) {
        hideTyping();
        showError('Could not place order: ' + (err.message || 'Connection issue. Try ordering at the counter.'));
      })
      .finally(function () {
        isLoading = false;
        updateSendButton();
        if (isOpen) document.getElementById('aiChatInput').focus();
      });
  }

  function updateCartUI() {
    var totalItems = cart.reduce(function (s, c) { return s + c.qty; }, 0);
    var totalPrice = cart.reduce(function (s, c) { return s + c.price * c.qty; }, 0);

    // Bubble badge
    var badge = document.getElementById('aiCartBadge');
    if (badge) {
      badge.textContent = totalItems;
      badge.style.display = totalItems > 0 ? '' : 'none';
    }

    // Cart bar
    var bar = document.getElementById('aiCartBar');
    if (bar) {
      bar.style.display = totalItems > 0 ? '' : 'none';
    }
    var countEl = document.getElementById('aiCartBarCount');
    if (countEl) countEl.textContent = totalItems + ' item' + (totalItems !== 1 ? 's' : '');
    var totalEl = document.getElementById('aiCartBarTotal');
    if (totalEl) totalEl.textContent = 'ETB ' + totalPrice;

    // Render item chips with remove buttons in the cart bar
    var itemsEl = document.getElementById('aiCartBarItems');
    if (itemsEl) {
      if (cart.length === 0) {
        itemsEl.innerHTML = '';
        itemsEl.style.display = 'none';
      } else {
        itemsEl.style.display = '';
        var html = '';
        cart.forEach(function (item) {
          html += '<div class="ai-cart-chip">' +
            '<span class="ai-cart-chip-name">' + escapeHtml(item.name) + (item.qty > 1 ? ' x' + item.qty : '') + '</span>' +
            '<button class="ai-cart-chip-remove" data-uid="' + item.uid + '" aria-label="Remove ' + escapeHtml(item.name) + '">&times;</button>' +
          '</div>';
        });
        itemsEl.innerHTML = html;
        // Attach remove events
        itemsEl.querySelectorAll('.ai-cart-chip-remove').forEach(function (btn) {
          btn.addEventListener('click', function () {
            removeFromCart(this.getAttribute('data-uid'));
          });
        });
      }
    }
  }

  // ---------- API ----------
  function callAI(userText) {
    isLoading = true;
    updateSendButton();
    showTyping();
    // Exclude the current user message (backend appends it separately)
    var history = messages.filter(function (m) { return m.role; }).slice(0, -1).slice(-10);
    fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: userText, history: history, lang: chatLang }),
    })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        hideTyping();
        if (data.ok && data.reply) {
          // If the reply suggests ordering, show the menu
          if (ORDER_KEYWORDS.test(data.reply) && !menuLoaded) {
            showMenuCarousel();
          }
          addBotMessage(data.reply);
        } else if (data.error === 'AI_SERVICE_NOT_CONFIGURED') {
          showError('Almost ready! The AI binding needs to be enabled in the Cloudflare Dashboard (one-click under Settings > Functions > AI).');
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
        if (isOpen) document.getElementById('aiChatInput').focus();
      });
  }

  function updateSendButton() {
    var btn = document.getElementById('aiChatSend');
    if (!btn) return;
    var input = document.getElementById('aiChatInput');
    var empty = !input || !input.value.trim();
    btn.disabled = isLoading || empty;
    btn.classList.toggle('loading', isLoading);
    btn.setAttribute('aria-label', isLoading ? 'Sending' : 'Send message');
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

  // ---------- Cart persistence (survives refresh) ----------
  function loadCart() {
    try {
      var r = localStorage.getItem(CART_KEY);
      var c = r ? JSON.parse(r) : [];
      // Migrate legacy items missing uid
      c.forEach(function (item) {
        if (!item.uid) item.uid = item.id + '-legacy-' + Math.random().toString(36).slice(2, 8);
      });
      return c;
    }
    catch (e) { return []; }
  }
  function saveCart() {
    try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); }
    catch (e) { /* full */ }
  }

  // ---------- Init ----------
  function init() {
    createWidget();
    renderUnread();
    maybeAutoWelcome();

    // Public API — lets the landing page open the assistant from any CTA
    window.FuFutChat = {
      open: function () { if (!isOpen) toggle(); },
      close: function () { if (isOpen) toggle(); },
      toggle: toggle,
      isOpen: function () { return isOpen; },
    };
    window.fufutOpenChat = window.FuFutChat.open;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
