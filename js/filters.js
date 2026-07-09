window.CampaignFilters = {
  apply() {
    const state = window.CampaignState;
    const u = window.CampaignUtils;
    const q = u.lower(u.el('searchInput').value);
    const party = u.el('partyFilter').value;
    const status = u.el('statusFilter').value;
    state.pageSize = Number(u.el('pageSize').value || window.CampaignConfig.pageSize);
    state.filters = { search: q, party, status };

    const filtered = state.rows.filter(row => {
      const haystack = [
        row.name,
        row.national_id,
        row.phone,
        row.house,
        row.lives_in,
        row.living_place,
        row.party,
        row.remarks,
        row.vote_assigned_by
      ].map(v => u.lower(v)).join(' ');

      if (q && !haystack.includes(q)) return false;
      if (party !== 'all' && u.text(row.party).toUpperCase() !== party) return false;
      if (status === 'unassigned') return !u.text(row.vote_assigned_by);
      if (status !== 'all') {
        return [
          row.vote_status,
          row.phone_status,
          row.d2d_status,
          row.reach_status,
          row.transport_status,
          row.support_level
        ].includes(status);
      }
      return true;
    }).sort((a, b) => u.text(a.house).localeCompare(u.text(b.house)) || u.text(a.name).localeCompare(u.text(b.name)));

    state.setFiltered(filtered);
    return filtered;
  }
};
