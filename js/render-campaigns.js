window.CampaignRenderCampaigns = {
  renderTable() {
    const state = window.CampaignState;
    const u = window.CampaignUtils;
    const totalPages = Math.max(1, Math.ceil(state.filtered.length / state.pageSize));
    if (state.page > totalPages) state.page = totalPages;
    const start = (state.page - 1) * state.pageSize;
    const pageRows = state.filtered.slice(start, start + state.pageSize);

    u.el('recordCount').textContent = `${u.fmt(state.filtered.length)} records`;
    u.el('pageInfo').textContent = `Page ${state.page} of ${totalPages}`;
    u.el('prevPage').disabled = state.page <= 1;
    u.el('nextPage').disabled = state.page >= totalPages;

    u.el('recordsBody').innerHTML = pageRows.map(row => {
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
    }).join('') || '<tr><td colspan="9">No records found.</td></tr>';
  },
  render() {
    this.renderTable();
  }
};
