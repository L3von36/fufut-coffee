/* ============================================================
   FU FUT COFFEE — Main JavaScript
   Stable, null-safe interactions essential for page functionality
   ============================================================ */

// ---------- 1. Reduced Motion Check ----------
const PREFERS_REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------- 2. Mobile Menu Toggle ----------
(function initMobileMenu() {
  const nav = document.getElementById('nav');
  const toggle = document.getElementById('navToggle');
  const backdrop = document.getElementById('navBackdrop');
  const drawer = document.getElementById('navDrawer');

  if (!nav || !toggle) return;

  function openMenu() {
    nav.classList.add('mobile-open');
    toggle.classList.add('active');
    toggle.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }

  function closeMenu() {
    nav.classList.remove('mobile-open');
    toggle.classList.remove('active');
    toggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  toggle.addEventListener('click', function() {
    if (nav.classList.contains('mobile-open')) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  // Close button in drawer header
  var drawerClose = document.querySelector('.nav-drawer-close');
  if (drawerClose) {
    drawerClose.addEventListener('click', closeMenu);
  }

  // Close on backdrop click
  if (backdrop) {
    backdrop.addEventListener('click', closeMenu);
  }

  // Close menu when clicking a link
  if (drawer) {
    drawer.querySelectorAll('a').forEach(function(link) {
      link.addEventListener('click', closeMenu);
    });
  }

  // Close menu on Escape
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && nav.classList.contains('mobile-open')) {
      closeMenu();
    }
  });
})();

// ---------- 3. Navbar Glass Effect on Scroll ----------
(function initNavGlass() {
  var nav = document.getElementById('nav');
  if (!nav) return;

  window.addEventListener('scroll', function() {
    if (window.scrollY > 20) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
  }, { passive: true });
})();

// ---------- 4. Back to Top Button ----------
(function initBackToTop() {
  var btn = document.getElementById('backToTop');
  if (!btn) return;

  window.addEventListener('scroll', function() {
    btn.classList.toggle('visible', window.scrollY > 600);
  }, { passive: true });

  btn.addEventListener('click', function() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
})();

// ---------- 5. Reveal-on-Scroll (IntersectionObserver) ----------
// Complements GSAP ScrollTrigger — catches any [data-reveal] elements
(function initReveal() {
  const revealElements = document.querySelectorAll('[data-reveal]');
  if (!revealElements.length) return;

  if (PREFERS_REDUCED_MOTION) {
    revealElements.forEach(function(el) { el.classList.add('in-view'); });
    return;
  }

  var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

  revealElements.forEach(function(el) { observer.observe(el); });
})();

// ---------- 6. Smooth Scroll for Anchor Links ----------
(function initSmoothScroll() {
  if (PREFERS_REDUCED_MOTION) return;

  document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
    anchor.addEventListener('click', function(e) {
      var href = this.getAttribute('href');
      if (href === '#') return;
      var target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
})();

// ---------- 7. Toast Notification (shared utility) ----------
// Only define if inline script hasn't already defined it
if (typeof window.showToast !== 'function') {
  window.showToast = function(message, duration) {
    duration = duration || 3000;
    var toast = document.getElementById('toast');
    if (!toast) return;

    var msgEl = toast.querySelector('.toast__msg');
    if (msgEl) msgEl.textContent = message;

    toast.classList.add('show');
    clearTimeout(toast._hideTimer);
    toast._hideTimer = setTimeout(function() {
      toast.classList.remove('show');
    }, duration);
  };
}

// ---------- 8. Active Nav Link Highlighting ----------
(function initActiveNav() {
  var sections = document.querySelectorAll('section[id], div[id]');
  var navLinks = document.querySelectorAll('.nav-links a');
  if (!sections.length || !navLinks.length) return;

  function updateActiveLink() {
    var scrollPos = window.scrollY + 120;
    var currentId = '';

    sections.forEach(function(section) {
      var top = section.offsetTop;
      var height = section.offsetHeight;
      if (scrollPos >= top && scrollPos < top + height) {
        currentId = section.id;
      }
    });

    navLinks.forEach(function(link) {
      link.classList.remove('active');
      if (link.getAttribute('href') === '#' + currentId) {
        link.classList.add('active');
      }
    });
  }

  window.addEventListener('scroll', updateActiveLink, { passive: true });
  updateActiveLink();
})();
