const SUPABASE_URL = 'https://tkuivkhghmeljcuqwwdy.supabase.co';
const SUPABASE_KEY = 'sb_publishable_pBOO7h7_TBtfDhv_vYqEFw_MCpHFkq-';
const TABLE = '2026';
const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const state = { rows: [], filtered: [], page: 1, pageSize: 20, activeView: 'dashboard', editing: null };
const $ = (id) => document.getElementById(id);
const safe = (v) => (v ?? '').toString().trim();
const lower = (v) => safe(v).toLowerCase();
const pct = (n, d) => d ? ((n / d) * 100) : 0;
const fmt = (n) => Number(n || 0).toLocaleString();

function toast(message) {
  const el = $('toast');
  el.textContent = message;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 2600);
}

function badge(value) {
  const v = safe(value) || 'none';
  let cls = '';
  if (['will-vote','called','reach','reached','guaranteed','arranged','picked-up'].includes(v)) cls = 'ok';
  if (['need-call','not-decided','not-visited','need-transport','not-guaranteed','busy','not-answer'].includes(v)) cls = 'warn';
  if (['not-vote','disconnected','wrong-number','out-of-coverage'].includes(v)) cls = 'danger';
  return `<span class="badge ${cls}">${label(v)}</span>`;
}

function label(v) {
  return safe(v).replaceAll('-', ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'None';
}

function normalizeRow(row) {
  return {
    ...row,
    vote_status: row.vote_status || 'not-decided',
    phone_status: row.phone_status || 'need-call',
    d2d_status: row.d2d_status || 'not-visited',
    reach_status: row.reach_status || 'not-reached',
    support_level: row.support_level || 'normal',
    transport_status: row.transport_status || 'not-needed'
  };
}

async function loadData() {
  $('connectionStatus').textContent = 'Loading Supabase data…';
  try {
    const { data, error } = await client.from(TABLE).select('*').order('house', { ascending: true }).limit(5000);
    if (error) throw error;
    state.rows = (data || []).map(normalizeRow);
    $('connectionStatus').textContent = `Connected • ${fmt(state.rows.length)} records`;
    $('lastUpdated').textContent = new Date().toLocaleString();
    state.page = 1;
    renderAll();
  } catch (err) {
    console.error(err);
    $('connectionStatus').textContent = 'Connection or table error';
    toast(err.message || 'Could not load Supabase data');
    renderAll();
  }
}

function metrics(rows = state.rows) {
  const total = rows.length;
  const reached = rows.filter(r => r.reach_status === 'reached' || ['will-vote','not-vote'].includes(r.vote_status) || ['called','reach'].includes(r.phone_status)).length;
  const called = rows.filter(r => r.phone_status === 'called').length;
  const needCall = rows.filter(r => r.phone_status === 'need-call' || !r.phone_status).length;
  const willVote = rows.filter(r => r.vote_status === 'will-vote').length;
  const notVote = rows.filter(r => r.vote_status === 'not-vote').length;
  const notDecided = rows.filter(r => r.vote_status === 'not-decided' || !r.vote_status).length;
  const d2d = rows.filter(r => r.d2d_status === 'reach').length;
  const needD2D = rows.filter(r => r.d2d_status === 'not-visited' || !r.d2d_status).length;
  const guaranteed = rows.filter(r => r.support_level === 'guaranteed').length;
  const needTransport = rows.filter(r => r.transport_status === 'need-transport').length;
  const assigned = rows.filter(r => safe(r.vote_assigned_by)).length;
  const unassigned = total - assigned;
  return { total, reached, called, needCall, willVote, notVote, notDecided, d2d, needD2D, guaranteed, needTransport, assigned, unassigned };
}

function applyFilters() {
  const q = lower($('searchInput').value);
  const party = $('partyFilter').value;
  const status = $('statusFilter').value;
  state.pageSize = Number($('pageSize').value || 20);
  state.filtered = state.rows.filter(r => {
    const hay = [r.name,r.national_id,r.phone,r.house,r.lives_in,r.living_place,r.party,r.remarks,r.vote_assigned_by].map(lower).join(' ');
    if (q && !hay.includes(q)) return false;
    if (party !== 'all' && safe(r.party).toUpperCase() !== party) return false;
    if (status === 'unassigned') return !safe(r.vote_assigned_by);
    if (status !== 'all') {
      return [r.vote_status,r.phone_status,r.d2d_status,r.reach_status,r.transport_status,r.support_level].includes(status);
    }
    return true;
  }).sort((a,b) => safe(a.house).localeCompare(safe(b.house)) || safe(a.name).localeCompare(safe(b.name)));
}

function renderAll() {
  applyFilters();
  renderKpis();
  renderProgress();
  renderPriorities();
  renderRecords();
  renderAnalytics();
  renderReport();
}

function renderKpis() {
  const m = metrics(state.rows);
  const items = [
    ['Total Records', m.total, 'All voters in table'],
    ['Reached', m.reached, `${pct(m.reached,m.total).toFixed(1)}% outreach`],
    ['Called', m.called, `${pct(m.called,m.total).toFixed(1)}% phone`],
    ['Will Vote', m.willVote, `${pct(m.willVote,m.total).toFixed(1)}% support`],
    ['Need Call', m.needCall, `${pct(m.needCall,m.total).toFixed(1)}% pending`],
    ['Assigned', m.assigned, `${m.unassigned} unassigned`]
  ];
  $('kpiGrid').innerHTML = items.map(([t,n,s]) => `<article class="kpi"><span>${t}</span><strong>${fmt(n)}</strong><small>${s}</small></article>`).join('');
}

function renderProgress() {
  const m = metrics(state.rows);
  const items = [
    ['Voter reach rate', m.reached, m.total, 'Target 50%+'],
    ['Voter call rate', m.called, m.total, 'Target 30%+'],
    ['Will vote rate', m.willVote, m.total, 'Target 20%+'],
    ['D2D visit rate', m.d2d, m.total, 'Target 25%+'],
    ['Guaranteed support', m.guaranteed, m.total, 'Target 10%+']
  ];
  $('progressBars').innerHTML = items.map(([t,n,d,sub]) => {
    const p = pct(n,d);
    return `<div class="progress-item"><div class="progress-top"><span>${t}</span><span>${p.toFixed(1)}%</span></div><div class="bar"><i style="width:${Math.min(p,100)}%"></i></div><small>${fmt(n)} of ${fmt(d)} • ${sub}</small></div>`;
  }).join('');
}

function renderPriorities() {
  const m = metrics(state.rows);
  const items = [
    ['Phone banking', `${fmt(m.needCall)} voters still need calls`, 'Focus first on voters with phone numbers and no reach status.'],
    ['Undecided voters', `${fmt(m.notDecided)} voters are not decided`, 'Move these through calls, D2D visits, and follow-up notes.'],
    ['Team assignment', `${fmt(m.unassigned)} voters are unassigned`, 'Assign voters by house or area to avoid duplicate outreach.'],
    ['Election day transport', `${fmt(m.needTransport)} voters need transport`, 'Prepare vehicle plan and status updates before polling day.']
  ];
  $('priorityList').innerHTML = items.map(([t,b,s]) => `<div class="priority"><b>${t}</b><strong>${b}</strong><br><small>${s}</small></div>`).join('');
}

function renderRecords() {
  const totalPages = Math.max(1, Math.ceil(state.filtered.length / state.pageSize));
  if (state.page > totalPages) state.page = totalPages;
  const start = (state.page - 1) * state.pageSize;
  const pageRows = state.filtered.slice(start, start + state.pageSize);
  $('recordCount').textContent = `${fmt(state.filtered.length)} records`;
  $('pageInfo').textContent = `Page ${state.page} of ${totalPages}`;
  $('prevPage').disabled = state.page <= 1;
  $('nextPage').disabled = state.page >= totalPages;
  $('recordsBody').innerHTML = pageRows.map(r => {
    const photo = safe(r.photo_url) || safe(r.image_key) || '';
    const avatar = photo ? `<img class="avatar" src="${photo}" alt="">` : `<span class="avatar"></span>`;
    return `<tr>
      <td><div class="person">${avatar}<div><b>${safe(r.name) || 'No name'}</b><br><small>${safe(r.national_id) || 'No ID'}</small></div></div></td>
      <td>${safe(r.house) || safe(r.lives_in) || '-'}</td>
      <td>${safe(r.phone) ? `<a href="tel:${safe(r.phone)}">${safe(r.phone)}</a>` : '-'}</td>
      <td>${badge(r.party)}</td>
      <td>${badge(r.vote_status)}</td>
      <td>${badge(r.phone_status)}</td>
      <td>${badge(r.d2d_status)}</td>
      <td>${safe(r.vote_assigned_by) || '<span class="badge warn">Unassigned</span>'}</td>
      <td><button class="primary" onclick="openEdit(${Number(r.id)})">Update</button></td>
    </tr>`;
  }).join('') || `<tr><td colspan="9">No records match the current filters.</td></tr>`;
}

function renderAnalytics() {
  const groups = {};
  for (const r of state.rows) {
    const key = safe(r.party).toUpperCase() || 'UNKNOWN';
    groups[key] ||= [];
    groups[key].push(r);
  }
  $('partyAnalytics').innerHTML = Object.entries(groups).map(([party, rows]) => {
    const m = metrics(rows);
    return `<div class="analytics-row"><div><b>${party}</b><br><small>${fmt(rows.length)} records</small></div><div><b>${pct(m.willVote,m.total).toFixed(1)}%</b><br><small>will vote</small></div><div><b>${pct(m.reached,m.total).toFixed(1)}%</b><br><small>reached</small></div></div>`;
  }).join('') || '<p>No analytics yet.</p>';

  const m = metrics(state.rows);
  const insights = [];
  if (m.needCall > m.called) insights.push(['High call backlog', `${fmt(m.needCall)} voters still need calls. Phone banking is the biggest bottleneck.`]);
  if (m.notDecided > m.willVote) insights.push(['Conversion opportunity', `${fmt(m.notDecided)} voters are not decided. Prioritize persuasive follow-up.`]);
  if (m.unassigned > 0) insights.push(['Assignment gap', `${fmt(m.unassigned)} voters are not assigned to any team member.`]);
  if (m.needTransport > 0) insights.push(['Transport preparation', `${fmt(m.needTransport)} voters need transport support for turnout.`]);
  if (!insights.length) insights.push(['Healthy workflow', 'No major bottleneck detected from current data.']);
  $('insightsList').innerHTML = insights.map(([t,s]) => `<div class="insight"><b>${t}</b><br><small>${s}</small></div>`).join('');
}

function renderReport() {
  const m = metrics(state.rows);
  $('reportOutput').textContent = `2026 Campaign Dashboard Report\nGenerated: ${new Date().toLocaleString()}\n\nTotal records: ${fmt(m.total)}\nReached: ${fmt(m.reached)} (${pct(m.reached,m.total).toFixed(1)}%)\nCalled: ${fmt(m.called)} (${pct(m.called,m.total).toFixed(1)}%)\nWill vote: ${fmt(m.willVote)} (${pct(m.willVote,m.total).toFixed(1)}%)\nNot decided: ${fmt(m.notDecided)}\nNeed call: ${fmt(m.needCall)}\nD2D reached: ${fmt(m.d2d)}\nGuaranteed support: ${fmt(m.guaranteed)}\nNeed transport: ${fmt(m.needTransport)}\nAssigned: ${fmt(m.assigned)}\nUnassigned: ${fmt(m.unassigned)}\n\nPriority actions:\n1. Call voters marked need-call.\n2. Assign all unassigned voters by house/area.\n3. Follow up not-decided voters.\n4. Prepare transport list before election day.`;
}

function openEdit(id) {
  const row = state.rows.find(r => Number(r.id) === Number(id));
  if (!row) return;
  state.editing = row;
  const dialog = $('editDialog');
  dialog.innerHTML = document.querySelector('dialog').innerHTML || dialog.innerHTML;
}
window.openEdit = function(id) {
  const r = state.rows.find(x => Number(x.id) === Number(id));
  if (!r) return;
  state.editing = r;
  $('editDialog').innerHTML = `<form method="dialog" id="editForm"><div class="modal-head"><div><h2>${safe(r.name) || 'Update voter'}</h2><p>${safe(r.house)} • ${safe(r.phone)} • ${safe(r.national_id)}</p></div><button class="icon-btn" value="cancel">×</button></div><div class="form-grid">
    ${selectField('vote_status','Vote status',r.vote_status,['not-decided','will-vote','not-vote'])}
    ${selectField('phone_status','Phone status',r.phone_status,['need-call','called','busy','not-answer','disconnected','wrong-number','out-of-coverage'])}
    ${selectField('d2d_status','D2D status',r.d2d_status,['not-visited','reach','not-home','live-in-another-place'])}
    ${selectField('reach_status','Reach status',r.reach_status,['not-reached','reached'])}
    ${selectField('support_level','Support level',r.support_level,['normal','not-guaranteed','guaranteed'])}
    ${selectField('transport_status','Transport',r.transport_status,['not-needed','need-transport','arranged','picked-up'])}
    <label>Assigned by<input name="vote_assigned_by" value="${escapeAttr(r.vote_assigned_by)}" placeholder="Team member name"></label>
    <label>Living place<input name="living_place" value="${escapeAttr(r.living_place)}" placeholder="Current living place"></label>
    <label class="full">Remarks<textarea name="remarks" rows="4">${escapeHtml(r.remarks)}</textarea></label>
  </div><div class="modal-actions"><button class="secondary" value="cancel">Cancel</button><button class="primary" id="saveVoterBtn" value="default">Save</button></div></form>`;
  $('editForm').addEventListener('submit', saveEdit);
  $('editDialog').showModal();
};

function selectField(name, title, value, options) {
  return `<label>${title}<select name="${name}">${options.map(o => `<option value="${o}" ${o === value ? 'selected' : ''}>${label(o)}</option>`).join('')}</select></label>`;
}
function escapeHtml(s){return safe(s).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));}
function escapeAttr(s){return escapeHtml(s).replace(/"/g,'&quot;');}

async function saveEdit(e) {
  e.preventDefault();
  if (!state.editing) return;
  const form = new FormData(e.currentTarget);
  const patch = Object.fromEntries(form.entries());
  if (['will-vote','not-vote'].includes(patch.vote_status) || patch.support_level === 'guaranteed' || patch.phone_status === 'called' || patch.d2d_status === 'reach') patch.reach_status = 'reached';
  if (!safe(patch.vote_assigned_by)) patch.vote_assigned_by = null;
  if (safe(patch.vote_assigned_by)) patch.vote_assigned_at = new Date().toISOString();
  const { error } = await client.from(TABLE).update(patch).eq('id', state.editing.id);
  if (error) { toast(error.message || 'Save failed'); return; }
  Object.assign(state.editing, normalizeRow(patch));
  $('editDialog').close();
  toast('Saved');
  renderAll();
}

function exportCsv() {
  const rows = state.filtered.length ? state.filtered : state.rows;
  const cols = ['id','name','national_id','house','lives_in','phone','party','vote_status','phone_status','d2d_status','reach_status','support_level','transport_status','vote_assigned_by','living_place','remarks'];
  const csv = [cols.join(',')].concat(rows.map(r => cols.map(c => '"' + safe(r[c]).replaceAll('"','""') + '"').join(','))).join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], {type:'text/csv'}));
  a.download = `campaign-export-${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
}

function switchView(view) {
  state.activeView = view;
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.view === view));
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  $(`${view}View`).classList.add('active');
}

document.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-view]');
  if (btn) switchView(btn.dataset.view);
});
['searchInput','partyFilter','statusFilter','pageSize'].forEach(id => $(id).addEventListener('input', () => { state.page = 1; renderAll(); }));
$('refreshBtn').addEventListener('click', loadData);
$('exportBtn').addEventListener('click', exportCsv);
$('prevPage').addEventListener('click', () => { state.page--; renderRecords(); });
$('nextPage').addEventListener('click', () => { state.page++; renderRecords(); });
$('copyReportBtn').addEventListener('click', async () => { await navigator.clipboard.writeText($('reportOutput').textContent); toast('Report copied'); });

loadData();
