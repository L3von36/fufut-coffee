/* ============================================================
   FU FUT COFFEE — Main JavaScript
   Reveal animations, dark mode, mobile menu, forms, toast
   ============================================================ */

// ---------- 1. Reduced Motion Check ----------
const PREFERS_REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------- 2. Lucide Icons ----------
if (typeof lucide !== 'undefined') {
  lucide.createIcons();
}

// ---------- 3. Reveal-on-Scroll ----------
(function initReveal() {
  const revealElements = document.querySelectorAll('[data-reveal]');

  // If user prefers reduced motion, show all elements immediately
  if (PREFERS_REDUCED_MOTION) {
    revealElements.forEach(el => {
      el.classList.add('in-view');
    });
    return;
  }

  // Use IntersectionObserver for reveal animations
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  });

  revealElements.forEach(el => observer.observe(el));
})();

// ---------- 4. Dark Mode Toggle ----------
(function initDarkMode() {
  const toggle = document.getElementById('darkToggle');
  if (!toggle) return;

  // Check for saved preference or system preference
  const savedTheme = localStorage.getItem('theme');
  const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const currentTheme = savedTheme || (systemDark ? 'dark' : 'light');
  document.documentElement.setAttribute('data-theme', currentTheme);

  // Update icon visibility
  const iconSun = toggle.querySelector('.icon-sun');
  const iconMoon = toggle.querySelector('.icon-moon');

  function updateIcons(theme) {
    if (iconSun && iconMoon) {
      if (theme === 'dark') {
        iconSun.style.display = 'none';
        iconMoon.style.display = 'inline-block';
      } else {
        iconSun.style.display = 'inline-block';
        iconMoon.style.display = 'none';
      }
    }
  }

  updateIcons(currentTheme);

  toggle.addEventListener('click', () => {
    const theme = document.documentElement.getAttribute('data-theme');
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateIcons(newTheme);
  });
})();

// ---------- 5. Language Toggle ----------
(function initLangToggle() {
  const toggle = document.getElementById('langToggle');
  if (!toggle) return;

  toggle.addEventListener('click', () => {
    // Simple EN/አማ toggle — in a real app this would swap content
    const current = toggle.querySelector('span').textContent;
    toggle.querySelector('span').textContent = current === 'EN' ? 'አማ' : 'EN';
  });
})();

// ---------- 6. Mobile Menu Toggle ----------
(function initMobileMenu() {
  const hamburger = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobileMenu');
  const mobileClose = document.getElementById('mobileClose');

  if (!hamburger || !mobileMenu) return;

  function openMenu() {
    mobileMenu.classList.add('open');
    hamburger.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }

  function closeMenu() {
    mobileMenu.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  hamburger.addEventListener('click', openMenu);

  if (mobileClose) {
    mobileClose.addEventListener('click', closeMenu);
  }

  // Close menu when clicking outside
  mobileMenu.addEventListener('click', (e) => {
    if (e.target === mobileMenu) closeMenu();
  });

  // Close menu when clicking a link
  const mobileLinks = mobileMenu.querySelectorAll('a');
  mobileLinks.forEach(link => {
    link.addEventListener('click', closeMenu);
  });

  // Close menu on escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && mobileMenu.classList.contains('open')) {
      closeMenu();
    }
  });
})();

// ---------- 7. Back to Top Button ----------
(function initBackToTop() {
  const btn = document.getElementById('backToTop');
  if (!btn) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 600) {
      btn.classList.add('visible');
    } else {
      btn.classList.remove('visible');
    }
  });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
})();

// ---------- 8. Toast Notification ----------
window.showToast = function(message, duration = 3000) {
  const toast = document.getElementById('toast');
  if (!toast) return;

  const msgEl = toast.querySelector('.toast__msg');
  if (msgEl) msgEl.textContent = message;

  toast.classList.add('show');

  setTimeout(() => {
    toast.classList.remove('show');
  }, duration);
};

// ---------- 9. Reservation Form ----------
(function initReservationForm() {
  const form = document.getElementById('reservationForm');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = form.querySelector('#resName').value.trim();
    const email = form.querySelector('#resEmail').value.trim();
    const date = form.querySelector('#resDate').value;
    const time = form.querySelector('#resTime').value;
    const guests = form.querySelector('#resGuests').value;

    if (!name || !email || !date || !time || !guests) {
      window.showToast('Please fill in all required fields.');
      return;
    }

    // In a real app, this would POST to /api/reservations
    // For now, show a success message
    window.showToast(`Reservation confirmed for ${name} on ${date} at ${time}!`);
    form.reset();
  });
})();

// ---------- 10. Newsletter Form ----------
(function initNewsletterForm() {
  const form = document.getElementById('newsletterForm');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const emailInput = form.querySelector('input[type="email"]');
    const email = emailInput ? emailInput.value.trim() : '';

    if (!email) {
      window.showToast('Please enter your email address.');
      return;
    }

    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      window.showToast('Please enter a valid email address.');
      return;
    }

    window.showToast(`Thanks for subscribing, ${email}!`);
    form.reset();
  });
})();

// ---------- 11. Smooth Scroll for Anchor Links ----------
(function initSmoothScroll() {
  // Skip if user prefers reduced motion
  if (PREFERS_REDUCED_MOTION) return;

  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
})();

// ---------- 12. Navbar Glass Effect on Scroll ----------
(function initNavGlass() {
  const nav = document.getElementById('nav');
  if (!nav) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 20) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
  });
})();

// ---------- 13. Menu Tab Switching ----------
(function initMenuTabs() {
  const tabs = document.querySelectorAll('[data-menu-tab]');
  const cards = document.querySelectorAll('[data-category]');
  if (!tabs.length || !cards.length) return;

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const category = tab.getAttribute('data-menu-tab');

      tabs.forEach(t => t.classList.remove('tag--active'));
      tab.classList.add('tag--active');

      cards.forEach(card => {
        card.classList.toggle('hide', card.getAttribute('data-category') !== category);
      });

      if (typeof lucide !== 'undefined') lucide.createIcons();
    });
  });
})();

// ---------- 14. Stats Counter Animation ----------
(function initStatsCounter() {
  if (PREFERS_REDUCED_MOTION) {
    document.querySelectorAll('.stat__number').forEach(el => {
      el.textContent = el.getAttribute('data-count');
    });
    return;
  }

  const statNumbers = document.querySelectorAll('.stat__number[data-count]');
  if (!statNumbers.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  statNumbers.forEach(el => observer.observe(el));

  function animateCounter(el) {
    const target = parseInt(el.getAttribute('data-count'), 10);
    const duration = 2000;
    const startTime = performance.now();

    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(target * eased);

      el.textContent = current.toLocaleString();

      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        el.textContent = target.toLocaleString();
      }
    }

    requestAnimationFrame(update);
  }
})();
