/* MODULE: Stable Resident Database ID Display | VERSION: 2.0.0 */
(() => {
  'use strict';

  let queued = false;

  const text = value => String(value ?? '').trim();

  function residentFor(id) {
    return window.CampaignApp?.state?.rows?.find(
      row => String(row.id) === String(id)
    );
  }

  function makeLine(resident) {
    const line = document.createElement('small');
    line.className = 'resident-db-id';
    line.dataset.residentDbId = String(resident.id);
    line.textContent = `DB ID: ${resident.id} · National ID: ${text(resident.national_id) || 'No ID'}`;
    return line;
  }

  function applyListRows(section) {
    document.querySelectorAll('#pageContent .data-table tbody tr').forEach(row => {
      const edit = row.querySelector(`[data-edit-section="${section}"][data-edit-id]`);
      if (!edit) return;

      const resident = residentFor(edit.dataset.editId);
      const nameCell = row.querySelectorAll('td')[1];
      if (!resident || !nameCell) return;

      if (nameCell.querySelector(`[data-resident-db-id="${resident.id}"]`)) return;

      const oldNationalId = [...nameCell.querySelectorAll('small')].find(
        node => text(node.textContent) === text(resident.national_id)
      );
      if (oldNationalId) oldNationalId.hidden = true;

      nameCell.appendChild(document.createElement('br'));
      nameCell.appendChild(makeLine(resident));
    });
  }

  function applyGalleryCards() {
    document.querySelectorAll('#pageContent .resident-gallery-card').forEach(card => {
      const edit = card.querySelector('[data-edit-section="residents"][data-edit-id]');
      if (!edit) return;

      const resident = residentFor(edit.dataset.editId);
      const body = card.querySelector('.resident-gallery-body');
      if (!resident || !body) return;
      if (body.querySelector(`[data-resident-db-id="${resident.id}"]`)) return;

      const oldId = body.querySelector('.resident-id');
      if (oldId) oldId.hidden = true;
      body.querySelector('h3')?.insertAdjacentElement('afterend', makeLine(resident));
    });
  }

  function apply() {
    const section = window.CampaignApp?.state?.section;
    if (section !== 'residents' && section !== 'assign') return;

    if (!document.getElementById('residentDbIdStyle')) {
      const style = document.createElement('style');
      style.id = 'residentDbIdStyle';
      style.textContent = '.resident-db-id{display:inline-block;margin-top:4px;color:#64748b;font-size:12px;line-height:1.35}';
      document.head.appendChild(style);
    }

    if (section === 'residents') {
      applyListRows('residents');
      applyGalleryCards();
    } else {
      applyListRows('assign');
    }
  }

  function queueApply() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      apply();
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    const root = document.getElementById('pageContent') || document.body;
    new MutationObserver(queueApply).observe(root, {
      childList: true,
      subtree: true
    });
    queueApply();
  });
})();
