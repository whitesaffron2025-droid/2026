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

    if (patch.vote_status === 'will-vote') {
      patch.reach_status = 'reached';
    }

    if (patch.phone_status && patch.phone_status !== 'need-call') {
      patch.call_attempts = Math.max(callAttempts, 1);
      patch.last_call_at = new Date().toISOString();
    }

    if (patch.phone_status === 'called' && patch.call_outcome === 'promised-to-vote') {
      patch.vote_status = 'will-vote';
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
    const cols = ['id', 'name', 'national_id', 'house', 'phone', 'party', 'vote_status', 'phone_status', 'd2d_status', 'reach_status', 'vote_assigned_by', 'call_attempts', 'last_call_at', 'call_center_agent', 'call_outcome'];
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
