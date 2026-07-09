window.CampaignRenderDashboard = {
  renderKpis() {
    const u = window.CampaignUtils;
    const m = window.CampaignMetrics.calculate();
    const items = [
      ['Total Records', m.total, 'All voters in table'],
      ['Reached', m.reached, `${u.pct(m.reached, m.total)}% outreach`],
      ['Called', m.called, `${u.pct(m.called, m.total)}% phone`],
      ['Will Vote', m.willVote, `${u.pct(m.willVote, m.total)}% support`],
      ['Need Call', m.needCall, `${u.pct(m.needCall, m.total)}% pending`],
      ['Assigned', m.assigned, `${u.fmt(m.unassigned)} unassigned`]
    ];
    u.el('kpiGrid').innerHTML = items.map(([title, value, sub]) => `<article class="kpi"><span>${title}</span><strong>${u.fmt(value)}</strong><small>${sub}</small></article>`).join('');
  },
  renderProgress() {
    const u = window.CampaignUtils;
    const m = window.CampaignMetrics.calculate();
    const items = [
      ['Reach rate', m.reached, m.total],
      ['Call rate', m.called, m.total],
      ['Will vote rate', m.willVote, m.total],
      ['D2D reach', m.d2d, m.total],
      ['Guaranteed', m.guaranteed, m.total]
    ];
    u.el('progressBars').innerHTML = items.map(([title, value, total]) => {
      const p = u.pct(value, total);
      return `<div class="progress-item"><div class="progress-top"><span>${title}</span><span>${p}%</span></div><div class="bar"><i style="width:${Math.min(Number(p), 100)}%"></i></div><small>${u.fmt(value)} of ${u.fmt(total)}</small></div>`;
    }).join('');
  },
  renderPriorities() {
    const u = window.CampaignUtils;
    const m = window.CampaignMetrics.calculate();
    const items = [
      ['Need call', m.needCall],
      ['Not decided', m.notDecided],
      ['Unassigned', m.unassigned],
      ['Need transport', m.needTransport]
    ];
    u.el('priorityList').innerHTML = items.map(([title, value]) => `<div class="priority"><b>${title}</b><strong>${u.fmt(value)}</strong></div>`).join('');
  },
  render() {
    this.renderKpis();
    this.renderProgress();
    this.renderPriorities();
  }
};
