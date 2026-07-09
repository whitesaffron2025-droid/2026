window.CampaignRenderAnalytics = {
  getPartyAnalyticsHtml() {
    const u = window.CampaignUtils;
    const groups = {};
    window.CampaignState.rows.forEach(row => {
      const key = u.text(row.party).toUpperCase() || 'UNKNOWN';
      if (!groups[key]) groups[key] = [];
      groups[key].push(row);
    });
    return Object.keys(groups).map(party => {
      const rows = groups[party];
      const m = window.CampaignMetrics.calculate(rows);
      return `<div class="analytics-row"><div><b>${party}</b><br><small>${u.fmt(rows.length)} records</small></div><div><b>${u.pct(m.willVote, m.total)}%</b><br><small>will vote</small></div><div><b>${u.pct(m.reached, m.total)}%</b><br><small>reached</small></div></div>`;
    }).join('');
  },
  getInsightsHtml(stats) {
    const u = window.CampaignUtils;
    return `<div class="insight"><b>Loaded full database</b><br><small>${u.fmt(stats.total)} records included in this dashboard.</small></div>`;
  },
  getReportText(stats) {
    const u = window.CampaignUtils;
    return `Report\nTotal records: ${u.fmt(stats.total)}\nReached: ${u.fmt(stats.reached)}\nCalled: ${u.fmt(stats.called)}\nWill vote: ${u.fmt(stats.willVote)}\nNeed call: ${u.fmt(stats.needCall)}\nAssigned: ${u.fmt(stats.assigned)}\nUnassigned: ${u.fmt(stats.unassigned)}`;
  },
  getAnalyticsHtml(stats) {
    return {
      partyAnalytics: this.getPartyAnalyticsHtml(),
      insights: this.getInsightsHtml(stats),
      report: this.getReportText(stats)
    };
  },
  inject(html) {
    const u = window.CampaignUtils;
    u.el('partyAnalytics').innerHTML = html.partyAnalytics;
    u.el('insightsList').innerHTML = html.insights;
    u.el('reportOutput').textContent = html.report;
  },
  render() {
    const stats = window.CampaignMetrics.calculate();
    const html = this.getAnalyticsHtml(stats);
    this.inject(html);
    return html;
  }
};
