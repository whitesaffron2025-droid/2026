/* MODULE: Resident Database ID Display | VERSION: 1.0.0 */
(() => {
  'use strict';

  let queued = false;

  function text(value) {
    return String(value ?? '').trim();
  }

  function residentFor(id) {
    return window.CampaignApp?.state?.rows?.find(
      row => String(row.id) === String(id)
    );
  }

  function idLine(id, nationalId) {
    return `<small class="resident-db-id"><strong>DB ID:</strong> ${text(id)} · <strong>National ID:</strong> ${text(nationalId) || 'No ID'}</small>`;
  }

  function applyToResidentsList() {
    if (window.CampaignApp?.state?.section !== 'residents') return;

    document.querySelectorAll('.data-table tbody tr').forEach(row => {
      const edit = row.querySelector('[data-edit-section="residents"][data-edit-id]');
      if (!edit) return;

      const resident = residentFor(edit.dataset.editId);
      const nameCell = row.querySelectorAll('td')[1];
      if (!resident || !nameCell) return;

      nameCell.querySelector('.resident-db-id')?.remove();
      const oldNationalId = [...nameCell.querySelectorAll('small')].find(
        node => !node.classList.contains('resident-db-id') &&
          text(node.textContent) === text(resident.national_id)
      );
      oldNationalId?.remove();
      nameCell.insertAdjacentHTML(
        'beforeend',
        `<br>${idLine(resident.id, resident.national_id)}`
      );
    });
  }

  function applyToResidentGallery() {
    if (window.CampaignApp?.state?.section !== 'residents') return;

    document.querySelectorAll('.resident-gallery-card').forEach(card => {
      const edit = card.querySelector('[data-edit-section="residents"][data-edit-id]');
      if (!edit) return;

      const resident = residentFor(edit.dataset.editId);
      const body = card.querySelector('.resident-gallery-body');
      if (!resident || !body) return;

      body.querySelector('.resident-db-id')?.remove();
      const oldId = body.querySelector('.resident-id');
      if (oldId) oldId.innerHTML = `<strong>DB ID:</strong> ${text(resident.id)} · <strong>National ID:</strong> ${text(resident.national_id) || 'No ID'}`;
      else body.querySelector('h3')?.insertAdjacentHTML('afterend', idLine(resident.id, resident.national_id));
    });
  }

  function applyToAssignList() {
    if (window.CampaignApp?.state?.section !== 'assign') return;

    document.querySelectorAll('.data-table tbody tr').forEach(row => {
      const edit = row.querySelector('[data-edit-section="assign"][data-edit-id]');
      if (!edit) return;

      const resident = residentFor(edit.dataset.editId);
      const nameCell = row.querySelectorAll('td')[1];
      if (!resident || !nameCell) return;

      nameCell.querySelector('.resident-db-id')?.remove();
      const oldNationalId = [...nameCell.querySelectorAll('small')].find(
        node => !node.classList.contains('resident-db-id') &&
          text(node.textContent) === text(resident.national_id)
      );
      oldNationalId?.remove();
      nameCell.insertAdjacentHTML(
        'beforeend',
        `<br>${idLine(resident.id, resident.national_id)}`
      );
    });
  }

  function apply() {
    if (!document.getElementById('residentDbIdStyle')) {
      const style = document.createElement('style');
      style.id = 'residentDbIdStyle';
      style.textContent = '.resident-db-id{display:inline-block;margin-top:4px;color:#64748b;font-size:12px;line-height:1.35}.resident-db-id strong{color:#334155}';
      document.head.appendChild(style);
    }

    applyToResidentsList();
    applyToResidentGallery();
    applyToAssignList();
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
    const root = document.getElementById('adminApp') || document.body;
    new MutationObserver(queueApply).observe(root, {
      childList: true,
      subtree: true
    });
    queueApply();
  });
})();
