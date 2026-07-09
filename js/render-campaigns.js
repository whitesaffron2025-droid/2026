window.CampaignRenderCampaigns = {
  getPhotoHtml(row) {
    const u = window.CampaignUtils;
    const photo = u.text(row.photo_url) || u.text(row.image_key);
    return photo ? `<img class="avatar" src="${photo}" alt="">` : '<span class="avatar"></span>';
  },
  getRowHtml(row) {
    const u = window.CampaignUtils;
    const phone = u.text(row.phone);
    if (window.CampaignState.publicView) {
      return `<tr>
        <td>${this.getPhotoHtml(row)}</td>
        <td><b>${u.text(row.name) || 'No name'}</b></td>
        <td>${phone ? `<a href="tel:${phone}">${phone}</a>` : '-'}</td>
        <td>${u.text(row.national_id) || '-'}</td>
        <td>${u.text(row.house) || u.text(row.lives_in) || '-'}</td>
      </tr>`;
    }
    return `<tr>
      <td><div class="person">${this.getPhotoHtml(row)}<div><b>${u.text(row.name) || 'No name'}</b><br><small>${u.text(row.national_id) || 'No ID'}</small></div></div></td>
      <td>${u.text(row.house) || '-'}</td>
      <td>${phone ? `<a href="tel:${phone}">${phone}</a>` : '-'}</td>
      <td>${u.badge(row.party)}</td>
      <td>${u.badge(row.vote_status)}</td>
      <td>${u.badge(row.phone_status)}</td>
      <td>${u.badge(row.d2d_status)}</td>
      <td>${u.text(row.vote_assigned_by) || '<span class="badge warn">Unassigned</span>'}</td>
      <td><button class="primary" data-edit-id="${Number(row.id)}">View</button></td>
    </tr>`;
  },
  getTableHeadHtml() {
    if (window.CampaignState.publicView) {
      return '<tr><th>Image</th><th>Name</th><th>Phone</th><th>ID</th><th>House</th></tr>';
    }
    return '<tr><th>Name</th><th>House</th><th>Phone</th><th>Party</th><th>Vote</th><th>Call</th><th>D2D</th><th>Assign</th><th>Action</th></tr>';
  },
  getTableHtml(pageRows) {
    const colspan = window.CampaignState.publicView ? 5 : 9;
    return pageRows.map(row => this.getRowHtml(row)).join('') || `<tr><td colspan="${colspan}">No records found.</td></tr>`;
  },
  getPaginationState() {
    const state = window.CampaignState;
    const totalPages = Math.max(1, Math.ceil(state.filtered.length / state.pageSize));
    if (state.page > totalPages) state.page = totalPages;
    const start = (state.page - 1) * state.pageSize;
    const pageRows = state.filtered.slice(start, start + state.pageSize);
    return { totalPages, start, pageRows };
  },
  getCampaignsHtml() {
    const p = this.getPaginationState();
    return {
      head: this.getTableHeadHtml(),
      rows: this.getTableHtml(p.pageRows),
      totalPages: p.totalPages,
      recordCount: window.CampaignState.filtered.length
    };
  },
  inject(html) {
    const state = window.CampaignState;
    const u = window.CampaignUtils;
    u.el('recordsTitle').textContent = state.publicView ? 'Public Voter View' : 'Voter Records';
    u.el('recordCount').textContent = `${u.fmt(html.recordCount)} records`;
    u.el('pageInfo').textContent = `Page ${state.page} of ${html.totalPages}`;
    u.el('prevPage').disabled = state.page <= 1;
    u.el('nextPage').disabled = state.page >= html.totalPages;
    u.el('recordsHead').innerHTML = html.head;
    u.el('recordsBody').innerHTML = html.rows;
  },
  render() {
    const html = this.getCampaignsHtml();
    this.inject(html);
    return html;
  }
};
