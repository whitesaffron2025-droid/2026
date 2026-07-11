(() => {
  'use strict';

  const cfg = window.CampaignConfig;
  const db = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });
  const table = cfg.tableName || 'campaign';
  const pageSize = 1000;
  let rows = [];
  const pending = new Map();
  let isSaving = false;

  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[char]));

  const currentVotedValue = row => pending.has(String(row.id))
    ? pending.get(String(row.id))
    : row.has_voted === true;

  async function loadResidents() {
    const all = [];
    for (let from = 0; ; from += pageSize) {
      const { data, error } = await db
        .from(table)
        .select('id,photo_url,name,national_id,house,lives_in,living_place,phone,sex,age,party,has_voted,voted_at')
        .eq('party', 'PNC')
        .order('house', { ascending: true })
        .order('name', { ascending: true })
        .range(from, from + pageSize - 1);
      if (error) throw error;
      all.push(...(data || []));
      if (!data || data.length < pageSize) break;
    }
    rows = all;
    render();
  }

  function baseFilteredRows() {
    const query = document.getElementById('searchInput').value.trim().toLowerCase();
    return rows.filter(row => {
      const queryMatches = !query || [
        row.id, row.national_id, row.name, row.house,
        row.lives_in, row.living_place, row.phone, row.sex, row.age
      ].map(value => String(value ?? '').toLowerCase()).join(' ').includes(query);
      return queryMatches;
    });
  }

  function filteredRows() {
    const status = document.getElementById('statusFilter').value;
    return baseFilteredRows().filter(row => {
      const voted = currentVotedValue(row);
      return status === 'ALL' || (status === 'VOTED' ? voted : !voted);
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

      return `<tr class="${voted ? 'voted-row' : ''} ${isPending ? 'pending-row' : ''}" data-resident-id="${esc(row.id)}">
        <td>${esc(row.id)}</td>
        <td>${photo}</td>
        <td>${esc(row.national_id) || '-'}</td>
        <td><strong>${esc(row.name) || 'No name'}</strong></td>
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
    }).join('') || '<tr><td colspan="10" class="no-results">No PNC residents found for this filter</td></tr>';

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
      state.textContent = 'No pending changes';
      state.dataset.state = 'saved';
    }
  }

  async function saveChanges() {
    if (!pending.size || isSaving) return;
    isSaving = true;
    updateSaveControls();
    render();

    const changes = [...pending.entries()];
    const failed = [];

    for (const [id, hasVoted] of changes) {
      const votedAt = hasVoted ? new Date().toISOString() : null;
      const { error } = await db
        .from(table)
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
      alert(`Some changes were not saved:\n${failed.map(item => `ID ${item.id}: ${item.message}`).join('\n')}`);
    } else {
      state.textContent = 'All changes saved';
      state.dataset.state = 'saved';
    }
  }

  function csvCell(value) {
    const text = String(value ?? '');
    return `"${text.replace(/"/g, '""')}"`;
  }

  function exportFilteredCsv() {
    const list = filteredRows();
    if (!list.length) {
      alert('There are no filtered residents to export.');
      return;
    }

    const headers = [
      'ID', 'ID Number', 'Name', 'Official Address', 'Living Now',
      'Mobile', 'Sex', 'Age', 'Vote Status', 'Voted At'
    ];

    const lines = [headers.map(csvCell).join(',')];
    list.forEach(row => {
      const voted = currentVotedValue(row);
      const votedAt = voted ? (pending.has(String(row.id)) ? 'Pending save' : formatSavedTime(row.voted_at)) : '';
      lines.push([
        row.id,
        row.national_id,
        row.name,
        row.house,
        row.lives_in || row.living_place || 'Not recorded',
        row.phone,
        row.sex,
        row.age,
        voted ? 'Voted' : 'Not Yet',
        votedAt
      ].map(csvCell).join(','));
    });

    const status = document.getElementById('statusFilter').value.toLowerCase();
    const date = new Date().toISOString().slice(0, 10);
    const filename = `pnc-live-${status}-${date}.csv`;
    const blob = new Blob(['\uFEFF' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
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

    if (event.target.closest('#clearFilters')) {
      document.getElementById('statusFilter').value = 'ALL';
      document.getElementById('searchInput').value = '';
      render();
    }
  });

  document.getElementById('statusFilter').addEventListener('change', render);
  document.getElementById('searchInput').addEventListener('input', render);

  window.addEventListener('beforeunload', event => {
    if (!pending.size) return;
    event.preventDefault();
    event.returnValue = '';
  });

  loadResidents().catch(error => {
    console.error('PNC live turnout load failed:', error);
    document.getElementById('residentRows').innerHTML = `<tr><td colspan="10" class="no-results">${esc(error.message)}</td></tr>`;
    const state = document.getElementById('saveState');
    state.textContent = 'Load failed';
    state.dataset.state = 'error';
  });
})();