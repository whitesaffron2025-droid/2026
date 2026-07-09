window.CampaignRenderAnalytics = {
  renderPartyAnalytics() {
    const u = window.CampaignUtils;
    const groups = {};
    window.CampaignState.rows.forEach(row => {
      const key = u.text(row.party).toUpperCase() || 'UNKNOWN';
      if (!groups[key]) groups[key] = [];
      groups[key].push(row);
    });
    u.el('partyAnalytics').innerHTML = Object.keys(groups).map(party => {
      const rows = groups[party];
      const m = window.CampaignMetrics.calculate(rows);
      return `<div class="analytics-row"><div><b>${party}</b><br><small>${u.fmt(rows.length)} records</small></div><div><b>${u.pct(m.willVote, m.total)}%</b><br><small>will vote</small></div><div><b>${u.pct(m.reached, m.total)}%</b><br><small>reached</small></div></div>`;
    }).join('');
  },
  renderInsights() {
    const u = window.CampaignUtils;
    const m = window.CampaignMetrics.calculate();
    u.el('insightsList').innerHTML = `<div class="insight"><b>Loaded full database</b><br><small>${u.fmt(m.total)} records included in this dashboard.</small></div>`;
  },
  renderReport() {
    const u = window.CampaignUtils;
    const m = window.CampaignMetrics.calculate();
    u.el('reportOutput').textContent = `Report\nTotal records: ${u.fmt(m.total)}\nReached: ${u.fmt(m.reached)}\nCalled: ${u.fmt(m.called)}\nWill vote: ${u.fmt(m.willVote)}\nNeed call: ${u.fmt(m.needCall)}\nAssigned: ${u.fmt(m.assigned)}\nUnassigned: ${u.fmt(m.unassigned)}`;
  },
  render() {
    this.renderPartyAnalytics();
    this.renderInsights();
    this.renderReport();
  }
};
