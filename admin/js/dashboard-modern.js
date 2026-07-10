/* MODULE: Modern Campaign Dashboard | VERSION: 1.1.0 | BUILD: 2026.07.10 */
(() => {
  'use strict';

  const cfg = window.CampaignConfig;
  if (!cfg || !window.supabase) return;

  const db = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseKey, {
    auth: { persistSession: true, autoRefreshToken: true }
  });

  const text = value => String(value ?? '').trim();
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[char]));
  const pct = (value, total) => total ? Math.round(value / total * 100) : 0;
  const address = row => text(row.house) || text(row.living_place) || text(row.lives_in) || 'No Address';
  const partyKey = value => {
    const v = text(value).toUpperCase();
    if (v === 'PNC') return 'PNC';
    if (v === 'MDP') return 'MDP';
    return 'NONE';
  };

  let busy = false;
  const isDashboard = () => !location.hash || location.hash === '#dashboard';

  async function loadRows() {
    const rows = [];
    let from = 0;
    const size = Number(cfg.batchSize || 1000);
    while (true) {
      const { data, error } = await db.from(cfg.tableName)
        .select('id,name,house,living_place,lives_in,phone,party,vote_status,reach_status,phone_status,last_call_at,d2d_status,transport_status,vote_assigned_by,vote_assigned_at,call_center_agent')
        .order('id', { ascending: true })
        .range(from, from + size - 1);
      if (error) throw error;
      rows.push(...(data || []));
      if (!data || data.length < size) break;
      from += size;
    }
    return rows;
  }

  async function loadAssignments() {
    const { data, error } = await db.from('resident_assignments')
      .select('resident_id,assignee_name,assigned_at')
      .order('assigned_at', { ascending: false })
      .limit(250);
    return error ? [] : (data || []);
  }

  function selectedParty() {
    const value = document.getElementById('globalParty')?.value;
    if (value === 'PNC' || value === 'MDP') return value;
    if (value === '') return 'NONE';
    return 'all';
  }

  function applyParty(rows) {
    const selected = selectedParty();
    if (selected === 'all') return rows;
    return rows.filter(row => partyKey(row.party) === selected);
  }

  function topHouses(rows) {
    const map = new Map();
    rows.forEach(row => {
      const key = address(row);
      const item = map.get(key) || { name: key, total: 0, assigned: 0 };
      item.total += 1;
      if (text(row.vote_assigned_by)) item.assigned += 1;
      map.set(key, item);
    });
    return [...map.values()].sort((a,b) => b.total - a.total).slice(0, 8);
  }

  function stat(label, value, total, note, hash) {
    const percent = pct(value, total);
    return `<button class="md-stat" data-go="${hash}"><span>${label}</span><strong>${value.toLocaleString()}</strong><small>${note}</small><div class="md-progress"><i style="width:${percent}%"></i></div><b>${percent}%</b></button>`;
  }

  function bars(items) {
    const max = Math.max(...items.map(item => item.value), 1);
    return items.map(item => `<div class="md-bar"><span>${item.label}</span><div><i style="width:${Math.round(item.value / max * 100)}%"></i></div><strong>${item.value.toLocaleString()}</strong></div>`).join('');
  }

  function render(allRows, assignments) {
    const host = document.getElementById('pageContent');
    if (!host || !isDashboard()) return;

    const rows = applyParty(allRows);
    const total = rows.length;
    const assigned = rows.filter(row => text(row.vote_assigned_by)).length;
    const called = rows.filter(row => text(row.last_call_at) || ['called','connected'].includes(text(row.phone_status))).length;
    const visited = rows.filter(row => text(row.d2d_status) && text(row.d2d_status) !== 'not-visited').length;
    const reached = rows.filter(row => text(row.reach_status) === 'reached').length;
    const willVote = rows.filter(row => text(row.vote_status) === 'will-vote').length;
    const noPhone = rows.filter(row => !text(row.phone)).length;
    const unassigned = total - assigned;
    const assignedNeverCalled = rows.filter(row => text(row.vote_assigned_by) && !text(row.last_call_at)).length;
    const transportNeed = rows.filter(row => ['need','need-transport'].includes(text(row.transport_status))).length;
    const houses = topHouses(rows);
    const activity = assignments.slice(0, 10);

    host.innerHTML = `
      <section class="md-goal"><div><span>Today's Goal</span><strong>Contact 100 residents</strong></div><div class="md-progress"><i style="width:${Math.min(called,100)}%"></i></div><b>${Math.min(called,100)} / 100</b></section>
      <section class="md-stats">
        ${stat('Residents', total, total, 'Master records', '#residents')}
        ${stat('Assigned', assigned, total, `${unassigned} unassigned`, '#assign')}
        ${stat('Contacted', called, total, `${assignedNeverCalled} assigned, not called`, '#calls')}
        ${stat('Reached', reached, total, 'Confirmed contact', '#calls')}
        ${stat('Will Vote', willVote, total, 'Confirmed support', '#votes')}
      </section>
      <section class="md-grid">
        <article class="md-panel"><header><span>Campaign Pipeline</span><h2>Workflow Progress</h2></header><div class="md-bars">${bars([{label:'Assigned',value:assigned},{label:'Called',value:called},{label:'Visited',value:visited},{label:'Will Vote',value:willVote}])}</div></article>
        <article class="md-panel"><header><span>Action Centre</span><h2>Needs Attention</h2></header><div class="md-alerts"><button data-go="#assign"><b>${unassigned}</b><span>Residents unassigned</span></button><button data-go="#calls"><b>${noPhone}</b><span>Residents without phone</span></button><button data-go="#calls"><b>${assignedNeverCalled}</b><span>Assigned but never called</span></button><button data-go="#transport"><b>${transportNeed}</b><span>Need transport follow-up</span></button></div></article>
        <article class="md-panel"><header><span>Geographic Progress</span><h2>Top Houses</h2></header><div class="md-houses">${houses.map(house => `<button data-house="${esc(house.name)}"><div><strong>${esc(house.name)}</strong><span>${house.assigned}/${house.total} assigned</span></div><div class="md-progress"><i style="width:${pct(house.assigned,house.total)}%"></i></div><b>${pct(house.assigned,house.total)}%</b></button>`).join('')}</div></article>
        <article class="md-panel"><header><span>Recent Activity</span><h2>Assignment Feed</h2></header><div class="md-feed">${activity.length ? activity.map(item => `<div><i></i><section><strong>${esc(item.assignee_name || 'Assignee')} selected a resident</strong><span>${new Date(item.assigned_at).toLocaleString('en-GB')}</span></section></div>`).join('') : '<p>No assignment activity yet.</p>'}</div></article>
      </section>`;
  }

  async function load() {
    if (!isDashboard() || busy) return;
    const host = document.getElementById('pageContent');
    if (!host) return;
    busy = true;
    host.innerHTML = '<div class="md-loading">Loading campaign dashboard…</div>';
    try {
      const [rows, assignments] = await Promise.all([loadRows(), loadAssignments()]);
      render(rows, assignments);
    } catch (error) {
      host.innerHTML = `<div class="md-error">Dashboard error: ${esc(error.message)}</div>`;
    } finally {
      busy = false;
    }
  }

  document.addEventListener('click', event => {
    const go = event.target.closest('[data-go]');
    if (go) {
      location.hash = go.dataset.go;
      return;
    }
    const house = event.target.closest('[data-house]');
    if (house) {
      sessionStorage.setItem('campaign_prefilter_house', house.dataset.house);
      location.hash = '#residents';
    }
  });

  document.addEventListener('change', event => {
    if (event.target.id === 'globalParty' && isDashboard()) setTimeout(load, 80);
  });

  window.addEventListener('hashchange', () => setTimeout(load, 80));
  new MutationObserver(() => {
    if (isDashboard() && document.getElementById('pageContent') && !document.querySelector('.md-goal')) load();
  }).observe(document.documentElement, { childList: true, subtree: true });

  setTimeout(load, 150);
})();