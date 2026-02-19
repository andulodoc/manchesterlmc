/* ============================================================
   Manchester LMC — main.js
   Vanilla JS: nav, scroll, counter, reveal, tabs, accordion, filter
   ============================================================ */

'use strict';

/* ── Sticky nav + scroll class ────────────────────────────── */
(function () {
  const nav = document.querySelector('.site-nav');
  if (!nav) return;

  const onScroll = () => {
    if (window.scrollY > 40) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); // run on load
})();

/* ── Mobile nav toggle ────────────────────────────────────── */
(function () {
  const hamburger = document.querySelector('.nav-hamburger');
  const mobileNav = document.querySelector('.nav-mobile');
  const body = document.body;
  if (!hamburger || !mobileNav) return;

  const toggle = (open) => {
    hamburger.classList.toggle('open', open);
    mobileNav.classList.toggle('open', open);
    hamburger.setAttribute('aria-expanded', String(open));
    body.style.overflow = open ? 'hidden' : '';
  };

  hamburger.addEventListener('click', () => {
    const isOpen = hamburger.classList.contains('open');
    toggle(!isOpen);
  });

  // Close when clicking outside or on a link
  mobileNav.addEventListener('click', (e) => {
    if (e.target.tagName === 'A') toggle(false);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') toggle(false);
  });
})();

/* ── Mobile nav sub-menu toggles ─────────────────────────── */
(function () {
  const mobileLinks = document.querySelectorAll('.nav-mobile-link[data-toggle]');
  mobileLinks.forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const target = link.dataset.toggle;
      const sub = document.getElementById(target);
      if (!sub) return;
      const isOpen = sub.style.display !== 'none' && sub.style.display !== '';
      sub.style.display = isOpen ? 'none' : 'block';
      link.querySelector('svg')?.style && (link.querySelector('svg').style.transform = isOpen ? '' : 'rotate(180deg)');
    });
  });
})();

/* ── Scroll reveal ────────────────────────────────────────── */
(function () {
  const reveals = document.querySelectorAll('.reveal');
  if (!reveals.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );

  reveals.forEach((el) => observer.observe(el));
})();

/* ── Counter animation ────────────────────────────────────── */
(function () {
  const counters = document.querySelectorAll('[data-count]');
  if (!counters.length) return;

  const easeOut = (t) => 1 - Math.pow(1 - t, 3);

  const animateCounter = (el) => {
    const target = parseInt(el.dataset.count, 10);
    const prefix = el.dataset.prefix || '';
    const suffix = el.dataset.suffix || '';
    const duration = 1800;
    const start = performance.now();

    const step = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const value = Math.round(easeOut(progress) * target);
      el.textContent = prefix + value.toLocaleString() + suffix;
      if (progress < 1) requestAnimationFrame(step);
    };

    requestAnimationFrame(step);
  };

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.5 }
  );

  counters.forEach((el) => observer.observe(el));
})();

/* ── Tab switcher ─────────────────────────────────────────── */
(function () {
  document.querySelectorAll('[data-tabs]').forEach((tabsContainer) => {
    const tabList = tabsContainer.querySelector('.tab-list');
    if (!tabList) return;

    const buttons = tabList.querySelectorAll('.tab-btn');
    const panels = tabsContainer.querySelectorAll('.tab-panel');

    const activate = (btn) => {
      buttons.forEach((b) => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      panels.forEach((p) => {
        p.classList.remove('active');
        p.setAttribute('hidden', '');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
      const target = document.getElementById(btn.dataset.tab);
      if (target) {
        target.classList.add('active');
        target.removeAttribute('hidden');
      }
    };

    buttons.forEach((btn) => {
      btn.addEventListener('click', () => activate(btn));
    });

    // Keyboard navigation
    tabList.addEventListener('keydown', (e) => {
      const btns = [...buttons];
      const idx = btns.indexOf(document.activeElement);
      if (e.key === 'ArrowRight' && idx < btns.length - 1) {
        btns[idx + 1].focus();
        activate(btns[idx + 1]);
      } else if (e.key === 'ArrowLeft' && idx > 0) {
        btns[idx - 1].focus();
        activate(btns[idx - 1]);
      }
    });

    // Activate first tab by default
    if (buttons[0]) activate(buttons[0]);
  });
})();

/* ── Accordion ────────────────────────────────────────────── */
(function () {
  document.querySelectorAll('.accordion').forEach((accordion) => {
    const buttons = accordion.querySelectorAll('.accordion-btn');
    buttons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const panel = btn.nextElementSibling;
        const isOpen = btn.classList.contains('open');
        // Close all in this accordion
        accordion.querySelectorAll('.accordion-btn').forEach((b) => {
          b.classList.remove('open');
          b.setAttribute('aria-expanded', 'false');
          b.nextElementSibling?.classList.remove('open');
        });
        // Open clicked (if wasn't open)
        if (!isOpen) {
          btn.classList.add('open');
          btn.setAttribute('aria-expanded', 'true');
          panel?.classList.add('open');
        }
      });
    });
  });
})();

