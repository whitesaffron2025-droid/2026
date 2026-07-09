// js/app.js
// Fresh 2026 Campaign Manager
// Uses existing js/config.js only. Supabase config/table remain unchanged.

(function () {
  'use strict';

  const state = {
    rows: [],
    filtered: [],
    section: 'dashboard',
    search: '',
    party: 'all',
    page: 1,
    pageSize: 20
  };

  const SECTIONS = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'residents', label: 'Residents' },
    { id: 'assign', label: 'Assign' },
    { id: 'calls', label: 'Calls' },
    { id: 'votes', label: 'Votes' },
    { id: 'visits', label: 'Visits' },
    { id: 'transport', label: 'Transport' },
    { id: 'reports', label: 'Reports' }
  ];

  function $(id) {
    return document.getElementById(id);
  }

  function text(value) {
    return String(value || '').trim();
  }

  function esc(value) {
    return text(value).replace(/[&<>"']/g, function (char) {
      return {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      }[char];
    });
  }

  function status(value, fallback) {
    return text(value) || fallback;
  }

  function setSection(section) {
    state.section = SECTIONS.some(function (s) { return s.id === section; }) ? section : 'dashboard';
    state.page = 1;
    const url = new URL(window.location.href);
    url.searchParams.set('section', state.section);
    window.history.replaceState({}, '', url);
    render();
  }

  async function fetchRows() {
    const cfg = window.CampaignConfig;
    if (!cfg || !cfg.supabaseUrl || !cfg.supabaseKey || !cfg.tableName) {
      throw new Error('Missing CampaignConfig in js/config.js');
    }

    let all = [];
    let from = 0;
    const batchSize = cfg.batchSize || 1000;

    while (true) {
      const url =
        `${cfg.supabaseUrl}/rest/v1/${encodeURIComponent(cfg.tableName)}` +
        '?select=*&order=house.asc.nullslast&order=id.asc';

      const res = await fetch(url, {
        headers: {
          apikey: cfg.supabaseKey,
          Authorization: `Bearer ${cfg.supabaseKey}`,
          Range: `${from}-${from + batchSize - 1}`,
          'Range-Unit': 'items'
        }
      });

      if (!res.ok) {
        throw new Error(`Supabase load failed ${res.status}: ${await res.text()}`);
      }

      const batch = await res.json();
      all = all.concat(batch || []);
      if (!batch || batch.length < batchSize) break;
      from += batchSize;
    }

    return all;
  }

  async function updateRow(id, patch) {
    const cfg = window.CampaignConfig;
    const res = await fetch(
      `${cfg.supabaseUrl}/rest/v1/${encodeURIComponent(cfg.tableName)}?id=eq.${encodeURIComponent(id)}`,
      {
        method: 'PATCH',
        headers: {
          apikey: cfg.supabaseKey,
          Authorization: `Bearer ${cfg.supabaseKey}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation'
        },
        body: JSON.stringify(patch)
      }
    );

    if (!res.ok) {
      throw new Error(`Save failed ${res.status}: ${await res.text()}`);
    }

    return res.json();
  }

  function sectionRows() {
    let rows = state.rows.slice();

    if (state.party !== 'all') {
      rows = rows.filter(function (r) { return text(r.party).toUpperCase() === state.party; });
    }

    if (state.search) {
      const q = state.search.toLowerCase();
      rows = rows.filter(function (r) {
        return [
          r.name,
          r.national_id,
          r.phone,
          r.house,
          r.lives_in,
          r.living_place,
          r.party,
          r.remarks,
          r.vote_assigned_by
        ].map(function (v) { return text(v).toLowerCase(); }).join(' ').includes(q);
      });
    }

    if (state.section === 'assign') {
      rows = rows.filter(function (r) { return !text(r.vote_assigned_by); });
    }

    if (state.section === 'calls') {
      rows = rows.filter(function (r) { return status(r.phone_status, 'need-call') === 'need-call'; });
    }

    if (state.section === 'votes') {
      rows = rows.filter(function (r) { return status(r.vote_status, 'not-decided') === 'not-decided'; });
    }

    if (state.section === 'visits') {
      rows = rows.filter(function (r) { return status(r.d2d_status, 'not-visited') === 'not-visited'; });
    }

    if (state.section === 'transport') {
      rows = rows.filter(function (r) { return status(r.transport_status, 'not-needed') === 'need-transport'; });
    }

    return rows.sort(function (a, b) {
      return (
        text(a.house).localeCompare(text(b.house), undefined, { numeric: true }) ||
        text(a.name).localeCompare(text(b.name))
      );
    });
  }

  function metrics() {
    const rows = state.rows;
    return {
      total: rows.length,
      unassigned: rows.filter(function (r) { return !text(r.vote_assigned_by); }).length,
      needCall: rows.filter(function (r) { return status(r.phone_status, 'need-call') === 'need-call'; }).length,
      notDecided: rows.filter(function (r) { return status(r.vote_status, 'not-decided') === 'not-decided'; }).length,
      willVote: rows.filter(function (r) { return status(r.vote_status, 'not-decided') === 'will-vote'; }).length,
      notVisited: rows.filter(function (r) { return status(r.d2d_status, 'not-visited') === 'not-visited'; }).length,
      needTransport: rows.filter(function (r) { return status(r.transport_status, 'not-needed') === 'need-transport'; }).length,
      remarks: rows.filter(function (r) { return !!text(r.remarks); }).length
    };
  }

  function renderShell() {
    document.body.innerHTML = `
      <header class="topbar">
        <a class="brand" href="./" aria-label="Home">
          <span class="brand-mark">2026</span>
          <span>
            <strong>Campaign Manager</strong>
            <small id="connectionStatus">Loading...</small>
          </span>
        </a>
        <nav id="nav" class="nav" aria-label="Workflow navigation"></nav>
      </header>

      <main class="shell">
        <section class="hero">
          <div>
            <p class="eyebrow">Clean workflow</p>
            <h1 id="pageTitle">Campaign Dashboard</h1>
            <p class="hero-text">Each section is a focused work queue: assign, call, vote, visit, transport, and report.</p>
          </div>
        </section>

        <section class="toolbar" aria-label="Filters">
          <label>Search
            <input id="searchInput" type="search" placeholder="Name, ID, phone, house" autocomplete="off">
          </label>
          <label>Party
            <select id="partyFilter">
              <option value="all">All</option>
              <option value="PNC">PNC</option>
              <option value="MDP">MDP</option>
            </select>
          </label>
          <label>Page size
            <select id="pageSize">
              <option value="20">20</option>
              <option value="50">50</option>
            </select>
          </label>
        </section>

        <section id="dashboard"></section>
        <section id="content"></section>
      </main>

      <dialog id="editDialog" class="modal"></dialog>
    `;
  }

  function renderNav() {
    $('nav').innerHTML = SECTIONS.map(function (s) {
      return `<button class="nav-btn ${state.section === s.id ? 'active' : ''}" data-section="${s.id}">${s.label}</button>`;
    }).join('');
  }

  function renderDashboard() {
    const m = metrics();
    $('dashboard').innerHTML = `
      <div class="kpi-grid">
        ${kpi('Residents', m.total, 'residents')}
        ${kpi('Unassigned', m.unassigned, 'assign')}
        ${kpi('Need Call', m.needCall, 'calls')}
        ${kpi('Need Vote Decision', m.notDecided, 'votes')}
        ${kpi('Will Vote', m.willVote, 'residents')}
        ${kpi('Not Visited', m.notVisited, 'visits')}
        ${kpi('Need Transport', m.needTransport, 'transport')}
        ${kpi('With Remarks', m.remarks, 'residents')}
      </div>
    `;
  }

  function kpi(label, value, section) {
    return `
      <button class="kpi" data-section="${section}">
        <span>${esc(label)}</span>
        <strong>${Number(value || 0).toLocaleString()}</strong>
      </button>
    `;
  }

  function sectionTitle() {
    return {
      dashboard: 'Campaign Dashboard',
      residents: 'Residents',
      assign: 'Unassigned Voters',
      calls: 'Need Call',
      votes: 'Need Vote Decision',
      visits: 'Need D2D Visit',
      transport: 'Need Transport',
      reports: 'Reports'
    }[state.section] || 'Residents';
  }

  function renderContent() {
    $('pageTitle').textContent = sectionTitle();

    if (state.section === 'dashboard') {
      $('dashboard').style.display = '';
      $('content').innerHTML = '';
      return;
    }

    if (state.section === 'reports') {
      $('dashboard').style.display = 'none';
      renderReports();
      return;
    }

    $('dashboard').style.display = 'none';
    const rows = sectionRows();
    state.filtered = rows;
    const start = (state.page - 1) * state.pageSize;
    const pageRows = rows.slice(start, start + state.pageSize);
    const totalPages = Math.max(1, Math.ceil(rows.length / state.pageSize));

    $('content').innerHTML = `
      <article class="panel">
        <div class="panel-head">
          <h2>${esc(sectionTitle())}</h2>
          <span>${rows.length.toLocaleString()} records</span>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>House</th>
                <th>Phone</th>
                <th>Party</th>
                <th>Vote</th>
                <th>Call</th>
                <th>D2D</th>
                <th>Assign</th>
                <th>Remarks</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              ${pageRows.map(rowHtml).join('') || '<tr><td colspan="10">No records found.</td></tr>'}
            </tbody>
          </table>
        </div>
        <div class="pager">
          <button class="secondary" id="prevPage" ${state.page <= 1 ? 'disabled' : ''}>Previous</button>
          <span>Page ${state.page} of ${totalPages}</span>
          <button class="secondary" id="nextPage" ${state.page >= totalPages ? 'disabled' : ''}>Next</button>
        </div>
      </article>
    `;

    $('prevPage').onclick = function () {
      if (state.page > 1) {
        state.page--;
        render();
      }
    };

    $('nextPage').onclick = function () {
      if (state.page < totalPages) {
        state.page++;
        render();
      }
    };
  }

  function renderReports() {
    const m = metrics();
    $('content').innerHTML = `
      <article class="panel">
        <div class="panel-head">
          <h2>Campaign Report</h2>
          <button class="primary" id="copyReport">Copy Report</button>
        </div>
        <pre id="reportOutput" class="report-box">${esc(reportText(m))}</pre>
      </article>
    `;
    $('copyReport').onclick = function () {
      navigator.clipboard.writeText(reportText(m)).then(function () { alert('Report copied.'); });
    };
  }

  function reportText(m) {
    return [
      '2026 Campaign Report',
      'Generated: ' + new Date().toLocaleString(),
      '',
      'Residents: ' + m.total,
      'Unassigned: ' + m.unassigned,
      'Need Call: ' + m.needCall,
      'Need Vote Decision: ' + m.notDecided,
      'Will Vote: ' + m.willVote,
      'Not Visited: ' + m.notVisited,
      'Need Transport: ' + m.needTransport,
      'With Remarks: ' + m.remarks
    ].join('\n');
  }

  function rowHtml(row) {
    const remark = text(row.remarks);
    return `
      <tr>
        <td><strong>${esc(row.name || 'No name')}</strong><br><small>${esc(row.national_id || 'No ID')}</small></td>
        <td>${esc(row.house || '-')}</td>
        <td>${row.phone ? `<a href="tel:${esc(row.phone)}">${esc(row.phone)}</a>` : '-'}</td>
        <td>${badge(row.party || '-')}</td>
        <td>${badge(status(row.vote_status, 'not-decided'))}</td>
        <td>${badge(status(row.phone_status, 'need-call'))}</td>
        <td>${badge(status(row.d2d_status, 'not-visited'))}</td>
        <td>${text(row.vote_assigned_by) ? esc(row.vote_assigned_by) : badge('Unassigned', 'warn')}</td>
        <td>${remark ? `<small>${esc(shorten(remark, 70))}</small>` : '<small>No remarks</small>'}</td>
        <td><button class="primary" data-edit="${esc(row.id)}">Update</button></td>
      </tr>
    `;
  }

  function shorten(value, limit) {
    const v = text(value);
    return v.length > limit ? v.slice(0, limit - 1) + '…' : v;
  }

  function badge(value, type) {
    return `<span class="badge ${type || ''}">${esc(value)}</span>`;
  }

  function openEditor(id) {
    const row = state.rows.find(function (r) { return String(r.id) === String(id); });
    if (!row) return;
    const dialog = $('editDialog');

    dialog.innerHTML = `
      <form id="editForm" class="modal-card" data-id="${esc(row.id)}">
        <div class="modal-head">
          <div>
            <h2>Update Voter</h2>
            <small>${esc(row.name)} • ${esc(row.house)} • ${esc(row.phone || 'No phone')}</small>
          </div>
          <button type="button" class="secondary" id="closeModal">Close</button>
        </div>
        <div class="modal-grid">
          <label class="modal-field">Assign To
            <input name="vote_assigned_by" value="${esc(row.vote_assigned_by)}" placeholder="Assignee name">
          </label>
          <label class="modal-field">Vote Status
            <select name="vote_status">
              ${option('not-decided', 'Not Decided', row.vote_status)}
              ${option('will-vote', 'Will Vote', row.vote_status)}
              ${option('not-vote', 'Not Vote', row.vote_status)}
            </select>
          </label>
          <label class="modal-field">Support Level
            <select name="support_level">
              ${option('normal', 'Normal', row.support_level)}
              ${option('not-guaranteed', 'Not Guaranteed', row.support_level)}
              ${option('guaranteed', 'Guaranteed', row.support_level)}
            </select>
          </label>
          <label class="modal-field">Call Status
            <select name="phone_status">
              ${option('need-call', 'Need Call', row.phone_status)}
              ${option('called', 'Called', row.phone_status)}
              ${option('busy', 'Busy', row.phone_status)}
              ${option('not-answer', 'Not Answer', row.phone_status)}
              ${option('disconnected', 'Disconnected', row.phone_status)}
              ${option('wrong-number', 'Wrong Number', row.phone_status)}
              ${option('out-of-coverage', 'Out of Coverage', row.phone_status)}
              ${option('no-phone', 'No Phone', row.phone_status)}
            </select>
          </label>
          <label class="modal-field">D2D Status
            <select name="d2d_status">
              ${option('not-visited', 'Not Visited', row.d2d_status)}
              ${option('reach', 'Reached / Visited', row.d2d_status)}
              ${option('not-home', 'Not Home', row.d2d_status)}
              ${option('live-in-another-place', 'Live in Another Place', row.d2d_status)}
            </select>
          </label>
          <label class="modal-field">Transport
            <select name="transport_status">
              ${option('not-needed', 'Not Needed', row.transport_status)}
              ${option('need-transport', 'Need Transport', row.transport_status)}
              ${option('arranged', 'Arranged', row.transport_status)}
              ${option('picked-up', 'Picked Up', row.transport_status)}
            </select>
          </label>
          <label class="modal-field">Living Place
            <input name="living_place" value="${esc(row.living_place)}" placeholder="Living place">
          </label>
          <label class="modal-field">Remarks
            <textarea name="remarks" rows="4" placeholder="Write remarks here">${esc(row.remarks)}</textarea>
          </label>
        </div>
        <div class="modal-actions">
          <button type="button" class="secondary" id="cancelModal">Cancel</button>
          <button type="submit" class="primary">Save</button>
        </div>
      </form>
    `;

    $('closeModal').onclick = closeEditor;
    $('cancelModal').onclick = closeEditor;
    $('editForm').onsubmit = saveEditor;
    dialog.showModal();
  }

  function option(value, label, current) {
    return `<option value="${esc(value)}" ${status(current, '') === value ? 'selected' : ''}>${esc(label)}</option>`;
  }

  function closeEditor() {
    const dialog = $('editDialog');
    if (dialog && dialog.open) dialog.close();
  }

  async function saveEditor(event) {
    event.preventDefault();
    const form = event.target;
    const id = form.dataset.id;
    const data = Object.fromEntries(new FormData(form).entries());
    const assignee = text(data.vote_assigned_by);

    const patch = {
      vote_assigned_by: assignee || null,
      vote_assigned_at: assignee ? new Date().toISOString() : null,
      vote_status: data.vote_status,
      support_level: data.support_level,
      phone_status: data.phone_status,
      d2d_status: data.d2d_status,
      transport_status: data.transport_status,
      living_place: text(data.living_place) || null,
      remarks: text(data.remarks) || null
    };

    if (patch.phone_status === 'called') patch.reach_status = 'reached';
    if (patch.phone_status === 'need-call') patch.reach_status = 'not-reached';
    if (patch.vote_status === 'will-vote' || patch.vote_status === 'not-vote' || patch.support_level === 'guaranteed') {
      patch.reach_status = 'reached';
    }

    try {
      const updatedRows = await updateRow(id, patch);
      const updated = updatedRows[0] || patch;
      const index = state.rows.findIndex(function (r) { return String(r.id) === String(id); });
      if (index >= 0) state.rows[index] = Object.assign({}, state.rows[index], updated);
      closeEditor();
      render();
      alert('Saved.');
    } catch (error) {
      alert(error.message || error);
    }
  }

  function bindEvents() {
    document.addEventListener('click', function (event) {
      const sectionButton = event.target.closest('[data-section]');
      if (sectionButton) {
        setSection(sectionButton.dataset.section);
        return;
      }
      const editButton = event.target.closest('[data-edit]');
      if (editButton) openEditor(editButton.dataset.edit);
    });

    $('searchInput').addEventListener('input', function () {
      state.search = this.value.trim();
      state.page = 1;
      render();
    });

    $('partyFilter').addEventListener('input', function () {
      state.party = this.value;
      state.page = 1;
      render();
    });

    $('pageSize').addEventListener('input', function () {
      state.pageSize = Number(this.value || 20);
      state.page = 1;
      render();
    });
  }

  function render() {
    renderNav();
    renderDashboard();
    renderContent();
  }

  async function init() {
    renderShell();
    bindEvents();

    const params = new URLSearchParams(window.location.search);
    state.section = params.get('section') || 'dashboard';
    state.party = params.get('party') || 'all';
    if ($('partyFilter')) $('partyFilter').value = state.party;

    try {
      $('connectionStatus').textContent = 'Loading records...';
      state.rows = await fetchRows();
      $('connectionStatus').textContent = `Connected • ${state.rows.length.toLocaleString()} records`;
      render();
    } catch (error) {
      $('connectionStatus').textContent = 'Load failed';
      $('content').innerHTML = `<div class="panel"><h2>Load Error</h2><p>${esc(error.message || error)}</p></div>`;
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
