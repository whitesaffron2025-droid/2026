/* MODULE: Filter + Export Layout | VERSION: 1.0.0 */
(() => {
  'use strict';

  let frame = 0;

  function applyLayout() {
    const filterBar = document.querySelector('.filter-bar');
    const tools = document.getElementById('sectionExportTools');
    if (!filterBar || !tools) return;

    if (tools.parentElement !== filterBar) filterBar.appendChild(tools);

    filterBar.style.display = 'flex';
    filterBar.style.flexWrap = 'wrap';
    filterBar.style.alignItems = 'end';
    filterBar.style.gap = '12px';

    tools.style.display = 'flex';
    tools.style.flexWrap = 'wrap';
    tools.style.gap = '8px';
    tools.style.alignItems = 'center';
    tools.style.marginLeft = 'auto';
    tools.style.paddingTop = '18px';

    tools.querySelectorAll('button').forEach(button => {
      button.style.minHeight = '38px';
      button.style.whiteSpace = 'nowrap';
    });

    if (!document.getElementById('filterExportResponsiveStyle')) {
      const style = document.createElement('style');
      style.id = 'filterExportResponsiveStyle';
      style.textContent = `
        .filter-bar > label { flex: 1 1 190px; min-width: 170px; }
        .filter-bar > button:not(#sectionExportTools button) { flex: 0 1 220px; }
        #sectionExportTools { flex: 0 1 auto; }
        @media (max-width: 760px) {
          .filter-bar { align-items: stretch !important; }
          .filter-bar > label,
          .filter-bar > button,
          #sectionExportTools { flex: 1 1 100% !important; width: 100%; }
          #sectionExportTools { margin-left: 0 !important; padding-top: 0 !important; }
          #sectionExportTools button { flex: 1 1 calc(50% - 8px); }
        }
      `;
      document.head.appendChild(style);
    }
  }

  function schedule() {
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      applyLayout();
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true });
    schedule();
  });
})();