/* ── Guidance / Document filter ───────────────────────────── */
(function () {
  const filterContainer = document.getElementById('guidance-filter');
  if (!filterContainer) return;

  const searchInput = filterContainer.querySelector('.filter-search-input');
  const chips = filterContainer.querySelectorAll('.filter-chip');
  const resultsCount = document.getElementById('results-count');
  const docList = document.getElementById('document-list');
  if (!docList) return;

  let activeCategory = 'all';

  const render = () => {
    const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
    const cards = docList.querySelectorAll('[data-doc]');
    let visible = 0;

    cards.forEach((card) => {
      const cat = (card.dataset.category || '').toLowerCase();
      const title = (card.dataset.title || '').toLowerCase();
      const catMatch = activeCategory === 'all' || cat === activeCategory;
      const searchMatch = !query || title.includes(query) || cat.includes(query);
      const show = catMatch && searchMatch;
      card.style.display = show ? '' : 'none';
      if (show) visible++;
    });

    if (resultsCount) {
      resultsCount.textContent = `Showing ${visible} document${visible !== 1 ? 's' : ''}`;
    }
  };

  chips.forEach((chip) => {
    chip.addEventListener('click', () => {
      chips.forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');
      activeCategory = chip.dataset.category || 'all';
      render();
    });
  });

  if (searchInput) {
    searchInput.addEventListener('input', render);
  }

  render();
})();

/* ── News / vacancy filter chips ─────────────────────────── */
(function () {
  document.querySelectorAll('[data-filter-group]').forEach((group) => {
    const chips = group.querySelectorAll('.filter-chip');
    const targetId = group.dataset.filterGroup;
    const list = document.getElementById(targetId);
    if (!list) return;

    chips.forEach((chip) => {
      chip.addEventListener('click', () => {
        chips.forEach((c) => c.classList.remove('active'));
        chip.classList.add('active');
        const category = chip.dataset.category || 'all';
        list.querySelectorAll('[data-category]').forEach((item) => {
          const cat = (item.dataset.category || '').toLowerCase();
          item.style.display = category === 'all' || cat === category ? '' : 'none';
        });
      });
    });
  });
})();

/* ── Vacancy post-a-vacancy auth gate ─────────────────────── */
(function () {
  const authGate = document.getElementById('vacancy-auth-gate');
  const form = document.getElementById('vacancy-form');
  if (!authGate || !form) return;

  // Simulate unauthenticated state; replace with real session check
  const isAuthenticated = false;

  if (isAuthenticated) {
    authGate.style.display = 'none';
    form.style.display = 'block';
  } else {
    authGate.style.display = 'block';
    form.style.display = 'none';
  }
})();

/* ── Contact / breach form submission feedback ─────────────── */
(function () {
  document.querySelectorAll('form[data-ajax]').forEach((form) => {
    form.addEventListener('submit', (e) => {
      const btn = form.querySelector('[type="submit"]');
      if (!btn) return;
      btn.disabled = true;
      btn.textContent = 'Sending…';
      // Real submission handled by Formspree/Netlify; this is for UX only
    });
  });
})();

/* ── Smooth scroll for anchor links ───────────────────────── */
(function () {
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (e) => {
      const id = link.getAttribute('href').slice(1);
      if (!id) return;
      const target = document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
})();

/* ── Search overlay (stub) ────────────────────────────────── */
(function () {
  const btn = document.querySelector('.nav-search-btn');
  if (!btn) return;
  btn.addEventListener('click', () => {
    const q = window.prompt('Search Manchester LMC:');
    if (q && q.trim()) {
      window.location.href = `/guidance/?q=${encodeURIComponent(q.trim())}`;
    }
  });
})();
