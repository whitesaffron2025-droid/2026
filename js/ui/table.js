window.CampaignTable = {
  filterCard() {
    const h = window.CampaignHelpers;
    const state = window.CampaignState;
    return `
      <div class="toolbar section-filter" aria-label="Section filters">
        <label>Address<select id="addressFilter"><option value="all">All Addresses</option></select></label>
        <label class="search-wide">Search<input id="searchInput" type="search" placeholder="Name, ID or mobile" value="${h.escape(state.search)}" autocomplete="off"></label>
        <button class="primary search-button" id="searchBtn">Search</button>
        <button class="secondary search-button" id="clearSearchBtn">Clear</button>
        <label>Party<select id="partyFilter"><option value="all" ${state.party === 'all' ? 'selected' : ''}>All</option><option value="PNC" ${state.party === 'PNC' ? 'selected' : ''}>PNC</option><option value="MDP" ${state.party === 'MDP' ? 'selected' : ''}>MDP</option></select></label>
        <label>Page size<select id="pageSize"><option value="20" ${state.pageSize === 20 ? 'selected' : ''}>20</option><option value="50" ${state.pageSize === 50 ? 'selected' : ''}>50</option></select></label>
      </div>
    `;
  },

  render(rows, title) {
    const h = window.CampaignHelpers;
    const state = window.CampaignState;
    const start = (state.page - 1) * state.pageSize;
    const pageRows = rows.slice(start, start + state.pageSize);
    const totalPages = Math.max(1, Math.ceil(rows.length / state.pageSize));

    document.getElementById('dashboard').style.display = 'none';
    document.getElementById('content').innerHTML = `
      <article class="panel">
        <div class="panel-head"><h2>${h.escape(title)}</h2><span>${rows.length.toLocaleString()} records</span></div>
        ${this.filterCard()}
        <div class="table-wrap">
          <table>
            <thead><tr><th>Name</th><th>House</th><th>Phone</th><th>Party</th><th>Vote</th><th>Call</th><th>D2D</th><th>Assign</th><th>Remarks</th><th>Action</th></tr></thead>
            <tbody>${pageRows.map(this.rowHtml.bind(this)).join('') || '<tr><td colspan="10">No records found.</td></tr>'}</tbody>
          </table>
        </div>
        <div class="pager">
          <button class="secondary" id="prevPage" ${state.page <= 1 ? 'disabled' : ''}>Previous</button>
          <span>Page ${state.page} of ${totalPages}</span>
          <button class="secondary" id="nextPage" ${state.page >= totalPages ? 'disabled' : ''}>Next</button>
        </div>
      </article>
    `;

    window.CampaignShell.renderAddressOptions();

    document.getElementById('prevPage').onclick = function () {
      if (state.page > 1) {
        state.page--;
        window.CampaignApp.render();
      }
    };

    document.getElementById('nextPage').onclick = function () {
      if (state.page < totalPages) {
        state.page++;
        window.CampaignApp.render();
      }
    };
  },

  rowHtml(row) {
    const h = window.CampaignHelpers;
    const d = h.defaults;
    const remark = h.text(row.remarks);
    return `
      <tr>
        <td><strong>${h.escape(row.name || 'No name')}</strong><br><small>${h.escape(row.national_id || 'No ID')}</small></td>
        <td>${h.escape(row.house || '-')}</td>
        <td>${row.phone ? `<a href="tel:${h.escape(row.phone)}">${h.escape(row.phone)}</a>` : '-'}</td>
        <td>${h.badge(row.party || '-')}</td>
        <td>${h.badge(h.value(row.vote_status, d.vote_status))}</td>
        <td>${h.badge(h.value(row.phone_status, d.phone_status))}</td>
        <td>${h.badge(h.value(row.d2d_status, d.d2d_status))}</td>
        <td>${h.text(row.vote_assigned_by) ? h.escape(row.vote_assigned_by) : h.badge('Unassigned', 'warn')}</td>
        <td>${remark ? `<small>${h.escape(h.shorten(remark, 70))}</small>` : '<small>No remarks</small>'}</td>
        <td><button class="primary" data-edit="${h.escape(row.id)}">Update</button></td>
      </tr>
    `;
  }
};
