(function () {
  'use strict';

  const cfg = window.CampaignConfig;
  const sections = ['dashboard', 'residents', 'assign', 'calls', 'votes', 'visits', 'transport'];
  const state = { section: 'dashboard', party: 'all', search: '', visible: 20, filters: {}, rows: [], user: null, loading: false };
  let db = null;

  const sectionConfig = {
    residents: { title: 'Residents', subtitle: 'Master resident data', stats: ['Total Residents', 'PNC', 'MDP', 'With Phone'], filters: ['address'], columns: ['Photo', 'Name / ID', 'Address', 'Mobile', 'Party', 'Action'] },
    assign: { title: 'Assign', subtitle: 'Assignment view of Residents master data', stats: ['Total Voters', 'Unassigned', 'Assigned', 'Completed'], filters: ['address', 'assignCategory', 'assigner'], columns: ['Photo', 'Name / ID', 'Address', 'Mobile', 'Assigner', 'Status', 'Action'] },
    calls: { title: 'Calls', subtitle: 'Call-center view of Residents master data', stats: ['Total Calls', 'Connected', 'Not Reached', 'Follow-up'], filters: ['address', 'callStatus'], columns: ['Photo', 'Name', 'Address', 'Phone', 'Agent', 'Call Status', 'Action'] },
    votes: { title: 'Votes', subtitle: 'Voting intention view of Residents master data', stats: ['Total Voters', 'Will Vote', 'Not Vote', 'Not Decided'], filters: ['address', 'voteStatus'], columns: ['Photo', 'Name', 'Address', 'Party', 'Vote Status', 'Action'] },
    visits: { title: 'Door to Door', subtitle: 'Door-to-door view of Residents master data', stats: ['Total Households', 'Reached', 'Not Home', 'Not Visited'], filters: ['address', 'visitStatus'], columns: [] },
    transport: { title: 'Transport', subtitle: 'Transport view of Residents master data', stats: ['Total Residents', 'Need Transport', 'Arranged', 'Not Needed'], filters: ['address', 'transportStatus'], columns: ['Photo', 'Name', 'Address', 'Mobile', 'Transport Status', 'Action'] }
  };

  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const text = value => String(value ?? '').trim();
  const label = section => section.charAt(0).toUpperCase() + section.slice(1);
  const addressOf = row => text(row.house) || text(row.living_place) || text(row.lives_in) || 'No Address';
  const statusClass = value => 'status-' + text(value || 'none').toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const voteStatus = row => text(row.vote_status) || 'not-decided';
  const phoneStatus = row => text(row.call_outcome) || text(row.phone_status) || 'need-call';
  const visitStatus = row => text(row.d2d_status) || 'not-visited';
  const transportStatus = row => text(row.transport_status) || 'not-needed';
  const assignStatus = row => !text(row.vote_assigned_by) ? 'unassigned' : text(row.reach_status) === 'reached' ? 'completed' : 'assigned';

  function loginScreen(message = '') {
    document.getElementById('adminApp').innerHTML = `
      <main class="login-screen">
        <form id="loginForm" class="login-card">
          <div class="login-logo">2026</div>
          <p class="eyebrow">Secure admin access</p>
          <h1>Campaign Manager</h1>
          <p class="login-copy">Sign in with your Supabase administrator account.</p>
          ${message ? `<div class="login-error">${esc(message)}</div>` : ''}
          <label>Email<input id="loginEmail" type="email" autocomplete="username" value="${esc(localStorage.getItem('campaign_admin_email') || cfg.adminEmail || '')}" required></label>
          <label>Password<input id="loginPassword" type="password" autocomplete="current-password" required></label>
          <label class="remember-row"><input id="rememberEmail" type="checkbox" checked> Remember email on this device</label>
          <button id="loginButton" class="btn primary login-button" type="submit">Sign In</button>
          <small>Password is never saved in localStorage.</small>
        </form>
      </main>`;
    document.getElementById('loginForm').addEventListener('submit', signIn);
  }

  async function signIn(event) {
    event.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const button = document.getElementById('loginButton');
    button.disabled = true;
    button.textContent = 'Signing in...';
    if (document.getElementById('rememberEmail').checked) localStorage.setItem('campaign_admin_email', email);
    else localStorage.removeItem('campaign_admin_email');

    const { data, error } = await db.auth.signInWithPassword({ email, password });
    if (error) return loginScreen(error.message);
    state.user = data.user;
    await loadRows();
  }

  async function signOut() {
    await db.auth.signOut();
    state.user = null;
    state.rows = [];
    loginScreen();
  }

  function shell() {
    document.getElementById('adminApp').innerHTML = `
      <div class="app-shell">
        <header class="topbar">
          <div class="topbar-main">
            <div class="brand"><span class="brand-mark">2026</span><span><strong>Campaign Manager</strong><small>${esc(cfg.adminName || 'Admin')} workspace</small></span></div>
            <div class="status-wrap"><span class="status-dot"></span><span>Connected</span><span>•</span><span>${state.rows.length.toLocaleString()} records</span><button id="logoutButton" class="logout-button">Logout</button></div>
          </div>
          <div class="nav-row">
            <nav class="nav">${sections.map(section => `<button data-section="${section}">${label(section)}</button>`).join('')}</nav>
            <label class="party-filter">Party<select id="globalParty"><option value="all">All</option><option value="PNC">PNC</option><option value="MDP">MDP</option></select></label>
          </div>
        </header>
        <main class="page"><section id="pageContent"></section></main>
      </div>`;
    bindWorkspace();
  }

  async function loadRows() {
    state.loading = true;
    document.getElementById('adminApp').innerHTML = '<main class="loading-screen"><div class="loading-box"><span class="spinner"></span><strong>Loading Residents master data…</strong></div></main>';
    try {
      const all = [];
      let from = 0;
      const size = Number(cfg.batchSize || 1000);
      while (true) {
        const { data, error } = await db.from(cfg.tableName).select('*').order('house', { ascending: true, nullsFirst: false }).order('id', { ascending: true }).range(from, from + size - 1);
        if (error) throw error;
        all.push(...(data || []));
        if (!data || data.length < size) break;
        from += size;
      }
      state.rows = all;
      state.loading = false;
      shell();
      const hash = location.hash.replace('#', '');
      if (sections.includes(hash)) state.section = hash;
      render();
    } catch (error) {
      state.loading = false;
      document.getElementById('adminApp').innerHTML = `<main class="loading-screen"><div class="login-card"><h1>Database Load Error</h1><p>${esc(error.message)}</p><button class="btn primary" id="retryButton">Retry</button><button class="btn secondary" id="logoutErrorButton">Logout</button></div></main>`;
      document.getElementById('retryButton').onclick = loadRows;
      document.getElementById('logoutErrorButton').onclick = signOut;
    }
  }

  function filtered(section) {
    let data = state.rows.slice();
    if (state.party !== 'all') data = data.filter(row => text(row.party).toUpperCase() === state.party);
    if (state.search) {
      const query = state.search.toLowerCase();
      data = data.filter(row => [row.name, row.national_id, row.phone, addressOf(row)].map(text).join(' ').toLowerCase().includes(query));
    }
    const filters = state.filters;
    if (filters.address && filters.address !== 'all') data = data.filter(row => addressOf(row) === filters.address);
    if (section === 'assign' && filters.assignCategory && filters.assignCategory !== 'all') data = data.filter(row => assignStatus(row) === filters.assignCategory);
    if (section === 'assign' && filters.assigner && filters.assigner !== 'all') data = data.filter(row => text(row.vote_assigned_by) === filters.assigner);
    if (section === 'calls' && filters.callStatus && filters.callStatus !== 'all') data = data.filter(row => phoneStatus(row) === filters.callStatus);
    if (section === 'votes' && filters.voteStatus && filters.voteStatus !== 'all') data = data.filter(row => voteStatus(row) === filters.voteStatus);
    if (section === 'visits' && filters.visitStatus && filters.visitStatus !== 'all') data = data.filter(row => visitStatus(row) === filters.visitStatus);
    if (section === 'transport' && filters.transportStatus && filters.transportStatus !== 'all') data = data.filter(row => transportStatus(row) === filters.transportStatus);
    return data;
  }

  function statValues(section, data) {
    if (section === 'residents') return [data.length, data.filter(row => text(row.party).toUpperCase() === 'PNC').length, data.filter(row => text(row.party).toUpperCase() === 'MDP').length, data.filter(row => text(row.phone)).length];
    if (section === 'assign') return [data.length, data.filter(row => assignStatus(row) === 'unassigned').length, data.filter(row => assignStatus(row) === 'assigned').length, data.filter(row => assignStatus(row) === 'completed').length];
    if (section === 'calls') return [data.length, data.filter(row => ['connected', 'called'].includes(phoneStatus(row))).length, data.filter(row => ['need-call', 'not-answer', 'disconnected', 'out-of-coverage'].includes(phoneStatus(row))).length, data.filter(row => Boolean(row.callback_scheduled_at)).length];
    if (section === 'votes') return [data.length, data.filter(row => voteStatus(row) === 'will-vote').length, data.filter(row => voteStatus(row) === 'not-vote').length, data.filter(row => voteStatus(row) === 'not-decided').length];
    if (section === 'visits') return [data.length, data.filter(row => visitStatus(row) === 'reach').length, data.filter(row => visitStatus(row) === 'not-home').length, data.filter(row => visitStatus(row) === 'not-visited').length];
    return [data.length, data.filter(row => ['need', 'need-transport'].includes(transportStatus(row))).length, data.filter(row => ['arranged', 'picked-up'].includes(transportStatus(row))).length, data.filter(row => transportStatus(row) === 'not-needed').length];
  }

  function stats(section, data) {
    const values = statValues(section, data);
    return `<div class="stats-grid">${sectionConfig[section].stats.map((name, index) => `<article class="stat-card"><span>${esc(name)}</span><strong>${values[index].toLocaleString()}</strong></article>`).join('')}</div>`;
  }

  function filters(section) {
    const list = sectionConfig[section].filters;
    const addresses = [...new Set(state.rows.map(addressOf).filter(Boolean))].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    const assigners = [...new Set(state.rows.map(row => text(row.vote_assigned_by)).filter(Boolean))].sort();
    let html = '<div class="filter-bar">';
    if (list.includes('address')) html += `<label>Address<select data-filter="address"><option value="all">All Addresses</option>${addresses.map(value => `<option value="${esc(value)}">${esc(value)}</option>`).join('')}</select></label>`;
    if (list.includes('assignCategory')) html += '<label>Assign Status<select data-filter="assignCategory"><option value="all">All</option><option value="unassigned">Unassigned</option><option value="assigned">Assigned</option><option value="completed">Completed</option></select></label>';
    if (list.includes('assigner')) html += `<label>Assigner<select data-filter="assigner"><option value="all">All Assigners</option>${assigners.map(value => `<option value="${esc(value)}">${esc(value)}</option>`).join('')}</select></label>`;
    if (list.includes('callStatus')) html += '<label>Call Status<select data-filter="callStatus"><option value="all">All</option><option value="need-call">Need Call</option><option value="connected">Connected</option><option value="called">Called</option><option value="busy">Busy</option><option value="not-answer">Not Answer</option><option value="disconnected">Disconnected</option><option value="out-of-coverage">Out of Coverage</option></select></label>';
    if (list.includes('voteStatus')) html += '<label>Vote Status<select data-filter="voteStatus"><option value="all">All</option><option value="will-vote">Will Vote</option><option value="not-vote">Not Vote</option><option value="not-decided">Not Decided</option></select></label>';
    if (list.includes('visitStatus')) html += '<label>Visit Status<select data-filter="visitStatus"><option value="all">All</option><option value="reach">Reached</option><option value="not-home">Not Home</option><option value="live-in-another-place">Lives Elsewhere</option><option value="not-visited">Not Visited</option></select></label>';
    if (list.includes('transportStatus')) html += '<label>Transport<select data-filter="transportStatus"><option value="all">All</option><option value="need-transport">Need Transport</option><option value="arranged">Arranged</option><option value="picked-up">Picked Up</option><option value="not-needed">Not Needed</option></select></label>';
    html += `<label>Search<input id="searchInput" value="${esc(state.search)}" placeholder="Name, ID, phone or address"></label><button class="btn secondary" id="clearFilters">Clear</button></div>`;
    return html;
  }

  function avatar(row) {
    return text(row.photo_url) ? `<img class="avatar avatar-image" src="${esc(row.photo_url)}" alt="" loading="lazy" onerror="this.outerHTML='<span class=&quot;avatar&quot;>?</span>'">` : '<span class="avatar">?</span>';
  }

  function cells(section, row) {
    const nameId = `<strong>${esc(row.name || 'No name')}</strong><br><small>${esc(row.national_id || 'No ID')}</small>`;
    const action = `<button class="btn primary" disabled title="Editing will be enabled after data verification">${section === 'residents' ? 'Edit' : label(section)}</button>`;
    if (section === 'residents') return [avatar(row), nameId, esc(addressOf(row)), esc(row.phone || '-'), `<span class="badge">${esc(row.party || '-')}</span>`, action];
    if (section === 'assign') return [avatar(row), nameId, esc(addressOf(row)), esc(row.phone || '-'), esc(row.vote_assigned_by || 'Unassigned'), `<span class="status ${statusClass(assignStatus(row))}">${esc(assignStatus(row))}</span>`, action];
    if (section === 'calls') return [avatar(row), esc(row.name || '-'), esc(addressOf(row)), esc(row.phone || '-'), esc(row.call_center_agent || '-'), `<span class="status ${statusClass(phoneStatus(row))}">${esc(phoneStatus(row))}</span>`, action];
    if (section === 'votes') return [avatar(row), esc(row.name || '-'), esc(addressOf(row)), esc(row.party || '-'), `<span class="status ${statusClass(voteStatus(row))}">${esc(voteStatus(row))}</span>`, action];
    return [avatar(row), esc(row.name || '-'), esc(addressOf(row)), esc(row.phone || '-'), `<span class="status ${statusClass(transportStatus(row))}">${esc(transportStatus(row))}</span>`, action];
  }

  function table(section, data) {
    const visible = data.slice(0, state.visible);
    return `<div class="table-wrap"><table class="data-table"><thead><tr>${sectionConfig[section].columns.map(column => `<th>${esc(column)}</th>`).join('')}</tr></thead><tbody>${visible.map(row => `<tr>${cells(section, row).map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('') || `<tr><td colspan="${sectionConfig[section].columns.length}">No records found</td></tr>`}</tbody></table></div><div class="load-row"><button class="btn secondary" id="loadMore" ${visible.length >= data.length ? 'disabled' : ''}>Load More</button><span>Showing ${visible.length.toLocaleString()} of ${data.length.toLocaleString()}</span></div>`;
  }

  function visitCards(data) {
    const visible = data.slice(0, state.visible);
    return `<div class="section-toolbar"><h2>Door to Door Visits</h2></div>${filters('visits')}<div class="cards-grid">${visible.map(row => `<article class="record-card"><div class="card-header"><h4>${esc(row.name || 'No name')}</h4><span class="status ${statusClass(visitStatus(row))}">${esc(visitStatus(row))}</span></div><div class="field"><span class="label">Agent</span><span class="value">${esc(row.vote_assigned_by || 'Unassigned')}</span></div><div class="field"><span class="label">Resident ID</span><span class="value">${esc(row.national_id || '-')}</span></div><div class="field"><span class="label">Address</span><span class="value">${esc(addressOf(row))}</span></div><div class="field"><span class="label">Living Place</span><span class="value">${esc(row.living_place || '-')}</span></div><div class="field"><span class="label">Notes</span><span class="value">${esc(row.remarks || '-')}</span></div><div class="card-actions"><button class="btn edit" disabled>Edit</button></div></article>`).join('') || '<div class="empty-card">No visits found</div>'}</div><div class="load-row"><button class="btn secondary" id="loadMore" ${visible.length >= data.length ? 'disabled' : ''}>Load More</button><span>Showing ${visible.length.toLocaleString()} of ${data.length.toLocaleString()}</span></div>`;
  }

  function dashboard() {
    const data = state.party === 'all' ? state.rows : state.rows.filter(row => text(row.party).toUpperCase() === state.party);
    const values = [data.length, data.filter(row => assignStatus(row) !== 'unassigned').length, data.filter(row => ['connected', 'called'].includes(phoneStatus(row))).length, data.filter(row => text(row.reach_status) === 'reached').length];
    document.getElementById('pageContent').innerHTML = `<section class="page-head"><div><p class="eyebrow">Dashboard</p><h1>Campaign Overview</h1><p>Read-only summary from the live Residents master table.</p></div><span class="record-pill">${data.length.toLocaleString()} records</span></section><div class="stats-grid">${['Total Voters', 'Assigned', 'Called', 'Reached'].map((name, index) => `<article class="stat-card"><span>${name}</span><strong>${values[index].toLocaleString()}</strong></article>`).join('')}</div><div class="dashboard-grid"><article class="panel placeholder"><h2>Database Connected</h2><p>Live data is loaded from Supabase table <strong>2026</strong>.</p></article><article class="panel placeholder"><h2>Safe Verification Mode</h2><p>Viewing and filtering are active. Write actions remain disabled until each field mapping is verified.</p></article></div>`;
  }

  function render() {
    document.querySelectorAll('.nav button').forEach(button => button.classList.toggle('active', button.dataset.section === state.section));
    document.getElementById('globalParty').value = state.party;
    if (state.section === 'dashboard') return dashboard();
    const data = filtered(state.section);
    const body = state.section === 'visits' ? visitCards(data) : `${filters(state.section)}${table(state.section, data)}`;
    document.getElementById('pageContent').innerHTML = `<section class="page-head"><div><p class="eyebrow">${esc(sectionConfig[state.section].title)}</p><h1>${esc(sectionConfig[state.section].title)}</h1><p>${esc(sectionConfig[state.section].subtitle)}</p></div><span class="record-pill">${data.length.toLocaleString()} records</span></section>${stats(state.section, data)}<section class="panel">${body}</section>`;
  }

  function bindWorkspace() {
    document.getElementById('logoutButton').addEventListener('click', signOut);
    document.addEventListener('click', event => {
      const nav = event.target.closest('[data-section]');
      if (nav) {
        state.section = nav.dataset.section;
        state.visible = 20;
        state.filters = {};
        location.hash = state.section;
        render();
        return;
      }
      if (event.target.id === 'clearFilters') {
        state.search = '';
        state.filters = {};
        state.visible = 20;
        render();
        return;
      }
      if (event.target.id === 'loadMore') {
        state.visible += 20;
        render();
      }
    });
    document.addEventListener('input', event => {
      if (event.target.id === 'globalParty') {
        state.party = event.target.value;
        state.visible = 20;
        render();
        return;
      }
      if (event.target.id === 'searchInput') {
        state.search = event.target.value;
        state.visible = 20;
        render();
        return;
      }
      if (event.target.dataset.filter) {
        state.filters[event.target.dataset.filter] = event.target.value;
        state.visible = 20;
        render();
      }
    });
  }

  async function init() {
    if (!cfg || !cfg.supabaseUrl || !cfg.supabaseKey || !window.supabase) {
      document.getElementById('adminApp').innerHTML = '<main class="loading-screen"><div class="login-card"><h1>Configuration Error</h1><p>Supabase configuration or SDK is missing.</p></div></main>';
      return;
    }
    db = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseKey, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
    const { data: { session } } = await db.auth.getSession();
    if (!session) return loginScreen();
    state.user = session.user;
    await loadRows();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
