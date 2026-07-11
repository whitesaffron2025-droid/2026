(() => {
  'use strict';

  const cfg = window.CampaignConfig;
  const db = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });
  const table = cfg.tableName || 'campaign';
  const pageSize = 1000;
  let rows = [];
  const savingIds = new Set();

  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[char]));

  const isVoted = row => row.has_voted === true;

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
      const partyMatches = party === 'ALL' || String(row.party || '').toUpperCase() === party;
      const statusMatches = status === 'ALL' || (status === 'VOTED' ? isVoted(row) : !isVoted(row));
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
      const voted = isVoted(row);
      const saving = savingIds.has(String(row.id));
      const photo = row.photo_url
        ? `<img class="avatar" src="${esc(row.photo_url)}" alt="${esc(row.name || 'Resident')}">`
        : '<span class="avatar avatar-empty">?</span>';
      const statusText = saving ? 'Saving…' : voted ? 'Voted' : 'Not Yet';
      const time = voted && row.voted_at ? `<small>${esc(formatSavedTime(row.voted_at))}</small>` : '';

      return `<tr class="${voted ? 'voted-row' : ''}" data-resident-id="${esc(row.id)}">
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
          <button type="button" class="vote-toggle ${voted ? 'voted' : 'not-voted'}" data-toggle-vote="${esc(row.id)}" ${saving ? 'disabled' : ''}>
            <span class="vote-icon">${voted ? '✓' : '○'}</span>
            <span>${statusText}</span>
          </button>
          ${time}
        </td>
      </tr>`;
    }).join('') || '<tr><td colspan="10" class="no-results">No residents found</td></tr>';

    document.getElementById('totalCount').textContent = list.length.toLocaleString();
    document.getElementById('votedCount').textContent = list.filter(isVoted).length.toLocaleString();
    document.getElementById('notVotedCount').textContent = list.filter(row => !isVoted(row)).length.toLocaleString();
  }

  async function updateVoteStatus(id) {
    const row = rows.find(item => String(item.id) === String(id));
    if (!row || savingIds.has(String(id))) return;

    const nextValue = !isVoted(row);
    const payload = {
      has_voted: nextValue,
      voted_at: nextValue ? new Date().toISOString() : null
    };

    savingIds.add(String(id));
    setSaveState('Saving…', 'saving');
    render();

    try {
      const { error } = await db.from(table).update(payload).eq('id', Number(id));
      if (error) throw error;
      row.has_voted = nextValue;
      row.voted_at = payload.voted_at;
      setSaveState(`Saved ID ${id}`, 'saved');
    } catch (error) {
      console.error('Live turnout save failed:', error);
      setSaveState(`Save failed: ${error.message}`, 'error');
      alert(`Could not save resident ID ${id}: ${error.message}`);
    } finally {
      savingIds.delete(String(id));
      render();
    }
  }

  function setSaveState(message, state) {
    const element = document.getElementById('saveState');
    element.textContent = message;
    element.dataset.state = state;
  }

  document.addEventListener('click', event => {
    const toggle = event.target.closest('[data-toggle-vote]');
    if (toggle) updateVoteStatus(toggle.dataset.toggleVote);

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

  loadResidents().catch(error => {
    console.error('Live turnout load failed:', error);
    document.getElementById('residentRows').innerHTML = `<tr><td colspan="10" class="no-results">${esc(error.message)}</td></tr>`;
    setSaveState('Load failed', 'error');
  });
})();