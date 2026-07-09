window.CampaignMetrics = {
  calculate(rows) {
    const u = window.CampaignUtils;
    rows = rows || window.CampaignState.rows;
    const total = rows.length;
    const reached = rows.filter(r => r.reach_status === 'reached' || ['will-vote', 'not-vote'].includes(r.vote_status) || r.phone_status === 'called' || r.d2d_status === 'reach').length;
    const called = rows.filter(r => r.phone_status === 'called').length;
    const willVote = rows.filter(r => r.vote_status === 'will-vote').length;
    const needCall = rows.filter(r => r.phone_status === 'need-call' || !r.phone_status).length;
    const notDecided = rows.filter(r => r.vote_status === 'not-decided' || !r.vote_status).length;
    const d2d = rows.filter(r => r.d2d_status === 'reach').length;
    const d2dNotVisited = rows.filter(r => r.d2d_status === 'not-visited' || !r.d2d_status).length;
    const d2dNotHome = rows.filter(r => r.d2d_status === 'not-home').length;
    const d2dLiveAnother = rows.filter(r => r.d2d_status === 'live-in-another-place').length;
    const guaranteed = rows.filter(r => r.support_level === 'guaranteed').length;
    const needTransport = rows.filter(r => r.transport_status === 'need-transport').length;
    const assigned = rows.filter(r => u.text(r.vote_assigned_by)).length;
    return {
      total,
      reached,
      called,
      willVote,
      needCall,
      notDecided,
      d2d,
      d2dNotVisited,
      d2dNotHome,
      d2dLiveAnother,
      guaranteed,
      needTransport,
      assigned,
      unassigned: total - assigned
    };
  },
  assignerStats(rows) {
    const u = window.CampaignUtils;
    rows = rows || window.CampaignState.rows;
    const groups = {};
    rows.forEach(row => {
      const name = u.text(row.vote_assigned_by) || 'Unassigned';
      if (!groups[name]) groups[name] = { name, total: 0, reached: 0, willVote: 0, d2d: 0, needCall: 0 };
      groups[name].total++;
      if (row.reach_status === 'reached' || row.d2d_status === 'reach' || row.phone_status === 'called' || ['will-vote', 'not-vote'].includes(row.vote_status)) groups[name].reached++;
      if (row.vote_status === 'will-vote') groups[name].willVote++;
      if (row.d2d_status === 'reach') groups[name].d2d++;
      if (row.phone_status === 'need-call' || !row.phone_status) groups[name].needCall++;
    });
    return Object.values(groups).sort((a, b) => b.total - a.total || a.name.localeCompare(b.name));
  }
};
