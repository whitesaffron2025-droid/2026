(() => {
'use strict';
const cfg=window.CampaignConfig;
const db=window.supabase.createClient(cfg.supabaseUrl,cfg.supabaseKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
const table=cfg.tableName||'campaign';
let rows=[];
const pending=new Map();
const esc=v=>String(v??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const value=r=>pending.has(String(r.id))?pending.get(String(r.id)):Boolean(r.has_voted);
async function load(){
 const all=[];
 for(let from=0;;from+=1000){
  const {data,error}=await db.from(table).select('id,photo_url,name,national_id,house,lives_in,living_place,phone,sex,age,party,has_voted,voted_at').order('house').order('name').range(from,from+999);
  if(error)throw error;
  all.push(...(data||[]));
  if(!data||data.length<1000)break;
 }
 rows=all;render();
}
function visible(){
 const party=document.getElementById('partyFilter').value;
 const q=document.getElementById('searchInput').value.trim().toLowerCase();
 return rows.filter(r=>(party==='ALL'||String(r.party||'').toUpperCase()===party)&&(!q||[r.id,r.national_id,r.name,r.house,r.lives_in,r.living_place,r.phone,r.sex,r.age].join(' ').toLowerCase().includes(q)));
}
function render(){
 const list=visible();
 document.getElementById('residentRows').innerHTML=list.map(r=>{
  const id=String(r.id),changed=pending.has(id),done=value(r);
  const photo=r.photo_url?`<img class="avatar" src="${esc(r.photo_url)}" alt="">`:'<span class="avatar">?</span>';
  const status=changed?(done?'Pending: Voted':'Pending: Not Voted'):(done?'Voted':'Not Voted');
  return `<tr data-id="${id}" class="${changed?'pending':done?'voted':''}"><td>${esc(r.id)}</td><td>${photo}</td><td>${esc(r.national_id)||'-'}</td><td><strong>${esc(r.name)||'No name'}</strong></td><td>${esc(r.house)||'-'}</td><td>${esc(r.lives_in||r.living_place)||'Not recorded'}</td><td>${esc(r.phone)||'-'}</td><td>${esc(r.sex)||'-'}</td><td>${esc(r.age)||'-'}</td><td><span class="status-pill ${changed?'status-pending':done?'status-voted':'status-not'}">${status}</span></td></tr>`;
 }).join('')||'<tr><td colspan="10">No residents found</td></tr>';
 document.getElementById('totalCount').textContent=list.length.toLocaleString();
 document.getElementById('votedCount').textContent=list.filter(value).length.toLocaleString();
 document.getElementById('notVotedCount').textContent=list.filter(r=>!value(r)).length.toLocaleString();
 document.getElementById('pendingCount').textContent=`${pending.size} pending`;
}
function toggle(id){
 const r=rows.find(x=>String(x.id)===String(id));if(!r)return;
 const next=!value(r),original=Boolean(r.has_voted);
 if(next===original)pending.delete(String(id));else pending.set(String(id),next);
 render();
}
async function save(){
 if(!pending.size){alert('Click a resident row first.');return;}
 const button=document.getElementById('saveChanges');button.disabled=true;button.textContent='Saving…';
 try{
  for(const [id,done] of pending){
   const payload={has_voted:done,voted_at:done?new Date().toISOString():null};
   const {error}=await db.from(table).update(payload).eq('id',Number(id));if(error)throw error;
   const r=rows.find(x=>String(x.id)===id);r.has_voted=done;r.voted_at=payload.voted_at;
  }
  pending.clear();render();alert('Saved to Supabase.');
 }catch(error){console.error(error);alert(`Could not save: ${error.message}`)}finally{button.disabled=false;button.textContent='Save Changes'}
}
document.addEventListener('click',e=>{const row=e.target.closest('tr[data-id]');if(row)toggle(row.dataset.id);if(e.target.closest('#saveChanges'))save()});
document.getElementById('partyFilter').addEventListener('change',render);
document.getElementById('searchInput').addEventListener('input',render);
load().catch(error=>document.getElementById('residentRows').innerHTML=`<tr><td colspan="10">${esc(error.message)}</td></tr>`);
})();