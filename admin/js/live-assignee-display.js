/* Live Assignee Display v1.1.0 */
(() => {
  'use strict';

  let queued = false;

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, char => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[char]));
  }

  function enhance() {
    document.querySelectorAll('#residentRows tr[data-resident-id]').forEach(row => {
      const nameCell = row.querySelectorAll('td')[3];
      if (!nameCell) return;

      const source = nameCell.querySelector('.assignment-note');
      const names = source
        ? source.textContent
            .replace(/^Assigned:\s*/i, '')
            .split(',')
            .map(name => name.trim())
            .filter(Boolean)
        : [];

      if (source) source.hidden = true;

      const signature = names.join('|').toLowerCase();
      let block = nameCell.querySelector('.live-assignee-block');
      if (block?.dataset.signature === signature) return;

      if (!block) {
        block = document.createElement('div');
        block.className = 'live-assignee-block';
        nameCell.appendChild(block);
      }

      block.dataset.signature = signature;
      block.className = `live-assignee-block ${names.length ? 'is-assigned' : 'is-unassigned'}`;
      block.innerHTML = names.length
        ? `<span class="live-assignee-label">Assigned</span><ul>${names.map(name => `<li>${escapeHtml(name)}</li>`).join('')}</ul>`
        : '<span class="live-assignee-label">Unassigned</span>';
    });
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