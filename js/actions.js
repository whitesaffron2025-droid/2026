window.CampaignActions = {
  buildUpdatePatch(form) {
    const data = Object.fromEntries(new FormData(form).entries());
    const patch = {
      vote_status: data.vote_status || 'not-decided',
      phone_status: data.phone_status || 'need-call',
      d2d_status: data.d2d_status || 'not-visited',
      reach_status: data.reach_status || 'not-reached',
      support_level: data.support_level || 'normal',
      transport_status: data.transport_status || 'not-needed',
      vote_assigned_by: data.vote_assigned_by.trim() || null,
      living_place: data.living_place.trim() || null,
      remarks: data.remarks.trim() || null,
      election_review_updated_at: new Date().toISOString()
    };

    if (patch.vote_status === 'will-vote') {
      patch.reach_status = 'reached';
    }

    if (patch.vote_assigned_by) {
      patch.vote_assigned_at = new Date().toISOString();
    }

    return patch;
  },
  async saveRecord(id, form) {
    const patch = this.buildUpdatePatch(form);
    const updatedRows = await window.CampaignApi.updateRecord(id, patch);
    const updated = updatedRows && updatedRows[0] ? window.CampaignUtils.normalize(updatedRows[0]) : { id, ...patch };
    const index = window.CampaignState.rows.findIndex(row => Number(row.id) === Number(id));
    if (index >= 0) window.CampaignState.rows[index] = { ...window.CampaignState.rows[index], ...updated };
    window.CampaignModals.close();
    window.CampaignApp.populateAssigners();
    window.CampaignApp.render();
    const auto = patch.vote_status === 'will-vote' ? '\nReach Status automatically set to Reached.' : '';
    alert(`Record updated successfully.${auto}`);
    return { success: true, patch, updated };
  },
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
