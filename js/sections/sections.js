window.CampaignSections = {
  title(section) {
    return {
      dashboard: 'Campaign Dashboard',
      residents: 'Residents',
      assign: 'Assign Voters',
      calls: 'Call Center',
      votes: 'Vote Decision',
      visits: 'D2D Visits',
      transport: 'Transport',
      reports: 'Reports'
    }[section] || 'Residents';
  },

  searchHaystack(row) {
    const h = window.CampaignHelpers;
    const category = window.CampaignState.searchCategory || 'any';
    const address = [row.house, row.lives_in, row.living_place].map(value => h.text(value)).join(' ');
    const map = {
      name: [row.name],
      id: [row.national_id],
      address: [address],
      mobile: [row.phone],
      any: [row.name, row.national_id, row.phone, row.house, row.lives_in, row.living_place, row.party, row.remarks, row.vote_assigned_by]
    };
    return (map[category] || map.any).map(value => h.text(value).toLowerCase()).join(' ');
  },

  baseRows() {
    const h = window.CampaignHelpers;
    const state = window.CampaignState;
    let rows = state.rows.slice();

    if (state.party !== 'all') rows = rows.filter(row => h.text(row.party).toUpperCase() === state.party);

    if (state.search) {
      const q = state.search.toLowerCase();
      rows = rows.filter(row => this.searchHaystack(row).includes(q));
    }

    return rows.sort((a, b) => h.text(a.house).localeCompare(h.text(b.house), undefined, { numeric: true }) || h.text(a.name).localeCompare(h.text(b.name)));
  },

  rowsFor(section) {
    if (section === 'assign') return window.CampaignAssign.rows();
    if (section === 'calls') return window.CampaignCalls.rows();
    if (section === 'votes') return window.CampaignVotes.rows();
    if (section === 'visits') return window.CampaignVisits.rows();
    if (section === 'transport') return window.CampaignTransport.rows();
    return this.baseRows();
  }
};
