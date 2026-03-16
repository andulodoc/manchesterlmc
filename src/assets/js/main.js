/* ============================================================
   Manchester LMC — main.js
   Vanilla JS: nav, tabs, accordion, filter, search, disclaimer
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
  if (!hamburger || !mobileNav) return;

  const toggle = (open) => {
    hamburger.classList.toggle('open', open);
    mobileNav.classList.toggle('open', open);
    hamburger.setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('nav-open', open);
  };

  hamburger.addEventListener('click', () => toggle(!hamburger.classList.contains('open')));

  mobileNav.addEventListener('click', (e) => {
    const link = e.target.closest('a');
    if (link && !link.dataset.toggle) toggle(false);
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
      chips.forEach((c) => { c.classList.remove('active'); c.setAttribute('aria-pressed', 'false'); });
      chip.classList.add('active');
      chip.setAttribute('aria-pressed', 'true');
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

    const noResults = document.getElementById(targetId.replace('list', 'no-results'));

    const applyFilter = (category) => {
      let visible = 0;
      list.querySelectorAll('[data-category]').forEach((item) => {
        const cat = (item.dataset.category || '').toLowerCase();
        const show = category === 'all' || cat === category;
        item.style.display = show ? '' : 'none';
        if (show) visible++;
      });
      if (noResults) {
        noResults.hidden = visible > 0;
      }
    };

    chips.forEach((chip) => {
      chip.addEventListener('click', () => {
        chips.forEach((c) => { c.classList.remove('active'); c.setAttribute('aria-pressed', 'false'); });
        chip.classList.add('active');
        chip.setAttribute('aria-pressed', 'true');
        applyFilter(chip.dataset.category || 'all');
      });
    });

    // Support deep-linking via ?category=slug
    const params = new URLSearchParams(window.location.search);
    const preselect = params.get('category');
    if (preselect) {
      const match = [...chips].find((c) => c.dataset.category === preselect);
      if (match) {
        chips.forEach((c) => { c.classList.remove('active'); c.setAttribute('aria-pressed', 'false'); });
        match.classList.add('active');
        match.setAttribute('aria-pressed', 'true');
        applyFilter(preselect);
      }
    }
  });
})();

/* ── Vacancy post-a-vacancy auth gate ─────────────────────── */
/* Driven by auth state — see auth module below. */
(function () {
  window.__manchesterLMC = window.__manchesterLMC || {};
  window.__manchesterLMC.updateVacancyGate = function (authenticated) {
    const authGate = document.getElementById('vacancy-auth-gate');
    const form = document.getElementById('vacancy-form');
    if (!authGate || !form) return;
    if (authenticated) {
      authGate.style.display = 'none';
      form.style.display = 'block';
    } else {
      authGate.style.display = 'block';
      form.style.display = 'none';
    }
  };
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


/* ── Search overlay (native, no CDN) ─────────────────────── */
(function () {
  var PAGE_ICON = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>';
  var DOC_ICON  = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>';

  document.body.insertAdjacentHTML('beforeend',
    '<div id="search-overlay" class="search-overlay" role="dialog" aria-modal="true" aria-label="Search Manchester LMC">' +
      '<div class="search-backdrop" id="search-backdrop"></div>' +
      '<div class="search-dialog">' +
        '<div class="search-input-row">' +
          '<span class="search-input-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></span>' +
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

  var overlay   = document.getElementById('search-overlay');
  var input     = document.getElementById('search-input');
  var results   = document.getElementById('search-results');
  var searchBtn = document.querySelector('.nav-search-btn');
  var index     = null;
  var focused   = -1;
  var isOpen    = false;

  function esc(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function loadIndex(cb) {
    if (index) { cb(); return; }
    fetch('/assets/js/search-index.json')
      .then(function (r) { return r.json(); })
      .then(function (data) { index = data; cb(); })
      .catch(function () { results.innerHTML = '<p class="search-no-results">Search index could not be loaded.</p>'; });
  }

  function open() {
    if (isOpen) return;
    isOpen = true;
    overlay.removeAttribute('hidden');
    requestAnimationFrame(function () { overlay.classList.add('is-open'); });
    document.body.style.overflow = 'hidden';
    loadIndex(function () { input.focus(); });
  }

  function close() {
    if (!isOpen) return;
    isOpen = false;
    overlay.classList.remove('is-open');
    document.body.style.overflow = '';
    focused = -1;
    setTimeout(function () { overlay.setAttribute('hidden', ''); }, 160);
    if (searchBtn) searchBtn.focus();
  }

  overlay.setAttribute('hidden', '');

  function render(query) {
    focused = -1;
    if (!query || !index) { results.innerHTML = '<p class="search-empty-state">Type to search pages and documents</p>'; return; }
    var q = query.toLowerCase();
    var hits = index.filter(function (item) {
      return (item.title||'').toLowerCase().includes(q) || (item.description||'').toLowerCase().includes(q) || (item.category||'').toLowerCase().includes(q);
    }).slice(0, 8);
    if (!hits.length) { results.innerHTML = '<p class="search-no-results">No results for <strong>' + esc(query) + '</strong></p>'; return; }
    results.innerHTML = hits.map(function (item) {
      var isDoc = item.type === 'document';
      return '<button class="search-result-item" data-url="' + esc(item.url) + '" role="option" aria-selected="false">' +
        '<div class="search-result-icon' + (isDoc ? ' search-result-icon--doc' : '') + '">' + (isDoc ? DOC_ICON : PAGE_ICON) + '</div>' +
        '<div class="search-result-body"><div class="search-result-title">' + esc(item.title) + '</div>' +
        '<div class="search-result-meta">' + esc(item.category||'') + '</div></div></button>';
    }).join('');
    results.querySelectorAll('.search-result-item').forEach(function (btn) {
      btn.addEventListener('click', function () { window.location.href = btn.dataset.url; });
    });
  }

  function setFocus(idx) {
    var items = results.querySelectorAll('.search-result-item');
    items.forEach(function (el) { el.classList.remove('is-focused'); el.setAttribute('aria-selected','false'); });
    if (idx >= 0 && idx < items.length) { focused = idx; items[idx].classList.add('is-focused'); items[idx].setAttribute('aria-selected','true'); items[idx].scrollIntoView({block:'nearest'}); }
    else { focused = -1; }
  }

  input.addEventListener('input', function () { render(input.value.trim()); });
  input.addEventListener('keydown', function (e) {
    var items = results.querySelectorAll('.search-result-item');
    if (e.key==='ArrowDown') { e.preventDefault(); setFocus(Math.min(focused+1, items.length-1)); }
    else if (e.key==='ArrowUp') { e.preventDefault(); setFocus(focused>0 ? focused-1 : -1); }
    else if (e.key==='Enter' && focused>=0 && items[focused]) { window.location.href = items[focused].dataset.url; }
    else if (e.key==='Escape') { close(); }
  });

  document.querySelectorAll('.nav-search-btn').forEach(function (btn) { btn.addEventListener('click', open); });
  document.getElementById('search-close').addEventListener('click', close);
  document.getElementById('search-backdrop').addEventListener('click', close);
  document.addEventListener('keydown', function (e) {
    if ((e.ctrlKey||e.metaKey) && e.key==='k') { e.preventDefault(); isOpen ? close() : open(); }
    else if (e.key==='Escape' && isOpen) { close(); }
  });
})();


/* ── Disclaimer (native <dialog>) ────────────────────────── */
(function () {
  const dialog = document.getElementById('disclaimer-overlay');
  if (!dialog) return;

  if (!localStorage.getItem('manchesterlmc-disclaimer-accepted')) {
    dialog.showModal();
  }

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function animatedClose(callback) {
    if (reducedMotion) {
      dialog.close();
      if (callback) callback();
      return;
    }
    dialog.classList.add('closing');
    dialog.addEventListener('animationend', function handler() {
      dialog.removeEventListener('animationend', handler);
      dialog.classList.remove('closing');
      dialog.close();
      if (callback) callback();
    });
  }

  function accept() {
    localStorage.setItem('manchesterlmc-disclaimer-accepted', 'true');
    animatedClose();
  }

  document.getElementById('accept-disclaimer').addEventListener('click', accept);

  const decline = document.getElementById('view-again-disclaimer');
  if (decline) decline.addEventListener('click', () => { window.location.href = 'https://www.manchesterlmc.co.uk'; });

  const viewLink = document.getElementById('view-disclaimer-link');
  if (viewLink) viewLink.addEventListener('click', (e) => { e.preventDefault(); localStorage.removeItem('manchesterlmc-disclaimer-accepted'); location.reload(); });
})();

/* ── Members area auth ─────────────────────────────────────────
   Handles login, register, logout, and auth-state-driven UI.
   All tokens are stored server-side in httpOnly cookies —
   never in localStorage or sessionStorage.
   ─────────────────────────────────────────────────────────── */
(function () {

  /* ── Auth state check on page load ── */
  async function checkAuthState() {
    try {
      const res = await fetch('/.netlify/functions/auth-status', {
        method: 'GET',
        credentials: 'same-origin',
        headers: { 'X-Requested-With': 'XMLHttpRequest' },
      });
      if (!res.ok) return setUnauthenticated();
      const data = await res.json();
      if (data.authenticated) {
        setAuthenticated(data.displayName, data.role);
      } else {
        setUnauthenticated();
      }
    } catch {
      setUnauthenticated();
    }
  }

  function setAuthenticated(displayName, role) {
    // Members page: show content, hide login/register panels
    const loginSection = document.querySelector('.auth-tabs');
    const loginPanel   = document.getElementById('panel-login');
    const registerPanel = document.getElementById('panel-register');
    const memberContent = document.getElementById('member-content');
    const loggedInAs    = document.getElementById('member-display-name');

    if (loginSection)   loginSection.style.display = 'none';
    if (loginPanel)     loginPanel.style.display = 'none';
    if (registerPanel)  registerPanel.style.display = 'none';
    if (memberContent) {
      memberContent.style.display = 'block';
      if (loggedInAs) loggedInAs.textContent = displayName;
    }

    // Show admin link if lmc_admin
    const adminLink = document.getElementById('nav-admin-link');
    if (adminLink && role === 'lmc_admin') adminLink.style.display = '';

    // Update vacancy gate
    if (window.__manchesterLMC?.updateVacancyGate) {
      window.__manchesterLMC.updateVacancyGate(true);
    }

    // Update nav login/register buttons
    const navLogin    = document.querySelector('.nav-utility-btn[href="/members/"]');
    const navRegister = document.querySelector('.nav-utility-btn[href="/members/#register"]');
    if (navLogin) { navLogin.textContent = displayName.split(' ')[0]; navLogin.href = '/members/'; }
    if (navRegister) navRegister.style.display = 'none';
  }

  function setUnauthenticated() {
    if (window.__manchesterLMC?.updateVacancyGate) {
      window.__manchesterLMC.updateVacancyGate(false);
    }
  }

  /* ── Login form ── */
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = loginForm.querySelector('[type="submit"]');
      const errorBox = document.getElementById('login-error');
      const errorMsg = errorBox?.querySelector('div');

      btn.disabled = true;
      btn.textContent = 'Logging in…';
      if (errorBox) errorBox.style.display = 'none';

      try {
        const res = await fetch('/.netlify/functions/auth-login', {
          method: 'POST',
          credentials: 'same-origin',
          headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
          },
          body: JSON.stringify({
            email: loginForm.querySelector('#login-email').value.trim(),
            password: loginForm.querySelector('#login-password').value,
          }),
        });

        const data = await res.json();

        if (res.ok && data.ok) {
          setAuthenticated(data.displayName, data.role);
          // Scroll to member content
          document.getElementById('member-content')?.scrollIntoView({ behavior: 'smooth' });
        } else {
          if (errorBox) {
            errorBox.style.display = 'flex';
            if (errorMsg) errorMsg.textContent = data.error || 'Login failed. Please try again.';
          }
          btn.disabled = false;
          btn.textContent = 'Log In';
        }
      } catch {
        if (errorBox) {
          errorBox.style.display = 'flex';
          if (errorMsg) (errorMsg).textContent = 'A network error occurred. Please try again.';
        }
        btn.disabled = false;
        btn.textContent = 'Log In';
      }
    });
  }

  /* ── Register form ── */
  const registerForm = document.getElementById('register-form');
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = registerForm.querySelector('[type="submit"]');

      btn.disabled = true;
      btn.textContent = 'Submitting…';

      const password  = registerForm.querySelector('#reg-password').value;
      const password2 = registerForm.querySelector('#reg-password2').value;

      if (password !== password2) {
        showFormError(registerForm, 'Passwords do not match.');
        btn.disabled = false;
        btn.textContent = 'Register & Proceed to Payment';
        return;
      }

      try {
        const res = await fetch('/.netlify/functions/auth-register', {
          method: 'POST',
          credentials: 'same-origin',
          headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
          },
          body: JSON.stringify({
            firstname: registerForm.querySelector('#reg-firstname').value.trim(),
            lastname:  registerForm.querySelector('#reg-lastname').value.trim(),
            email:     registerForm.querySelector('#reg-email').value.trim(),
            gmc:       registerForm.querySelector('#reg-gmc').value.trim(),
            role:      registerForm.querySelector('#reg-role').value,
            password,
            password2,
          }),
        });

        const data = await res.json();

        if (res.ok && data.ok) {
          registerForm.innerHTML =
            '<div class="alert alert--success" style="margin-top:1rem">' +
            '<div>' + (data.message || 'Registration received. Please check your email.') + '</div>' +
            '</div>';
        } else {
          showFormError(registerForm, data.error || 'Registration failed. Please try again.');
          btn.disabled = false;
          btn.textContent = 'Register & Proceed to Payment';
        }
      } catch {
        showFormError(registerForm, 'A network error occurred. Please try again.');
        btn.disabled = false;
        btn.textContent = 'Register & Proceed to Payment';
      }
    });
  }

  /* ── Logout button ── */
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      logoutBtn.disabled = true;
      logoutBtn.textContent = 'Logging out…';
      try {
        await fetch('/.netlify/functions/auth-logout', {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'X-Requested-With': 'XMLHttpRequest' },
        });
      } finally {
        // Reload to show the login form again
        window.location.reload();
      }
    });
  }

  /* ── Utility: show an error message above a form's submit button ── */
  function showFormError(form, message) {
    let box = form.querySelector('.form-error-box');
    if (!box) {
      box = document.createElement('div');
      box.className = 'alert alert--warning form-error-box';
      box.style.marginTop = '1rem';
      const btn = form.querySelector('[type="submit"]');
      form.insertBefore(box, btn);
    }
    box.textContent = message;
    box.style.display = 'flex';
  }

  /* ── Forgot password inline form ── */
  const forgotPanel  = document.getElementById('forgot-panel');
  const forgotLink   = document.getElementById('forgot-link');
  const resetErrLink = document.getElementById('reset-link-in-error');
  const forgotCancel = document.getElementById('forgot-cancel');
  const forgotForm   = document.getElementById('forgot-form');

  function showForgotPanel() {
    if (!forgotPanel) return;
    forgotPanel.style.display = '';
    document.getElementById('forgot-email')?.focus();
  }

  if (forgotLink) {
    forgotLink.addEventListener('click', (e) => { e.preventDefault(); showForgotPanel(); });
  }
  if (resetErrLink) {
    resetErrLink.addEventListener('click', (e) => { e.preventDefault(); showForgotPanel(); });
  }
  if (forgotCancel) {
    forgotCancel.addEventListener('click', () => { forgotPanel.style.display = 'none'; });
  }

  if (forgotForm) {
    forgotForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn     = forgotForm.querySelector('[type="submit"]');
      const success = document.getElementById('forgot-success');

      btn.disabled = true;
      btn.textContent = 'Sending…';

      try {
        await fetch('/.netlify/functions/auth-reset-password', {
          method: 'POST',
          credentials: 'same-origin',
          headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
          },
          body: JSON.stringify({
            email: document.getElementById('forgot-email').value.trim(),
          }),
        });
      } finally {
        // Always show the generic success message regardless of response
        forgotForm.style.display = 'none';
        if (success) success.style.display = 'flex';
        btn.disabled = false;
        btn.textContent = 'Send Reset Link';
      }
    });
  }

  /* ── Run on load ── */
  checkAuthState();

})();
