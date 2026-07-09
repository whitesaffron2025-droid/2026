window.CampaignFiltersRenderer = {
  option(value, label, selected) {
    const h = window.CampaignHelpers;
    return `<option value="${h.escape(value)}" ${selected ? 'selected' : ''}>${h.escape(label)}</option>`;
  },

  addressOptions() {
    const h = window.CampaignHelpers;
    const state = window.CampaignState;
    const counts = new Map();
    state.rows.forEach(row => {
      const address = window.CampaignSections.rowAddress(row);
      if (!address) return;
      counts.set(address, (counts.get(address) || 0) + 1);
    });
    const addresses = Array.from(counts.keys()).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    return this.option('all', `All Addresses (${state.rows.length.toLocaleString()})`, state.address === 'all') + addresses.map(address => {
      return this.option(address, `${address} (${counts.get(address)})`, state.address === address);
    }).join('');
  },

  assignerOptions() {
    const h = window.CampaignHelpers;
    const state = window.CampaignState;
    const assigners = [...new Set(state.rows.map(row => h.text(row.vote_assigned_by)).filter(Boolean))].sort((a, b) => a.localeCompare(b));
    const current = window.CampaignAssign ? window.CampaignAssign.assignee : 'all';
    return this.option('all', 'All assigners', current === 'all') + assigners.map(name => this.option(name, name, current === name)).join('');
  },

  buildFilter(filter) {
    const state = window.CampaignState;
    if (filter === 'address') {
      return `<label>Address<select id="addressFilter">${this.addressOptions()}</select></label>`;
    }
    if (filter === 'party') {
      return `<label>Party<select id="partyFilter">${this.option('all', 'All', state.party === 'all')}${this.option('PNC', 'PNC', state.party === 'PNC')}${this.option('MDP', 'MDP', state.party === 'MDP')}</select></label>`;
    }
    if (filter === 'assignCategory') {
      const mode = window.CampaignAssign ? window.CampaignAssign.mode : 'unassigned';
      return `<label>Assign Category<select id="assignMode">${this.option('unassigned', 'Unassigned', mode === 'unassigned')}${this.option('assigned', 'Assigned', mode === 'assigned')}${this.option('all', 'All Residents', mode === 'all')}</select></label>`;
    }
    if (filter === 'assigner') {
      return `<label>Assigner<select id="assignerMode">${this.assignerOptions()}</select></label>`;
    }
    if (filter === 'voteStatus') {
      const current = state.voteStatus || 'all';
      return `<label>Vote Status<select id="voteStatusFilter">${this.option('all', 'All', current === 'all')}${this.option('will-vote', 'Will Vote', current === 'will-vote')}${this.option('not-vote', 'Not Vote', current === 'not-vote')}${this.option('not-decided', 'Not Decided', current === 'not-decided')}</select></label>`;
    }
    if (filter === 'visitStatus') {
      const current = state.visitStatus || 'all';
      return `<label>Visit Status<select id="visitStatusFilter">${this.option('all', 'All', current === 'all')}${this.option('reach', 'Reach', current === 'reach')}${this.option('not-home', 'Not Home', current === 'not-home')}${this.option('live-in-another-place', 'Live in Another Place', current === 'live-in-another-place')}${this.option('not-visited', 'Not Visited', current === 'not-visited')}</select></label>`;
    }
    if (filter === 'transportStatus') {
      const current = state.transportStatus || 'all';
      return `<label>Transport<select id="transportStatusFilter">${this.option('all', 'All', current === 'all')}${this.option('need', 'Need', current === 'need')}${this.option('not-needed', 'Not Needed', current === 'not-needed')}</select></label>`;
    }
    return '';
  },

  render(section) {
    const h = window.CampaignHelpers;
    const state = window.CampaignState;
    const config = window.CampaignSectionConfigs[section];
    const filterHtml = (config.filters || []).map(filter => this.buildFilter(filter)).join('');
    return `
      <div class="toolbar section-filter ${section === 'assign' ? 'assign-toolbar' : ''}" aria-label="${h.escape(config.title)} filters">
        ${filterHtml}
        <label class="search-wide">Search<input id="searchInput" type="search" placeholder="Name, ID or mobile" value="${h.escape(state.search)}" autocomplete="off"></label>
        <button class="secondary search-button" id="clearSearchBtn">Clear</button>
        <label>Page size<select id="pageSize">${this.option('20', '20', state.pageSize === 20)}${this.option('50', '50', state.pageSize === 50)}</select></label>
      </div>
    `;
  }
};
