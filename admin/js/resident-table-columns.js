/* MODULE: Resident Table Columns | VERSION: 1.0.0 */
(() => {
  'use strict';

  function text(value) {
    return String(value ?? '').trim();
  }

  function residentById(id) {
    return window.CampaignApp?.state?.rows?.find(
      row => String(row.id) === String(id)
    );
  }

  function applyResidentColumns() {
    const app = window.CampaignApp;
    if (!app?.state || app.state.section !== 'residents') return;

    const table = document.querySelector('#pageContent .data-table');
    if (!table || table.dataset.standardResidentColumns === '1') return;

    const headerRow = table.querySelector('thead tr');
    if (headerRow) {
      headerRow.innerHTML = [
        'ID',
        'Photo',
        'ID Number',
        'Name',
        'Official Address',
        'Living Now',
        'Mobile',
        'Sex',
        'Age',
        'Action'
      ].map(label => `<th>${label}</th>`).join('');
    }

    table.querySelectorAll('tbody tr').forEach(row => {
      const edit = row.querySelector('[data-edit-section="residents"][data-edit-id]');
      if (!edit) return;

      const resident = residentById(edit.dataset.editId);
      const cells = [...row.children];
      if (!resident || cells.length < 8) return;

      const [photoCell, , addressCell, livingCell, mobileCell, sexCell, ageCell, actionCell] = cells;

      const idCell = document.createElement('td');
      idCell.textContent = text(resident.id);

      const nationalIdCell = document.createElement('td');
      nationalIdCell.textContent = text(resident.national_id) || '-';

      const nameCell = document.createElement('td');
      nameCell.innerHTML = `<strong>${text(resident.name) || 'No name'}</strong>`;

      row.replaceChildren(
        idCell,
        photoCell,
        nationalIdCell,
        nameCell,
        addressCell,
        livingCell,
        mobileCell,
        sexCell,
        ageCell,
        actionCell
      );
    });

    table.dataset.standardResidentColumns = '1';
  }

  function scheduleApply() {
    requestAnimationFrame(applyResidentColumns);
  }

  document.addEventListener('DOMContentLoaded', () => {
    const pageContent = document.getElementById('pageContent');
    if (pageContent) {
      new MutationObserver(scheduleApply).observe(pageContent, {
        childList: true,
        subtree: false
      });
    }

    document.addEventListener('click', event => {
      if (
        event.target.closest('[data-resident-view]') ||
        event.target.closest('#loadMore') ||
        event.target.closest('[data-section]')
      ) {
        setTimeout(scheduleApply, 0);
      }
    });

    document.addEventListener('change', event => {
      if (event.target.id === 'globalParty' || event.target.dataset.filter) {
        setTimeout(scheduleApply, 0);
      }
    });

    document.addEventListener('input', event => {
      if (event.target.id === 'searchInput') {
        setTimeout(scheduleApply, 0);
      }
    });

    scheduleApply();
  });
})();
