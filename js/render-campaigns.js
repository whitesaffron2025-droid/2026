window.CampaignRenderCampaigns = {
  getRowHtml(row) {
    const u = window.CampaignUtils;
    const phone = u.text(row.phone);
    return `<tr>
      <td><div class="person"><span class="avatar"></span><div><b>${u.text(row.name) || 'No name'}</b><br><small>${u.text(row.national_id) || 'No ID'}</small></div></div></td>
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
  getTableHtml(pageRows) {
    return pageRows.map(row => this.getRowHtml(row)).join('') || '<tr><td colspan="9">No records found.</td></tr>';
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
      rows: this.getTableHtml(p.pageRows),
      totalPages: p.totalPages,
      recordCount: window.CampaignState.filtered.length
    };
  },
  inject(html) {
    const state = window.CampaignState;
    const u = window.CampaignUtils;
    u.el('recordCount').textContent = `${u.fmt(html.recordCount)} records`;
    u.el('pageInfo').textContent = `Page ${state.page} of ${html.totalPages}`;
    u.el('prevPage').disabled = state.page <= 1;
    u.el('nextPage').disabled = state.page >= html.totalPages;
    u.el('recordsBody').innerHTML = html.rows;
  },
  render() {
    const html = this.getCampaignsHtml();
    this.inject(html);
    return html;
  }
};
