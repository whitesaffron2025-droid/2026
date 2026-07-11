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

  function filteredRows() {
    const party = document.getElementById('partyFilter').value;
    const status = document.getElementById('statusFilter').value;
    const query = document.getElementById('searchInput').value.trim().toLowerCase();

    return rows.filter(row => {
      const voted = currentVotedValue(row);
      const partyMatches = party === 'ALL' || String(row.party || '').toUpperCase() === party;
      const statusMatches = status === 'ALL' || (status === 'VOTED' ? voted : !voted);
      const queryMatches = !query || [
        row.id, row.national_id, row.name, row.house,
        row.lives_in, row.living_place, row.phone, row.sex, row.age
      ].map(value => String(value ?? '').toLowerCase()).join(' ').includes(query);
      return partyMatches && statusMatches && queryMatches;
    });
  }

  function formatSavedTime(value) {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' });
  }

  function render() {
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
    }).join('') || '<tr><td colspan="10" class="no-results">No residents found</td></tr>';

    document.getElementById('totalCount').textContent = list.length.toLocaleString();
    document.getElementById('votedCount').textContent = list.filter(currentVotedValue).length.toLocaleString();
    document.getElementById('notVotedCount').textContent = list.filter(row => !currentVotedValue(row)).length.toLocaleString();
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
        .eq('id', Number(id));

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

  document.addEventListener('click', event => {
    const toggle = event.target.closest('[data-toggle-vote]');
    if (toggle) toggleVoteStatus(toggle.dataset.toggleVote);

    if (event.target.closest('#saveChanges')) saveChanges();

    if (event.target.closest('#clearFilters')) {
      document.getElementById('partyFilter').value = 'ALL';
      document.getElementById('statusFilter').value = 'ALL';
      document.getElementById('searchInput').value = '';
      render();
    }
  });

  document.getElementById('partyFilter').addEventListener('change', render);
  document.getElementById('statusFilter').addEventListener('change', render);
  document.getElementById('searchInput').addEventListener('input', render);

  window.addEventListener('beforeunload', event => {
    if (!pending.size) return;
    event.preventDefault();
    event.returnValue = '';
  });

  loadResidents().catch(error => {
    console.error('Live turnout load failed:', error);
    document.getElementById('residentRows').innerHTML = `<tr><td colspan="10" class="no-results">${esc(error.message)}</td></tr>`;
    const state = document.getElementById('saveState');
    state.textContent = 'Load failed';
    state.dataset.state = 'error';
  });
})();