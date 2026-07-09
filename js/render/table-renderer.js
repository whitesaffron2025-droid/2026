window.CampaignTableRenderer = {
  labelFor(column) {
    return {
      photo: 'Photo',
      nameId: 'Name / ID',
      address: 'Address',
      mobile: 'Mobile',
      party: 'Party',
      assignedTo: 'Assigned To',
      callStatus: 'Call Status',
      voteStatus: 'Vote Status',
      visitStatus: 'Visit Status',
      transportStatus: 'Transport',
      remarks: 'Remarks',
      action: 'Action'
    }[column] || column;
  },

  statusValue(row, column) {
    const h = window.CampaignHelpers;
    const d = h.defaults;
    if (column === 'assignedTo') return h.text(row.vote_assigned_by) || 'Unassigned';
    if (column === 'callStatus') return h.value(row.phone_status, d.phone_status);
    if (column === 'voteStatus') return h.value(row.vote_status, d.vote_status);
    if (column === 'visitStatus') return h.value(row.d2d_status, d.d2d_status);
    if (column === 'transportStatus') return h.value(row.transport_status, d.transport_status);
    return '';
  },

  cell(row, column, config) {
    const h = window.CampaignHelpers;
    const photo = h.text(row.photo_url);
    const address = window.CampaignSections.rowAddress(row) || '-';
    const remark = h.text(row.remarks);

    if (column === 'photo') return photo ? `<img class="avatar" src="${h.escape(photo)}" alt="" loading="lazy" onerror="this.style.display='none'">` : '<span class="avatar">?</span>';
    if (column === 'nameId') return `<strong>${h.escape(row.name || 'No name')}</strong><br><small>${h.escape(row.national_id || 'No ID')}</small>`;
    if (column === 'address') return h.escape(address);
    if (column === 'mobile') return row.phone ? `<a href="tel:${h.escape(row.phone)}">${h.escape(row.phone)}</a>` : '-';
    if (column === 'party') return h.badge(row.party || '-');
    if (['assignedTo', 'callStatus', 'voteStatus', 'visitStatus', 'transportStatus'].includes(column)) return h.badge(this.statusValue(row, column));
    if (column === 'remarks') return remark ? `<small>${h.escape(h.shorten(remark, 70))}</small>` : '<small>No remarks</small>';
    if (column === 'action') return `<button class="primary" data-edit="${h.escape(row.id)}">${h.escape(config.actionLabel || 'Update')}</button>`;
    return '-';
  },

  render(section, rows) {
    const config = window.CampaignSectionConfigs[section];
    const columns = config.columns || [];
    const state = window.CampaignState;
    const start = (state.page - 1) * state.pageSize;
    const pageRows = rows.slice(start, start + state.pageSize);

    if (state.structureMode) {
      return `
        <div class="structure-placeholder">
          <strong>${config.title} layout mode</strong>
          <p>Columns: ${columns.map(column => this.labelFor(column)).join(' | ')}</p>
        </div>
      `;
    }

    return `
      <div class="table-wrap">
        <table>
          <thead><tr>${columns.map(column => `<th>${this.labelFor(column)}</th>`).join('')}</tr></thead>
          <tbody>${pageRows.map(row => `<tr>${columns.map(column => `<td>${this.cell(row, column, config)}</td>`).join('')}</tr>`).join('') || `<tr><td colspan="${columns.length}">No records found.</td></tr>`}</tbody>
        </table>
      </div>
    `;
  }
};
