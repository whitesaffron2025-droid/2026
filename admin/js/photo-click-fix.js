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

  document.addEventListener('click', openResidentFromPhoto, true);
})();