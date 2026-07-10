(function () {
  'use strict';

  const sections = ['dashboard','residents','assign','calls','votes','visits','transport'];
  const state = {
    section: 'dashboard',
    party: 'all',
    search: '',
    visible: 20,
    filters: {},
    records: [
      {id:1,name:'Sample Resident One',national_id:'A000001',house:'Sample House A',phone:'7000001',party:'PNC',assignStatus:'unassigned',assigner:'',callStatus:'not called',voteStatus:'not voted',visitStatus:'not visited',transportStatus:'none'},
      {id:2,name:'Sample Resident Two',national_id:'A000002',house:'Sample House B',phone:'7000002',party:'MDP',assignStatus:'assigned',assigner:'Team A',callStatus:'connected',voteStatus:'voted',visitStatus:'visited',transportStatus:'confirmed'},
      {id:3,name:'Sample Resident Three',national_id:'A000003',house:'Dhafthar',phone:'7000003',party:'PNC',assignStatus:'completed',assigner:'Team B',callStatus:'follow-up',voteStatus:'mail-in',visitStatus:'scheduled',transportStatus:'need transport'}
    ]
  };

  const config = {
    residents:{title:'Residents',stats:['Total Residents','Registered Voters','Unregistered','New This Month'],filters:['address'],columns:['Name / ID','Address','Mobile','Party','Action']},
    assign:{title:'Assign',stats:['Total Voters','Unassigned','Assigned','Completed'],filters:['address','assignCategory','assigner'],columns:['Name / ID','Address','Mobile','Assigner','Status','Action']},
    calls:{title:'Calls',stats:['Total Calls','Connected','Not Reached','Follow-up Needed'],filters:['address','priority'],columns:['Name','Address','Phone','Priority','Call Status','Action']},
    votes:{title:'Votes',stats:['Total Voters','Voted','Not Voted','Mail-In'],filters:['address','voteStatus'],columns:['Name','Address','Party','Vote Status','Action']},
    visits:{title:'Visits',stats:['Total Households','Visited','Not Visited','Scheduled'],filters:['address','visitStatus'],columns:['Name','Address','Visit Status','Action']},
    transport:{title:'Transport',stats:['Total Requests','Need Transport','Confirmed','Completed'],filters:['address','transportStatus'],columns:['Name','Address','Mobile','Transport Status','Action']}
  };

  const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const label = section => section.charAt(0).toUpperCase() + section.slice(1);

  function shell() {
    document.body.innerHTML = `
      <header class="app-header">
        <div class="header-main">
          <a class="brand" href="#dashboard"><span class="logo">2026</span><span><strong>Campaign Manager</strong><small>Status: Structure Preview</small></span></a>
          <div class="record-count">3 preview records</div>
        </div>
        <div class="nav-row">
          <nav class="nav">${sections.map(s=>`<button data-section="${s}" class="nav-btn">${label(s)}</button>`).join('')}</nav>
          <label class="global-party">Party<select id="globalParty"><option value="all">All</option><option value="PNC">PNC</option><option value="MDP">MDP</option></select></label>
        </div>
      </header>
      <main class="page-shell"><section id="app"></section></main>
    `;
  }

  function filtered(section) {
    let rows = state.records.slice();
    if (state.party !== 'all') rows = rows.filter(r=>r.party===state.party);
    if (state.search) {
      const q = state.search.toLowerCase();
      rows = rows.filter(r=>[r.name,r.national_id,r.phone].join(' ').toLowerCase().includes(q));
    }
    const f = state.filters;
    if (f.address && f.address !== 'all') rows = rows.filter(r=>r.house===f.address);
    if (section==='assign' && f.assignCategory && f.assignCategory!=='all') rows = rows.filter(r=>r.assignStatus===f.assignCategory);
    if (section==='assign' && f.assigner && f.assigner!=='all') rows = rows.filter(r=>r.assigner===f.assigner);
    if (section==='votes' && f.voteStatus && f.voteStatus!=='all') rows = rows.filter(r=>r.voteStatus===f.voteStatus);
    if (section==='visits' && f.visitStatus && f.visitStatus!=='all') rows = rows.filter(r=>r.visitStatus===f.visitStatus);
    if (section==='transport' && f.transportStatus && f.transportStatus!=='all') rows = rows.filter(r=>r.transportStatus===f.transportStatus);
    return rows;
  }

  function stats(section, rows) {
    const values = section==='residents' ? [rows.length, rows.length, 0, 0]
      : section==='assign' ? [rows.length, rows.filter(r=>r.assignStatus==='unassigned').length, rows.filter(r=>r.assignStatus==='assigned').length, rows.filter(r=>r.assignStatus==='completed').length]
      : section==='calls' ? [rows.length, rows.filter(r=>r.callStatus==='connected').length, rows.filter(r=>r.callStatus==='not reached').length, rows.filter(r=>r.callStatus==='follow-up').length]
      : section==='votes' ? [rows.length, rows.filter(r=>r.voteStatus==='voted').length, rows.filter(r=>r.voteStatus==='not voted').length, rows.filter(r=>r.voteStatus==='mail-in').length]
      : section==='visits' ? [rows.length, rows.filter(r=>r.visitStatus==='visited').length, rows.filter(r=>r.visitStatus==='not visited').length, rows.filter(r=>r.visitStatus==='scheduled').length]
      : [rows.length, rows.filter(r=>r.transportStatus==='need transport').length, rows.filter(r=>r.transportStatus==='confirmed').length, rows.filter(r=>r.transportStatus==='completed').length];
    return `<div class="stats-grid">${config[section].stats.map((name,i)=>`<article class="stat-card"><span>${esc(name)}</span><strong>${values[i]||0}</strong></article>`).join('')}</div>`;
  }

  function filterBar(section) {
    const filters = config[section].filters;
    const addresses = [...new Set(state.records.map(r=>r.house))];
    let html = '<div class="filter-bar">';
    if (filters.includes('address')) html += `<label>Address<select data-filter="address"><option value="all">All Addresses</option>${addresses.map(v=>`<option>${esc(v)}</option>`).join('')}</select></label>`;
    if (filters.includes('assignCategory')) html += '<label>Assign Category<select data-filter="assignCategory"><option value="all">All</option><option value="unassigned">Unassigned</option><option value="assigned">Assigned</option><option value="completed">Completed</option></select></label>';
    if (filters.includes('assigner')) html += '<label>Assigner<select data-filter="assigner"><option value="all">All</option><option>Team A</option><option>Team B</option></select></label>';
    if (filters.includes('priority')) html += '<label>Priority<select data-filter="priority"><option value="all">All</option><option>High</option><option>Medium</option><option>Low</option></select></label>';
    if (filters.includes('voteStatus')) html += '<label>Vote Status<select data-filter="voteStatus"><option value="all">All</option><option value="voted">Voted</option><option value="not voted">Not Voted</option><option value="mail-in">Mail-In</option><option value="early">Early</option></select></label>';
    if (filters.includes('visitStatus')) html += '<label>Visit Status<select data-filter="visitStatus"><option value="all">All</option><option value="visited">Visited</option><option value="not visited">Not Visited</option><option value="scheduled">Scheduled</option></select></label>';
    if (filters.includes('transportStatus')) html += '<label>Transport Status<select data-filter="transportStatus"><option value="all">All</option><option value="need transport">Need Transport</option><option value="confirmed">Confirmed</option><option value="completed">Completed</option></select></label>';
    html += `<label class="search-field">Search<input id="searchInput" placeholder="Name, ID or mobile" value="${esc(state.search)}"></label><button id="clearBtn" class="btn secondary">Clear</button>`;
    html += '</div>';
    return html;
  }

  function rowCells(section,row) {
    const nameId = `<strong>${esc(row.name)}</strong><br><small>${esc(row.national_id)}</small>`;
    const action = `<button class="btn primary">${section==='residents'?'Edit':label(section)}</button>`;
    if (section==='residents') return [nameId,row.house,row.phone,row.party,action];
    if (section==='assign') return [nameId,row.house,row.phone,row.assigner||'Unassigned',row.assignStatus,action];
    if (section==='calls') return [row.name,row.house,row.phone,'Medium',row.callStatus,action];
    if (section==='votes') return [row.name,row.house,row.party,row.voteStatus,action];
    if (section==='visits') return [row.name,row.house,row.visitStatus,action];
    return [row.name,row.house,row.phone,row.transportStatus,action];
  }

  function table(section, rows) {
    const shown = rows.slice(0,state.visible);
    return `<div class="table-wrap"><table><thead><tr>${config[section].columns.map(c=>`<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>${shown.map(r=>`<tr>${rowCells(section,r).map(c=>`<td>${c}</td>`).join('')}</tr>`).join('')||`<tr><td colspan="${config[section].columns.length}">No records found</td></tr>`}</tbody></table></div><div class="load-row"><button id="loadMore" class="btn secondary" ${shown.length>=rows.length?'disabled':''}>Load More</button><span>Showing ${shown.length} of ${rows.length}</span></div>`;
  }

  function dashboard() {
    const rows = state.party==='all'?state.records:state.records.filter(r=>r.party===state.party);
    const values = [rows.length,rows.filter(r=>r.assignStatus!=='unassigned').length,rows.filter(r=>r.callStatus==='connected').length,rows.filter(r=>r.assignStatus==='completed').length];
    document.getElementById('app').innerHTML = `<section class="page-head"><div><p class="eyebrow">Dashboard</p><h1>Campaign Overview</h1></div></section><div class="stats-grid">${['Total Voters','Assigned','Called','Completed'].map((n,i)=>`<article class="stat-card"><span>${n}</span><strong>${values[i]}</strong></article>`).join('')}</div><div class="dashboard-grid"><article class="panel"><h2>Campaign Summary</h2><div class="chart-placeholder">Chart area</div></article><article class="panel"><h2>Recent Activity</h2><div class="activity-list"><p>Resident structure ready</p><p>Section views connected to master data</p><p>Supabase connection disabled during layout review</p></div></article></div>`;
  }

  function render() {
    document.querySelectorAll('.nav-btn').forEach(b=>b.classList.toggle('active',b.dataset.section===state.section));
    document.getElementById('globalParty').value = state.party;
    if (state.section==='dashboard') return dashboard();
    const rows = filtered(state.section);
    document.getElementById('app').innerHTML = `<section class="page-head"><div><p class="eyebrow">${esc(config[state.section].title)}</p><h1>${esc(config[state.section].title)}</h1></div><span>${rows.length} records</span></section>${stats(state.section,rows)}<section class="panel">${filterBar(state.section)}${table(state.section,rows)}</section>`;
  }

  function bind() {
    document.addEventListener('click',e=>{
      const nav=e.target.closest('[data-section]');
      if(nav){state.section=nav.dataset.section;state.visible=20;state.filters={};location.hash=state.section;render();return;}
      if(e.target.id==='clearBtn'){state.search='';state.filters={};state.visible=20;render();return;}
      if(e.target.id==='loadMore'){state.visible+=20;render();}
    });
    document.addEventListener('input',e=>{
      if(e.target.id==='globalParty'){state.party=e.target.value;state.visible=20;render();return;}
      if(e.target.id==='searchInput'){state.search=e.target.value;state.visible=20;render();return;}
      if(e.target.dataset.filter){state.filters[e.target.dataset.filter]=e.target.value;state.visible=20;render();}
    });
  }

  shell();
  bind();
  const hash=location.hash.replace('#','');
  if(sections.includes(hash)) state.section=hash;
  render();
})();
