/* Live Assignee Display v1.0.0 */
(() => {
  'use strict';

  let queued = false;

  function enhance() {
    document.querySelectorAll('#residentRows tr[data-resident-id]').forEach(row => {
      const nameCell = row.querySelectorAll('td')[3];
      if (!nameCell) return;

      const existing = nameCell.querySelector('.assignment-note');
      let names = [];
      if (existing) {
        names = existing.textContent
          .replace(/^Assigned:\s*/i, '')
          .split(',')
          .map(name => name.trim())
          .filter(Boolean);
        existing.remove();
      }

      nameCell.querySelector('.live-assignee-block')?.remove();
      const block = document.createElement('div');
      block.className = `live-assignee-block ${names.length ? 'is-assigned' : 'is-unassigned'}`;

      if (names.length) {
        block.innerHTML = `<span class="live-assignee-label">Assigned</span><ul>${names.map(name => `<li>${escapeHtml(name)}</li>`).join('')}</ul>`;
      } else {
        block.innerHTML = '<span class="live-assignee-label">Unassigned</span>';
      }

      nameCell.appendChild(block);
    });
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, char => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[char]));
  }

  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      enhance();
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    const body = document.getElementById('residentRows');
    if (!body) return;
    new MutationObserver(schedule).observe(body, { childList: true, subtree: true });
    schedule();
  });
})();
