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
      el.textContent = prefix + ('noFormat' in el.dataset ? value : value.toLocaleString()) + suffix;
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

/* ── Search overlay ───────────────────────────────────────── */
(function () {
  // Capture the script element synchronously so we can resolve the base path
  // from any page depth (root or subdirectory).
  var scriptSrc = (document.currentScript || {}).src || '';
  var BASE = scriptSrc.replace(/assets\/js\/main\.js.*$/, '');
  if (!BASE) BASE = './';

  // ── Inject overlay HTML ────────────────────────────────────
  var SEARCH_ICON = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>';
  var PAGE_ICON   = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>';
  var DOC_ICON    = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>';

  document.body.insertAdjacentHTML('beforeend',
    '<div id="search-overlay" class="search-overlay" role="dialog" aria-modal="true" aria-label="Search Manchester LMC">' +
      '<div class="search-backdrop" id="search-backdrop"></div>' +
      '<div class="search-dialog">' +
        '<div class="search-input-row">' +
          '<span class="search-input-icon">' + SEARCH_ICON + '</span>' +
          '<input id="search-input" class="search-input" type="search" placeholder="Search pages and documents\u2026" autocomplete="off" spellcheck="false" aria-label="Search Manchester LMC" aria-autocomplete="list" aria-controls="search-results">' +
          '<button class="search-close-btn" id="search-close" aria-label="Close search">Esc</button>' +
        '</div>' +
        '<div id="search-results" class="search-results" role="listbox" aria-label="Search results">' +
          '<p class="search-empty-state">Type to search pages and documents</p>' +
        '</div>' +
        '<div class="search-footer">' +
          '<span class="search-footer-hint"><kbd class="search-kbd">\u2191</kbd><kbd class="search-kbd">\u2193</kbd>&nbsp;navigate</span>' +
          '<span class="search-footer-hint"><kbd class="search-kbd">\u23ce</kbd>&nbsp;open</span>' +
          '<span class="search-footer-hint"><kbd class="search-kbd">Esc</kbd>&nbsp;close</span>' +
        '</div>' +
      '</div>' +
    '</div>'
  );

  var overlay  = document.getElementById('search-overlay');
  var backdrop = document.getElementById('search-backdrop');
  var input    = document.getElementById('search-input');
  var results  = document.getElementById('search-results');
  var closeBtn = document.getElementById('search-close');
  var searchBtn = document.querySelector('.nav-search-btn');

  var fuse = null;
  var focusedIndex = -1;
  var lastQuery = '';
  var isOpen = false;

  // ── Helpers ────────────────────────────────────────────────
  function esc(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // ── Load Fuse.js from CDN then fetch index ─────────────────
  function initSearch(cb) {
    if (fuse) { cb(); return; }
    var s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/fuse.js@7/dist/fuse.min.js';
    s.onload = function () {
      fetch(BASE + 'assets/js/search-index.json')
        .then(function (r) { return r.json(); })
        .then(function (data) {
          fuse = new Fuse(data, {
            keys: [
              { name: 'title',       weight: 0.7 },
              { name: 'description', weight: 0.2 },
              { name: 'category',    weight: 0.1 },
            ],
            threshold: 0.35,
            minMatchCharLength: 2,
          });
          cb();
        })
        .catch(function () {
          results.innerHTML = '<p class="search-no-results">Search index could not be loaded.</p>';
        });
    };
    s.onerror = function () {
      results.innerHTML = '<p class="search-no-results">Search could not be loaded.</p>';
    };
    document.head.appendChild(s);
  }

  // ── Open / Close ───────────────────────────────────────────
  function openOverlay() {
    if (isOpen) return;
    isOpen = true;
    overlay.removeAttribute('hidden');
    // Trigger transition on next frame
    requestAnimationFrame(function () {
      overlay.classList.add('is-open');
    });
    document.body.style.overflow = 'hidden';
    initSearch(function () {
      input.focus();
      if (lastQuery) renderResults(lastQuery);
    });
  }

  function closeOverlay() {
    if (!isOpen) return;
    isOpen = false;
    overlay.classList.remove('is-open');
    document.body.style.overflow = '';
    focusedIndex = -1;
    setTimeout(function () {
      overlay.setAttribute('hidden', '');
    }, 160);
    if (searchBtn) searchBtn.focus();
  }

  // Set hidden initially so it doesn't appear on page load
  overlay.setAttribute('hidden', '');

  // ── Render results ─────────────────────────────────────────
  function renderResults(query) {
    lastQuery = query;
    focusedIndex = -1;

    if (!query || !fuse) {
      results.innerHTML = '<p class="search-empty-state">Type to search pages and documents</p>';
      return;
    }

    var hits = fuse.search(query, { limit: 8 });

    if (!hits.length) {
      results.innerHTML = '<p class="search-no-results">No results for <strong>' + esc(query) + '</strong></p>';
      return;
    }

    results.innerHTML = hits.map(function (hit) {
      var item  = hit.item;
      var isDoc = item.type === 'document';
      var icon  = '<div class="search-result-icon' + (isDoc ? ' search-result-icon--doc' : '') + '">' + (isDoc ? DOC_ICON : PAGE_ICON) + '</div>';
      var meta  = isDoc
        ? '<span class="search-result-badge">' + esc(item.category) + '</span>'
        : '<div class="search-result-meta">' + esc(item.section || '') + '</div>';

      return (
        '<button class="search-result-item" data-url="' + esc(item.url) + '" role="option" aria-selected="false">' +
          icon +
          '<div class="search-result-body">' +
            '<div class="search-result-title">' + esc(item.title) + '</div>' +
            meta +
          '</div>' +
        '</button>'
      );
    }).join('');

    results.querySelectorAll('.search-result-item').forEach(function (btn) {
      btn.addEventListener('click', function () {
        window.location.href = BASE + btn.dataset.url;
      });
    });
  }

  // ── Keyboard navigation ────────────────────────────────────
  function setFocused(idx) {
    var items = results.querySelectorAll('.search-result-item');
    items.forEach(function (el) {
      el.classList.remove('is-focused');
      el.setAttribute('aria-selected', 'false');
    });
    if (idx >= 0 && idx < items.length) {
      focusedIndex = idx;
      items[idx].classList.add('is-focused');
      items[idx].setAttribute('aria-selected', 'true');
      items[idx].scrollIntoView({ block: 'nearest' });
    } else {
      focusedIndex = -1;
    }
  }

  input.addEventListener('input', function () {
    renderResults(input.value.trim());
  });

  input.addEventListener('keydown', function (e) {
    var items = results.querySelectorAll('.search-result-item');
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocused(Math.min(focusedIndex + 1, items.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocused(focusedIndex > 0 ? focusedIndex - 1 : -1);
    } else if (e.key === 'Enter' && focusedIndex >= 0 && items[focusedIndex]) {
      window.location.href = BASE + items[focusedIndex].dataset.url;
    } else if (e.key === 'Escape') {
      closeOverlay();
    }
  });

  // ── Wire up triggers ───────────────────────────────────────
  if (searchBtn) {
    searchBtn.addEventListener('click', openOverlay);
  }
  closeBtn.addEventListener('click', closeOverlay);
  backdrop.addEventListener('click', closeOverlay);

  document.addEventListener('keydown', function (e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      isOpen ? closeOverlay() : openOverlay();
    } else if (e.key === 'Escape' && isOpen) {
      closeOverlay();
    }
  });
})();

/* ── Disclaimer Overlay System ───────────────────────────── */
(function() {
  // DOM Elements
  const disclaimerOverlay = document.getElementById('disclaimer-overlay');
  const acceptButton = document.getElementById('accept-disclaimer');
  const declineButton = document.getElementById('view-again-disclaimer');
  const closeButton = document.getElementById('disclaimer-close');

  // Check if user has previously accepted disclaimer
  const hasAcceptedDisclaimer = localStorage.getItem('manchesterlmc-disclaimer-accepted');

  // If not accepted, show disclaimer
  if (!hasAcceptedDisclaimer && disclaimerOverlay) {
    setTimeout(() => {
      disclaimerOverlay.classList.add('is-open');
      document.body.style.overflow = 'hidden';

      // Focus on accept button for accessibility
      acceptButton.focus();
    }, 100); // Small delay for page to render first
  }

  // Function to close disclaimer
  function closeDisclaimer() {
    disclaimerOverlay.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  // Function to accept disclaimer
  function acceptDisclaimer() {
    // Store acceptance in localStorage
    localStorage.setItem('manchesterlmc-disclaimer-accepted', 'true');

    // Close overlay
    closeDisclaimer();
  }

  // Event Listeners
  if (disclaimerOverlay) {
    // Accept button
    acceptButton.addEventListener('click', acceptDisclaimer);

    // View official site button
    if (declineButton) {
      declineButton.addEventListener('click', function() {
        window.location.href = 'https://www.manchesterlmc.co.uk';
      });
    }

    // Close button
    closeButton.addEventListener('click', closeDisclaimer);

    // Keyboard navigation
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && disclaimerOverlay.classList.contains('is-open')) {
        closeDisclaimer();
      }
    });

    // Click on backdrop to close
    const backdrop = document.getElementById('disclaimer-backdrop');
    if (backdrop) {
      backdrop.addEventListener('click', closeDisclaimer);
    }
  }
})();

// Make functions available globally for external access if needed
window.ManchesterLMC = window.ManchesterLMC || {};
window.ManchesterLMC.closeDisclaimer = closeDisclaimer;
window.ManchesterLMC.acceptDisclaimer = acceptDisclaimer;

/* ── View disclaimer link in footer ───────────────────────── */
document.addEventListener('DOMContentLoaded', function() {
  const viewDisclaimerLink = document.getElementById('view-disclaimer-link');
  if (viewDisclaimerLink) {
    viewDisclaimerLink.addEventListener('click', function(e) {
      e.preventDefault();
      localStorage.removeItem('manchesterlmc-disclaimer-accepted');
      location.reload();
    });
  }
});

