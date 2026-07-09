window.CampaignRenderDashboard = {
  getStatsCardsHtml(stats) {
    const u = window.CampaignUtils;
    const items = [
      ['Total Records', stats.total, 'All voters in table'],
      ['Will Vote', stats.willVote, `${u.pct(stats.willVote, stats.total)}% support`],
      ['Reached', stats.reached, `${u.pct(stats.reached, stats.total)}% outreach`],
      ['Called', stats.called, `${u.pct(stats.called, stats.total)}% phone`],
      ['Need Call', stats.needCall, `${u.pct(stats.needCall, stats.total)}% pending`],
      ['No Phone', stats.noPhone, `${u.pct(stats.noPhone, stats.total)}% missing`],
      ['Call Attempts', stats.totalCallAttempts, `${stats.callSuccessRate.toFixed(1)}% success`],
      ['Call Conversion', stats.willVoteFromCalls, `${stats.callConversionRate.toFixed(1)}% will vote from calls`]
    ];
    return items.map(([title, value, sub]) => `<article class="kpi"><span>${title}</span><strong>${u.fmt(value)}</strong><small>${sub}</small></article>`).join('');
  },
  getProgressHtml(stats) {
    const u = window.CampaignUtils;
    const items = [
      ['Reach rate', stats.reached, stats.total],
      ['Call rate', stats.called, stats.total],
      ['Will vote rate', stats.willVote, stats.total],
      ['D2D reach', stats.d2d, stats.total],
      ['Guaranteed', stats.guaranteed, stats.total],
      ['Call conversion', stats.willVoteFromCalls, stats.called || 1]
    ];
    return items.map(([title, value, total]) => {
      const p = u.pct(value, total);
      return `<div class="progress-item"><div class="progress-top"><span>${title}</span><span>${p}%</span></div><div class="bar"><i style="width:${Math.min(Number(p), 100)}%"></i></div><small>${u.fmt(value)} of ${u.fmt(total)}</small></div>`;
    }).join('');
  },
  getPrioritiesHtml(stats) {
    const u = window.CampaignUtils;
    const items = [
      ['Need call', stats.needCall],
      ['No phone', stats.noPhone],
      ['Not decided', stats.notDecided],
      ['Unassigned', stats.unassigned],
      ['Need transport', stats.needTransport]
    ];
    return items.map(([title, value]) => `<div class="priority"><b>${title}</b><strong>${u.fmt(value)}</strong></div>`).join('');
  },
  getDashboardHtml(stats) {
    return {
      statsCards: this.getStatsCardsHtml(stats),
      progress: this.getProgressHtml(stats),
      priorities: this.getPrioritiesHtml(stats)
    };
  },
  inject(html) {
    const u = window.CampaignUtils;
    const statsTarget = document.getElementById('dashboard-stats') || document.getElementById('kpiGrid');
    if (statsTarget) statsTarget.innerHTML = html.statsCards;
    u.el('progressBars').innerHTML = html.progress;
    u.el('priorityList').innerHTML = html.priorities;
  },
  render() {
    const stats = window.CampaignMetrics.calculate();
    const html = this.getDashboardHtml(stats);
    this.inject(html);
    return html;
  }
};

Object.assign(window, {
  renderDashboard: () => window.CampaignRenderDashboard.render()
});
