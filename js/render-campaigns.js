window.CampaignRenderCampaigns = {
  getPhotoHtml(row) {
    const u = window.CampaignUtils;
    const photo = u.text(row.photo_url) || u.text(row.image_key);
    return photo ? `<img class="avatar" src="${photo}" alt="">` : '<span class="avatar"></span>';
  },
  getReachBadgeHtml(row) {
    if (row.vote_status === 'will-vote' && row.reach_status === 'reached') {
      return '<span class="badge ok badge-reached">Reached Auto</span>';
    }
    return '';
  },
  getRowClass(row) {
    if (row.vote_status === 'will-vote' && row.reach_status === 'reached') return ' class="will-vote-reached"';
    if (row.vote_status === 'not-vote' && row.reach_status === 'reached') return ' class="not-vote-reached"';
    return '';
  },
  getActiveFiltersHtml() {
    const u = window.CampaignUtils;
    const state = window.CampaignState;
    const items = [];
    if (state.publicView) items.push('Public safe view');
    if (state.filters.search) items.push(`Search = ${state.filters.search}`);
    if (state.filters.party !== 'all') items.push(`Party = ${state.filters.party}`);
    if (state.filters.status !== 'all') items.push(`Outreach = ${state.filters.status}`);
    if (state.filters.d2d !== 'all') items.push(`D2D = ${state.filters.d2d}`);
    if (state.filters.callStatus !== 'all') items.push(`Call Status = ${state.filters.callStatus}`);
    if (state.filters.callOutcome !== 'all') items.push(`Outcome = ${state.filters.callOutcome}`);
    if (state.filters.assigner !== 'all') items.push(`Assigner = ${state.filters.assigner}`);
    if (state.filters.house) items.push(`House = ${state.filters.house}`);
    if (state.filters.id) items.push(`ID = ${state.filters.id}`);
    if (!items.length) return '';
    return `<div><b>Active Filters:</b> ${items.map(item => `<span class="badge">${u.text(item)}</span>`).join(' ')} <small>Showing ${u.fmt(state.filtered.length)} records</small></div>`;
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
    const checked = window.CampaignState.selectedIds.has(Number(row.id)) ? 'checked' : '';
    return `<tr${this.getRowClass(row)}>
      <td><input type="checkbox" class="row-select" data-select-id="${Number(row.id)}" ${checked}></td>
      <td><div class="person">${this.getPhotoHtml(row)}<div><b>${u.text(row.name) || 'No name'}</b><br><small>${u.text(row.national_id) || 'No ID'} ${this.getReachBadgeHtml(row)}</small></div></div></td>
      <td>${u.text(row.house) || '-'}</td>
      <td>${phone ? `<a href="tel:${phone}">${phone}</a>` : '-'}</td>
      <td>${u.badge(row.party)}</td>
      <td>${u.badge(row.vote_status)}</td>
      <td>${u.badge(row.phone_status)}</td>
      <td>${u.badge(row.d2d_status)}</td>
      <td>${u.text(row.vote_assigned_by) || '<span class="badge warn">Unassigned</span>'}</td>
      <td><button class="primary" data-edit-id="${Number(row.id)}">View/Edit</button></td>
    </tr>`;
  },
  getTableHeadHtml() {
    if (window.CampaignState.publicView) {
      return '<tr><th>Image</th><th>Name</th><th>Phone</th><th>ID</th><th>House</th></tr>';
    }
    return '<tr><th><input type="checkbox" id="selectAllRows"></th><th>Name</th><th>House</th><th>Phone</th><th>Party</th><th>Vote</th><th>Call</th><th>D2D</th><th>Assign</th><th>Action</th></tr>';
  },
  getTableHtml(pageRows) {
    const colspan = window.CampaignState.publicView ? 5 : 10;
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
      filters: this.getActiveFiltersHtml(),
      totalPages: p.totalPages,
      pageRows: p.pageRows,
      recordCount: window.CampaignState.filtered.length
    };
  },
  updateSelectionSummary(pageRows) {
    const u = window.CampaignUtils;
    const selectedCount = document.getElementById('selectedCount');
    if (selectedCount) selectedCount.textContent = `${u.fmt(window.CampaignState.selectedIds.size)} selected`;
    const selectAll = document.getElementById('selectAllRows');
    if (selectAll && pageRows) {
      const ids = pageRows.map(row => Number(row.id));
      selectAll.checked = ids.length > 0 && ids.every(id => window.CampaignState.selectedIds.has(id));
      selectAll.indeterminate = ids.some(id => window.CampaignState.selectedIds.has(id)) && !selectAll.checked;
    }
  },
  inject(html) {
    const state = window.CampaignState;
    const u = window.CampaignUtils;
    u.el('recordsTitle').textContent = state.publicView ? 'Public Voter View' : 'Voter Records';
    u.el('recordCount').textContent = `${u.fmt(html.recordCount)} records`;
    u.el('pageInfo').textContent = `Page ${state.page} of ${html.totalPages}`;
    u.el('prevPage').disabled = state.page <= 1;
    u.el('nextPage').disabled = state.page >= html.totalPages;
    u.el('activeFilterSummary').innerHTML = html.filters;
    u.el('recordsHead').innerHTML = html.head;
    const body = document.getElementById('table-body') || document.getElementById('recordsBody');
    if (body) body.innerHTML = html.rows;
    this.updateSelectionSummary(html.pageRows);
  },
  render() {
    const html = this.getCampaignsHtml();
    this.inject(html);
    return html;
  }
};

Object.assign(window, {
  renderCampaigns: () => window.CampaignRenderCampaigns.render()
});
