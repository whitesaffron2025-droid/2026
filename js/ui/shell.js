window.CampaignShell = {
  sections: [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'residents', label: 'Residents' },
    { id: 'assign', label: 'Assign' },
    { id: 'calls', label: 'Calls' },
    { id: 'votes', label: 'Votes' },
    { id: 'visits', label: 'Visits' },
    { id: 'transport', label: 'Transport' },
    { id: 'reports', label: 'Reports' }
  ],

  render() {
    document.body.innerHTML = `
      <header class="topbar">
        <a class="brand" href="./" aria-label="Home">
          <span class="brand-mark">2026</span>
          <span><strong>Campaign Manager</strong><small id="connectionStatus">Loading...</small></span>
        </a>
        <nav id="nav" class="nav" aria-label="Workflow navigation"></nav>
      </header>

      <main class="shell">
        <section class="hero">
          <div>
            <p class="eyebrow">Modern workflow</p>
            <h1 id="pageTitle">Campaign Dashboard</h1>
            <p class="hero-text">Select address, search by name/ID/mobile, filter and update residents from section-based work queues.</p>
          </div>
        </section>

        <section class="toolbar search-panel" aria-label="Filters">
          <label>Address
            <select id="addressFilter"><option value="all">All Addresses</option></select>
          </label>
          <label>Search By
            <select id="searchCategory">
              <option value="any">Any field</option>
              <option value="name">Name</option>
              <option value="id">ID</option>
              <option value="mobile">Mobile</option>
            </select>
          </label>
          <label class="search-wide">Search
            <input id="searchInput" type="search" placeholder="Type search text" autocomplete="off">
          </label>
          <button class="primary search-button" id="searchBtn">Search</button>
          <button class="secondary search-button" id="clearSearchBtn">Clear</button>
          <label>Party
            <select id="partyFilter"><option value="all">All</option><option value="PNC">PNC</option><option value="MDP">MDP</option></select>
          </label>
          <label>Page size
            <select id="pageSize"><option value="20">20</option><option value="50">50</option></select>
          </label>
        </section>

        <section id="dashboard"></section>
        <section id="content"></section>
      </main>

      <dialog id="editDialog" class="modal"></dialog>
    `;
  },

  renderNav() {
    const h = window.CampaignHelpers;
    const state = window.CampaignState;
    document.getElementById('nav').innerHTML = this.sections.map(function (section) {
      return `<button class="nav-btn ${state.section === section.id ? 'active' : ''}" data-section="${section.id}">${h.escape(section.label)}</button>`;
    }).join('');
  },

  renderAddressOptions() {
    const h = window.CampaignHelpers;
    const state = window.CampaignState;
    const select = document.getElementById('addressFilter');
    if (!select) return;
    const counts = new Map();
    state.rows.forEach(function (row) {
      const address = h.text(row.house) || h.text(row.living_place) || h.text(row.lives_in);
      if (!address) return;
      counts.set(address, (counts.get(address) || 0) + 1);
    });
    const addresses = Array.from(counts.keys()).sort(function (a, b) { return a.localeCompare(b, undefined, { numeric: true }); });
    select.innerHTML = `<option value="all">All Addresses (${state.rows.length.toLocaleString()})</option>` + addresses.map(function (address) {
      return `<option value="${h.escape(address)}">${h.escape(address)} (${counts.get(address)})</option>`;
    }).join('');
    select.value = addresses.indexOf(state.address) >= 0 ? state.address : 'all';
  },

  setTitle(title) {
    document.getElementById('pageTitle').textContent = title;
  },

  setStatus(message) {
    document.getElementById('connectionStatus').textContent = message;
  }
};
