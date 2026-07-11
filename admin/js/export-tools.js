/* MODULE: Filtered Records Export | VERSION: 3.0.0 */
(() => {
  'use strict';

  const text = value => String(value ?? '').trim();
  const partyKey = value => {
    const party = text(value).toUpperCase();
    return party === 'PNC' ? 'PNC' : party === 'MDP' ? 'MDP' : 'NONE';
  };
  const address = row => text(row.house) || 'No Address';
  const living = row => text(row.living_place) || text(row.lives_in) || '';
  const vote = row => text(row.vote_status) || 'not-decided';
  const call = row => text(row.call_outcome) || text(row.phone_status) || 'need-call';
  const visit = row => text(row.d2d_status) || 'not-visited';
  const transport = row => text(row.transport_status) || 'not-needed';
  const assignmentStatus = row => !text(row.vote_assigned_by)
    ? 'unassigned'
    : text(row.reach_status) === 'reached' ? 'completed' : 'assigned';

  let scheduled = false;

  function filteredRows() {
    const app = window.CampaignApp;
    if (!app?.state || !app?.getRows) return [];

    const state = app.state;
    const section = state.section;
    const filters = state.filters || {};
    let rows = app.getRows();

    if (state.search) {
      const query = text(state.search).toLowerCase();
      rows = rows.filter(row => [
        row.name,
        row.national_id,
        row.phone,
        address(row),
        living(row),
        row.sex,
        row.age,
        row.party
      ].map(text).join(' ').toLowerCase().includes(query));
    }

    if (filters.address && filters.address !== 'all') {
      rows = rows.filter(row => address(row) === filters.address);
    }

    if (section === 'residents' && filters.sex && filters.sex !== 'all') {
      rows = rows.filter(row => text(row.sex).toLowerCase() === filters.sex);
    }

    if (section === 'assign') {
      if (filters.assignStatus && filters.assignStatus !== 'all') {
        rows = rows.filter(row => assignmentStatus(row) === filters.assignStatus);
      }
      if (filters.assigner && filters.assigner !== 'all') {
        const ids = new Set(
          app.getAssignments()
            .filter(item => text(item.assignee_name) === filters.assigner)
            .map(item => String(item.resident_id))
        );
        rows = rows.filter(row => ids.has(String(row.id)));
      }
    }

    if (section === 'calls') {
      if (filters.callStatus && filters.callStatus !== 'all') {
        rows = rows.filter(row => call(row) === filters.callStatus);
      }
      if (filters.callAgent && filters.callAgent !== 'all') {
        rows = rows.filter(row => text(row.call_center_agent) === filters.callAgent);
      }
    }

    if (section === 'votes' && filters.voteStatus && filters.voteStatus !== 'all') {
      rows = rows.filter(row => vote(row) === filters.voteStatus);
    }

    if (section === 'visits' && filters.visitStatus && filters.visitStatus !== 'all') {
      rows = rows.filter(row => visit(row) === filters.visitStatus);
    }

    if (section === 'transport' && filters.transportStatus && filters.transportStatus !== 'all') {
      rows = rows.filter(row => transport(row) === filters.transportStatus);
    }

    return rows;
  }

  function columnsFor(section) {
    const common = [
      ['ID', row => row.id],
      ['Name', row => row.name],
      ['National ID', row => row.national_id],
      ['Official Address', row => address(row)],
      ['Living Place', row => living(row)],
      ['Phone', row => row.phone],
      ['Sex', row => row.sex],
      ['Age', row => row.age],
      ['Party', row => partyKey(row.party)]
    ];

    const sectionColumns = {
      residents: [],
      assign: [
        ['Assign Status', row => assignmentStatus(row)],
        ['Assigned By', row => row.vote_assigned_by],
        ['Assigned At', row => row.vote_assigned_at],
        ['Remarks', row => row.remarks]
      ],
      calls: [
        ['Call Status', row => call(row)],
        ['Call Agent', row => row.call_center_agent],
        ['Last Call', row => row.last_call_at],
        ['Call Notes', row => row.call_notes]
      ],
      votes: [
        ['Vote Status', row => vote(row)],
        ['Support Level', row => row.support_level],
        ['Remarks', row => row.remarks]
      ],
      visits: [
        ['Visit Status', row => visit(row)],
        ['Remarks', row => row.remarks]
      ],
      transport: [
        ['Transport Status', row => transport(row)],
        ['Remarks', row => row.remarks]
      ]
    };

    return [...common, ...(sectionColumns[section] || [])];
  }

  function csvCell(value) {
    return `"${String(value ?? '').replace(/"/g, '""')}"`;
  }

  function exportFilteredRecords() {
    const app = window.CampaignApp;
    const section = app?.state?.section || 'residents';
    const rows = filteredRows();

    if (!rows.length) {
      alert('No filtered records to export.');
      return;
    }

    const columns = columnsFor(section);
    const csv = [
      columns.map(([label]) => label),
      ...rows.map(row => columns.map(([, getter]) => getter(row)))
    ].map(row => row.map(csvCell).join(',')).join('\n');

    const filename = `${section}-filtered-${new Date().toISOString().slice(0, 10)}.csv`;
    const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], {
      type: 'text/csv;charset=utf-8'
    }));
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function installButton() {
    document.getElementById('sectionExportTools')?.remove();

    const filterBar = document.querySelector('.filter-bar');
    if (!filterBar) return;

    const tools = document.createElement('div');
    tools.id = 'sectionExportTools';
    tools.innerHTML = '<button id="standardSectionExport" type="button" class="btn primary">Export Filtered CSV</button>';
    filterBar.appendChild(tools);
  }

  function scheduleButton() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      installButton();
    });
  }

  document.addEventListener('click', event => {
    if (event.target.closest('#standardSectionExport')) exportFilteredRecords();
  });

  document.addEventListener('DOMContentLoaded', () => {
    new MutationObserver(scheduleButton).observe(document.body, {
      childList: true,
      subtree: true
    });
    scheduleButton();
  });
})();
