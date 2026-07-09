window.CampaignReports = {
  reportText() {
    const m = window.CampaignDashboard.metrics();
    return [
      '2026 Campaign Report',
      'Generated: ' + new Date().toLocaleString(),
      '',
      'Residents: ' + m.total,
      'Unassigned: ' + m.unassigned,
      'Need Call: ' + m.needCall,
      'Need Vote Decision: ' + m.notDecided,
      'Will Vote: ' + m.willVote,
      'Not Visited: ' + m.notVisited,
      'Need Transport: ' + m.needTransport,
      'With Remarks: ' + m.remarks
    ].join('\n');
  },

  render() {
    const h = window.CampaignHelpers;
    const report = this.reportText();
    document.getElementById('dashboard').style.display = 'none';
    document.getElementById('content').innerHTML = `
      <article class="panel">
        <div class="panel-head"><h2>Campaign Report</h2><button class="primary" id="copyReport">Copy Report</button></div>
        <pre class="report-box">${h.escape(report)}</pre>
      </article>
    `;
    document.getElementById('copyReport').onclick = function () {
      navigator.clipboard.writeText(report).then(function () { alert('Report copied.'); });
    };
  }
};
