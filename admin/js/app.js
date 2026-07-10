(function(){
'use strict';

const sections=['dashboard','residents','assign','calls','votes','visits','transport'];
const state={section:'dashboard',party:'all',search:'',visible:20,filters:{}};

const rows=[
{id:1,name:'Sample Resident One',national_id:'A000001',house:'Sample House A',phone:'7000001',party:'PNC',assignStatus:'unassigned',assigner:'',callStatus:'not called',voteStatus:'not voted',visitStatus:'not visited',transportStatus:'none'},
{id:2,name:'Sample Resident Two',national_id:'A000002',house:'Sample House B',phone:'7000002',party:'MDP',assignStatus:'assigned',assigner:'Team A',callStatus:'connected',voteStatus:'voted',visitStatus:'visited',transportStatus:'confirmed'},
{id:3,name:'Sample Resident Three',national_id:'A000003',house:'Dhafthar',phone:'7000003',party:'PNC',assignStatus:'completed',assigner:'Team B',callStatus:'follow-up',voteStatus:'mail-in',visitStatus:'scheduled',transportStatus:'need transport'}
];

const config={
residents:{title:'Residents',subtitle:'Master resident data',stats:['Total Residents','Registered Voters','Unregistered','New This Month'],filters:['address'],columns:['Photo','Name / ID','Address','Mobile','Party','Action']},
assign:{title:'Assign',subtitle:'Assign residents to campaign teams',stats:['Total Voters','Unassigned','Assigned','Completed'],filters:['address','assignCategory','assigner'],columns:['Photo','Name / ID','Address','Mobile','Assigner','Status','Action']},
calls:{title:'Calls',subtitle:'Track campaign call outcomes',stats:['Total Calls','Connected','Not Reached','Follow-up Needed'],filters:['address','priority'],columns:['Photo','Name','Address','Phone','Priority','Call Status','Action']},
votes:{title:'Votes',subtitle:'Track voting intention and progress',stats:['Total Voters','Voted','Not Voted','Mail-In'],filters:['address','voteStatus'],columns:['Photo','Name','Address','Party','Vote Status','Action']},
visits:{title:'Visits',subtitle:'Track door-to-door visits',stats:['Total Households','Visited','Not Visited','Scheduled'],filters:['address','visitStatus'],columns:['Photo','Name','Address','Visit Status','Action']},
transport:{title:'Transport',subtitle:'Manage election-day transport',stats:['Total Requests','Need Transport','Confirmed','Completed'],filters:['address','transportStatus'],columns:['Photo','Name','Address','Mobile','Transport Status','Action']}
};

const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const label=s=>s.charAt(0).toUpperCase()+s.slice(1);

function shell(){
 document.getElementById('adminApp').innerHTML=`
 <div class="app-shell">
  <header class="topbar">
   <div class="topbar-main">
    <div class="brand"><span class="brand-mark">2026</span><span><strong>Campaign Manager</strong><small>Admin workspace</small></span></div>
    <div class="status-wrap"><span class="status-dot"></span><span>Structure mode</span><span>•</span><span>${rows.length} preview records</span></div>
   </div>
   <div class="nav-row">
    <nav class="nav">${sections.map(s=>`<button data-section="${s}">${label(s)}</button>`).join('')}</nav>
    <label class="party-filter">Party<select id="globalParty"><option value="all">All</option><option value="PNC">PNC</option><option value="MDP">MDP</option></select></label>
   </div>
  </header>
  <main class="page"><section id="pageContent"></section></main>
 </div>`;
}

function filtered(section){
 let data=rows.slice();
 if(state.party!=='all')data=data.filter(r=>r.party===state.party);
 if(state.search){const q=state.search.toLowerCase();data=data.filter(r=>[r.name,r.national_id,r.phone].join(' ').toLowerCase().includes(q));}
 const f=state.filters;
 if(f.address&&f.address!=='all')data=data.filter(r=>r.house===f.address);
 if(section==='assign'&&f.assignCategory&&f.assignCategory!=='all')data=data.filter(r=>r.assignStatus===f.assignCategory);
 if(section==='assign'&&f.assigner&&f.assigner!=='all')data=data.filter(r=>r.assigner===f.assigner);
 if(section==='votes'&&f.voteStatus&&f.voteStatus!=='all')data=data.filter(r=>r.voteStatus===f.voteStatus);
 if(section==='visits'&&f.visitStatus&&f.visitStatus!=='all')data=data.filter(r=>r.visitStatus===f.visitStatus);
 if(section==='transport'&&f.transportStatus&&f.transportStatus!=='all')data=data.filter(r=>r.transportStatus===f.transportStatus);
 return data;
}

function statValues(section,data){
 if(section==='residents')return[data.length,data.length,0,0];
 if(section==='assign')return[data.length,data.filter(r=>r.assignStatus==='unassigned').length,data.filter(r=>r.assignStatus==='assigned').length,data.filter(r=>r.assignStatus==='completed').length];
 if(section==='calls')return[data.length,data.filter(r=>r.callStatus==='connected').length,data.filter(r=>r.callStatus==='not reached').length,data.filter(r=>r.callStatus==='follow-up').length];
 if(section==='votes')return[data.length,data.filter(r=>r.voteStatus==='voted').length,data.filter(r=>r.voteStatus==='not voted').length,data.filter(r=>r.voteStatus==='mail-in').length];
 if(section==='visits')return[data.length,data.filter(r=>r.visitStatus==='visited').length,data.filter(r=>r.visitStatus==='not visited').length,data.filter(r=>r.visitStatus==='scheduled').length];
 return[data.length,data.filter(r=>r.transportStatus==='need transport').length,data.filter(r=>r.transportStatus==='confirmed').length,data.filter(r=>r.transportStatus==='completed').length];
}

function stats(section,data){const values=statValues(section,data);return`<div class="stats-grid">${config[section].stats.map((s,i)=>`<article class="stat-card"><span>${esc(s)}</span><strong>${values[i]||0}</strong></article>`).join('')}</div>`;}

function filters(section){
 const list=config[section].filters;const addresses=[...new Set(rows.map(r=>r.house))];let html='<div class="filter-bar">';
 if(list.includes('address'))html+=`<label>Address<select data-filter="address"><option value="all">All Addresses</option>${addresses.map(v=>`<option>${esc(v)}</option>`).join('')}</select></label>`;
 if(list.includes('assignCategory'))html+='<label>Assign Category<select data-filter="assignCategory"><option value="all">All</option><option value="unassigned">Unassigned</option><option value="assigned">Assigned</option><option value="completed">Completed</option></select></label>';
 if(list.includes('assigner'))html+='<label>Assigner<select data-filter="assigner"><option value="all">All</option><option>Team A</option><option>Team B</option></select></label>';
 if(list.includes('priority'))html+='<label>Priority<select data-filter="priority"><option value="all">All</option><option>High</option><option>Medium</option><option>Low</option></select></label>';
 if(list.includes('voteStatus'))html+='<label>Vote Status<select data-filter="voteStatus"><option value="all">All</option><option value="voted">Voted</option><option value="not voted">Not Voted</option><option value="mail-in">Mail-In</option><option value="early">Early</option></select></label>';
 if(list.includes('visitStatus'))html+='<label>Visit Status<select data-filter="visitStatus"><option value="all">All</option><option value="visited">Visited</option><option value="not visited">Not Visited</option><option value="scheduled">Scheduled</option></select></label>';
 if(list.includes('transportStatus'))html+='<label>Transport Status<select data-filter="transportStatus"><option value="all">All</option><option value="need transport">Need Transport</option><option value="confirmed">Confirmed</option><option value="completed">Completed</option></select></label>';
 html+=`<label>Search<input id="searchInput" value="${esc(state.search)}" placeholder="Name, ID or mobile"></label><button class="btn secondary" id="clearFilters">Clear</button></div>`;return html;
}

function cells(section,row){const avatar='<span class="avatar">?</span>';const nameId=`<strong>${esc(row.name)}</strong><br><small>${esc(row.national_id)}</small>`;const action=`<button class="btn primary">${section==='residents'?'Edit':label(section)}</button>`;if(section==='residents')return[avatar,nameId,row.house,row.phone,`<span class="badge">${row.party}</span>`,action];if(section==='assign')return[avatar,nameId,row.house,row.phone,row.assigner||'Unassigned',row.assignStatus,action];if(section==='calls')return[avatar,row.name,row.house,row.phone,'Medium',row.callStatus,action];if(section==='votes')return[avatar,row.name,row.house,row.party,row.voteStatus,action];if(section==='visits')return[avatar,row.name,row.house,row.visitStatus,action];return[avatar,row.name,row.house,row.phone,row.transportStatus,action];}

function table(section,data){const visible=data.slice(0,state.visible);return`<div class="table-wrap"><table class="data-table"><thead><tr>${config[section].columns.map(c=>`<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>${visible.map(r=>`<tr>${cells(section,r).map(c=>`<td>${c}</td>`).join('')}</tr>`).join('')||`<tr><td colspan="${config[section].columns.length}">No records found</td></tr>`}</tbody></table></div><div class="load-row"><button class="btn secondary" id="loadMore" ${visible.length>=data.length?'disabled':''}>Load More</button><span>Showing ${visible.length} of ${data.length}</span></div>`;}

function dashboard(){const data=state.party==='all'?rows:rows.filter(r=>r.party===state.party);const vals=[data.length,data.filter(r=>r.assignStatus!=='unassigned').length,data.filter(r=>r.callStatus==='connected').length,data.filter(r=>r.assignStatus==='completed').length];document.getElementById('pageContent').innerHTML=`<section class="page-head"><div><p class="eyebrow">Dashboard</p><h1>Campaign Overview</h1><p>Read-only summary of the Residents master data.</p></div><span class="record-pill">${data.length} records</span></section><div class="stats-grid">${['Total Voters','Assigned','Called','Completed'].map((n,i)=>`<article class="stat-card"><span>${n}</span><strong>${vals[i]}</strong></article>`).join('')}</div><div class="dashboard-grid"><article class="panel placeholder"><h2>Campaign Summary</h2><p>Chart and progress area.</p></article><article class="panel placeholder"><h2>Recent Activity</h2><p>Latest resident updates will appear here.</p></article></div>`;}

function render(){document.querySelectorAll('.nav button').forEach(b=>b.classList.toggle('active',b.dataset.section===state.section));document.getElementById('globalParty').value=state.party;if(state.section==='dashboard')return dashboard();const data=filtered(state.section);document.getElementById('pageContent').innerHTML=`<section class="page-head"><div><p class="eyebrow">${esc(config[state.section].title)}</p><h1>${esc(config[state.section].title)}</h1><p>${esc(config[state.section].subtitle)}</p></div><span class="record-pill">${data.length} records</span></section>${stats(state.section,data)}<section class="panel">${filters(state.section)}${table(state.section,data)}</section>`;}

function bind(){document.addEventListener('click',e=>{const nav=e.target.closest('[data-section]');if(nav){state.section=nav.dataset.section;state.visible=20;state.filters={};location.hash=state.section;render();return;}if(e.target.id==='clearFilters'){state.search='';state.filters={};state.visible=20;render();return;}if(e.target.id==='loadMore'){state.visible+=20;render();}});document.addEventListener('input',e=>{if(e.target.id==='globalParty'){state.party=e.target.value;state.visible=20;render();return;}if(e.target.id==='searchInput'){state.search=e.target.value;state.visible=20;render();return;}if(e.target.dataset.filter){state.filters[e.target.dataset.filter]=e.target.value;state.visible=20;render();}});}

shell();bind();const hash=location.hash.replace('#','');if(sections.includes(hash))state.section=hash;render();
})();
