window.CampaignMetrics = {
  calculate(rows) {
    const u = window.CampaignUtils;
    rows = rows || window.CampaignState.rows;
    const total = rows.length;
    const reached = rows.filter(r => r.reach_status === 'reached' || ['will-vote', 'not-vote'].includes(r.vote_status) || r.phone_status === 'called' || r.d2d_status === 'reach').length;
    const called = rows.filter(r => r.phone_status === 'called').length;
    const willVote = rows.filter(r => r.vote_status === 'will-vote').length;
    const needCall = rows.filter(r => r.phone_status === 'need-call' || !r.phone_status).length;
    const noPhone = rows.filter(r => r.phone_status === 'no-phone' || !u.text(r.phone)).length;
    const busy = rows.filter(r => r.phone_status === 'busy').length;
    const disconnected = rows.filter(r => ['disconnected', 'wrong-number', 'out-of-coverage', 'out-of-range'].includes(r.phone_status)).length;
    const notDecided = rows.filter(r => r.vote_status === 'not-decided' || !r.vote_status).length;
    const d2d = rows.filter(r => r.d2d_status === 'reach').length;
    const d2dNotVisited = rows.filter(r => r.d2d_status === 'not-visited' || !r.d2d_status).length;
    const d2dNotHome = rows.filter(r => r.d2d_status === 'not-home').length;
    const d2dLiveAnother = rows.filter(r => r.d2d_status === 'live-in-another-place').length;
    const guaranteed = rows.filter(r => r.support_level === 'guaranteed').length;
    const needTransport = rows.filter(r => r.transport_status === 'need-transport').length;
    const assigned = rows.filter(r => u.text(r.vote_assigned_by)).length;
    const totalCallAttempts = rows.reduce((sum, r) => sum + Number(r.call_attempts || 0), 0);
    const totalCallDuration = rows.reduce((sum, r) => sum + Number(r.call_duration || 0), 0);
    const willVoteFromCalls = rows.filter(r => r.phone_status === 'called' && r.vote_status === 'will-vote').length;
    const callable = rows.filter(r => ['need-call', 'called', 'busy', 'switched-off', 'not-answer', 'disconnected', 'wrong-number', 'out-of-coverage', 'out-of-range'].includes(r.phone_status)).length;
    return {
      total,
      reached,
      called,
      willVote,
      needCall,
      noPhone,
      busy,
      disconnected,
      notDecided,
      d2d,
      d2dNotVisited,
      d2dNotHome,
      d2dLiveAnother,
      guaranteed,
      needTransport,
      assigned,
      unassigned: total - assigned,
      totalCallAttempts,
      avgCallAttempts: total ? totalCallAttempts / total : 0,
      totalCallDuration,
      avgCallDuration: called ? totalCallDuration / called : 0,
      willVoteFromCalls,
      callSuccessRate: callable ? (called / callable) * 100 : 0,
      callConversionRate: called ? (willVoteFromCalls / called) * 100 : 0,
      smsSent: rows.filter(r => r.sms_sent === true).length,
      emailSent: rows.filter(r => r.email_sent === true).length
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
  },
  callAgentStats(rows) {
    rows = rows || window.CampaignState.rows;
    const u = window.CampaignUtils;
    const groups = {};
    rows.forEach(row => {
      const name = u.text(row.call_center_agent) || 'No Agent';
      if (!groups[name]) groups[name] = { name, total: 0, called: 0, attempts: 0, duration: 0, willVote: 0 };
      groups[name].total++;
      if (row.phone_status === 'called') groups[name].called++;
      groups[name].attempts += Number(row.call_attempts || 0);
      groups[name].duration += Number(row.call_duration || 0);
      if (row.phone_status === 'called' && row.vote_status === 'will-vote') groups[name].willVote++;
    });
    return Object.values(groups).sort((a, b) => b.called - a.called || b.total - a.total || a.name.localeCompare(b.name));
  }
};
