window.CampaignModal = {
  open(row) {
    const h = window.CampaignHelpers;
    const section = window.CampaignState.section;
    const dialog = document.getElementById('editDialog');
    dialog.innerHTML = `
      <form id="editForm" class="modal-card" data-id="${h.escape(row.id)}" data-section="${h.escape(section)}">
        <div class="modal-head">
          <div><h2>${h.escape(window.CampaignSections.title(section))} Update</h2><small>${h.escape(row.name)} • ${h.escape(row.house)} • ${h.escape(row.phone || 'No phone')}</small></div>
          <button type="button" class="secondary" id="closeModal">Close</button>
        </div>
        <div class="modal-grid">${this.fields(section, row)}</div>
        <div class="modal-actions"><button type="button" class="secondary" id="cancelModal">Cancel</button><button type="submit" class="primary">Save</button></div>
      </form>
    `;
    document.getElementById('closeModal').onclick = this.close;
    document.getElementById('cancelModal').onclick = this.close;
    document.getElementById('editForm').onsubmit = window.CampaignApp.saveEditor;
    dialog.showModal();
  },

  close() {
    const dialog = document.getElementById('editDialog');
    if (dialog && dialog.open) dialog.close();
  },

  fields(section, row) {
    if (section === 'assign') return window.CampaignAssign.fields(row);
    if (section === 'calls') return window.CampaignCalls.fields(row);
    if (section === 'votes') return window.CampaignVotes.fields(row);
    if (section === 'visits') return window.CampaignVisits.fields(row);
    if (section === 'transport') return window.CampaignTransport.fields(row);
    return window.CampaignResidents.fields(row);
  },

  buildPatch(section, data) {
    if (section === 'assign') return window.CampaignAssign.patch(data);
    if (section === 'calls') return window.CampaignCalls.patch(data);
    if (section === 'votes') return window.CampaignVotes.patch(data);
    if (section === 'visits') return window.CampaignVisits.patch(data);
    if (section === 'transport') return window.CampaignTransport.patch(data);
    return window.CampaignResidents.patch(data);
  }
};
