(() => {
  'use strict';
  const root = document.getElementById('previewRoot');
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function render(payload) {
    const filters = Object.entries(payload.filters || {}).map(([k,v]) => `<span><strong>${esc(k)}:</strong> ${esc(v || 'None')}</span>`).join('');
    const listRows = payload.rows.map(r => `<tr><td>${esc(r.id)}</td><td>${r.photo ? `<img src="${esc(r.photo)}" alt="${esc(r.name || 'Resident')}">` : '<span class="preview-photo-empty">?</span>'}</td><td>${esc(r.idNumber || '-')}</td><td><strong>${esc(r.name || 'No name')}</strong>${r.assignees ? `<span class="assignment">Assigned: ${esc(r.assignees)}</span>` : ''}</td><td>${esc(r.address || '-')}</td><td>${esc(r.livingNow || 'Not recorded')}</td><td>${esc(r.mobile || '-')}</td><td>${esc(r.sex || '-')}</td><td>${esc(r.age || '-')}</td><td>${esc(r.campaignVote || 'Not Decided')}</td><td><span class="status ${r.turnout === 'Voted' ? 'voted' : 'not-yet'}">${esc(r.turnout || 'Not Yet')}</span></td></tr>`).join('');
    const cards = payload.rows.map(r => `<article class="preview-gallery-card ${r.turnout === 'Voted' ? 'voted-card' : ''}"><div class="preview-gallery-photo">${r.photo ? `<img src="${esc(r.photo)}" alt="${esc(r.name || 'Resident')}">` : '<span>?</span>'}</div><div class="preview-gallery-body"><h3>${esc(r.name || 'No name')}</h3>${r.assignees ? `<small class="assignment">Assigned: ${esc(r.assignees)}</small>` : ''}<dl><div><dt>ID</dt><dd>${esc(r.id)}</dd></div><div><dt>ID Number</dt><dd>${esc(r.idNumber || '-')}</dd></div><div><dt>Official Address</dt><dd>${esc(r.address || '-')}</dd></div><div><dt>Living Now</dt><dd>${esc(r.livingNow || 'Not recorded')}</dd></div><div><dt>Mobile</dt><dd>${esc(r.mobile || '-')}</dd></div><div><dt>Sex / Age</dt><dd>${esc(r.sex || '-')} / ${esc(r.age || '-')}</dd></div><div><dt>Campaign Vote</dt><dd>${esc(r.campaignVote || 'Not Decided')}</dd></div></dl><span class="status ${r.turnout === 'Voted' ? 'voted' : 'not-yet'}">${esc(r.turnout || 'Not Yet')}</span></div></article>`).join('');
    root.innerHTML = `<div class="preview-head"><div><h1>PNC · Vilimale Dhaaira Turnout</h1><div class="muted">Public share generated ${esc(payload.generated)}</div></div><div class="preview-actions"><button class="secondary" id="shareBtn">Share Link</button><button class="primary" id="printBtn">Print</button></div></div><div class="preview-stats"><div class="preview-card"><strong>${esc(payload.counts.visible)}</strong><span>Visible</span></div><div class="preview-card"><strong>${esc(payload.counts.voted)}</strong><span>Voted</span></div><div class="preview-card"><strong>${esc(payload.counts.notYet)}</strong><span>Not Yet</span></div><div class="preview-card"><strong>${esc(payload.counts.total)}</strong><span>PNC Total</span></div></div><div class="preview-filters">${filters}</div><div class="preview-view-bar"><strong>Resident View</strong><div class="preview-view-toggle"><button id="previewGalleryBtn" class="active">Gallery</button><button id="previewListBtn">List</button></div></div><div id="previewGallery" class="preview-gallery">${cards}</div><div id="previewList" class="preview-table-wrap" hidden><table class="preview-table"><thead><tr><th>ID</th><th>Photo</th><th>ID Number</th><th>Name</th><th>Official Address</th><th>Living Now</th><th>Mobile</th><th>Sex</th><th>Age</th><th>Campaign Vote</th><th>Turnout</th></tr></thead><tbody>${listRows}</tbody></table></div><div class="preview-footer">Public read-only link. No database changes can be made here.</div>`;
    const gallery = document.getElementById('previewGallery');
    const list = document.getElementById('previewList');
    document.getElementById('previewGalleryBtn').onclick = () => { gallery.hidden = false; list.hidden = true; };
    document.getElementById('previewListBtn').onclick = () => { gallery.hidden = true; list.hidden = false; };
    document.getElementById('printBtn').onclick = () => window.print();
    document.getElementById('shareBtn').onclick = async () => {
      if (navigator.share) { try { await navigator.share({ title: 'PNC Live Turnout', url: location.href }); } catch (_) {} }
      else { try { await navigator.clipboard.writeText(location.href); alert('Public link copied.'); } catch (_) { alert(location.href); } }
    };
  }

  async function load() {
    const token = new URLSearchParams(location.search).get('s');
    if (!token) throw new Error('Missing share token');
    const cfg = window.CampaignConfig;
    const db = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseKey);
    const { data, error } = await db.rpc('get_live_turnout_share', { p_token: token });
    if (error) throw error;
    if (!data || !Array.isArray(data.rows)) throw new Error('Share unavailable');
    render(data);
  }

  load().catch(error => {
    console.error(error);
    root.innerHTML = '<div class="preview-empty"><h2>Public link is unavailable</h2><p>The link may be invalid or expired. Create a new link from the Live page.</p></div>';
  });
})();