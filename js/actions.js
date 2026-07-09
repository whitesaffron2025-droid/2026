window.CampaignActions = {
  exportData() {
    const state = window.CampaignState;
    const u = window.CampaignUtils;
    const rows = state.filtered.length ? state.filtered : state.rows;
    const cols = ['id', 'name', 'national_id', 'house', 'phone', 'party', 'vote_status', 'phone_status', 'd2d_status', 'reach_status', 'vote_assigned_by'];
    const csv = [cols.join(',')].concat(rows.map(row => cols.map(col => u.escapeCsv(row[col])).join(','))).join('\n');
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    link.download = 'campaign-export.csv';
    link.click();
  },
  copyReport() {
    const report = window.CampaignUtils.el('reportOutput').textContent;
    navigator.clipboard.writeText(report);
  }
};
