(() => {
  'use strict';

  const text = value => String(value ?? '').trim();
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[char]));

  function formatAssignedAt(value) {
    if (!value) return 'Not assigned';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? 'Not assigned' : date.toLocaleString('en-GB');
  }

  function currentAssignTable() {
    const heading = document.querySelector('#pageContent .page-head h1');
    if (text(heading?.textContent) !== 'Assign') return null;
    return document.querySelector('#pageContent table.data-table');
  }

  function selectedAddress() {
    return document.querySelector('[data-filter="address"]')?.value || 'all';
  }

  function selectedParty() {
    return document.getElementById('globalParty')?.value || 'all';
  }

  function currentSearch() {
    return document.getElementById('searchInput')?.value || '';
  }

  function buildLink() {
    const link = new URL('../shared.html', location.href);
    link.searchParams.set('mode', 'self-assign');
    link.searchParams.set('house', selectedAddress());
    link.searchParams.set('party', selectedParty());
    if (currentSearch()) link.searchParams.set('search', currentSearch());
    return link.href;
  }

  function addShareToolbar(table) {
    if (document.querySelector('.self-assign-share-toolbar')) return;

    document.querySelector('.share-toolbar')?.remove();
    document.querySelector('.bulk-assign-toolbar')?.remove();

    const toolbar = document.createElement('div');
    toolbar.className = 'share-toolbar self-assign-share-toolbar';
    toolbar.innerHTML = `
      <div>
        <strong>Create self-assignment link</strong>
        <small>Uses the current address, party and search filters.</small>
      </div>
      <button id="copySelfAssignLink" class="btn primary" type="button">Generate Share Link</button>`;

    const wrap = table.closest('.table-wrap');
    wrap.parentNode.insertBefore(toolbar, wrap);
  }

  function addAssignedTimeColumn(table) {
    if (table.dataset.assignedTimeReady === '1') return;
    table.dataset.assignedTimeReady = '1';

    const header = table.querySelector('thead tr');
    const actionHead = [...header.children].find(cell => text(cell.textContent) === 'Action');
    const timeHead = document.createElement('th');
    timeHead.textContent = 'Assigned Time';
    header.insertBefore(timeHead, actionHead || null);

    table.querySelectorAll('tbody tr').forEach(row => {
      const edit = row.querySelector('[data-edit-id]');
      if (!edit) return;
      const timeCell = document.createElement('td');
      timeCell.className = 'assigned-time-cell';
      timeCell.textContent = 'Loading…';
      row.insertBefore(timeCell, edit.closest('td'));
    });

    loadAssignedTimes(table);
  }

  async function loadAssignedTimes(table) {
    const cfg = window.CampaignConfig;
    if (!cfg || !window.supabase) return;

    const db = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseKey, {
      auth: { persistSession:true, autoRefreshToken:true }
    });

    const rows = [...table.querySelectorAll('tbody tr')];
    const ids = rows.map(row => row.querySelector('[data-edit-id]')?.dataset.editId).filter(Boolean);
    if (!ids.length) return;

    const { data, error } = await db.from(cfg.tableName)
      .select('id,vote_assigned_at')
      .in('id', ids);

    if (error) return;
    const map = new Map((data || []).map(item => [String(item.id), item.vote_assigned_at]));

    rows.forEach(row => {
      const id = row.querySelector('[data-edit-id]')?.dataset.editId;
      const cell = row.querySelector('.assigned-time-cell');
      if (id && cell) cell.textContent = formatAssignedAt(map.get(String(id)));
    });
  }

  function decorate() {
    const table = currentAssignTable();
    if (!table) return;
    addShareToolbar(table);
    addAssignedTimeColumn(table);
  }

  document.addEventListener('click', event => {
    if (event.target.id !== 'copySelfAssignLink') return;
    const link = buildLink();
    navigator.clipboard?.writeText(link)
      .then(() => alert('Self-assignment link copied.'))
      .catch(() => prompt('Copy this link:', link));
  });

  new MutationObserver(decorate).observe(document.documentElement, {
    childList:true,
    subtree:true
  });

  decorate();
})();