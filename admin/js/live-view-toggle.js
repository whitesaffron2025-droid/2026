/* Live Gallery/List View v1.0.0 */
(() => {
  'use strict';

  const tableWrap = document.querySelector('.live-table-wrap');
  const tbody = document.getElementById('residentRows');
  const gallery = document.getElementById('liveGallery');
  const listButton = document.getElementById('liveListView');
  const galleryButton = document.getElementById('liveGalleryView');
  if (!tableWrap || !tbody || !gallery || !listButton || !galleryButton) return;

  let currentView = localStorage.getItem('pncLiveView') || 'list';

  function cellText(cells, index) {
    return cells[index]?.textContent?.replace(/\s+/g, ' ').trim() || '-';
  }

  function rebuildGallery() {
    const rows = [...tbody.querySelectorAll('tr[data-resident-id]')];
    if (!rows.length) {
      gallery.innerHTML = '<div class="live-gallery-empty">No PNC residents found for these filters</div>';
      return;
    }

    gallery.innerHTML = rows.map(row => {
      const cells = row.querySelectorAll('td');
      const image = cells[1]?.querySelector('img');
      const emptyAvatar = cells[1]?.querySelector('.avatar-empty');
      const nameCell = cells[3];
      const name = nameCell?.querySelector('strong')?.textContent?.trim() || 'No name';
      const assignment = nameCell?.querySelector('.assignment-note')?.textContent?.trim() || '';
      const voteButton = cells[9]?.querySelector('[data-toggle-vote]');
      const photo = image
        ? `<img src="${image.src}" alt="${name.replace(/"/g, '&quot;')}">`
        : `<span class="gallery-avatar-empty">${emptyAvatar?.textContent?.trim() || '?'}</span>`;
      const status = voteButton ? voteButton.outerHTML : '';

      return `<article class="live-gallery-card ${row.classList.contains('voted-row') ? 'voted-card' : ''} ${row.classList.contains('pending-row') ? 'pending-card' : ''}">
        <div class="gallery-photo">${photo}</div>
        <div class="gallery-body">
          <h3>${name}</h3>
          ${assignment ? `<small class="assignment-note">${assignment}</small>` : ''}
          <dl>
            <div><dt>ID</dt><dd>${cellText(cells, 0)}</dd></div>
            <div><dt>ID Number</dt><dd>${cellText(cells, 2)}</dd></div>
            <div><dt>Official Address</dt><dd>${cellText(cells, 4)}</dd></div>
            <div><dt>Living Now</dt><dd>${cellText(cells, 5)}</dd></div>
            <div><dt>Mobile</dt><dd>${cellText(cells, 6)}</dd></div>
            <div><dt>Sex / Age</dt><dd>${cellText(cells, 7)} / ${cellText(cells, 8)}</dd></div>
          </dl>
          <div class="gallery-status">${status}</div>
        </div>
      </article>`;
    }).join('');
  }

  function applyView(view) {
    currentView = view === 'gallery' ? 'gallery' : 'list';
    localStorage.setItem('pncLiveView', currentView);
    const isGallery = currentView === 'gallery';
    tableWrap.hidden = isGallery;
    gallery.hidden = !isGallery;
    galleryButton.classList.toggle('active', isGallery);
    listButton.classList.toggle('active', !isGallery);
    galleryButton.setAttribute('aria-pressed', isGallery ? 'true' : 'false');
    listButton.setAttribute('aria-pressed', isGallery ? 'false' : 'true');
    if (isGallery) rebuildGallery();
  }

  listButton.addEventListener('click', () => applyView('list'));
  galleryButton.addEventListener('click', () => applyView('gallery'));
  new MutationObserver(() => {
    if (currentView === 'gallery') rebuildGallery();
  }).observe(tbody, { childList: true, subtree: true });

  applyView(currentView);
})();