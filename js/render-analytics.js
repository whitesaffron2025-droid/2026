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
  getD2DAnalyticsHtml(stats) {
    const u = window.CampaignUtils;
    return `<div class="insight"><b>D2D Overview</b><br><small>Reached/Visited: ${u.fmt(stats.d2d)} • Not Visited: ${u.fmt(stats.d2dNotVisited)} • Not Home: ${u.fmt(stats.d2dNotHome)} • Live Elsewhere: ${u.fmt(stats.d2dLiveAnother)}</small></div>`;
  },
  getAssignerAnalyticsHtml() {
    const u = window.CampaignUtils;
    const top = window.CampaignMetrics.assignerStats().slice(0, 8);
    return `<div class="insight"><b>Assigner Summary</b><br>${top.map(item => `<small>${item.name}: ${u.fmt(item.total)} assigned, ${u.fmt(item.reached)} reached, ${u.fmt(item.willVote)} will vote</small>`).join('<br>')}</div>`;
  },
  getInsightsHtml(stats) {
    const u = window.CampaignUtils;
    return `<div class="insight"><b>Loaded full database</b><br><small>${u.fmt(stats.total)} records included in this dashboard.</small></div>${this.getD2DAnalyticsHtml(stats)}${this.getAssignerAnalyticsHtml()}`;
  },
  getReportText(stats) {
    const u = window.CampaignUtils;
    return `Report\nTotal records: ${u.fmt(stats.total)}\nReached: ${u.fmt(stats.reached)}\nCalled: ${u.fmt(stats.called)}\nWill vote: ${u.fmt(stats.willVote)}\nNeed call: ${u.fmt(stats.needCall)}\nAssigned: ${u.fmt(stats.assigned)}\nUnassigned: ${u.fmt(stats.unassigned)}\n\nD2D\nReached/Visited: ${u.fmt(stats.d2d)}\nNot visited: ${u.fmt(stats.d2dNotVisited)}\nNot home: ${u.fmt(stats.d2dNotHome)}\nLive in another place: ${u.fmt(stats.d2dLiveAnother)}`;
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
