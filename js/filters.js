window.CampaignFilters = {
  apply() {
    const state = window.CampaignState;
    const u = window.CampaignUtils;
    const q = u.lower(u.el('searchInput').value);
    const party = u.el('partyFilter').value;
    const status = u.el('statusFilter').value;
    const d2d = u.el('d2dFilter').value;
    const callStatus = u.el('callStatusFilter').value;
    const callOutcome = u.el('callOutcomeFilter').value;
    const assigner = u.el('assignerFilter').value;
    state.pageSize = Number(u.el('pageSize').value || window.CampaignConfig.pageSize);
    state.filters = { ...state.filters, search: q, party, status, d2d, callStatus, callOutcome, assigner };

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
        row.vote_assigned_by,
        row.call_center_agent,
        row.call_notes,
        row.call_outcome
      ].map(v => u.lower(v)).join(' ');

      if (q && !haystack.includes(q)) return false;
      if (state.filters.house && !u.lower(row.house).includes(u.lower(state.filters.house))) return false;
      if (state.filters.id && u.lower(row.national_id) !== u.lower(state.filters.id)) return false;
      if (party !== 'all' && u.text(row.party).toUpperCase() !== party) return false;
      if (d2d !== 'all' && row.d2d_status !== d2d) return false;
      if (callStatus !== 'all' && row.phone_status !== callStatus) return false;
      if (callOutcome !== 'all' && row.call_outcome !== callOutcome) return false;
      if (assigner === 'unassigned' && u.text(row.vote_assigned_by)) return false;
      if (assigner !== 'all' && assigner !== 'unassigned' && u.lower(row.vote_assigned_by) !== u.lower(assigner)) return false;
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
  },
  applyUrlParams() {
    const state = window.CampaignState;
    const u = window.CampaignUtils;
    const params = new URLSearchParams(window.location.search);
    const search = params.get('search') || '';
    const assigner = params.get('assigner') || '';
    const d2d = params.get('d2d') || '';
    const callStatus = params.get('call') || params.get('phone_status') || '';
    const callOutcome = params.get('outcome') || '';
    const house = params.get('house') || '';
    const id = params.get('id') || params.get('voter') || '';
    const unassigned = params.get('unassigned') === 'true' || params.get('filter') === 'unassigned';
    const publicFlag = params.get('public') === 'true';

    if (publicFlag || assigner || d2d || callStatus || callOutcome || house || id || search || unassigned) {
      state.publicView = publicFlag;
      if (search) u.el('searchInput').value = search;
      if (assigner) u.el('assignerFilter').value = assigner;
      if (d2d) u.el('d2dFilter').value = d2d;
      if (callStatus) u.el('callStatusFilter').value = callStatus;
      if (callOutcome) u.el('callOutcomeFilter').value = callOutcome;
      if (unassigned) u.el('assignerFilter').value = 'unassigned';
      state.filters.house = house;
      state.filters.id = id;
      state.urlFiltersApplied = true;
    }
  }
};
