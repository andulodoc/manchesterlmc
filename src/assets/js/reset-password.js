(function () {

  function show(id) {
    ['reset-loading','reset-invalid','reset-form-panel','reset-success','reset-already-logged-in']
      .forEach(el => {
        const node = document.getElementById(el);
        if (node) node.style.display = el === id ? '' : 'none';
      });
  }

  // Extract token from URL — Supabase puts it in the hash as access_token
  // or in query params as token_hash depending on flow setting
  function getToken() {
    // Check query params first (newer PKCE-adjacent flows)
    const params = new URLSearchParams(window.location.search);
    if (params.get('token_hash')) return { token: params.get('token_hash'), source: 'query' };

    // Fall back to URL hash (implicit flow)
    const hash = new URLSearchParams(window.location.hash.slice(1));
    if (hash.get('access_token') && hash.get('type') === 'recovery') {
      return { token: hash.get('access_token'), source: 'hash' };
    }

    return null;
  }

  async function init() {
    // If no token in URL, this page was visited directly
    const tokenData = getToken();
    if (!tokenData) {
      show('reset-invalid');
      return;
    }

    // Check if already logged in (shouldn't reset if they have an active session)
    try {
      const statusRes = await fetch('/.netlify/functions/auth-status', {
        credentials: 'same-origin',
        headers: { 'X-Requested-With': 'XMLHttpRequest' },
      });
      const status = await statusRes.json();
      if (status.authenticated) {
        show('reset-already-logged-in');
        return;
      }
    } catch { /* non-fatal */ }

    // Token present — show the form
    show('reset-form-panel');

    // Wire up form
    const form = document.getElementById('reset-password-form');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = form.querySelector('[type="submit"]');
      const errBox = document.getElementById('reset-form-error');
      const errMsg = document.getElementById('reset-form-error-msg');

      const password  = document.getElementById('new-password').value;
      const password2 = document.getElementById('new-password2').value;

      errBox.style.display = 'none';

      if (password.length < 8) {
        errMsg.textContent = 'Password must be at least 8 characters.';
        errBox.style.display = 'flex';
        return;
      }
      if (password !== password2) {
        errMsg.textContent = 'Passwords do not match.';
        errBox.style.display = 'flex';
        return;
      }

      btn.disabled = true;
      btn.textContent = 'Updating…';

      try {
        const res = await fetch('/.netlify/functions/auth-reset-password', {
          method: 'POST',
          credentials: 'same-origin',
          headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
          },
          body: JSON.stringify({ token: tokenData.token, password }),
        });

        const data = await res.json();

        if (res.ok && data.ok) {
          // Clear the token from the URL so it can't be reused from history
          history.replaceState(null, '', window.location.pathname);
          show('reset-success');
        } else {
          errMsg.textContent = data.error || 'Unable to reset password. Please request a new link.';
          errBox.style.display = 'flex';
          btn.disabled = false;
          btn.textContent = 'Set New Password';
        }
      } catch {
        errMsg.textContent = 'A network error occurred. Please try again.';
        errBox.style.display = 'flex';
        btn.disabled = false;
        btn.textContent = 'Set New Password';
      }
    });
  }

  init();
})();
