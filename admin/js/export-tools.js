/* MODULE: Standard Section Export | VERSION: 2.0.0 */
(() => {
  'use strict';

  const text = value => String(value ?? '').trim();
  let scheduled = false;

  function currentSectionTitle() {
    return text(document.querySelector('.page-head h1')?.textContent) ||
      text(document.querySelector('.md-goal') ? 'Dashboard' : '') ||
      'Campaign Summary';
  }

  function summaryRows() {
    return [...document.querySelectorAll('.stats-grid .stat-card')]
      .map(card => ({
        metric: text(card.querySelector('span')?.textContent),
        value: text(card.querySelector('strong')?.textContent)
      }))
      .filter(row => row.metric && row.value);
  }

  function activeFilters() {
    const filters = [];
    const party = document.getElementById('globalParty');
    if (party?.selectedOptions?.[0]) {
      filters.push(['Party', text(party.selectedOptions[0].textContent)]);
    }

    document.querySelectorAll('.filter-bar label').forEach(label => {
      const name = text(label.childNodes[0]?.textContent);
      const control = label.querySelector('select,input');
      if (!name || !control) return;

      const value = control.tagName === 'SELECT'
        ? text(control.selectedOptions?.[0]?.textContent)
        : text(control.value);

      if (!value || /^all\b/i.test(value)) return;
      filters.push([name, value]);
    });

    return filters;
  }

  function filename() {
    const section = currentSectionTitle()
      .replace(/[^a-z0-9]+/gi, '-')
      .replace(/^-|-$/g, '') || 'summary';
    return `${section}-export-${new Date().toISOString().slice(0, 10)}.csv`;
  }

  function csvCell(value) {
    return `"${String(value ?? '').replace(/"/g, '""')}"`;
  }

  function downloadCsv() {
    const rows = summaryRows();
    if (!rows.length) {
      alert('No section summary is available to export.');
      return;
    }

    const filters = activeFilters();
    const csv = [
      ['Export Type', 'Filtered section summary'],
      ['Section', currentSectionTitle()],
      ['Generated', new Date().toLocaleString('en-GB')],
      ...filters.map(([name, value]) => [`Filter: ${name}`, value]),
      [],
      ['Metric', 'Value'],
      ...rows.map(row => [row.metric, row.value])
    ].map(row => row.map(csvCell).join(',')).join('\n');

    const url = URL.createObjectURL(
      new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' })
    );
    const link = document.createElement('a');
    link.href = url;
    link.download = filename();
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function removeOldExportControls() {
    document.querySelectorAll(
      '[data-summary-export], [data-export], .export-button, .export-btn, #exportButton, #exportCsv, #printSummary, #shareSummary'
    ).forEach(control => {
      if (control.id !== 'standardSectionExport') control.remove();
    });

    document.querySelectorAll('button, a').forEach(control => {
      if (control.id === 'standardSectionExport') return;
      const label = text(control.textContent).toLowerCase();
      if (
        label === 'export summary' ||
        label === 'print summary' ||
        label === 'share summary' ||
        label === 'export csv' ||
        label === 'export filtered'
      ) {
        control.remove();
      }
    });
  }

  function addStandardButton() {
    removeOldExportControls();

    const filterBar = document.querySelector('.filter-bar');
    const pageHead = document.querySelector('.page-head');
    const host = filterBar || pageHead;
    if (!host || document.getElementById('sectionExportTools')) return;

    const tools = document.createElement('div');
    tools.id = 'sectionExportTools';
    tools.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-left:auto';
    tools.innerHTML = '<button id="standardSectionExport" type="button" class="btn primary">Export CSV</button>';
    host.appendChild(tools);
  }

  function scheduleToolbar() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      addStandardButton();
    });
  }

  document.addEventListener('click', event => {
    if (event.target.closest('#standardSectionExport')) downloadCsv();
  });

  document.addEventListener('DOMContentLoaded', () => {
    new MutationObserver(scheduleToolbar).observe(document.body, {
      childList: true,
      subtree: true
    });
    scheduleToolbar();
  });
})();
