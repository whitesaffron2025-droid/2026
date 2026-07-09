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
  getCallCenterAnalyticsHtml(stats) {
    const u = window.CampaignUtils;
    const agents = window.CampaignMetrics.callAgentStats().slice(0, 6);
    return `<div class="insight"><b>Call Center Overview</b><br><small>Need Call: ${u.fmt(stats.needCall)} • Called: ${u.fmt(stats.called)} • No Phone: ${u.fmt(stats.noPhone)} • Attempts: ${u.fmt(stats.totalCallAttempts)} • Success: ${stats.callSuccessRate.toFixed(1)}% • Conversion: ${stats.callConversionRate.toFixed(1)}%</small><br>${agents.map(agent => `<small>${agent.name}: ${u.fmt(agent.called)} called, ${u.fmt(agent.attempts)} attempts, ${u.fmt(agent.willVote)} will vote</small>`).join('<br>')}</div>`;
  },
  getAssignerAnalyticsHtml() {
    const u = window.CampaignUtils;
    const top = window.CampaignMetrics.assignerStats().slice(0, 8);
    return `<div class="insight"><b>Assigner Summary</b><br>${top.map(item => `<small>${item.name}: ${u.fmt(item.total)} assigned, ${u.fmt(item.reached)} reached, ${u.fmt(item.willVote)} will vote</small>`).join('<br>')}</div>`;
  },
  getInsightsHtml(stats) {
    const u = window.CampaignUtils;
    return `<div class="insight"><b>Loaded full database</b><br><small>${u.fmt(stats.total)} records included in this dashboard.</small></div>${this.getCallCenterAnalyticsHtml(stats)}${this.getD2DAnalyticsHtml(stats)}${this.getAssignerAnalyticsHtml()}`;
  },
  selectedReportFields() {
    return [...document.querySelectorAll('.report-field:checked')].map(input => input.value);
  },
  activeFilterText() {
    const s = window.CampaignState.filters;
    const parts = [];
    if (s.search) parts.push(`Search: ${s.search}`);
    if (s.party !== 'all') parts.push(`Party: ${s.party}`);
    if (s.status !== 'all') parts.push(`Outreach: ${s.status}`);
    if (s.d2d !== 'all') parts.push(`D2D: ${s.d2d}`);
    if (s.callStatus !== 'all') parts.push(`Call: ${s.callStatus}`);
    if (s.callOutcome !== 'all') parts.push(`Outcome: ${s.callOutcome}`);
    if (s.assigner !== 'all') parts.push(`Assigner: ${s.assigner}`);
    if (s.house) parts.push(`House: ${s.house}`);
    if (s.id) parts.push(`ID: ${s.id}`);
    return parts.length ? parts.join('\n') : 'No active filters';
  },
  getReportText(stats) {
    const u = window.CampaignUtils;
    const fields = this.selectedReportFields();
    const lines = [`Campaign Report`, `Generated: ${new Date().toLocaleString()}`, `Filtered records: ${u.fmt(window.CampaignState.filtered.length)}`, ''];
    if (fields.includes('summary')) {
      lines.push('Summary', `Total records: ${u.fmt(stats.total)}`, `Reached: ${u.fmt(stats.reached)}`, `Called: ${u.fmt(stats.called)}`, `Will vote: ${u.fmt(stats.willVote)}`, `Need call: ${u.fmt(stats.needCall)}`, `Assigned: ${u.fmt(stats.assigned)}`, `Unassigned: ${u.fmt(stats.unassigned)}`, '');
    }
    if (fields.includes('call')) {
      lines.push('Call Center', `Need call: ${u.fmt(stats.needCall)}`, `Called: ${u.fmt(stats.called)}`, `No phone: ${u.fmt(stats.noPhone)}`, `Busy: ${u.fmt(stats.busy)}`, `Disconnected/Wrong/Out of coverage: ${u.fmt(stats.disconnected)}`, `Total call attempts: ${u.fmt(stats.totalCallAttempts)}`, `Average call attempts: ${stats.avgCallAttempts.toFixed(2)}`, `Average call duration seconds: ${stats.avgCallDuration.toFixed(1)}`, `Will vote from calls: ${u.fmt(stats.willVoteFromCalls)}`, `Call success rate: ${stats.callSuccessRate.toFixed(1)}%`, `Call conversion rate: ${stats.callConversionRate.toFixed(1)}%`, `SMS sent: ${u.fmt(stats.smsSent)}`, `Email sent: ${u.fmt(stats.emailSent)}`, '');
    }
    if (fields.includes('d2d')) {
      lines.push('D2D', `Reached/Visited: ${u.fmt(stats.d2d)}`, `Not visited: ${u.fmt(stats.d2dNotVisited)}`, `Not home: ${u.fmt(stats.d2dNotHome)}`, `Live in another place: ${u.fmt(stats.d2dLiveAnother)}`, '');
    }
    if (fields.includes('assigner')) {
      lines.push('Top Assigners');
      window.CampaignMetrics.assignerStats().slice(0, 10).forEach(item => lines.push(`${item.name}: ${u.fmt(item.total)} assigned, ${u.fmt(item.reached)} reached, ${u.fmt(item.willVote)} will vote`));
      lines.push('');
    }
    if (fields.includes('filters')) {
      lines.push('Active Filters', this.activeFilterText(), '');
    }
    return lines.join('\n');
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
    const stats = window.CampaignMetrics.calculate(window.CampaignState.filtered.length ? window.CampaignState.filtered : window.CampaignState.rows);
    const html = this.getAnalyticsHtml(stats);
    this.inject(html);
    return html;
  }
};
