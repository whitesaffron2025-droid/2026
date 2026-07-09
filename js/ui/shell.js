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
            <p class="eyebrow">Clean workflow</p>
            <h1 id="pageTitle">Campaign Dashboard</h1>
            <p class="hero-text">Each section is a focused work queue.</p>
          </div>
        </section>

        <section class="toolbar" aria-label="Filters">
          <label>Search<input id="searchInput" type="search" placeholder="Name, ID, phone, house" autocomplete="off"></label>
          <label>Party<select id="partyFilter"><option value="all">All</option><option value="PNC">PNC</option><option value="MDP">MDP</option></select></label>
          <label>Page size<select id="pageSize"><option value="20">20</option><option value="50">50</option></select></label>
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

  setTitle(title) {
    document.getElementById('pageTitle').textContent = title;
  },

  setStatus(message) {
    document.getElementById('connectionStatus').textContent = message;
  }
};
