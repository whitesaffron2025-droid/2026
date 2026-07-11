(() => {
  'use strict';
  const root = document.getElementById('previewRoot');
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[char]));
  const normalized = value => String(value || '').trim().toLowerCase();

  function render(payload) {
    const publicRows = (payload.rows || []).filter(row => normalized(row.address) !== 'dhafthar');
    const publicFilters = Object.entries(payload.filters || {})
      .filter(([label]) => normalized(label) !== 'assignment');
    const filters = publicFilters
      .map(([label, value]) => `<span><strong>${esc(label)}:</strong> ${esc(value || 'None')}</span>`)
      .join('');

    const votedCount = publicRows.filter(row => row.turnout === 'Voted').length;
    const notYetCount = publicRows.length - votedCount;

    const listRows = publicRows.map(row => `<tr>
      <td>${esc(row.id)}</td>
      <td>${row.photo ? `<img src="${esc(row.photo)}" alt="${esc(row.name || 'Resident')}">` : '<span class="preview-photo-empty">?</span>'}</td>
      <td>${esc(row.idNumber || '-')}</td>
      <td><strong>${esc(row.name || 'No name')}</strong></td>
      <td>${esc(row.address || '-')}</td>
      <td>${esc(row.livingNow || 'Not recorded')}</td>
      <td>${esc(row.mobile || '-')}</td>
      <td>${esc(row.sex || '-')}</td>
      <td>${esc(row.age || '-')}</td>
      <td>${esc(row.campaignVote || 'Not Decided')}</td>
      <td><span class="status ${row.turnout === 'Voted' ? 'voted' : 'not-yet'}">${esc(row.turnout || 'Not Yet')}</span></td>
    </tr>`).join('');

    const cards = publicRows.map(row => `<article class="preview-gallery-card ${row.turnout === 'Voted' ? 'voted-card' : ''}">
      <div class="preview-gallery-photo">${row.photo ? `<img src="${esc(row.photo)}" alt="${esc(row.name || 'Resident')}">` : '<span>?</span>'}</div>
      <div class="preview-gallery-body">
        <h3>${esc(row.name || 'No name')}</h3>
        <dl>
          <div><dt>ID</dt><dd>${esc(row.id)}</dd></div>
          <div><dt>ID Number</dt><dd>${esc(row.idNumber || '-')}</dd></div>
          <div><dt>Official Address</dt><dd>${esc(row.address || '-')}</dd></div>
          <div><dt>Living Now</dt><dd>${esc(row.livingNow || 'Not recorded')}</dd></div>
          <div><dt>Mobile</dt><dd>${esc(row.mobile || '-')}</dd></div>
          <div><dt>Sex / Age</dt><dd>${esc(row.sex || '-')} / ${esc(row.age || '-')}</dd></div>
          <div><dt>Campaign Vote</dt><dd>${esc(row.campaignVote || 'Not Decided')}</dd></div>
        </dl>
        <span class="status ${row.turnout === 'Voted' ? 'voted' : 'not-yet'}">${esc(row.turnout || 'Not Yet')}</span>
      </div>
    </article>`).join('');

    root.innerHTML = `<div class="preview-head">
      <div><h1>PNC · Vilimale Dhaaira Turnout</h1><div class="muted">Public share generated ${esc(payload.generated)}</div></div>
      <div class="preview-actions"><button class="secondary" id="shareBtn">Share Link</button><button class="primary" id="printBtn">Print</button></div>
    </div>
    <div class="preview-stats">
      <div class="preview-card"><strong>${publicRows.length}</strong><span>Visible</span></div>
      <div class="preview-card"><strong>${votedCount}</strong><span>Voted</span></div>
      <div class="preview-card"><strong>${notYetCount}</strong><span>Not Yet</span></div>
      <div class="preview-card"><strong>${publicRows.length}</strong><span>PNC Share Total</span></div>
    </div>
    <div class="preview-filters">${filters}</div>
    <div class="preview-view-bar"><strong>Resident View</strong><div class="preview-view-toggle"><button id="previewGalleryBtn" class="active">Gallery</button><button id="previewListBtn">List</button></div></div>
    <div id="previewGallery" class="preview-gallery">${cards || '<div class="preview-empty">No residents available in this public share.</div>'}</div>
    <div id="previewList" class="preview-table-wrap" hidden><table class="preview-table"><thead><tr><th>ID</th><th>Photo</th><th>ID Number</th><th>Name</th><th>Official Address</th><th>Living Now</th><th>Mobile</th><th>Sex</th><th>Age</th><th>Campaign Vote</th><th>Turnout</th></tr></thead><tbody>${listRows}</tbody></table></div>
    <div class="preview-footer">Public read-only link. Dhafthar and assignment details are excluded.</div>`;

    const gallery = document.getElementById('previewGallery');
    const list = document.getElementById('previewList');
    document.getElementById('previewGalleryBtn').onclick = () => { gallery.hidden = false; list.hidden = true; };
    document.getElementById('previewListBtn').onclick = () => { gallery.hidden = true; list.hidden = false; };
    document.getElementById('printBtn').onclick = () => window.print();
    document.getElementById('shareBtn').onclick = async () => {
      if (navigator.share) {
        try { await navigator.share({ title: 'PNC Live Turnout', url: location.href }); } catch (_) {}
      } else {
        try { await navigator.clipboard.writeText(location.href); alert('Public link copied.'); }
        catch (_) { alert(location.href); }
      }
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