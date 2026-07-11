(() => {
  'use strict';

  function openResidentFromPhoto(event) {
    const photo = event.target.closest('.avatar-image, .resident-photo');
    if (!photo) return;

    const container = photo.closest('tr, .resident-gallery-card, .record-card');
    const editButton = container?.querySelector('[data-edit-id]');
    if (!editButton) return;

    event.preventDefault();
    editButton.click();
  }

  function loadExportTools() {
    if (document.querySelector('script[data-export-tools]')) return;
    const script = document.createElement('script');
    script.src = 'js/export-tools.js?v=1';
    script.dataset.exportTools = 'true';
    script.defer = true;
    document.head.appendChild(script);
  }

  document.addEventListener('click', openResidentFromPhoto, true);
  document.addEventListener('DOMContentLoaded', loadExportTools, { once: true });
})();
