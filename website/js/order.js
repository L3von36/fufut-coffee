/* ============================================================
   FU FUT COFFEE — Order Page (Table QR Code Ordering)
   ============================================================
   This page is reached by scanning a table QR code:
   /order?t=<table_id>&k=<table_key>

   It reads t and k from the URL, displays the table name so a
   mis-scan is obvious, renders the menu with category tabs, and
   submits the order with the table_key so the kitchen knows
   which table the order is for — without the guest ever typing it.

   The key identifies a table, never a person. It is never stored
   beyond the lifetime of this tab: a guest who returns without
   scanning is just an ordinary visitor again.
   ============================================================ */
(function () {
    'use strict';

    /* ── API base: same-origin in production, localhost in dev ── */
    var API = '';
    try {
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            API = 'http://localhost:3000';
        }
    } catch (e) {}

    /* ── Read table identity from URL params ── */
    var params = new URLSearchParams(window.location.search);
    var tableParam = params.get('t');
    var tableKey = params.get('k');

    /* If there is no table code, this page is being visited directly
       rather than from a scan — bounce to the landing page. */
    if (!tableParam || !tableKey) {
        window.location.replace('/');
        return;
    }

    /* Publish table context for any other script that checks it,
       mirroring the landing page's window.fufutTable contract. */
    window.fufutTable = { id: tableParam, key: tableKey };

    /** "T4" or "4" → "Table 4"; anything else is shown as-is so a
        mis-scanned or forged code is immediately visible. */
    function friendlyName(id) {
        var m = String(id).match(/^T?(\d+)$/i);
        return m ? 'Table ' + m[1] : String(id);
    }

    /** Extract just the display number ("4") from the raw param,
        for showing inside the badge next to the "Table" label. */
    function tableNumber(id) {
        var m = String(id).match(/^T?(\d+)$/i);
        return m ? m[1] : String(id);
    }

    /* ── Display the table name in the header and cart banner ── */
    function applyTableInfo() {
        var number = tableNumber(tableParam);
        var name = friendlyName(tableParam);
        var hdr = document.getElementById('orderTableName');
        if (hdr) hdr.textContent = number;

        /* Lock the order type and table number inside the cart drawer
           so the guest cannot change them. */
        var typeEl = document.getElementById('cartOrderType');
        var tableEl = document.getElementById('cartTable');
        var banner = document.getElementById('cartTableBanner');
        var cartName = document.getElementById('cartTableName');

        if (typeEl) { typeEl.value = 'dine-in'; typeEl.disabled = true; }
        if (tableEl) { tableEl.value = tableParam; tableEl.disabled = true; }
        if (cartName) cartName.textContent = name;
        if (banner) banner.style.display = '';
    }

    /* ================================================================
       MENU
       ================================================================ */
    var menuData = null;          // { categoryKey: [item, ...], ... }
    var rawCategories = [];       // raw category objects from API
    var activeFilter = '';

    function slugify(str) {
        return str.split('/')[0].trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    }

    function showMenuLoading() {
        document.getElementById('menuLoading').style.display = '';
        document.getElementById('menuError').style.display = 'none';
        document.querySelectorAll('.order-menu-tabs, .order-menu-grid').forEach(function (el) {
            el.style.display = 'none';
        });
    }

    function showMenuError() {
        document.getElementById('menuLoading').style.display = 'none';
        document.getElementById('menuError').style.display = 'block';
        document.querySelectorAll('.order-menu-tabs, .order-menu-grid').forEach(function (el) {
            el.style.display = 'none';
        });
    }

    /** Turn the API's {categories:[{name,items}]} into a keyed map. */
    function transformMenus(raw) {
        var result = {};
        (raw.categories || []).forEach(function (cat) {
            var key = slugify(cat.name);
            var catName = (cat.name || '').toLowerCase();
            result[key] = (cat.items || []).filter(function (item) {
                return item.available !== false && item.available !== 0;
            }).map(function (item) {
                var priceNum = parseFloat(item.price) || 0;
                var desc = item.description || '';
                var descLc = desc.toLowerCase();

                /* Infer dietary labels from description */
                var tags = [];
                var dietary = '';
                if (Array.isArray(item.tags) && item.tags.length) {
                    tags = item.tags;
                } else {
                    var inferred = inferTags(descLc, catName);
                    tags = inferred.tags;
                    dietary = inferred.dietary;
                }

                var image = item.image && item.image.trim()
                    ? item.image
                    : defaultImage(item.name);

                /* Rewrite broken images.futfutcoffee.com URLs */
                if (image.indexOf('images.futfutcoffee.com') !== -1) {
                    var imgKey = image.split('images.futfutcoffee.com/')[1];
                    image = API + '/api/images/' + imgKey;
                }

                return {
                    name:   item.name,
                    name_am: item.name_am || '',
                    price:  String(priceNum),
                    desc:   desc,
                    desc_am: item.description_am || '',
                    image:  image,
                    tags:   tags,
                    dietary: dietary,
                    id:     item.id || ''
                };
            });
        });
        return result;
    }

    function inferTags(desc, catName) {
        var tags = [];
        if (desc.indexOf('vegan') !== -1 || desc.indexOf('ጾም') !== -1 || desc.indexOf('fasting') !== -1) tags.push('Vegan');
        else if (desc.indexOf('vegetarian') !== -1) tags.push('Vegetarian');
        else if (catName.indexOf('soft drink') !== -1 || catName.indexOf('juice') !== -1) tags.push('Vegan');
        if (desc.indexOf('traditional') !== -1 || desc.indexOf('ethiopian') !== -1 || desc.indexOf('habesha') !== -1) tags.push('Traditional');
        if (desc.indexOf('spicy') !== -1 || desc.indexOf('berbere') !== -1 || desc.indexOf('chili') !== -1) tags.push('Spicy');
        var dietary = tags.find(function (t) { return t === 'Vegan' || t === 'Vegetarian'; }) || '';
        return { tags: tags, dietary: dietary };
    }

    function defaultImage(name) {
        var safe = String(name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
        return 'assets/menu-' + safe + '.jpg';
    }

    function buildTabs(categories) {
        rawCategories = categories || [];
        var container = document.getElementById('menuTabs');
        var isAm = window.FufutI18n && window.FufutI18n.getLang() === 'am';
        container.innerHTML = '';
        categories.forEach(function (cat, i) {
            var key = slugify(cat.name);
            var label = isAm && cat.name_am ? cat.name_am : cat.name.split('/')[0].trim();
            var btn = document.createElement('button');
            btn.className = 'menu-tab' + (i === 0 ? ' active' : '');
            btn.dataset.tab = key;
            btn.textContent = label || key;
            btn.addEventListener('click', function () {
                container.querySelectorAll('.menu-tab').forEach(function (t) { t.classList.remove('active'); });
                btn.classList.add('active');
                renderMenu(key);
            });
            container.appendChild(btn);
        });
        /* Show tabs + grid now that we have data */
        document.getElementById('menuLoading').style.display = 'none';
        document.getElementById('menuError').style.display = 'none';
        document.querySelector('.order-menu-tabs').style.display = 'flex';
        document.querySelector('.order-menu-grid').style.display = 'grid';
    }

    function renderMenu(cat) {
        var grid = document.getElementById('menuGrid');
        if (!grid) return;
        var items = (menuData[cat] || []).filter(menuItemMatchesFilter);

        if (!items.length) {
            grid.innerHTML = '<div class="menu-empty-state" style="grid-column:1/-1;text-align:center;padding:48px;background:var(--color-surface);border:1.5px dashed var(--border-subtle);border-radius:var(--radius-md);box-shadow:var(--shadow-sm)">'
                + '<div style="font-size:2.5rem;margin-bottom:12px" aria-hidden="true">☕</div>'
                + '<h3 style="font-family:var(--font-display);font-size:var(--text-xl);color:var(--text-heading);margin-bottom:8px">No items in this category</h3>'
                + '<p style="font-size:var(--text-sm);color:var(--text-muted)">Check back soon — new items are always being added.</p>'
                + '</div>';
            return;
        }

        var isAm = window.FufutI18n && window.FufutI18n.getLang() === 'am';
        grid.innerHTML = items.map(function (m) {
            var displayName = isAm && m.name_am ? m.name_am : m.name;
            var displayDesc = isAm && m.desc_am ? m.desc_am : m.desc;
            var priceStr = (!m.price || m.price === '0' || isNaN(parseFloat(m.price))) ? '' : 'ETB ' + parseFloat(m.price).toLocaleString();
            var tagsHTML = (m.tags || []).map(function (t) {
                return '<span class="menu-card-tag ' + t.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '">' + t + '</span>';
            }).join('');
            var imgSrc = m.image ? m.image : 'assets/menu-reference.jpg';

            return '<div class="menu-card" data-name="' + (m.name || '').replace(/"/g, '&quot;') + '" data-price="' + m.price + '" data-image="' + imgSrc.replace(/"/g, '&quot;') + '">'
                + '<div class="menu-card-img" style="background-image:url(' + "'" + imgSrc + "'" + ')">'
                +   tagsHTML
                + '</div>'
                + '<div class="menu-card-body">'
                +   '<h3 class="menu-card-name">' + displayName + '</h3>'
                +   '<p class="menu-card-desc">' + (displayDesc || '') + '</p>'
                +   '<div class="menu-card-footer">'
                +     '<div class="menu-card-price">' + priceStr + '</div>'
                +     '<button class="btn-menu-order" aria-label="Add ' + (m.name || '') + ' to order" onclick="addToCartFromCard(this)">'
                +       '<span>+</span>'
                +     '</button>'
                +   '</div>'
                + '</div>'
                + '</div>';
        }).join('');

        /* Attach per-card add listeners (fallback to onclick on button) */
        grid.querySelectorAll('.menu-card').forEach(function (card) {
            card.addEventListener('click', function (e) {
                /* Don't trigger when clicking the add button */
                if (e.target.closest('.btn-menu-order')) return;
                var d = card.dataset;
                addToCart({ name: d.name, price: d.price, image: d.image, qty: 1 });
            });
        });
    }

    function menuItemMatchesFilter(m) {
        if (!activeFilter) return true;
        if (activeFilter === 'vegan') {
            return (m.tags || []).some(function (t) { return t.toLowerCase() === 'vegan'; });
        }
        return true;
    }

    /** Add an item directly from a rendered menu card's "Add" button. */
    window.addToCartFromCard = function (btn) {
        var card = btn.closest('.menu-card');
        addToCart({
            name:  card.dataset.name,
            price: card.dataset.price,
            image: card.dataset.image
        });
    };

    function loadMenuFromData(raw) {
        menuData = transformMenus(raw);
        buildTabs(raw.categories || []);
        var firstTab = document.querySelector('.menu-tab.active');
        if (firstTab) renderMenu(firstTab.dataset.tab);
    }

    function fetchMenu() {
        showMenuLoading();
        fetch(API + '/api/menus', { cache: 'no-store' })
            .then(function (r) { if (!r.ok) throw new Error('API error'); return r.json(); })
            .then(function (data) {
                if (!data || !data.categories) throw new Error('Bad response');
                loadMenuFromData(data);
            })
            .catch(function () {
                /* Fall back to local menus.json */
                fetch('/menus.json')
                    .then(function (r) { if (!r.ok) throw new Error('no menus.json'); return r.json(); })
                    .then(loadMenuFromData)
                    .catch(function () {
                        console.warn('[Order] Could not load menu');
                        showMenuError();
                    });
            });
    }

    window.retryMenu = function () { fetchMenu(); };

    /* ================================================================
       CART (mirrors the landing page's cart contract)
       ================================================================ */
    var cart = [];

    function cartKey(item) { return (item.id || '') + '|' + item.name; }

    /** Look up live price/image from the rendered menu data. */
    function findMenuItem(name) {
        if (!menuData) return null;
        for (var cat in menuData) {
            if (!Object.prototype.hasOwnProperty.call(menuData, cat)) continue;
            for (var i = 0; i < menuData[cat].length; i++) {
                if (menuData[cat][i].name === name) return menuData[cat][i];
            }
        }
        return null;
    }
    function getCurrentPrice(item) {
        var m = findMenuItem(item.name);
        return m ? parseFloat(m.price) : (parseFloat(item.price) || 0);
    }
    function getCurrentImage(item) {
        var m = findMenuItem(item.name);
        return m ? m.image : (item.image || '');
    }
    function isItemAvailable(item) {
        if (!menuData) return true;
        var m = findMenuItem(item.name);
        return !m || m.available !== false;
    }

    /** Add an item to the cart. */
    function addToCart(item) {
        var price = getCurrentPrice(item);
        var image = getCurrentImage(item);
        var k = cartKey({ id: item.id, name: item.name });
        var found = cart.find(function (c) { return cartKey(c) === k; });
        if (found) { found.qty += (item.qty || 1); }
        else { cart.push({ id: item.id || '', name: item.name, price: price, image: image, qty: item.qty || 1 }); }
        renderCart();
        updateCartFab();
        /* Bounce the cart FAB so the user sees where their item landed */
        var fab = document.getElementById('cartFab');
        if (fab) {
            fab.classList.remove('bounce');
            void fab.offsetWidth;
            fab.classList.add('bounce');
            fab.addEventListener('animationend', function h() {
                fab.classList.remove('bounce');
                fab.removeEventListener('animationend', h);
            });
        }
        if (window.toast) {
            window.toast.info((item.qty > 1 ? item.qty + '× ' : '1× ') + item.name + ' added');
        }
    }

    function changeQty(k, delta) {
        var idx = cart.findIndex(function (c) { return cartKey(c) === k; });
        if (idx === -1) return;
        cart[idx].qty += delta;
        if (cart[idx].qty <= 0) cart.splice(idx, 1);
        renderCart();
        updateCartFab();
    }
    window.changeQty = changeQty;

    function cartTotal() {
        return cart.reduce(function (s, c) {
            return s + getCurrentPrice(c) * c.qty;
        }, 0);
    }

    function updateCartFab() {
        var count = cart.reduce(function (s, c) { return s + c.qty; }, 0);
        var fab = document.getElementById('cartFab');
        var cnt = document.getElementById('cartCount');
        if (cnt) cnt.textContent = count;
        if (fab) fab.style.display = count > 0 ? 'flex' : 'none';
    }

    function renderCart() {
        var wrap = document.getElementById('cartItems');
        if (!wrap) return;

        if (!cart.length) {
            var emptyTxt = (window.FufutI18n ? window.FufutI18n.t('cart.empty') : 'Your cart is empty.<br>Add items from the menu.');
            wrap.innerHTML = '<div class="cart-empty">' + emptyTxt + '</div>';
        } else {
            wrap.innerHTML = cart.map(function (c) {
                var price = getCurrentPrice(c);
                var image = getCurrentImage(c);
                var k = cartKey(c);
                var kSafe = k.replace(/'/g, "\\'");
                return '<div class="cart-item">'
                    + (image ? '<img class="cart-item-img" src="' + image + '" alt="">' : '<div class="cart-item-img"></div>')
                    + '<div class="cart-item-info"><div class="cart-item-name">' + c.name + '</div>'
                    + '<div class="cart-item-price">ETB ' + price.toFixed(2) + '</div></div>'
                    + '<div class="cart-item-qty"><button onclick="changeQty(\'' + kSafe + '\',-1)">&minus;</button>'
                    + '<span>' + c.qty + '</span>'
                    + '<button onclick="changeQty(\'' + kSafe + '\',1)">+</button></div></div>';
            }).join('');
        }

        var totalEl = document.getElementById('cartTotal');
        if (totalEl) totalEl.textContent = 'ETB ' + cartTotal().toFixed(2);

        var submitEl = document.getElementById('cartSubmit');
        if (submitEl) submitEl.disabled = cart.length === 0;
    }

    function openCart() {
        document.getElementById('cartDrawer').classList.add('open');
        document.getElementById('cartOverlay').classList.add('open');
    }
    window.openCart = openCart;
    function closeCart() {
        var drawer = document.getElementById('cartDrawer');
        var overlay = document.getElementById('cartOverlay');
        var confirm = document.getElementById('cartConfirm');
        var footer = document.querySelector('.cart-footer');
        var items = document.getElementById('cartItems');

        drawer.classList.remove('open');
        overlay.classList.remove('open');

        /* Reset confirmation panel when cart is closed */
        if (confirm && confirm.style.display !== 'none') {
            confirm.style.display = 'none';
            if (footer) footer.style.display = '';
            if (items) items.style.display = '';
        }
    }
    window.closeCart = closeCart;

    /* ================================================================
       ORDER SUBMISSION
       ================================================================ */
    document.addEventListener('DOMContentLoaded', function () {
        var btn = document.getElementById('cartSubmit');
        if (!btn) return;

        btn.addEventListener('click', function () {
            if (!cart.length) return;

            /* Build the order payload — identical contract to the landing
               page, but table_key is always present here. */
            var items = [];
            var unavailable = [];
            cart.forEach(function (c) {
                if (!isItemAvailable(c)) {
                    unavailable.push(c.name);
                    return;
                }
                items.push({ id: c.id, name: c.name, qty: c.qty, price: getCurrentPrice(c) });
            });

            if (unavailable.length > 0) {
                window.toast.error('Unavailable: ' + unavailable.join(', ') + '. Remove them and try again.');
                cart = cart.filter(function (c) { return isItemAvailable(c); });
                renderCart();
                updateCartFab();
                return;
            }

            var total = items.reduce(function (s, it) { return s + it.price * it.qty; }, 0);

            var orderName  = (document.getElementById('cartName')  || {}).value || '';
            var orderPhone = (document.getElementById('cartPhone') || {}).value || '';
            var orderEmail = (document.getElementById('cartEmail') || {}).value || '';
            var orderType  = (document.getElementById('cartOrderType') || {}).value || 'dine-in';
            var orderTable = (document.getElementById('cartTable') || {}).value || '';
            var orderNotes = (document.getElementById('cartNotes') || {}).value || '';

            /* table_key is the authenticated identity of the table.
               Without it the order is anonymous; with it the API tags
               the order source as 'qr' and forces type 'dine-in'. */
            var tableKeyVal = (window.fufutTable && window.fufutTable.key) || undefined;

            window.buttonState.wrap(btn, function () {
                return fetch(API + '/api/orders', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        items: items,
                        total: total,
                        name: orderName,
                        phone: orderPhone,
                        email: orderEmail,
                        order_type: orderType,
                        table_number: orderTable,
                        table_key: tableKeyVal,
                        notes: orderNotes,
                        status: 'new'
                    })
                }).then(function (r) {
                    if (!r.ok) {
                        /* 403 = table key rejected or table not seated */
                        if (r.status === 403) throw new Error('invalid_table_key');
                        throw new Error('Request failed');
                    }
                    return r.json();
                }).then(function (data) {
                    if (!data || data.ok === false) {
                        throw new Error(data && data.error ? data.error : 'Rejected');
                    }

                    /* Show in-drawer confirmation with the order reference */
                    var refEl = document.getElementById('cartConfirmRef');
                    if (refEl) refEl.textContent = data.id || '—';

                    var confirmPanel = document.getElementById('cartConfirm');
                    var footer = document.querySelector('.cart-footer');
                    var cartItemsEl = document.getElementById('cartItems');
                    if (confirmPanel) {
                        if (footer) footer.style.display = 'none';
                        if (cartItemsEl) cartItemsEl.style.display = 'none';
                        confirmPanel.style.display = 'flex';
                    }

                    cart = [];
                    updateCartFab();
                });
            }, 'send', {
                loading: window.FufutI18n ? window.FufutI18n.t('cart.sending') : 'Sending...',
                success: 'Sent ✓',
                error: window.FufutI18n ? window.FufutI18n.t('cart.retry') : 'Try Again'
            }).catch(function (err) {
                if (err && err.message === 'invalid_table_key') {
                    window.toast.error(window.FufutI18n ? window.FufutI18n.t('order.invalidKey') : 'This table code is not recognised. Please ask staff for a fresh table card.');
                } else {
                    window.toast.error('Could not send your order. Please try again.');
                }
            });
        });
    });

    /* ================================================================
       LANGUAGE SWITCHER
       ================================================================ */
    function initLangSwitcher() {
        var switcher = document.getElementById('langSwitcherOrder');
        if (!switcher || !window.FufutI18n) return;

        var btns = switcher.querySelectorAll('.lang-btn');
        var currentLang = window.FufutI18n.getLang();

        btns.forEach(function (btn) {
            btn.classList.toggle('active', btn.dataset.lang === currentLang);
            btn.addEventListener('click', function () {
                window.FufutI18n.setLang(btn.dataset.lang);
            });
        });

        /* Re-render menu + cart when the language changes */
        document.addEventListener('fufut:langchange', function () {
            if (rawCategories.length) {
                buildTabs(rawCategories);
                var firstTab = document.querySelector('.menu-tab.active');
                if (firstTab) renderMenu(firstTab.dataset.tab);
            }
            renderCart();
        });
    }

    /* ================================================================
       BOOT
       ================================================================ */
    function init() {
        applyTableInfo();
        initLangSwitcher();
        fetchMenu();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
