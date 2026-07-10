(() => {
  'use strict';
  const cfg = window.CampaignConfig;
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const text = value => String(value ?? '').trim();
  const officialAddress = row => text(row.house) || 'No Address';
  const livingNow = row => text(row.living_place) || text(row.lives_in) || 'Not recorded';
  let residents = [];

  function photo(row) {
    if (text(row.photo_url)) return `<div class="resident-photo"><img src="${esc(row.photo_url)}" alt="" loading="lazy"></div>`;
    return `<div class="resident-photo">${esc((text(row.name)[0] || '?').toUpperCase())}</div>`;
  }

  function card(row) {
    return `<article class="resident-card">${photo(row)}<div class="resident-info"><h3>${esc(text(row.name) || 'No name')}</h3><p class="resident-id">ID: ${esc(text(row.national_id) || 'Not recorded')}</p><p class="resident-address">Official address: ${esc(officialAddress(row))}</p><p class="resident-address">Living now: ${esc(livingNow(row))}</p></div></article>`;
  }

  function render(query = '') {
    const q = query.trim().toLowerCase();
    const filtered = residents.filter(row => [row.name,row.national_id,officialAddress(row),livingNow(row)].map(text).join(' ').toLowerCase().includes(q));
    const groups = {};
    filtered.forEach(row => { const key = officialAddress(row); if (!groups[key]) groups[key] = []; groups[key].push(row); });
    const addresses = Object.keys(groups).sort((a,b) => a.localeCompare(b, undefined, {numeric:true}));
    document.getElementById('residentCount').textContent = `${filtered.length.toLocaleString()} residents`;
    document.getElementById('residentGroups').innerHTML = addresses.length ? addresses.map(address => {
      const rows = groups[address].sort((a,b) => text(a.name).localeCompare(text(b.name)));
      return `<section class="address-group"><header class="address-heading"><h2>${esc(address)}</h2><span>${rows.length}</span></header><div class="resident-list">${rows.map(card).join('')}</div></section>`;
    }).join('') : '<div class="empty-state">No residents found.</div>';
  }

  async function load() {
    if (!cfg || !cfg.supabaseUrl || !cfg.supabaseKey || !window.supabase) {
      document.getElementById('residentGroups').innerHTML = '<div class="empty-state">Public database configuration is unavailable.</div>';
      return;
    }
    const db = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseKey, {auth:{persistSession:false,autoRefreshToken:false}});
    const rows = [];
    let from = 0;
    const size = Number(cfg.batchSize || 1000);
    while (true) {
      const result = await db.from(cfg.tableName).select('id,photo_url,name,national_id,house,living_place,lives_in').order('house',{ascending:true,nullsFirst:false}).order('name',{ascending:true,nullsFirst:false}).range(from,from+size-1);
      if (result.error) {
        document.getElementById('residentGroups').innerHTML = `<div class="empty-state">Unable to load residents: ${esc(result.error.message)}</div>`;
        document.getElementById('residentCount').textContent = 'Unavailable';
        return;
      }
      rows.push(...(result.data || []));
      if (!result.data || result.data.length < size) break;
      from += size;
    }
    residents = rows;
    render();
  }

  document.addEventListener('DOMContentLoaded', () => {
    const search = document.getElementById('publicSearch');
    document.getElementById('clearPublicSearch').addEventListener('click', () => { search.value=''; render(); search.focus(); });
    search.addEventListener('input', () => render(search.value));
    load();
  });
})();