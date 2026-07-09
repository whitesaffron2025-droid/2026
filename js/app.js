// js/app.js
// Clean 2026 Campaign Manager
// Residents = master data. Other sections = filtered views of the same 2026 table.
// Live Supabase fetch is temporarily disabled so the structure can be reviewed safely.

(function () {
  'use strict';

  const SECTIONS = ['dashboard', 'residents', 'assign', 'calls', 'votes', 'visits', 'transport'];

  const state = {
    rows: [],
    section: 'dashboard',
    address: 'all',
    party: 'all',
    search: '',
    page: 1,
    pageSize: 20,
    assignView: 'all',
    assigner: 'all',
    status: 'all',
    structureMode: true
  };

  const CONFIG = {
    residents: { title: 'Residents', purpose: 'Master data — full resident view', filters: ['address', 'party'], columns: ['photo', 'nameId', 'address', 'mobile', 'party', 'statuses', 'remarks', 'action'], action: 'Edit' },
    assign: { title: 'Assign', purpose: 'Assignment view — update assignee and remarks only', filters: ['address', 'assignView', 'assigner', 'party'], columns: ['photo', 'nameId', 'address', 'mobile', 'party', 'assignedTo', 'remarks', 'action'], action: 'Assign' },
    calls: { title: 'Calls', purpose: 'Call view — update call status and call remarks only', filters: ['address', 'party'], columns: ['photo', 'nameId', 'address', 'mobile', 'party', 'callStatus', 'remarks', 'action'], action: 'Call' },
    votes: { title: 'Votes', purpose: 'Vote view — update vote decision only', filters: ['address', 'status', 'party'], columns: ['photo', 'nameId', 'address', 'mobile', 'party', 'voteStatus', 'remarks', 'action'], action: 'Vote' },
    visits: { title: 'Visits', purpose: 'D2D view — update visit status and place only', filters: ['address', 'status', 'party'], columns: ['photo', 'nameId', 'address', 'mobile', 'party', 'visitStatus', 'remarks', 'action'], action: 'Visit' },
    transport: { title: 'Transport', purpose: 'Transport view — update transport requirement only', filters: ['address', 'status', 'party'], columns: ['photo', 'nameId', 'address', 'mobile', 'party', 'transportStatus', 'remarks', 'action'], action: 'Transport' }
  };

  const DEFAULTS = { vote_status: 'not-decided', phone_status: 'need-call', d2d_status: 'not-visited', transport_status: 'not-needed', support_level: 'normal', reach_status: 'not-reached' };

  const STRUCTURE_ROWS = [
    { id: 1, photo_url: '', name: 'Sample Resident One', national_id: 'A000001', house: 'Sample House A', phone: '7000001', party: 'PNC', vote_assigned_by: '', phone_status: 'need-call', vote_status: 'not-decided', d2d_status: 'not-visited', transport_status: 'not-needed', remarks: 'Structure preview row' },
    { id: 2, photo_url: '', name: 'Sample Resident Two', national_id: 'A000002', house: 'Sample House B', phone: '7000002', party: 'MDP', vote_assigned_by: 'Team A', phone_status: 'called', vote_status: 'will-vote', d2d_status: 'reach', transport_status: 'need-transport', remarks: 'Shows filled workflow fields' },
    { id: 3, photo_url: '', name: 'Sample Resident Three', national_id: 'A000003', house: 'Dhafthar', phone: '7000003', party: 'PNC', vote_assigned_by: 'Team B', phone_status: 'busy', vote_status: 'not-vote', d2d_status: 'not-home', transport_status: 'arranged', remarks: 'Used for filter layout' }
  ];

  function $(id) { return document.getElementById(id); }
  function text(value) { return String(value || '').trim(); }
  function val(value, fallback) { return text(value) || fallback; }
  function esc(value) { return text(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
  function badge(value, type) { return `<span class="badge ${type || ''}">${esc(value)}</span>`; }
  function address(row) { return text(row.house) || text(row.living_place) || text(row.lives_in) || '-'; }
  function photo(row) { const url = text(row.photo_url); return url ? `<img class="avatar" src="${esc(url)}" alt="" loading="lazy">` : '<span class="avatar">?</span>'; }

  function statusFor(row, section) {
    if (section === 'calls') return val(row.phone_status, DEFAULTS.phone_status);
    if (section === 'votes') return val(row.vote_status, DEFAULTS.vote_status);
    if (section === 'visits') return val(row.d2d_status, DEFAULTS.d2d_status);
    if (section === 'transport') return val(row.transport_status, DEFAULTS.transport_status);
    return val(row.vote_status, DEFAULTS.vote_status);
  }

  function renderShell() {
    document.body.innerHTML = `
      <header class="topbar">
        <a class="brand" href="./" aria-label="Home">
          <span class="brand-mark">2026</span>
          <span><strong>Campaign Manager</strong><small id="connectionStatus">Structure preview • live fetch off</small></span>
        </a>
        <nav id="nav" class="nav" aria-label="Sections"></nav>
      </header>
      <main class="shell">
        <section class="hero compact-hero">
          <div>
            <p class="eyebrow">Residents master data</p>
            <h1 id="pageTitle">Dashboard</h1>
            <p id="pagePurpose" class="hero-text">Every section reads and updates the same Residents master data.</p>
          </div>
        </section>
        <section id="appRoot"></section>
      </main>
      <dialog id="editDialog" class="modal"></dialog>
    `;
  }

  function renderNav() { $('nav').innerHTML = SECTIONS.map(section => `<button class="nav-btn ${state.section === section ? 'active' : ''}" data-section="${section}">${esc(label(section))}</button>`).join(''); }
  function label(section) { return section === 'dashboard' ? 'Dashboard' : CONFIG[section].title; }

  function metrics() {
    const rows = state.rows;
    return { total: rows.length, assigned: rows.filter(r => !!text(r.vote_assigned_by)).length, unassigned: rows.filter(r => !text(r.vote_assigned_by)).length, needCall: rows.filter(r => val(r.phone_status, DEFAULTS.phone_status) === 'need-call').length, notDecided: rows.filter(r => val(r.vote_status, DEFAULTS.vote_status) === 'not-decided').length, notVisited: rows.filter(r => val(r.d2d_status, DEFAULTS.d2d_status) === 'not-visited').length, transport: rows.filter(r => ['need-transport', 'need'].includes(val(r.transport_status, DEFAULTS.transport_status))).length };
  }

  function renderDashboard() {
    const m = metrics();
    $('pageTitle').textContent = 'Dashboard';
    $('pagePurpose').textContent = 'Read-only summary from Residents master data.';
    $('appRoot').innerHTML = `
      <section class="kpi-grid">
        ${kpi('Residents', m.total, 'residents')}${kpi('Assigned', m.assigned, 'assign')}${kpi('Unassigned', m.unassigned, 'assign')}${kpi('Need Call', m.needCall, 'calls')}${kpi('Need Vote Decision', m.notDecided, 'votes')}${kpi('Not Visited', m.notVisited, 'visits')}${kpi('Need Transport', m.transport, 'transport')}
      </section>
      <section class="dashboard-grid">
        <article class="panel"><h2>Master Data Rule</h2><p>Residents is the single source of truth. Assign, Calls, Votes, Visits and Transport are views of the same table.</p></article>
        <article class="panel"><h2>Fetch Status</h2><p>Live Supabase fetch is currently OFF. This page is showing structure preview rows only.</p></article>
      </section>
    `;
  }

  function kpi(labelText, value, section) { return `<button class="kpi" data-section="${section}"><span>${esc(labelText)}</span><strong>${Number(value || 0).toLocaleString()}</strong></button>`; }

  function uniqueAddresses() { const counts = new Map(); state.rows.forEach(row => { const a = address(row); if (!a || a === '-') return; counts.set(a, (counts.get(a) || 0) + 1); }); return Array.from(counts.entries()).sort((a, b) => a[0].localeCompare(b[0], undefined, { numeric: true })); }
  function assigners() { return [...new Set(state.rows.map(r => text(r.vote_assigned_by)).filter(Boolean))].sort((a, b) => a.localeCompare(b)); }
  function option(value, labelText, current) { return `<option value="${esc(value)}" ${String(value) === String(current) ? 'selected' : ''}>${esc(labelText)}</option>`; }

  function renderFilters(section) {
    const cfg = CONFIG[section];
    let html = '<div class="toolbar section-filter">';
    if (cfg.filters.includes('address')) html += `<label>Address<select id="addressFilter">${option('all', `All Addresses (${state.rows.length})`, state.address)}${uniqueAddresses().map(([a, n]) => option(a, `${a} (${n})`, state.address)).join('')}</select></label>`;
    if (cfg.filters.includes('assignView')) html += `<label>Assign Status<select id="assignView">${option('all', 'All', state.assignView)}${option('unassigned', 'Unassigned', state.assignView)}${option('assigned', 'Assigned', state.assignView)}</select></label>`;
    if (cfg.filters.includes('assigner')) html += `<label>Assigner<select id="assignerFilter">${option('all', 'All Assigners', state.assigner)}${assigners().map(name => option(name, name, state.assigner)).join('')}</select></label>`;
    if (cfg.filters.includes('status')) html += statusFilter(section);
    if (cfg.filters.includes('party')) html += `<label>Party<select id="partyFilter">${option('all', 'All', state.party)}${option('PNC', 'PNC', state.party)}${option('MDP', 'MDP', state.party)}</select></label>`;
    html += `<label class="search-wide">Search<input id="searchInput" value="${esc(state.search)}" placeholder="Name, ID or mobile"></label>`;
    html += `<button class="secondary search-button" id="clearSearchBtn">Clear</button>`;
    html += `<label>Page size<select id="pageSize">${option('20', '20', state.pageSize)}${option('50', '50', state.pageSize)}</select></label>`;
    html += '</div>';
    return html;
  }

  function statusFilter(section) {
    if (section === 'votes') return `<label>Vote Status<select id="statusFilter">${option('all', 'All', state.status)}${option('not-decided', 'Not Decided', state.status)}${option('will-vote', 'Will Vote', state.status)}${option('not-vote', 'Not Vote', state.status)}</select></label>`;
    if (section === 'visits') return `<label>Visit Status<select id="statusFilter">${option('all', 'All', state.status)}${option('not-visited', 'Not Visited', state.status)}${option('reach', 'Reach', state.status)}${option('not-home', 'Not Home', state.status)}${option('live-in-another-place', 'Live in Another Place', state.status)}</select></label>`;
    if (section === 'transport') return `<label>Transport<select id="statusFilter">${option('all', 'All', state.status)}${option('not-needed', 'Not Needed', state.status)}${option('need-transport', 'Need Transport', state.status)}${option('need', 'Need', state.status)}${option('arranged', 'Arranged', state.status)}</select></label>`;
    return '';
  }

  function baseRows(section) {
    let rows = state.rows.slice();
    if (state.address !== 'all') rows = rows.filter(row => address(row) === state.address);
    if (state.party !== 'all') rows = rows.filter(row => text(row.party).toUpperCase() === state.party);
    if (state.search) { const q = state.search.toLowerCase(); rows = rows.filter(row => [row.name, row.national_id, row.phone].map(v => text(v).toLowerCase()).join(' ').includes(q)); }
    if (section === 'assign') { if (state.assignView === 'assigned') rows = rows.filter(row => !!text(row.vote_assigned_by)); if (state.assignView === 'unassigned') rows = rows.filter(row => !text(row.vote_assigned_by)); if (state.assigner !== 'all') rows = rows.filter(row => text(row.vote_assigned_by) === state.assigner); }
    if (['votes', 'visits', 'transport'].includes(section) && state.status !== 'all') rows = rows.filter(row => statusFor(row, section) === state.status);
    if (section === 'calls') rows = rows.filter(row => statusFor(row, section) === 'need-call' || state.search || state.address !== 'all' || state.party !== 'all');
    return rows.sort((a, b) => address(a).localeCompare(address(b), undefined, { numeric: true }) || text(a.name).localeCompare(text(b.name)));
  }

  function renderWorkPage(section) {
    const cfg = CONFIG[section];
    const rows = baseRows(section);
    const totalPages = Math.max(1, Math.ceil(rows.length / state.pageSize));
    if (state.page > totalPages) state.page = totalPages;
    const start = (state.page - 1) * state.pageSize;
    const pageRows = rows.slice(start, start + state.pageSize);
    $('pageTitle').textContent = cfg.title;
    $('pagePurpose').textContent = cfg.purpose;
    $('appRoot').innerHTML = `<article class="panel work-page"><div class="panel-head"><h2>${esc(cfg.title)}</h2><span>Structure preview • ${rows.length.toLocaleString()} rows</span></div>${renderFilters(section)}<div class="table-wrap"><table><thead><tr>${cfg.columns.map(col => `<th>${esc(columnLabel(col))}</th>`).join('')}</tr></thead><tbody>${pageRows.map(row => rowHtml(row, section)).join('') || `<tr><td colspan="${cfg.columns.length}">No preview rows found.</td></tr>`}</tbody></table></div>${pager(rows.length, totalPages)}</article>`;
  }

  function columnLabel(col) { return { photo: 'Photo', nameId: 'Name / ID', address: 'Address', mobile: 'Mobile', party: 'Party', statuses: 'Statuses', assignedTo: 'Assigned To', callStatus: 'Call Status', voteStatus: 'Vote Status', visitStatus: 'Visit Status', transportStatus: 'Transport', remarks: 'Remarks', action: 'Action' }[col] || col; }
  function rowHtml(row, section) { const cfg = CONFIG[section]; return `<tr>${cfg.columns.map(col => `<td>${cell(row, section, col)}</td>`).join('')}</tr>`; }
  function cell(row, section, col) { const remark = text(row.remarks); if (col === 'photo') return photo(row); if (col === 'nameId') return `<strong>${esc(row.name || 'No name')}</strong><br><small>${esc(row.national_id || 'No ID')}</small>`; if (col === 'address') return esc(address(row)); if (col === 'mobile') return row.phone ? `<a href="tel:${esc(row.phone)}">${esc(row.phone)}</a>` : '-'; if (col === 'party') return badge(row.party || '-'); if (col === 'statuses') return `${badge(statusFor(row, 'votes'))} ${badge(statusFor(row, 'calls'))} ${badge(statusFor(row, 'visits'))}`; if (col === 'assignedTo') return text(row.vote_assigned_by) ? esc(row.vote_assigned_by) : badge('Unassigned', 'warn'); if (['callStatus','voteStatus','visitStatus','transportStatus'].includes(col)) return badge(statusFor(row, section)); if (col === 'remarks') return remark ? `<small>${esc(remark.slice(0, 80))}</small>` : '<small>No remarks</small>'; if (col === 'action') return `<button class="primary" data-edit="${esc(row.id)}">${esc(CONFIG[section].action)}</button>`; return '-'; }
  function pager(total, totalPages) { const start = total ? ((state.page - 1) * state.pageSize) + 1 : 0; const end = Math.min(total, state.page * state.pageSize); return `<div class="pager"><button class="secondary" id="firstPage" ${state.page <= 1 ? 'disabled' : ''}>&lt;&lt;</button><button class="secondary" id="prevPage" ${state.page <= 1 ? 'disabled' : ''}>&lt;</button><span>Page ${state.page} of ${totalPages}</span><button class="secondary" id="nextPage" ${state.page >= totalPages ? 'disabled' : ''}>&gt;</button><button class="secondary" id="lastPage" ${state.page >= totalPages ? 'disabled' : ''}>&gt;&gt;</button><span>Showing ${start}-${end} of ${total}</span></div>`; }

  function openEditor(id) { alert('Structure preview only. Live save is disabled until layout is approved.'); }
  function render() { renderNav(); if (state.section === 'dashboard') renderDashboard(); else renderWorkPage(state.section); }
  function setSection(section) { state.section = SECTIONS.includes(section) ? section : 'dashboard'; state.page = 1; state.status = 'all'; const url = new URL(location.href); url.searchParams.set('section', state.section); history.replaceState({}, '', url); render(); }

  function bindEvents() {
    document.addEventListener('click', e => {
      const nav = e.target.closest('[data-section]'); if (nav) return setSection(nav.dataset.section);
      const edit = e.target.closest('[data-edit]'); if (edit) return openEditor(edit.dataset.edit);
      if (e.target.closest('#clearSearchBtn')) { state.search = ''; state.address = 'all'; state.party = 'all'; state.assignView = 'all'; state.assigner = 'all'; state.status = 'all'; state.page = 1; return render(); }
      const rows = baseRows(state.section); const pages = Math.max(1, Math.ceil(rows.length / state.pageSize));
      if (e.target.closest('#firstPage')) { state.page = 1; return render(); }
      if (e.target.closest('#prevPage')) { state.page = Math.max(1, state.page - 1); return render(); }
      if (e.target.closest('#nextPage')) { state.page = Math.min(pages, state.page + 1); return render(); }
      if (e.target.closest('#lastPage')) { state.page = pages; return render(); }
    });
    document.addEventListener('input', e => { const t = e.target; if (!t || !t.id) return; if (t.id === 'addressFilter') state.address = t.value; if (t.id === 'partyFilter') state.party = t.value; if (t.id === 'searchInput') state.search = t.value; if (t.id === 'pageSize') state.pageSize = Number(t.value || 20); if (t.id === 'assignView') state.assignView = t.value; if (t.id === 'assignerFilter') state.assigner = t.value; if (t.id === 'statusFilter') state.status = t.value; state.page = 1; render(); });
  }

  function init() {
    renderShell();
    bindEvents();
    const params = new URLSearchParams(location.search);
    state.section = SECTIONS.includes(params.get('section')) ? params.get('section') : 'dashboard';
    state.rows = STRUCTURE_ROWS.slice();
    render();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
