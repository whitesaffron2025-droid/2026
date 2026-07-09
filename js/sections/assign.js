window.CampaignAssign = {
  mode: 'unassigned',
  assignee: 'all',

  assigners() {
    const h = window.CampaignHelpers;
    return [...new Set(window.CampaignState.rows.map(row => h.text(row.vote_assigned_by)).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  },

  rows() {
    const h = window.CampaignHelpers;
    let rows = window.CampaignSections.baseRows();

    if (this.mode === 'unassigned') rows = rows.filter(row => !h.text(row.vote_assigned_by));
    if (this.mode === 'assigned') rows = rows.filter(row => !!h.text(row.vote_assigned_by));
    if (this.assignee !== 'all') rows = rows.filter(row => h.text(row.vote_assigned_by) === this.assignee);

    return rows;
  },

  render() {
    const h = window.CampaignHelpers;
    const rows = this.rows();
    const assigners = this.assigners();
    const state = window.CampaignState;
    const start = (state.page - 1) * state.pageSize;
    const pageRows = rows.slice(start, start + state.pageSize);
    const totalPages = Math.max(1, Math.ceil(rows.length / state.pageSize));

    document.getElementById('dashboard').style.display = 'none';
    document.getElementById('content').innerHTML = `
      <article class="panel">
        <div class="panel-head">
          <h2>Assign Voters</h2>
          <span>${rows.length.toLocaleString()} records</span>
        </div>

        <div class="toolbar assign-toolbar">
          <label>Assign Category
            <select id="assignMode">
              <option value="unassigned" ${this.mode === 'unassigned' ? 'selected' : ''}>Unassigned</option>
              <option value="assigned" ${this.mode === 'assigned' ? 'selected' : ''}>Assigned</option>
              <option value="all" ${this.mode === 'all' ? 'selected' : ''}>All Residents</option>
            </select>
          </label>
          <label>Assigner
            <select id="assignerMode">
              <option value="all">All assigners</option>
              ${assigners.map(name => `<option value="${h.escape(name)}" ${this.assignee === name ? 'selected' : ''}>${h.escape(name)}</option>`).join('')}
            </select>
          </label>
        </div>

        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Photo</th>
                <th>Name / ID</th>
                <th>Address</th>
                <th>Mobile</th>
                <th>Assigned To</th>
                <th>Remarks</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              ${pageRows.map(this.rowHtml.bind(this)).join('') || '<tr><td colspan="7">No assign records found.</td></tr>'}
            </tbody>
          </table>
        </div>

        <div class="pager">
          <button class="secondary" id="prevPage" ${state.page <= 1 ? 'disabled' : ''}>Previous</button>
          <span>Page ${state.page} of ${totalPages}</span>
          <button class="secondary" id="nextPage" ${state.page >= totalPages ? 'disabled' : ''}>Next</button>
        </div>
      </article>
    `;

    document.getElementById('assignMode').onchange = event => {
      this.mode = event.target.value;
      state.resetPage();
      window.CampaignApp.render();
    };

    document.getElementById('assignerMode').onchange = event => {
      this.assignee = event.target.value;
      state.resetPage();
      window.CampaignApp.render();
    };

    document.getElementById('prevPage').onclick = () => {
      if (state.page > 1) {
        state.page--;
        window.CampaignApp.render();
      }
    };

    document.getElementById('nextPage').onclick = () => {
      if (state.page < totalPages) {
        state.page++;
        window.CampaignApp.render();
      }
    };
  },

  rowHtml(row) {
    const h = window.CampaignHelpers;
    const photo = h.text(row.photo_url);
    const remark = h.text(row.remarks);
    const address = h.text(row.house) || h.text(row.living_place) || h.text(row.lives_in) || '-';
    return `
      <tr>
        <td>${photo ? `<img class="avatar" src="${h.escape(photo)}" alt="" loading="lazy" onerror="this.style.display='none'">` : '<span class="avatar">?</span>'}</td>
        <td><strong>${h.escape(row.name || 'No name')}</strong><br><small>${h.escape(row.national_id || 'No ID')}</small></td>
        <td>${h.escape(address)}</td>
        <td>${row.phone ? `<a href="tel:${h.escape(row.phone)}">${h.escape(row.phone)}</a>` : '-'}</td>
        <td>${h.text(row.vote_assigned_by) ? h.escape(row.vote_assigned_by) : h.badge('Unassigned', 'warn')}</td>
        <td>${remark ? `<small>${h.escape(h.shorten(remark, 70))}</small>` : '<small>No remarks</small>'}</td>
        <td><button class="primary" data-edit="${h.escape(row.id)}">Assign</button></td>
      </tr>
    `;
  },

  fields(row) {
    const h = window.CampaignHelpers;
    const assigners = this.assigners();
    return `
      ${h.field('Who is the assigner?', `<input list="assignerList" name="vote_assigned_by" value="${h.escape(row.vote_assigned_by)}" placeholder="Write assigner name"><datalist id="assignerList">${assigners.map(name => `<option value="${h.escape(name)}"></option>`).join('')}</datalist>`)}
      ${h.remarksField(row)}
    `;
  },

  patch(data) {
    const h = window.CampaignHelpers;
    const assignee = h.text(data.vote_assigned_by);
    return {
      vote_assigned_by: assignee || null,
      vote_assigned_at: assignee ? new Date().toISOString() : null,
      remarks: h.text(data.remarks) || null
    };
  }
};
