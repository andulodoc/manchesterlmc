(function () {

  const ROLE_TYPE_LABELS = {
    locum_gp: 'Locum GP', portfolio_gp: 'Portfolio GP',
    practice_staff: 'Practice Staff', gp_partner: 'GP Partner',
    salaried_gp: 'Salaried GP', other: 'Other',
  };

  const STATUS_BADGES = {
    active:    '<span class="badge badge--secondary">Active</span>',
    pending:   '<span class="badge badge--accent">Pending</span>',
    suspended: '<span class="badge" style="background:var(--colour-muted);color:#fff;">Suspended</span>',
  };

  let allUsers = [];
  let currentFilter = 'all';

  /* ── Boot ── */
  async function init() {
    const res = await fetch('/.netlify/functions/auth-status', {
      credentials: 'same-origin',
      headers: { 'X-Requested-With': 'XMLHttpRequest' },
    }).catch(() => null);

    document.getElementById('admin-loading').style.display = 'none';

    if (!res || !res.ok) return showDenied();
    const data = await res.json();
    if (!data.authenticated || data.role !== 'lmc_admin') return showDenied();

    document.getElementById('admin-content').style.display = 'block';
    loadUsers();
    loadAuditLog();
  }

  function showDenied() {
    document.getElementById('admin-access-denied').style.display = 'block';
  }

  /* ── Load users ── */
  async function loadUsers() {
    const res = await apiFetch('GET', '/.netlify/functions/admin-list-users');
    if (!res) return;
    allUsers = res.users || [];

    const pending   = allUsers.filter(u => u.status === 'pending');
    const active    = allUsers.filter(u => u.status === 'active');
    const suspended = allUsers.filter(u => u.status === 'suspended');

    document.getElementById('stat-pending').textContent   = pending.length;
    document.getElementById('stat-active').textContent    = active.length;
    document.getElementById('stat-suspended').textContent = suspended.length;

    const badge = document.getElementById('pending-badge');
    if (pending.length > 0) {
      badge.textContent = pending.length;
      badge.style.display = '';
    }

    renderPendingList(pending);
    renderMembersList(allUsers);
  }

  /* ── Pending list ── */
  function renderPendingList(users) {
    const el = document.getElementById('pending-list');
    if (users.length === 0) {
      el.innerHTML = '<p style="color:var(--colour-muted);">No pending registrations.</p>';
      return;
    }
    el.innerHTML = users.map(u => `
      <div class="member-resource-item" data-user-id="${u.id}" style="flex-wrap:wrap; gap:0.75rem; align-items:flex-start;">
        <div style="flex:1; min-width:200px;">
          <strong>${esc(u.first_name)} ${esc(u.last_name)}</strong>
          <div class="meta">${esc(u.email)}</div>
          <div class="meta">${ROLE_TYPE_LABELS[u.role_type] || u.role_type}
            ${u.email_confirmed ? '' : ' &middot; <span style="color:var(--colour-accent)">Email not verified</span>'}
          </div>
          <div class="meta">Registered ${formatDate(u.created_at)}</div>
        </div>
        <div style="display:flex; gap:0.5rem; flex-shrink:0; padding-top:0.25rem;">
          <button class="btn btn--sm btn--primary approve-btn" data-id="${u.id}">Approve</button>
          <button class="btn btn--sm btn--outline suspend-btn" data-id="${u.id}">Reject</button>
        </div>
      </div>
    `).join('');

    el.querySelectorAll('.approve-btn').forEach(btn =>
      btn.addEventListener('click', () => approveUser(btn.dataset.id)));
    el.querySelectorAll('.suspend-btn').forEach(btn =>
      btn.addEventListener('click', () => suspendUser(btn.dataset.id)));
  }

  /* ── Members list ── */
  function renderMembersList(users) {
    const filtered = users.filter(u => {
      if (currentFilter !== 'all' && u.status !== currentFilter) return false;
      const q = (document.getElementById('member-search').value || '').toLowerCase();
      if (!q) return true;
      return (u.first_name + ' ' + u.last_name + ' ' + u.email).toLowerCase().includes(q);
    });

    const el = document.getElementById('members-list');
    if (filtered.length === 0) {
      el.innerHTML = '<p style="color:var(--colour-muted);">No members found.</p>';
      return;
    }

    el.innerHTML = `
      <div style="overflow-x:auto;">
        <table style="width:100%; border-collapse:collapse; font-size:0.875rem;">
          <thead>
            <tr style="border-bottom:2px solid var(--colour-border); text-align:left;">
              <th style="padding:0.6rem 0.75rem;">Name</th>
              <th style="padding:0.6rem 0.75rem;">Email</th>
              <th style="padding:0.6rem 0.75rem;">Role type</th>
              <th style="padding:0.6rem 0.75rem;">Status</th>
              <th style="padding:0.6rem 0.75rem;">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${filtered.map(u => `
              <tr style="border-bottom:1px solid var(--colour-border);" data-user-id="${u.id}">
                <td style="padding:0.6rem 0.75rem;">${esc(u.first_name)} ${esc(u.last_name)}
                  ${u.role === 'lmc_admin' ? '<span class="badge badge--primary" style="margin-left:0.4rem;font-size:0.7rem;">Admin</span>' : ''}
                </td>
                <td style="padding:0.6rem 0.75rem; color:var(--colour-muted);">${esc(u.email)}</td>
                <td style="padding:0.6rem 0.75rem;">${ROLE_TYPE_LABELS[u.role_type] || u.role_type}</td>
                <td style="padding:0.6rem 0.75rem;">${STATUS_BADGES[u.status] || u.status}</td>
                <td style="padding:0.6rem 0.75rem;">
                  <div style="display:flex; gap:0.4rem; flex-wrap:wrap;">
                    ${u.status !== 'active'    ? `<button class="btn btn--sm btn--primary approve-btn" data-id="${u.id}">Approve</button>` : ''}
                    ${u.status !== 'suspended' ? `<button class="btn btn--sm btn--outline suspend-btn" data-id="${u.id}" style="color:var(--colour-accent);">Suspend</button>` : ''}
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;

    el.querySelectorAll('.approve-btn').forEach(btn =>
      btn.addEventListener('click', () => approveUser(btn.dataset.id)));
    el.querySelectorAll('.suspend-btn').forEach(btn =>
      btn.addEventListener('click', () => suspendUser(btn.dataset.id)));
  }

  /* ── Audit log ── */
  async function loadAuditLog() {
    const res = await apiFetch('GET', '/.netlify/functions/admin-audit-log');
    if (!res) return;
    const entries = res.entries || [];
    const el = document.getElementById('audit-list');

    if (entries.length === 0) {
      el.innerHTML = '<p style="color:var(--colour-muted);">No audit log entries.</p>';
      return;
    }

    el.innerHTML = `
      <div style="overflow-x:auto;">
        <table style="width:100%; border-collapse:collapse; font-size:0.875rem;">
          <thead>
            <tr style="border-bottom:2px solid var(--colour-border); text-align:left;">
              <th style="padding:0.6rem 0.75rem;">Time</th>
              <th style="padding:0.6rem 0.75rem;">User</th>
              <th style="padding:0.6rem 0.75rem;">Action</th>
              <th style="padding:0.6rem 0.75rem;">IP hash</th>
            </tr>
          </thead>
          <tbody>
            ${entries.map(e => `
              <tr style="border-bottom:1px solid var(--colour-border);">
                <td style="padding:0.6rem 0.75rem; color:var(--colour-muted); white-space:nowrap;">${formatDate(e.created_at)}</td>
                <td style="padding:0.6rem 0.75rem;">${esc(e.user_name)}</td>
                <td style="padding:0.6rem 0.75rem;"><code style="font-size:0.8rem; background:var(--colour-neutral); padding:0.1em 0.4em; border-radius:3px;">${esc(e.action)}</code></td>
                <td style="padding:0.6rem 0.75rem; color:var(--colour-muted); font-family:monospace; font-size:0.75rem;">${e.ip_hash || '—'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  /* ── Actions ── */
  async function approveUser(userId) {
    const row = document.querySelector(`[data-user-id="${userId}"]`);
    if (!confirm('Approve this account?')) return;
    setRowLoading(row, true);
    const res = await apiFetch('POST', '/.netlify/functions/admin-approve', { userId });
    if (res?.ok) {
      await loadUsers();
      loadAuditLog();
    }
  }

  async function suspendUser(userId) {
    const row = document.querySelector(`[data-user-id="${userId}"]`);
    if (!confirm('Suspend this account? Their active sessions will be revoked immediately.')) return;
    setRowLoading(row, true);
    const res = await apiFetch('POST', '/.netlify/functions/admin-suspend', { userId });
    if (res?.ok) {
      await loadUsers();
      loadAuditLog();
    }
  }

  /* ── Tab switching ── */
  document.querySelectorAll('[data-admin-tab]').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.adminTab;
      document.querySelectorAll('[data-admin-tab]').forEach(b => {
        const active = b === btn;
        b.setAttribute('aria-selected', active ? 'true' : 'false');
        b.style.fontWeight = active ? '600' : '400';
        b.style.color = active ? 'var(--colour-primary)' : 'var(--colour-muted)';
        b.style.borderBottom = active ? '3px solid var(--colour-primary)' : '3px solid transparent';
      });
      document.getElementById('panel-pending').style.display  = tab === 'pending'  ? '' : 'none';
      document.getElementById('panel-members').style.display  = tab === 'members'  ? '' : 'none';
      document.getElementById('panel-audit').style.display    = tab === 'audit'    ? '' : 'none';
    });
  });

  /* ── Filter buttons ── */
  document.querySelectorAll('.member-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.member-filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      renderMembersList(allUsers);
    });
  });

  /* ── Search ── */
  document.getElementById('member-search').addEventListener('input', () => {
    renderMembersList(allUsers);
  });

  /* ── Helpers ── */
  async function apiFetch(method, url, body) {
    try {
      const opts = {
        method,
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
      };
      if (body) opts.body = JSON.stringify(body);
      const res = await fetch(url, opts);
      return await res.json();
    } catch (e) {
      console.error('API error:', e);
      return null;
    }
  }

  function setRowLoading(row, loading) {
    if (!row) return;
    row.querySelectorAll('button').forEach(b => { b.disabled = loading; });
  }

  function esc(str) {
    return String(str || '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function formatDate(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }

  init();
})();
