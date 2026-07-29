/* ============================================================
   FU FUT COFFEE — Internationalization (English / Amharic)
   ============================================================ */

(function () {
  'use strict';

  /* ---------- Translation table ---------- */
  var T = {
    en: {
      // Preloader
      'preloader.brewing': 'Brewing your experience',

      // Nav links
      'nav.about': 'About',
      'nav.coffee': 'Coffee',
      'nav.menu': 'Menu',
      'nav.ceremony': 'Ceremony',
      'nav.gallery': 'Gallery',
      'nav.contact': 'Contact',
      'nav.orderOnline': 'Order Online',

      // Hero
      'hero.title': 'Experience Authentic<br>Ethiopian <span class="accent">Coffee</span>',
      'hero.sub': 'Where tradition meets modern taste. Single-origin beans, ceremony-brewed, served with heart.',
      'hero.reserve': 'Reserve Table',
      'hero.viewMenu': 'View Menu',
      'hero.scroll': 'Scroll',

      // Story section
      'story.eyebrow': 'Our Story',
      'story.title': 'From Ceremony<br>to <span class="accent">Community</span>',
      'story.p1': 'Fu Fut Coffee began with a simple belief: that the warmth of an Ethiopian coffee ceremony belongs everywhere. We pair heritage brewing methods with a modern café experience.',
      'story.p2': 'Every bean is ethically sourced from Yirgacheffe, Sidamo, and Guji regions. Every dish honors traditional flavors while welcoming contemporary palates.',
      'story.badge1Num': '9+',
      'story.badge1Label': 'Years Serving',
      'story.badge2Num': '48K+',
      'story.badge2Label': 'Happy Guests',
      'story.feat1': 'Single Origin Beans',
      'story.feat2': 'Ethically Sourced',
      'story.feat3': 'Open Daily 7AM–10PM',
      'story.feat4': 'Friendly Community',

      // Signature Coffee
      'coffee.eyebrow': 'Single Origin',
      'coffee.title': 'Signature Coffee',

      // Menu section
      'menu.script': 'Menu',
      'menu.eyebrow': 'Restaurant',
      'menu.title': 'From Breakfast to Dinner',
      'menu.vegan': '🌱 Vegan',
      'menu.order': 'Order',

      // Featured Dishes
      'dishes.eyebrow': "Chef's Table",
      'dishes.title': 'Featured Dishes',
      'dishes.addToOrder': 'Add to Order',

      // Coffee Ceremony
      'ceremony.eyebrow': 'Heritage',
      'ceremony.title': 'The Coffee Ceremony',
      'ceremony.desc': 'A centuries-old tradition of roasting, grinding, and brewing — shared with warmth and intention.',
      'ceremony.s1Title': 'Roasting',
      'ceremony.s1Text': 'Green beans are roasted over an open flame, filling the room with rich, aromatic smoke.',
      'ceremony.s2Title': 'Grinding',
      'ceremony.s2Text': 'The roasted beans are ground by hand using a traditional mortar and pestle.',
      'ceremony.s3Title': 'Brewing',
      'ceremony.s3Text': 'Coffee is brewed in a jebena — a clay pot — and served in three rounds: Abol, Tona, and Baraka.',
      'ceremony.cta': 'Book Ceremony',

      // Gallery
      'gallery.eyebrow': 'Visual Journey',
      'gallery.title': 'Our Gallery',
      'gallery.desc': 'Explore the warmth, aroma, and artistry of Fu Fut Coffee through our lens.',

      // Testimonials
      'testimonials.eyebrow': 'Guests Say',
      'testimonials.title': 'Loved by Regulars',

      // Stats
      'stat.happyCustomers': 'Happy Customers',
      'stat.yearsServing': 'Years Serving',
      'stat.cupsServed': 'Cups Served',
      'stat.awards': 'Awards',

      // Reservation
      'res.eyebrow': 'Book Your Table',
      'res.title': 'Join Us for an<br>Unforgettable Experience',
      'res.desc': "Whether it's a cozy dinner for two or a celebration with friends, we'll make sure your visit is special.",
      'res.hours': 'Opening Hours',
      'res.hoursVal': 'Mon – Fri: 7am – 10pm · Sat: 8am – 11pm · Sun: 8am – 9pm',
      'res.location': 'Location',
      'res.locationVal': 'Bole Road, Addis Ababa',
      'res.contactUs': 'Contact Us',
      'res.contactVal': '+251 931 190 440',
      'res.formTitle': 'Make a Reservation',
      'res.fullName': 'Full Name',
      'res.email': 'Email',
      'res.date': 'Date',
      'res.time': 'Time',
      'res.selectTime': 'Select time',
      'res.guests': 'Guests',
      'res.numGuests': 'Number of guests',
      'res.phone': 'Phone',
      'res.specialRequests': 'Special Requests',
      'res.notesPlaceholder': 'Dietary requirements, occasion, seating preference...',
      'res.reserveNow': 'Reserve Now',
      'res.sent': 'Reservation Sent!',

      // Footer
      'footer.quickLinks': 'Quick Links',
      'footer.ourStory': 'Our Story',
      'footer.coffee': 'Coffee',
      'footer.menu': 'Menu',
      'footer.gallery': 'Gallery',
      'footer.reservations': 'Reservations',
      'footer.hours': 'Hours',
      'footer.monFri': 'Mon – Fri: 7am – 10pm',
      'footer.sat': 'Saturday: 8am – 11pm',
      'footer.sun': 'Sunday: 8am – 9pm',
      'footer.holidays': 'Holidays: 9am – 6pm',
      'footer.contact': 'Contact',
      'footer.desc': 'Ethiopian coffee heritage meets modern café culture. Serving single-origin excellence and traditional flavors since 2017.',
      'footer.crafted': 'ፉፉቱ ኮፊ — Crafted with care.',

      // Cart / Order
      'cart.title': 'Your Order',
      'cart.empty': 'Your cart is empty.<br>Add items from the menu.',
      'cart.total': 'Total',
      'cart.sendOrder': 'Send Order',
      'cart.orderSent': 'Order Sent!',
      'cart.note': "We'll confirm your order by email.",
      'cart.removeUnavailable': 'Remove Unavailable Items',
      'cart.unavailable': 'Unavailable:',

      // Modal
      'modal.spice': 'Spice',
      'modal.prepTime': 'Prep Time',
      'modal.dietary': 'Dietary',
      'modal.serves': 'Serves',
      'modal.allergens': 'Allergens',
      'modal.flavorNotes': 'Flavor Notes',
      'modal.totalPrice': 'Total Price',
      'modal.addToOrder': 'Add to Order'
    },

    am: {
      // Preloader
      'preloader.brewing': 'ልምድዎን እያፈሩ ነው',

      // Nav links
      'nav.about': 'ስለ እኛ',
      'nav.coffee': 'ቡና',
      'nav.menu': 'ዝርዝር',
      'nav.ceremony': 'ስርዓት',
      'nav.gallery': 'ማዕከል',
      'nav.contact': 'ያግኙን',
      'nav.orderOnline': 'መያዣ ይዘዙ',

      // Hero
      'hero.title': 'ኦሪጅናል የኢትዮጵያ<br><span class="accent">ቡና</span> ይጠጡ',
      'hero.sub': 'ባህልና ዘመናዊ ጣዕም የሚገናኙበት ቦታ። ነጠላ-ምንጭ ቡና ኖትሶች፣ በስርዓት የተረፉ፣ በፍቅር የተሰጡ።',
      'hero.reserve': 'ቦታ ያስይዙ',
      'hero.viewMenu': 'ዝርዝሩን ይመልከቱ',
      'hero.scroll': 'ይንቀሳቀሱ',

      // Story section
      'story.eyebrow': 'ታሪካችን',
      'story.title': 'ከስርዓት<br>ወደ <span class="accent">ማህበረሰብ</span>',
      'story.p1': 'ፉፉቱ ኮፊ ቀስቃሽ እምነት አነሳች — የኢትዮጵያ የቡና ስርዓት ሞቃት በየቦታው ይገኝ እንደሆን ነው። ባህላዊ የማፍሰሻ ዘዴዎችን ከዘመናዊ ካፌ ተሞክሮ ጋር አቀናቅለናል።',
      'story.p2': 'እያንዳንዱ ቡና ኖት ከይርጋቸፈ፣ ሲዳሞ እና ጉጂ ክልሎች በሞላጋጅ መንገድ ይመጣል። እያንዳንዱ ምግብ ባህላዊ ጣዕምን አክብሮ ዘመናዊ ጣምማችን ያቀበለዋል።',
      'story.badge1Num': '9+',
      'story.badge1Label': 'ዓመት አገልግሎት',
      'story.badge2Num': '48K+',
      'story.badge2Label': 'ደስ ያለ እንግዶች',
      'story.feat1': 'ነጠላ-ምንጭ ቡና ኖትስ',
      'story.feat2': 'በሞላጋጅ መንገድ የተገኘ',
      'story.feat3': 'በየቀኑ 7AM–10PM',
      'story.feat4': 'ወዳጃዊ ማህበረሰብ',

      // Signature Coffee
      'coffee.eyebrow': 'ነጠላ-ምንጭ',
      'coffee.title': 'ልዩ ቡናዎቻችን',

      // Menu section
      'menu.script': 'ዝርዝር',
      'menu.eyebrow': 'ሬስቶራንት',
      'menu.title': 'ከቀን ዳቫ እስከ ምሳ',
      'menu.vegan': '🌱 ስርአተ አትክልት',
      'menu.order': 'ይዘዙ',

      // Featured Dishes
      'dishes.eyebrow': 'የሻክ ማዕከል',
      'dishes.title': 'የተመረጡ ምግቦች',
      'dishes.addToOrder': 'ወደ ዝርዝር ያክሉ',

      // Coffee Ceremony
      'ceremony.eyebrow': 'ቅርስ',
      'ceremony.title': 'የቡና ስርዓት',
      'ceremony.desc': 'ምናምን ዓመታት የነበረው የማቅለጥ ፣ የማፈስ እና የማፍሰሻ ስርዓት — በፍቅር እና በትዕግስት የሚካፈል።',
      'ceremony.s1Title': 'ማቅለጥ',
      'ceremony.s1Text': 'አስቀዝሞ ያለ አበሣ ቡና ኖት ይቀጥላል፣ የቡና ጽዋ በሚጮኽ ሽታ ይሞቃል።',
      'ceremony.s2Title': 'ማፈስ',
      'ceremony.s2Text': 'የተቀጠሉት ቡና ኖቶች ባህላዊ ሙዝ እና ዘንግ በእጅ ይፈስሳሉ።',
      'ceremony.s3Title': 'ማፍሰሻ',
      'ceremony.s3Text': 'ቡና በጀበና — ቡና በሚባል የሸክላ ቅርጫ — ይቀባልና በሶስት ዙር ይሰጣል፦ አቦል፣ ቶና እና ባራካ።',
      'ceremony.cta': 'ስርዓት ያስይዙ',

      // Gallery
      'gallery.eyebrow': 'ምስሎች',
      'gallery.title': 'የእኛ ማዕከል',
      'gallery.desc': 'የፉፉቱ ኮፊ ሞቃት፣ ጽዋ እና ጥበብ በምስሎች ይመልከቱ።',

      // Testimonials
      'testimonials.eyebrow': 'እንግዶች ይላሉ',
      'testimonials.title': 'በተደጋጋሚዎች የተወደዱ',

      // Stats
      'stat.happyCustomers': 'ደስ ያለ ደንበኞች',
      'stat.yearsServing': 'ዓመት አገልግልቷል',
      'stat.cupsServed': 'የተሰጠ ቡና',
      'stat.awards': 'ሽልማቶች',

      // Reservation
      'res.eyebrow': 'ቦታ ያስይዙ',
      'res.title': 'ከእኛ ጋር<br>አስቂኝ ተሞክሮ',
      'res.desc': 'ከጓደኛ ለሁለት ምሳ ወይም ከጓደኛዎች ጋር በሰላም ይገናኙ — ጉዞዎን ልናስተናግፍልዎታለን።',
      'res.hours': 'የስራ ሰዓቶች',
      'res.hoursVal': 'ሰኞ – ዓርብ: 7am – 10pm · ቅዳሜ: 8am – 11pm · እሁድ: 8am – 9pm',
      'res.location': 'አካባቢ',
      'res.locationVal': 'ቦሌ፣ አዲስ አበባ',
      'res.contactUs': 'ያግኙን',
      'res.contactVal': '+251 931 190 440',
      'res.formTitle': 'ቦታ ያስይዙ',
      'res.fullName': 'ሙሉ ስም',
      'res.email': 'ኢሜይል',
      'res.date': 'ቀን',
      'res.time': 'ሰዓት',
      'res.selectTime': 'ሰዓት ይምረጡ',
      'res.guests': 'እንግዶች',
      'res.numGuests': 'የእንግዶች ብዛት',
      'res.phone': 'ስልክ',
      'res.specialRequests': 'ልዩ ጥያቄዎች',
      'res.notesPlaceholder': 'የምግብ ምግብ ዓይነት፣ ክብርት፣ የመቀመጫ ምርጫ...',
      'res.reserveNow': 'አሁን ያስይዙ',
      'res.sent': 'ቦታ ተይዟል!',

      // Footer
      'footer.quickLinks': 'ፈጣን ማገናኛዎች',
      'footer.ourStory': 'ታሪካችን',
      'footer.coffee': 'ቡና',
      'footer.menu': 'ዝርዝር',
      'footer.gallery': 'ማዕከል',
      'footer.reservations': 'ቦታ ማስይዣ',
      'footer.hours': 'ሰዓቶች',
      'footer.monFri': 'ሰኞ – ዓርብ: 7am – 10pm',
      'footer.sat': 'ቅዳሜ: 8am – 11pm',
      'footer.sun': 'እሁድ: 8am – 9pm',
      'footer.holidays': 'በዓለት: 9am – 6pm',
      'footer.contact': 'ያግኙን',
      'footer.desc': 'የኢትዮጵያ ቡና ቅርስ ከዘመናዊ ካፌ ባህል ጋር ይገናናል። ነጠላ-ምንጭ ምርጥ እና ባህላዊ ጣዕም ከ2017 ጀምሮ።',
      'footer.crafted': 'ፉፉቱ ኮፊ — በፍቅር ተሰራ።',

      // Cart / Order
      'cart.title': 'ትዕዛዙ',
      'cart.empty': 'ዝርዝርዎ ባዶ ነው።<br>ከዝርዝሩ ውስጥ ያክሉ።',
      'cart.total': 'ጠቅላላ',
      'cart.sendOrder': 'ትዕዛዝ ላክ',
      'cart.orderSent': 'ትዕዛዝ ተልኳል!',
      'cart.note': 'ትዕዛዝዎን በኢሜይል እንገልፃለን።',
      'cart.removeUnavailable': 'ያልተገኙን አስወግድ',
      'cart.unavailable': 'ያልተገኙ:',

      // Modal
      'modal.spice': 'ቅመም',
      'modal.prepTime': 'የማዘጋጀት ሰዓት',
      'modal.dietary': 'የምግብ ዓይነት',
      'modal.serves': 'ይሰጣል',
      'modal.allergens': 'አለርጅ',
      'modal.flavorNotes': 'የጣዕም ማስታወሻ',
      'modal.totalPrice': 'ጠቅላላ ዋጋ',
      'modal.addToOrder': 'ወደ ዝርዝር ያክሉ'
    }
  };

  /* ---------- Guest option strings ---------- */
  var guestOptions = {
    en: ['', '1 Person', '2 People', '3 People', '4 People', '5 People', '6+ People'],
    am: ['', '1 ሰው', '2 ሰዎች', '3 ሰዎች', '4 ሰዎች', '5 ሰዎች', '6+ ሰዎች']
  };

  /* ---------- Current language ---------- */
  var _lang = localStorage.getItem('fufut_lang') || 'en';

  function getLang() { return _lang; }

  function setLang(lang) {
    if (lang !== 'en' && lang !== 'am') return;
    _lang = lang;
    localStorage.setItem('fufut_lang', lang);
    applyTranslations(lang);
    updateSwitcherUI(lang);
    document.documentElement.lang = lang === 'am' ? 'am' : 'en';
    // RTL for Amharic
    document.documentElement.dir = lang === 'am' ? 'ltr' : 'ltr';
    // Dispatch custom event so other scripts can react
    document.dispatchEvent(new CustomEvent('fufut:langchange', { detail: { lang: lang } }));
  }

  /* ---------- Apply translations to DOM ---------- */
  function applyTranslations(lang) {
    var dict = T[lang];
    if (!dict) return;

    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var key = el.getAttribute('data-i18n');
      var text = dict[key];
      if (text !== undefined) {
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
          el.placeholder = text;
        } else {
          el.innerHTML = text;
        }
      }
    });

    // Translate guest options
    var guestsEl = document.getElementById('guests');
    if (guestsEl) {
      var opts = guestOptions[lang] || guestOptions.en;
      var currentVal = guestsEl.value;
      guestsEl.innerHTML = '<option value="">' + (lang === 'am' ? 'የእንግዶች ብዛት' : 'Number of guests') + '</option>';
      for (var i = 1; i < opts.length; i++) {
        var opt = document.createElement('option');
        opt.textContent = opts[i];
        guestsEl.appendChild(opt);
      }
      guestsEl.value = currentVal;
    }
  }

  /* ---------- Build and insert language switcher ---------- */
  function createSwitcher() {
    var wrapper = document.createElement('div');
    wrapper.className = 'lang-switcher';
    wrapper.id = 'langSwitcher';

    var btnEn = document.createElement('button');
    btnEn.className = 'lang-btn' + (_lang === 'en' ? ' active' : '');
    btnEn.dataset.lang = 'en';
    btnEn.textContent = 'EN';
    btnEn.setAttribute('aria-label', 'Switch to English');

    var divider = document.createElement('span');
    divider.className = 'lang-divider';

    var btnAm = document.createElement('button');
    btnAm.className = 'lang-btn' + (_lang === 'am' ? ' active' : '');
    btnAm.dataset.lang = 'am';
    btnAm.textContent = 'አማ';
    btnAm.setAttribute('aria-label', 'Switch to Amharic');

    wrapper.appendChild(btnEn);
    wrapper.appendChild(divider);
    wrapper.appendChild(btnAm);

    wrapper.addEventListener('click', function (e) {
      var btn = e.target.closest('.lang-btn');
      if (btn) setLang(btn.dataset.lang);
    });

    return wrapper;
  }

  function updateSwitcherUI(lang) {
    document.querySelectorAll('.lang-switcher').forEach(function (s) {
      s.querySelectorAll('.lang-btn').forEach(function (b) {
        b.classList.toggle('active', b.dataset.lang === lang);
      });
    });
  }

  /* ---------- Inject CSS ---------- */
  var css = document.createElement('style');
  css.textContent = `
    .lang-switcher {
      display: flex;
      align-items: center;
      gap: 0;
      flex-shrink: 0;
    }
    .lang-switcher .lang-btn {
      background: transparent;
      border: 1px solid rgba(255,255,255,.3);
      color: rgba(255,255,255,.8);
      font-family: var(--font-body);
      font-size: var(--text-xs);
      font-weight: 600;
      padding: 5px 10px;
      cursor: pointer;
      transition: all var(--duration-fast);
      letter-spacing: .04em;
    }
    .lang-switcher .lang-btn:first-child {
      border-radius: var(--radius-pill) 0 0 var(--radius-pill);
      border-right: none;
    }
    .lang-switcher .lang-btn:last-child {
      border-radius: 0 var(--radius-pill) var(--radius-pill) 0;
      border-left: none;
    }
    .lang-switcher .lang-btn.active {
      background: var(--color-primary);
      border-color: var(--color-primary);
      color: #fff;
    }
    .lang-switcher .lang-btn:not(.active):hover {
      background: rgba(255,255,255,.1);
      color: #fff;
    }
    .lang-switcher .lang-divider {
      width: 1px;
      height: 16px;
      background: rgba(255,255,255,.2);
      z-index: 1;
    }
    /* Scrolled (glass) state */
    .nav.scrolled .lang-switcher .lang-btn {
      border-color: var(--neutral-300);
      color: var(--text-body);
    }
    .nav.scrolled .lang-switcher .lang-btn.active {
      background: var(--color-primary);
      border-color: var(--color-primary);
      color: #fff;
    }
    .nav.scrolled .lang-switcher .lang-btn:not(.active):hover {
      background: var(--teal-50);
      color: var(--color-primary);
    }
    .nav.scrolled .lang-switcher .lang-divider {
      background: var(--neutral-300);
    }
    /* Mobile drawer */
    @media (max-width: 1080px) {
      /* Hide desktop switcher on mobile */
      #langSwitcherDesktop { display: none !important; }
      .lang-switcher {
        margin-left: 0;
        margin-top: 8px;
        align-self: flex-start;
      }
      .lang-switcher .lang-btn {
        border-color: rgba(255,255,255,.2);
        color: rgba(255,255,255,.7);
      }
      .lang-switcher .lang-btn.active {
        background: var(--gold-500);
        border-color: var(--gold-500);
        color: var(--teal-900);
      }
      .lang-switcher .lang-btn:not(.active):hover {
        background: rgba(255,255,255,.08);
        color: #fff;
      }
      .lang-switcher .lang-divider {
        background: rgba(255,255,255,.15);
      }
    }
    /* Amharic text styling — use Ethiopic font */
    /* Hide mobile switcher on desktop */
    @media (min-width: 1081px) {
      #langSwitcherMobile { display: none !important; }
    }
    [lang="am"] body,
    html[lang="am"] body {
      font-family: "Noto Sans Ethiopic", var(--font-body);
    }
    [lang="am"] h1, [lang="am"] h2, [lang="am"] h3, [lang="am"] h4,
    [lang="am"] .sec-title, [lang="am"] .story-text h3,
    [lang="am"] .nav-logo, [lang="am"] .nav-drawer-logo-brand,
    [lang="am"] .coffee-card h3, [lang="am"] .menu-card h3,
    [lang="am"] .dish-card-name, [lang="am"] .footer-brand-name {
      font-family: "Noto Sans Ethiopic", var(--font-display);
    }
    [lang="am"] .sec-script,
    [lang="am"] .hero-amharic {
      font-family: var(--font-script);
    }
    /* Section descriptions use Ethiopic for readability */
    [lang="am"] .sec-desc, [lang="am"] .story-text p,
    [lang="am"] .ceremony-step-text p, [lang="am"] .res-info > p,
    [lang="am"] .footer-brand p {
      font-family: "Noto Sans Ethiopic", var(--font-body);
      line-height: 2;
    }
  `;
  document.head.appendChild(css);

  /* ---------- Initialize ---------- */
  function init() {
    // Insert switcher into the nav for desktop (before the Order Online button)
    var desktopBtn = document.querySelector('.btn-nav-desktop');
    if (desktopBtn) {
      var desktopSwitcher = createSwitcher();
      desktopSwitcher.id = 'langSwitcherDesktop';
      desktopBtn.parentNode.insertBefore(desktopSwitcher, desktopBtn);
    }

    // Insert switcher into mobile drawer footer
    var drawerFooter = document.querySelector('.nav-drawer-footer .nav-actions');
    if (drawerFooter) {
      var mobileSwitcher = createSwitcher();
      mobileSwitcher.id = 'langSwitcherMobile';
      drawerFooter.insertBefore(mobileSwitcher, drawerFooter.firstChild);
    }

    // Set initial lang
    document.documentElement.lang = _lang === 'am' ? 'am' : 'en';
    applyTranslations(_lang);
  }

  /* ---------- Expose for external use ---------- */
  window.FufutI18n = {
    getLang: getLang,
    setLang: setLang,
    t: function (key) {
      return (T[_lang] || T.en)[key] || key;
    }
  };

  /* ---------- Boot ---------- */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();