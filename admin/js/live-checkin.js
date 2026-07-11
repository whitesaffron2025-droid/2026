(() => {
  'use strict';

  const cfg = window.CampaignConfig;
  const db = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });
  const table = cfg.tableName || 'campaign';
  const pageSize = 1000;
  let rows = [];
  let assignments = [];
  let assignmentFiltersAvailable = true;
  const assignmentsByResident = new Map();
  const pending = new Map();
  let isSaving = false;

  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[char]));
  const text = value => String(value ?? '').trim();
  const currentVotedValue = row => pending.has(String(row.id))
    ? pending.get(String(row.id))
    : row.has_voted === true;

  function assignmentNames(row) {
    return assignmentsByResident.get(String(row.id)) || [];
  }

  function normalizedCampaignVoteStatus(row) {
    const value = text(row.vote_status).toLowerCase();
    if (value === 'will-vote') return 'will-vote';
    if (value === 'not-vote') return 'not-vote';
    return 'not-decided';
  }

  async function loadPaged(queryFactory) {
    const all = [];
    for (let from = 0; ; from += pageSize) {
      const { data, error } = await queryFactory(from, from + pageSize - 1);
      if (error) throw error;
      all.push(...(data || []));
      if (!data || data.length < pageSize) break;
    }
    return all;
  }

  async function loadResidents() {
    rows = await loadPaged((from, to) => db
      .from(table)
      .select('id,photo_url,name,national_id,house,lives_in,living_place,phone,sex,age,party,vote_status,has_voted,voted_at')
      .eq('party', 'PNC')
      .order('house', { ascending: true })
      .order('name', { ascending: true })
      .range(from, to));
  }

  async function loadAssignmentsOptional() {
    try {
      assignments = await loadPaged((from, to) => db
        .from('resident_assignments')
        .select('resident_id,assignee_name,assigned_at')
        .order('assigned_at', { ascending: false })
        .range(from, to));

      assignmentsByResident.clear();
      assignments.forEach(item => {
        const id = String(item.resident_id);
        const name = text(item.assignee_name);
        if (!name) return;
        const names = assignmentsByResident.get(id) || [];
        if (!names.some(existing => existing.toLowerCase() === name.toLowerCase())) names.push(name);
        assignmentsByResident.set(id, names);
      });
      assignmentFiltersAvailable = true;
    } catch (error) {
      console.warn('Assignment filter unavailable:', error);
      assignments = [];
      assignmentsByResident.clear();
      assignmentFiltersAvailable = false;
    }
  }

  function showAssignmentAvailability() {
    const assignmentFilter = document.getElementById('assignmentFilter');
    assignmentFilter.disabled = !assignmentFiltersAvailable;

    let notice = document.getElementById('assignmentNotice');
    if (!notice) {
      notice = document.createElement('div');
      notice.id = 'assignmentNotice';
      notice.className = 'assignment-notice';
      document.querySelector('.live-toolbar')?.insertAdjacentElement('afterend', notice);
    }

    if (assignmentFiltersAvailable) {
      notice.hidden = true;
      notice.textContent = '';
    } else {
      assignmentFilter.value = 'ALL';
      notice.hidden = false;
      notice.textContent = 'Assignment status is temporarily unavailable. All other filters, save, and export are still working.';
    }
  }

  function populateFilterOptions() {
    const addresses = [...new Set(rows.map(row => text(row.house)).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));

    document.getElementById('addressFilter').innerHTML =
      '<option value="ALL">All Addresses</option>' +
      addresses.map(value => `<option value="${esc(value)}">${esc(value)}</option>`).join('');

    showAssignmentAvailability();
  }

  function baseFilteredRows() {
    const address = document.getElementById('addressFilter').value;
    const assignmentStatus = assignmentFiltersAvailable
      ? document.getElementById('assignmentFilter').value
      : 'ALL';
    const campaignVote = document.getElementById('campaignVoteFilter').value;
    const query = document.getElementById('searchInput').value.trim().toLowerCase();

    return rows.filter(row => {
      const names = assignmentNames(row);
      const assigned = names.length > 0;
      const addressMatches = address === 'ALL' || text(row.house) === address;
      const assignmentMatches = assignmentStatus === 'ALL' ||
        (assignmentStatus === 'ASSIGNED' ? assigned : !assigned);
      const campaignVoteMatches = campaignVote === 'ALL' ||
        normalizedCampaignVoteStatus(row) === campaignVote;
      const queryMatches = !query || [
        row.id, row.national_id, row.name, row.house,
        row.lives_in, row.living_place, row.phone, row.sex, row.age,
        names.join(' ')
      ].map(value => String(value ?? '').toLowerCase()).join(' ').includes(query);
      return addressMatches && assignmentMatches && campaignVoteMatches && queryMatches;
    });
  }

  function filteredRows() {
    const turnoutStatus = document.getElementById('statusFilter').value;
    return baseFilteredRows().filter(row => {
      const voted = currentVotedValue(row);
      return turnoutStatus === 'ALL' || (turnoutStatus === 'VOTED' ? voted : !voted);
    });
  }

  function formatSavedTime(value) {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' });
  }

  function syncStatusCards() {
    const status = document.getElementById('statusFilter').value;
    document.querySelectorAll('[data-status-card]').forEach(card => {
      const active = card.dataset.statusCard === status;
      card.classList.toggle('active', active);
      card.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  }

  function render() {
    const baseList = baseFilteredRows();
    const list = filteredRows();
    const body = document.getElementById('residentRows');

    body.innerHTML = list.map(row => {
      const id = String(row.id);
      const voted = currentVotedValue(row);
      const isPending = pending.has(id);
      const photo = row.photo_url
        ? `<img class="avatar" src="${esc(row.photo_url)}" alt="${esc(row.name || 'Resident')}">`
        : '<span class="avatar avatar-empty">?</span>';
      const time = !isPending && row.has_voted && row.voted_at
        ? `<small>${esc(formatSavedTime(row.voted_at))}</small>`
        : '';
      const names = assignmentNames(row);

      return `<tr class="${voted ? 'voted-row' : ''} ${isPending ? 'pending-row' : ''}" data-resident-id="${esc(row.id)}">
        <td>${esc(row.id)}</td>
        <td>${photo}</td>
        <td>${esc(row.national_id) || '-'}</td>
        <td><strong>${esc(row.name) || 'No name'}</strong>${names.length ? `<small class="assignment-note">Assigned: ${esc(names.join(', '))}</small>` : ''}</td>
        <td>${esc(row.house) || '-'}</td>
        <td>${esc(row.lives_in || row.living_place) || 'Not recorded'}</td>
        <td>${esc(row.phone) || '-'}</td>
        <td>${esc(row.sex) || '-'}</td>
        <td>${esc(row.age) || '-'}</td>
        <td>
          <button type="button" class="vote-toggle ${voted ? 'voted' : 'not-voted'}" data-toggle-vote="${esc(row.id)}" ${isSaving ? 'disabled' : ''}>
            <span class="vote-icon">${voted ? '✓' : '○'}</span>
            <span>${voted ? 'Voted' : 'Not Yet'}</span>
          </button>
          ${isPending ? '<small class="pending-label">Pending save</small>' : time}
        </td>
      </tr>`;
    }).join('') || '<tr><td colspan="10" class="no-results">No PNC residents found for these filters</td></tr>';

    document.getElementById('totalCount').textContent = baseList.length.toLocaleString();
    document.getElementById('votedCount').textContent = baseList.filter(currentVotedValue).length.toLocaleString();
    document.getElementById('notVotedCount').textContent = baseList.filter(row => !currentVotedValue(row)).length.toLocaleString();
    syncStatusCards();
    updateSaveControls();
  }

  function toggleVoteStatus(id) {
    if (isSaving) return;
    const row = rows.find(item => String(item.id) === String(id));
    if (!row) return;
    const savedValue = row.has_voted === true;
    const nextValue = !currentVotedValue(row);
    if (nextValue === savedValue) pending.delete(String(id));
    else pending.set(String(id), nextValue);
    render();
  }

  function updateSaveControls() {
    const button = document.getElementById('saveChanges');
    const state = document.getElementById('saveState');
    button.disabled = isSaving || pending.size === 0;
    button.textContent = isSaving ? 'Saving…' : 'Save Changes';
    if (isSaving) {
      state.textContent = `Saving ${pending.size} change${pending.size === 1 ? '' : 's'}…`;
      state.dataset.state = 'saving';
    } else if (pending.size) {
      state.textContent = `${pending.size} pending change${pending.size === 1 ? '' : 's'}`;
      state.dataset.state = 'pending';
    } else {
      state.textContent = 'Ready';
      state.dataset.state = 'saved';
    }
  }

  async function saveChanges() {
    if (!pending.size || isSaving) return;
    isSaving = true;
    updateSaveControls();
    render();
    const failed = [];

    for (const [id, hasVoted] of [...pending.entries()]) {
      const votedAt = hasVoted ? new Date().toISOString() : null;
      const { error } = await db.from(table)
        .update({ has_voted: hasVoted, voted_at: votedAt })
        .eq('id', Number(id))
        .eq('party', 'PNC');

      if (error) {
        failed.push({ id, message: error.message });
        continue;
      }
      const row = rows.find(item => String(item.id) === String(id));
      if (row) {
        row.has_voted = hasVoted;
        row.voted_at = votedAt;
      }
      pending.delete(id);
    }

    isSaving = false;
    render();
    const state = document.getElementById('saveState');
    if (failed.length) {
      state.textContent = `${failed.length} change${failed.length === 1 ? '' : 's'} failed`;
      state.dataset.state = 'error';
      alert('Some vote changes could not be saved. Please try again.');
    } else {
      state.textContent = 'All changes saved';
      state.dataset.state = 'saved';
    }
  }

  function csvCell(value) {
    return `"${String(value ?? '').replace(/"/g, '""')}"`;
  }

  function exportFilteredCsv() {
    const list = filteredRows();
    if (!list.length) {
      alert('There are no filtered residents to export.');
      return;
    }
    const headers = ['ID','ID Number','Name','Official Address','Living Now','Mobile','Sex','Age','Assignment Status','Assignees','Campaign Vote Status','Turnout Status','Voted At'];
    const lines = [headers.map(csvCell).join(',')];
    list.forEach(row => {
      const voted = currentVotedValue(row);
      const names = assignmentNames(row);
      lines.push([
        row.id, row.national_id, row.name, row.house,
        row.lives_in || row.living_place || 'Not recorded', row.phone,
        row.sex, row.age,
        assignmentFiltersAvailable ? (names.length ? 'Assigned' : 'Unassigned') : 'Unavailable',
        names.join(', '), normalizedCampaignVoteStatus(row),
        voted ? 'Voted' : 'Not Yet',
        voted ? (pending.has(String(row.id)) ? 'Pending save' : formatSavedTime(row.voted_at)) : ''
      ].map(csvCell).join(','));
    });
    const status = document.getElementById('statusFilter').value.toLowerCase();
    const date = new Date().toISOString().slice(0, 10);
    const blob = new Blob(['\uFEFF' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pnc-live-${status}-${date}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function clearFilters() {
    document.getElementById('addressFilter').value = 'ALL';
    document.getElementById('assignmentFilter').value = 'ALL';
    document.getElementById('campaignVoteFilter').value = 'ALL';
    document.getElementById('statusFilter').value = 'ALL';
    document.getElementById('searchInput').value = '';
    render();
  }

  document.addEventListener('click', event => {
    const toggle = event.target.closest('[data-toggle-vote]');
    if (toggle) {
      toggleVoteStatus(toggle.dataset.toggleVote);
      return;
    }
    const card = event.target.closest('[data-status-card]');
    if (card) {
      document.getElementById('statusFilter').value = card.dataset.statusCard;
      render();
      document.querySelector('.live-table-wrap')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    if (event.target.closest('#exportFiltered')) exportFilteredCsv();
    if (event.target.closest('#saveChanges')) saveChanges();
    if (event.target.closest('#clearFilters')) clearFilters();
  });

  ['addressFilter', 'assignmentFilter', 'campaignVoteFilter', 'statusFilter']
    .forEach(id => document.getElementById(id).addEventListener('change', render));
  document.getElementById('searchInput').addEventListener('input', render);

  window.addEventListener('beforeunload', event => {
    if (!pending.size) return;
    event.preventDefault();
    event.returnValue = '';
  });

  loadResidents()
    .then(async () => {
      await loadAssignmentsOptional();
      populateFilterOptions();
      render();
    })
    .catch(error => {
      console.error('PNC live turnout load failed:', error);
      document.getElementById('residentRows').innerHTML = '<tr><td colspan="10" class="no-results">Residents could not be loaded. Please refresh the page or check the connection.</td></tr>';
      document.getElementById('totalCount').textContent = '0';
      document.getElementById('votedCount').textContent = '0';
      document.getElementById('notVotedCount').textContent = '0';
      const state = document.getElementById('saveState');
      state.textContent = 'Connection problem';
      state.dataset.state = 'error';
    });
})();