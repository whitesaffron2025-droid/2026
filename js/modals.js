window.CampaignModals = {
  option(value, label, current) {
    return `<option value="${value}" ${value === current ? 'selected' : ''}>${label}</option>`;
  },
  field(label, html) {
    return `<label class="modal-field"><span>${label}</span>${html}</label>`;
  },
  renderEditModal(row) {
    const u = window.CampaignUtils;
    const vote = row.vote_status || 'not-decided';
    const reach = vote === 'will-vote' ? 'reached' : (row.reach_status || 'not-reached');
    const reachDisabled = vote === 'will-vote' ? 'disabled' : '';
    const reachNote = vote === 'will-vote' ? 'Will Vote auto-sets Reach Status to Reached.' : 'Other vote statuses keep current reach status unless manually changed.';
    const callbackValue = row.callback_scheduled_at ? String(row.callback_scheduled_at).slice(0, 16) : '';
    return `
      <form id="editForm" class="modal-card" data-record-id="${Number(row.id)}">
        <div class="modal-head">
          <div>
            <h2>${u.text(row.name) || 'No name'}</h2>
            <small>${u.text(row.house) || '-'} • ${u.text(row.phone) || 'No phone'} • ${u.text(row.national_id) || 'No ID'}</small>
          </div>
          <button type="button" class="secondary" data-close-modal>Close</button>
        </div>
        <div class="modal-grid">
          ${this.field('Vote Status', `<select name="vote_status" id="modalVoteStatus">
            ${this.option('not-decided', 'Not Decided', vote)}
            ${this.option('will-vote', 'Will Vote', vote)}
            ${this.option('not-vote', 'Not Vote', vote)}
          </select>`)}
          ${this.field('Reach Status', `<select name="reach_status" id="modalReachStatus" ${reachDisabled}>
            ${this.option('not-reached', 'Not Reached', reach)}
            ${this.option('reached', 'Reached', reach)}
          </select><small id="reachStatusNote">${reachNote}</small>`)}
          ${this.field('Call Status', `<select name="phone_status">
            ${this.option('need-call', 'Need Call', row.phone_status || 'need-call')}
            ${this.option('called', 'Called', row.phone_status)}
            ${this.option('busy', 'Busy', row.phone_status)}
            ${this.option('switched-off', 'Switched Off', row.phone_status)}
            ${this.option('not-answer', 'Not Answer', row.phone_status)}
            ${this.option('disconnected', 'Disconnected', row.phone_status)}
            ${this.option('wrong-number', 'Wrong Number', row.phone_status)}
            ${this.option('out-of-coverage', 'Out of Coverage', row.phone_status)}
            ${this.option('out-of-range', 'Out of Range', row.phone_status)}
            ${this.option('no-phone', 'No Phone', row.phone_status)}
          </select>`)}
          ${this.field('Call Outcome', `<select name="call_outcome">
            ${this.option('', 'No Outcome', row.call_outcome || '')}
            ${this.option('promised-to-vote', 'Promised to Vote', row.call_outcome)}
            ${this.option('undecided', 'Undecided', row.call_outcome)}
            ${this.option('will-not-vote', 'Will Not Vote', row.call_outcome)}
            ${this.option('callback', 'Callback', row.call_outcome)}
            ${this.option('no-answer', 'No Answer', row.call_outcome)}
          </select>`)}
          ${this.field('D2D Status', `<select name="d2d_status">
            ${this.option('not-visited', 'Not Visited', row.d2d_status || 'not-visited')}
            ${this.option('reach', 'Reached / Visited', row.d2d_status)}
            ${this.option('not-home', 'Not Home', row.d2d_status)}
            ${this.option('live-in-another-place', 'Live in Another Place', row.d2d_status)}
          </select>`)}
          ${this.field('Support Level', `<select name="support_level">
            ${this.option('normal', 'Normal', row.support_level || 'normal')}
            ${this.option('not-guaranteed', 'Not Guaranteed', row.support_level)}
            ${this.option('guaranteed', 'Guaranteed', row.support_level)}
          </select>`)}
          ${this.field('Transport Status', `<select name="transport_status">
            ${this.option('not-needed', 'Not Needed', row.transport_status || 'not-needed')}
            ${this.option('need-transport', 'Need Transport', row.transport_status)}
            ${this.option('arranged', 'Arranged', row.transport_status)}
            ${this.option('picked-up', 'Picked Up', row.transport_status)}
          </select>`)}
          ${this.field('Assigned To', `<input name="vote_assigned_by" value="${u.text(row.vote_assigned_by)}" placeholder="Name">`)}
          ${this.field('Call Agent', `<input name="call_center_agent" value="${u.text(row.call_center_agent)}" placeholder="Agent name">`)}
          ${this.field('Call Attempts', `<input name="call_attempts" type="number" min="0" value="${Number(row.call_attempts || 0)}">`)}
          ${this.field('Call Duration Seconds', `<input name="call_duration" type="number" min="0" value="${row.call_duration || ''}" placeholder="Seconds">`)}
          ${this.field('Callback Scheduled', `<input name="callback_scheduled_at" type="datetime-local" value="${callbackValue}">`)}
          ${this.field('Living Place', `<input name="living_place" value="${u.text(row.living_place)}" placeholder="Living place">`)}
        </div>
        <div class="modal-checks">
          <label><input type="checkbox" name="sms_sent" ${row.sms_sent ? 'checked' : ''}> SMS Sent</label>
          <label><input type="checkbox" name="email_sent" ${row.email_sent ? 'checked' : ''}> Email Sent</label>
        </div>
        ${this.field('Call Notes', `<textarea name="call_notes" rows="3" placeholder="Call notes">${u.text(row.call_notes)}</textarea>`)}
        ${this.field('Remarks', `<textarea name="remarks" rows="4" placeholder="Remarks">${u.text(row.remarks)}</textarea>`)}
        <div class="modal-actions">
          <button type="button" class="secondary" data-close-modal>Cancel</button>
          <button type="submit" class="primary">Save</button>
        </div>
      </form>`;
  },
  openRecord(row) {
    const dialog = window.CampaignUtils.el('editDialog');
    dialog.innerHTML = this.renderEditModal(row);
    dialog.showModal();
  },
  syncReachStatus() {
    const vote = document.getElementById('modalVoteStatus');
    const reach = document.getElementById('modalReachStatus');
    const note = document.getElementById('reachStatusNote');
    if (!vote || !reach) return;
    if (vote.value === 'will-vote') {
      reach.value = 'reached';
      reach.disabled = true;
      if (note) note.textContent = 'Will Vote auto-sets Reach Status to Reached.';
    } else {
      reach.disabled = false;
      if (note) note.textContent = 'Reach Status kept as current value unless manually changed.';
    }
  },
  close() {
    const dialog = window.CampaignUtils.el('editDialog');
    if (dialog && dialog.open) dialog.close();
  }
};

Object.assign(window, {
  openModal: row => window.CampaignModals.openRecord(row),
  openRecord: row => window.CampaignModals.openRecord(row),
  closeModal: () => window.CampaignModals.close()
});
