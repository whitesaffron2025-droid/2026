window.CampaignDashboard = {
  metrics() {
    const h = window.CampaignHelpers;
    const d = h.defaults;
    const rows = window.CampaignState.rows;
    return {
      total: rows.length,
      unassigned: rows.filter(row => !h.text(row.vote_assigned_by)).length,
      needCall: rows.filter(row => h.value(row.phone_status, d.phone_status) === 'need-call').length,
      notDecided: rows.filter(row => h.value(row.vote_status, d.vote_status) === 'not-decided').length,
      willVote: rows.filter(row => h.value(row.vote_status, d.vote_status) === 'will-vote').length,
      notVisited: rows.filter(row => h.value(row.d2d_status, d.d2d_status) === 'not-visited').length,
      needTransport: rows.filter(row => h.value(row.transport_status, d.transport_status) === 'need-transport').length,
      remarks: rows.filter(row => !!h.text(row.remarks)).length
    };
  },

  render() {
    const m = this.metrics();
    const h = window.CampaignHelpers;
    document.getElementById('dashboard').style.display = '';
    document.getElementById('content').innerHTML = '';
    document.getElementById('dashboard').innerHTML = `
      <div class="kpi-grid">
        ${this.kpi('Residents', m.total, 'residents')}
        ${this.kpi('Unassigned', m.unassigned, 'assign')}
        ${this.kpi('Need Call', m.needCall, 'calls')}
        ${this.kpi('Need Vote Decision', m.notDecided, 'votes')}
        ${this.kpi('Will Vote', m.willVote, 'residents')}
        ${this.kpi('Not Visited', m.notVisited, 'visits')}
        ${this.kpi('Need Transport', m.needTransport, 'transport')}
        ${this.kpi('With Remarks', m.remarks, 'residents')}
      </div>
      <article class="panel">
        <h2>Workflow</h2>
        <p class="hero-text">Dashboard → Residents → Assign → Calls → Votes → Visits → Transport → Reports</p>
      </article>
    `;
  },

  kpi(label, value, section) {
    const h = window.CampaignHelpers;
    return `<button class="kpi" data-section="${section}"><span>${h.escape(label)}</span><strong>${Number(value || 0).toLocaleString()}</strong></button>`;
  }
};
