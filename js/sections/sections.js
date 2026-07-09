window.CampaignSections = {
  title(section) {
    const config = window.CampaignSectionConfigs && window.CampaignSectionConfigs[section];
    if (config) return config.title;
    return {
      dashboard: 'Campaign Dashboard',
      reports: 'Reports'
    }[section] || 'Residents';
  },

  rowAddress(row) {
    const h = window.CampaignHelpers;
    return h.text(row.house) || h.text(row.living_place) || h.text(row.lives_in);
  },

  searchHaystack(row) {
    const h = window.CampaignHelpers;
    return [row.name, row.national_id, row.phone].map(value => h.text(value).toLowerCase()).join(' ');
  },

  baseRows() {
    const h = window.CampaignHelpers;
    const state = window.CampaignState;
    let rows = state.rows.slice();

    if (state.address !== 'all') rows = rows.filter(row => this.rowAddress(row) === state.address);
    if (state.party !== 'all') rows = rows.filter(row => h.text(row.party).toUpperCase() === state.party);

    if (state.search) {
      const q = state.search.toLowerCase();
      rows = rows.filter(row => this.searchHaystack(row).includes(q));
    }

    return rows.sort((a, b) => this.rowAddress(a).localeCompare(this.rowAddress(b), undefined, { numeric: true }) || h.text(a.name).localeCompare(h.text(b.name)));
  },

  rowsFor(section) {
    const h = window.CampaignHelpers;
    let rows = this.baseRows();

    if (section === 'assign') return window.CampaignAssign.rows();
    if (section === 'calls') return window.CampaignCalls.rows();
    if (section === 'votes') {
      if (window.CampaignState.voteStatus !== 'all') rows = rows.filter(row => h.value(row.vote_status, h.defaults.vote_status) === window.CampaignState.voteStatus);
      return rows;
    }
    if (section === 'visits') {
      if (window.CampaignState.visitStatus !== 'all') rows = rows.filter(row => h.value(row.d2d_status, h.defaults.d2d_status) === window.CampaignState.visitStatus);
      return rows;
    }
    if (section === 'transport') {
      if (window.CampaignState.transportStatus !== 'all') rows = rows.filter(row => h.value(row.transport_status, h.defaults.transport_status) === window.CampaignState.transportStatus);
      return rows;
    }
    return rows;
  }
};
