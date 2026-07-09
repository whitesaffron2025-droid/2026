window.CampaignCharts = {
  instances: {},
  destroy(id) {
    if (this.instances[id]) {
      this.instances[id].destroy();
      delete this.instances[id];
    }
  },
  countBy(rows, field, fallback) {
    const u = window.CampaignUtils;
    const groups = {};
    rows.forEach(row => {
      const key = u.text(row[field]) || fallback || 'Unknown';
      groups[key] = (groups[key] || 0) + 1;
    });
    return groups;
  },
  makeChart(id, config) {
    if (typeof Chart === 'undefined') return null;
    const canvas = document.getElementById(id);
    if (!canvas) return null;
    this.destroy(id);
    this.instances[id] = new Chart(canvas, config);
    return this.instances[id];
  },
  renderVoteChart(rows) {
    const groups = this.countBy(rows, 'vote_status', 'not-decided');
    return this.makeChart('voteChart', {
      type: 'doughnut',
      data: {
        labels: Object.keys(groups),
        datasets: [{ data: Object.values(groups) }]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
    });
  },
  renderCallChart(rows) {
    const groups = this.countBy(rows, 'phone_status', 'need-call');
    return this.makeChart('callChart', {
      type: 'bar',
      data: {
        labels: Object.keys(groups),
        datasets: [{ label: 'Call Status', data: Object.values(groups) }]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
    });
  },
  renderD2DChart(rows) {
    const groups = this.countBy(rows, 'd2d_status', 'not-visited');
    return this.makeChart('d2dChart', {
      type: 'pie',
      data: {
        labels: Object.keys(groups),
        datasets: [{ data: Object.values(groups) }]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
    });
  },
  renderAssignerChart(rows) {
    const stats = window.CampaignMetrics.assignerStats(rows).slice(0, 10);
    return this.makeChart('assignerChart', {
      type: 'bar',
      data: {
        labels: stats.map(item => item.name),
        datasets: [{ label: 'Assigned', data: stats.map(item => item.total) }]
      },
      options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { beginAtZero: true } } }
    });
  },
  render() {
    const rows = window.CampaignState.filtered.length ? window.CampaignState.filtered : window.CampaignState.rows;
    this.renderVoteChart(rows);
    this.renderCallChart(rows);
    this.renderD2DChart(rows);
    this.renderAssignerChart(rows);
  }
};
