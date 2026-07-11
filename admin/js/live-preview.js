(() => {
  'use strict';

  const root = document.getElementById('previewRoot');
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[char]));

  let payload = null;
  try {
    payload = JSON.parse(sessionStorage.getItem('pncLiveSharePreview') || 'null');
  } catch (error) {
    console.error('Preview data parse failed:', error);
  }

  if (!payload || !Array.isArray(payload.rows)) {
    root.innerHTML = '<div class="preview-empty"><h2>Preview data is unavailable</h2><p>Return to the Live page and click Share Preview again.</p><a class="secondary" href="live.html">Back to Live</a></div>';
    return;
  }

  const filtersHtml = Object.entries(payload.filters || {})
    .map(([label, value]) => `<span><strong>${esc(label)}:</strong> ${esc(value || 'None')}</span>`)
    .join('');

  const listRows = payload.rows.map(row => `<tr>
    <td>${esc(row.id)}</td>
    <td>${row.photo ? `<img src="${esc(row.photo)}" alt="${esc(row.name || 'Resident')}">` : '<span class="preview-photo-empty">?</span>'}</td>
    <td>${esc(row.idNumber || '-')}</td>
    <td><strong>${esc(row.name || 'No name')}</strong>${row.assignees ? `<span class="assignment">Assigned: ${esc(row.assignees)}</span>` : ''}</td>
    <td>${esc(row.address || '-')}</td>
    <td>${esc(row.livingNow || 'Not recorded')}</td>
    <td>${esc(row.mobile || '-')}</td>
    <td>${esc(row.sex || '-')}</td>
    <td>${esc(row.age || '-')}</td>
    <td>${esc(row.campaignVote || 'Not Decided')}</td>
    <td><span class="status ${row.turnout === 'Voted' ? 'voted' : 'not-yet'}">${esc(row.turnout || 'Not Yet')}</span></td>
  </tr>`).join('');

  const galleryCards = payload.rows.map(row => `<article class="preview-gallery-card ${row.turnout === 'Voted' ? 'voted-card' : ''}">
    <div class="preview-gallery-photo">${row.photo ? `<img src="${esc(row.photo)}" alt="${esc(row.name || 'Resident')}">` : '<span>?</span>'}</div>
    <div class="preview-gallery-body">
      <h3>${esc(row.name || 'No name')}</h3>
      ${row.assignees ? `<small class="assignment">Assigned: ${esc(row.assignees)}</small>` : ''}
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
    <div><h1>PNC · Vilimale Dhaaira Turnout</h1><div class="muted">Share preview generated ${esc(payload.generated)}</div></div>
    <div class="preview-actions"><a class="secondary" href="live.html">Back</a><button class="secondary" id="shareBtn">Share</button><button class="primary" id="printBtn">Print</button></div>
  </div>
  <div class="preview-stats">
    <div class="preview-card"><strong>${esc(payload.counts.visible)}</strong><span>Visible</span></div>
    <div class="preview-card"><strong>${esc(payload.counts.voted)}</strong><span>Voted</span></div>
    <div class="preview-card"><strong>${esc(payload.counts.notYet)}</strong><span>Not Yet</span></div>
    <div class="preview-card"><strong>${esc(payload.counts.total)}</strong><span>PNC Total</span></div>
  </div>
  <div class="preview-filters">${filtersHtml}</div>
  <div class="preview-view-bar"><strong>Resident View</strong><div class="preview-view-toggle"><button id="previewGalleryBtn" class="active" aria-pressed="true">Gallery</button><button id="previewListBtn" aria-pressed="false">List</button></div></div>
  <div id="previewGallery" class="preview-gallery">${galleryCards}</div>
  <div id="previewList" class="preview-table-wrap" hidden><table class="preview-table"><thead><tr><th>ID</th><th>Photo</th><th>ID Number</th><th>Name</th><th>Official Address</th><th>Living Now</th><th>Mobile</th><th>Sex</th><th>Age</th><th>Campaign Vote</th><th>Turnout</th></tr></thead><tbody>${listRows}</tbody></table></div>
  <div class="preview-footer">Read-only preview. No database changes can be made here.</div>`;

  const gallery = document.getElementById('previewGallery');
  const list = document.getElementById('previewList');
  const galleryBtn = document.getElementById('previewGalleryBtn');
  const listBtn = document.getElementById('previewListBtn');

  function setView(view) {
    const isGallery = view === 'gallery';
    gallery.hidden = !isGallery;
    list.hidden = isGallery;
    galleryBtn.classList.toggle('active', isGallery);
    listBtn.classList.toggle('active', !isGallery);
    galleryBtn.setAttribute('aria-pressed', isGallery ? 'true' : 'false');
    listBtn.setAttribute('aria-pressed', isGallery ? 'false' : 'true');
  }

  galleryBtn.addEventListener('click', () => setView('gallery'));
  listBtn.addEventListener('click', () => setView('list'));

  const summaryText = `PNC Live Turnout — ${payload.counts.visible} visible residents. Voted: ${payload.counts.voted}. Not Yet: ${payload.counts.notYet}. Total: ${payload.counts.total}.`;
  document.getElementById('printBtn').addEventListener('click', () => window.print());
  document.getElementById('shareBtn').addEventListener('click', async () => {
    if (navigator.share) {
      try { await navigator.share({ title: 'PNC Live Turnout', text: summaryText }); } catch (_) {}
      return;
    }
    try {
      await navigator.clipboard.writeText(summaryText);
      alert('Summary copied to clipboard.');
    } catch (_) {
      alert(summaryText);
    }
  });
})();