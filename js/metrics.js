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
      guaranteed,
      needTransport,
      assigned,
      unassigned: total - assigned
    };
  }
};
