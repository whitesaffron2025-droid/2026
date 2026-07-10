(function(){
  'use strict';

  const residents=[
    {id:'A000001',name:'Sample Resident One',address:'Dhafthar',photo:''},
    {id:'A000002',name:'Sample Resident Two',address:'Dhafthar',photo:''},
    {id:'A000003',name:'Sample Resident Three',address:'Sample House A',photo:''},
    {id:'A000004',name:'Sample Resident Four',address:'Sample House B',photo:''}
  ];

  const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));

  function groupByAddress(rows){
    return rows.reduce((groups,row)=>{
      const key=(row.address||'No Address').trim()||'No Address';
      if(!groups[key]) groups[key]=[];
      groups[key].push(row);
      return groups;
    },{});
  }

  function photoHtml(row){
    if(row.photo){
      return `<div class="resident-photo"><img src="${esc(row.photo)}" alt="${esc(row.name)}"></div>`;
    }
    const initial=(row.name||'?').trim().charAt(0).toUpperCase()||'?';
    return `<div class="resident-photo" aria-hidden="true">${esc(initial)}</div>`;
  }

  function card(row){
    return `<article class="resident-card">
      ${photoHtml(row)}
      <div class="resident-info">
        <h3>${esc(row.name)}</h3>
        <p class="resident-id">ID: ${esc(row.id)}</p>
        <p class="resident-address">${esc(row.address)}</p>
      </div>
    </article>`;
  }

  function render(query=''){
    const q=query.trim().toLowerCase();
    const filtered=residents.filter(row=>[row.name,row.id,row.address].join(' ').toLowerCase().includes(q));
    const groups=groupByAddress(filtered);
    const addresses=Object.keys(groups).sort((a,b)=>a.localeCompare(b,undefined,{numeric:true}));
    document.getElementById('residentCount').textContent=`${filtered.length} resident${filtered.length===1?'':'s'}`;
    document.getElementById('residentGroups').innerHTML=addresses.length?addresses.map(address=>{
      const rows=groups[address].sort((a,b)=>a.name.localeCompare(b.name));
      return `<section class="address-group">
        <header class="address-heading"><h2>${esc(address)}</h2><span>${rows.length}</span></header>
        <div class="resident-list">${rows.map(card).join('')}</div>
      </section>`;
    }).join(''):'<div class="empty-state">No residents found.</div>';
  }

  document.addEventListener('DOMContentLoaded',()=>{
    const search=document.getElementById('publicSearch');
    const clear=document.getElementById('clearPublicSearch');
    search.addEventListener('input',()=>render(search.value));
    clear.addEventListener('click',()=>{search.value='';render();search.focus();});
    render();
  });
})();
