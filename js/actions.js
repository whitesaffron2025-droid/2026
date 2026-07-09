window.CampaignActions = {
  buildUpdatePatch(form) {
    const data = Object.fromEntries(new FormData(form).entries());
    const callAttempts = data.call_attempts === '' ? 0 : Number(data.call_attempts || 0);
    const callDuration = data.call_duration === '' ? null : Number(data.call_duration || 0);
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
      call_attempts: callAttempts,
      call_duration: callDuration,
      call_notes: data.call_notes.trim() || null,
      callback_scheduled_at: data.callback_scheduled_at || null,
      call_center_agent: data.call_center_agent.trim() || null,
      call_outcome: data.call_outcome || null,
      sms_sent: data.sms_sent === 'on',
      email_sent: data.email_sent === 'on',
      election_review_updated_at: new Date().toISOString()
    };
    if (patch.vote_status === 'will-vote') patch.reach_status = 'reached';
    if (patch.phone_status && patch.phone_status !== 'need-call') {
      patch.call_attempts = Math.max(callAttempts, 1);
      patch.last_call_at = new Date().toISOString();
    }
    if (patch.phone_status === 'called' && patch.call_outcome === 'promised-to-vote') {
      patch.vote_status = 'will-vote';
      patch.reach_status = 'reached';
    }
    if (patch.vote_assigned_by) patch.vote_assigned_at = new Date().toISOString();
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
  selectedIds() {
    return [...window.CampaignState.selectedIds].map(Number);
  },
  syncRows(updatedRows) {
    const rows = updatedRows.map(row => window.CampaignUtils.normalize(row));
    rows.forEach(updated => {
      const index = window.CampaignState.rows.findIndex(row => Number(row.id) === Number(updated.id));
      if (index >= 0) window.CampaignState.rows[index] = { ...window.CampaignState.rows[index], ...updated };
    });
    window.CampaignApp.populateAssigners();
    window.CampaignApp.render();
  },
  async bulkUpdate(patch, label) {
    const ids = this.selectedIds();
    if (!ids.length) return alert('Select records first.');
    const updated = await window.CampaignApi.bulkUpdate(ids, patch);
    this.syncRows(updated);
    alert(`${ids.length} records updated${label ? `: ${label}` : ''}.`);
  },
  async bulkUpdateVote() {
    const value = window.CampaignUtils.el('bulkVoteStatus').value;
    if (!value) return alert('Select vote status.');
    await this.bulkUpdate({ vote_status: value }, `Vote = ${value}`);
  },
  async bulkUpdateCall() {
    const value = window.CampaignUtils.el('bulkCallStatus').value;
    if (!value) return alert('Select call status.');
    const patch = { phone_status: value };
    if (value !== 'need-call') patch.last_call_at = new Date().toISOString();
    await this.bulkUpdate(patch, `Call = ${value}`);
  },
  async bulkUpdateD2D() {
    const value = window.CampaignUtils.el('bulkD2DStatus').value;
    if (!value) return alert('Select D2D status.');
    await this.bulkUpdate({ d2d_status: value }, `D2D = ${value}`);
  },
  async bulkAssign() {
    const name = window.CampaignUtils.text(window.CampaignUtils.el('bulkAssignee').value);
    if (!name) return alert('Enter assignee name.');
    await this.bulkUpdate({ vote_assigned_by: name, vote_assigned_at: new Date().toISOString() }, `Assigned to ${name}`);
  },
  async bulkDelete() {
    const ids = this.selectedIds();
    if (!ids.length) return alert('Select records first.');
    if (!confirm(`Delete ${ids.length} selected records? This cannot be undone.`)) return;
    await window.CampaignApi.bulkDelete(ids);
    window.CampaignState.rows = window.CampaignState.rows.filter(row => !ids.includes(Number(row.id)));
    window.CampaignState.selectedIds.clear();
    window.CampaignApp.render();
    alert(`${ids.length} records deleted.`);
  },
  csvForRows(rows) {
    const u = window.CampaignUtils;
    const cols = ['id', 'name', 'national_id', 'house', 'phone', 'party', 'vote_status', 'phone_status', 'd2d_status', 'reach_status', 'vote_assigned_by', 'call_attempts', 'last_call_at', 'call_center_agent', 'call_outcome'];
    return [cols.join(',')].concat(rows.map(row => cols.map(col => u.escapeCsv(row[col])).join(','))).join('\n');
  },
  downloadCsv(rows, filename) {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([this.csvForRows(rows)], { type: 'text/csv' }));
    link.download = filename;
    link.click();
  },
  exportData() {
    const state = window.CampaignState;
    const rows = state.filtered.length ? state.filtered : state.rows;
    this.downloadCsv(rows, 'campaign-export.csv');
  },
  exportSelected() {
    const ids = this.selectedIds();
    if (!ids.length) return alert('Select records first.');
    const rows = window.CampaignState.rows.filter(row => ids.includes(Number(row.id)));
    this.downloadCsv(rows, 'campaign-selected-export.csv');
  },
  printPdf() {
    window.print();
  },
  copyReport() {
    const report = window.CampaignUtils.el('reportOutput').textContent;
    navigator.clipboard.writeText(report);
  }
};

Object.assign(window, {
  updateRecord: (...args) => window.CampaignApi.updateRecord(...args),
  saveRecord: (...args) => window.CampaignActions.saveRecord(...args),
  bulkUpdateStatus: (...args) => window.CampaignActions.bulkUpdate(...args),
  exportCampaignData: () => window.CampaignActions.exportData(),
  exportSelectedRecords: () => window.CampaignActions.exportSelected()
});
