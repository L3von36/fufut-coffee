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

  // ---------- Order intent keywords ----------
  var ORDER_KEYWORDS = /\b(order|menu|food|coffee|drink|breakfast|lunch|dinner|eat|hungry|want\s+to\s+order|show\s+menu|what\s+do\s+you\s+have|i\s+want|get\s+me|can\s+i\s+(have|get)|ይህን|ልክልኝ|ምን\s+አለዎት|ማዘዣ)\b/i;

  // ---------- Suggestions ----------
  var SUGGESTIONS = [
    '\u2615 What coffees do you have?',
    '\uD83C\uDF3F Coffee ceremony',
    '\uD83C\uDF7D \uD83D\uDEB2 View menu & order',
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
    bubble.innerHTML =
      '<svg class="ai-icon-chat" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>' +
      '<svg class="ai-icon-close" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
      '<span class="ai-cart-badge" id="aiCartBadge" style="display:none">0</span>';
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
        '<button class="ai-chat-header-close" id="aiChatHeaderClose" aria-label="Close">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
        '</button>' +
      '</div>' +
      '<div class="ai-chat-messages" id="aiChatMessages"></div>' +
      '<div class="ai-suggestions" id="aiChatSuggestions"></div>' +
      '<div class="ai-menu-carousel" id="aiMenuCarousel" style="display:none">' +
        '<div class="ai-menu-carousel-header">' +
          '<span class="ai-menu-carousel-title" id="aiMenuCarouselTitle">Menu</span>' +
          '<div class="ai-menu-cats" id="aiMenuCats"></div>' +
        '</div>' +
        '<div class="ai-menu-scroll" id="aiMenuScroll"></div>' +
      '</div>' +
      '<div class="ai-cart-bar" id="aiCartBar" style="display:none">' +
        '<div class="ai-cart-bar-info">' +
          '<span class="ai-cart-bar-count" id="aiCartBarCount">0 items</span>' +
          '<span class="ai-cart-bar-total" id="aiCartBarTotal">ETB 0</span>' +
        '</div>' +
        '<div class="ai-cart-bar-actions">' +
          '<button class="ai-cart-bar-btn ai-cart-view" id="aiCartView">View Cart</button>' +
          '<button class="ai-cart-bar-btn ai-cart-order" id="aiCartOrder">Place Order</button>' +
        '</div>' +
      '</div>' +
      '<div class="ai-chat-input">' +
        '<input type="text" id="aiChatInput" placeholder="Ask about our coffee..." autocomplete="off" />' +
        '<button class="ai-chat-send" id="aiChatSend" aria-label="Send message">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>' +
        '</button>' +
      '</div>' +
      '<div class="ai-chat-footer">Fu Fut Coffee &middot; \u1353 \u12D3 \u130B \u12AE &middot; AI responses may not always be accurate</div>';
    document.body.appendChild(panel);

    // Events
    var input = document.getElementById('aiChatInput');
    var sendBtn = document.getElementById('aiChatSend');
    var headerClose = document.getElementById('aiChatHeaderClose');
    sendBtn.addEventListener('click', sendMessage);
    headerClose.addEventListener('click', function (e) { e.stopPropagation(); toggle(); });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && isOpen) toggle();
    });

    document.getElementById('aiCartView').addEventListener('click', showCartSummary);
    document.getElementById('aiCartOrder').addEventListener('click', placeOrder);

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
    document.body.style.overflow = isOpen ? 'hidden' : '';

    if (isOpen) {
      setTimeout(function () {
        document.getElementById('aiChatInput').focus();
      }, 350);
      if (messages.length === 0) {
        addBotMessage('Welcome to Fu Fut Coffee! I\u2019m here to help you explore our Ethiopian coffee, traditional dishes, and caf\u00e9 experience. You can also order right here! What would you like to know?');
      }
    }
  }

  // ---------- Render ----------
  function renderMessages() {
    var container = document.getElementById('aiChatMessages');
    container.innerHTML = '';
    messages.forEach(function (msg) {
      if (msg.type === 'cart-summary') {
        appendCartSummaryDOM(msg.content, false);
      } else {
        appendMessageDOM(msg.role, msg.content, false);
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

  function appendCartSummaryDOM(cartItems, animate) {
    var container = document.getElementById('aiChatMessages');
    var div = document.createElement('div');
    div.className = 'ai-msg ai-msg--bot';
    if (!animate) div.style.animation = 'none';

    var bubble = document.createElement('div');
    bubble.className = 'ai-msg-bubble ai-cart-summary';

    var total = 0;
    var html = '<div class="ai-cart-summary-title">\uD83D\uDCE6 Your Cart</div>';
    cartItems.forEach(function (item) {
      var subtotal = item.price * item.qty;
      total += subtotal;
      html += '<div class="ai-cart-summary-item">' +
        '<span class="ai-cart-item-name">' + escapeHtml(item.name) + ' <small>x' + item.qty + '</small></span>' +
        '<span class="ai-cart-item-price">ETB ' + subtotal + '</span>' +
      '</div>';
    });
    html += '<div class="ai-cart-summary-total"><span>Total</span><span>ETB ' + total + '</span></div>';
    bubble.innerHTML = html;

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
    div.innerHTML = '<div class="ai-msg-bubble ai-typing"><span></span><span></span><span></span></div>';
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
    renderSuggestions();

    // Check if this is an order intent
    if (ORDER_KEYWORDS.test(text) && !menuLoaded) {
      showMenuCarousel();
    }

    callAI(text);
  }

  function addUserMessage(text) {
    messages.push({ role: 'user', content: text });
    appendMessageDOM('user', text, true);
    scrollBottom();
  }

  function addBotMessage(text) {
    messages.push({ role: 'assistant', content: text });
    appendMessageDOM('assistant', text, true);
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
    scroll.innerHTML = Array(4).join('<div class="ai-menu-card-skeleton"><div class="ai-menu-card-skeleton-img"></div><div class="ai-menu-card-skeleton-text"></div><div class="ai-menu-card-skeleton-text short"></div></div>');

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
        scroll.innerHTML = '<div class="ai-menu-error">Could not load menu. Please try again.</div>';
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
      info.innerHTML =
        '<div class="ai-menu-card-name">' + escapeHtml(item.name) + '</div>' +
        (item.description ? '<div class="ai-menu-card-desc">' + escapeHtml(item.description).slice(0, 50) + '</div>' : '') +
        '<div class="ai-menu-card-bottom">' +
          '<span class="ai-menu-card-price">ETB ' + item.price + '</span>' +
          '<button class="ai-menu-card-add" aria-label="Add ' + escapeHtml(item.name) + ' to cart">+</button>' +
        '</div>';

      card.appendChild(imgDiv);
      card.appendChild(info);

      card.querySelector('.ai-menu-card-add').addEventListener('click', function (e) {
        e.stopPropagation();
        addToCart(item);
      });

      scroll.appendChild(card);
    });

    scrollBottom();
  }

  // ---------- Cart ----------
  function addToCart(item) {
    var existing = cart.find(function (c) { return c.id === item.id; });
    if (existing) {
      existing.qty++;
    } else {
      cart.push({ id: item.id, name: item.name, price: item.price, image: item.image || '', qty: 1 });
    }
    saveCart();
    updateCartUI();

    // Flash the add button
    var btn = event.target.closest('.ai-menu-card-add');
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
    messages.push({ type: 'cart-summary', content: cart.slice() });
    appendCartSummaryDOM(cart, true);
    scrollBottom();
  }

  function placeOrder() {
    if (cart.length === 0) {
      showError('Your cart is empty!');
      return;
    }

    // Calculate total before clearing
    var total = cart.reduce(function (s, c) { return s + c.price * c.qty; }, 0);
    var itemCount = cart.length;
    var itemNames = cart.map(function (c) { return c.name; }).join(', ');

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
          // Save cart before clearing
          var savedCart = cart.slice();
          // Clear cart and update UI FIRST (hides cart bar, frees space)
          cart = [];
          saveCart();
          updateCartUI();
          // Now add confirmation messages into the freed-up space
          addBotMessage('Order ' + orderId + ' placed! ' + String.fromCodePoint(0x1F389) + ' ' +
            itemCount + ' item' + (itemCount > 1 ? 's' : '') + ' (' + itemNames + ') totaling ETB ' + total +
            '. Your order is on its way — konjo choice!');
          messages.push({ type: 'cart-summary', content: savedCart });
          appendCartSummaryDOM(savedCart, true);
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
        document.getElementById('aiChatInput').focus();
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
  }

  // ---------- API ----------
  function callAI(userText) {
    isLoading = true;
    updateSendButton();
    showTyping();
    var history = messages.filter(function (m) { return m.role; }).slice(-10);
    fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: userText, history: history }),
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
        document.getElementById('aiChatInput').focus();
      });
  }

  function updateSendButton() {
    var btn = document.getElementById('aiChatSend');
    if (btn) btn.disabled = isLoading;
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
    try { var r = localStorage.getItem(CART_KEY); return r ? JSON.parse(r) : []; }
    catch (e) { return []; }
  }
  function saveCart() {
    try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); }
    catch (e) { /* full */ }
  }

  // ---------- Init ----------
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createWidget);
  } else {
    createWidget();
  }
})();
