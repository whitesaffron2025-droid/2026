/* MODULE: Section Summary Export Tools | VERSION: 1.1.0 */
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
    if (party?.selectedOptions?.[0]) filters.push(['Party', text(party.selectedOptions[0].textContent)]);

    document.querySelectorAll('.filter-bar label').forEach(label => {
      const name = text(label.childNodes[0]?.textContent);
      const control = label.querySelector('select,input');
      if (!name || !control) return;
      let value = '';
      if (control.tagName === 'SELECT') value = text(control.selectedOptions?.[0]?.textContent);
      else value = text(control.value);
      if (!value || /^all\b/i.test(value)) return;
      filters.push([name, value]);
    });

    return filters;
  }

  function filename(extension) {
    const section = currentSectionTitle().replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'summary';
    return `${section}-summary-${new Date().toISOString().slice(0, 10)}.${extension}`;
  }

  function csvCell(value) {
    return `"${String(value ?? '').replace(/"/g, '""')}"`;
  }

  function downloadCsv() {
    const rows = summaryRows();
    if (!rows.length) return alert('No summary data is available to export.');
    const filters = activeFilters();
    const csv = [
      ['Export Type', 'Filtered summary only'],
      ['Section', currentSectionTitle()],
      ['Generated', new Date().toLocaleString('en-GB')],
      ...filters.map(([name, value]) => [`Filter: ${name}`, value]),
      [],
      ['Metric', 'Value'],
      ...rows.map(row => [row.metric, row.value])
    ].map(row => row.map(csvCell).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = filename('csv');
    link.click();
    URL.revokeObjectURL(url);
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  }

  function printableHtml() {
    const filters = activeFilters();
    const filterRows = filters.length
      ? filters.map(([name, value]) => `<tr><th>Filter: ${escapeHtml(name)}</th><td>${escapeHtml(value)}</td></tr>`).join('')
      : '<tr><th>Filters</th><td>None</td></tr>';
    const metricRows = summaryRows().map(row => `<tr><th>${escapeHtml(row.metric)}</th><td>${escapeHtml(row.value)}</td></tr>`).join('');
    return `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(currentSectionTitle())}</title><style>body{font-family:Arial,sans-serif;margin:32px;color:#111}h1{margin:0 0 8px}p{color:#555;margin:0 0 24px}table{border-collapse:collapse;width:100%;max-width:760px;margin-bottom:22px}th,td{border:1px solid #bbb;padding:12px;text-align:left}th{background:#f3f4f6;width:55%}</style></head><body><h1>${escapeHtml(currentSectionTitle())} Summary</h1><p>Filtered summary only · Generated ${escapeHtml(new Date().toLocaleString('en-GB'))}</p><table>${filterRows}</table><table>${metricRows}</table></body></html>`;
  }

  function printSummary() {
    if (!summaryRows().length) return alert('No summary data is available to print.');
    const popup = window.open('', '_blank', 'noopener,noreferrer');
    if (!popup) return alert('Allow pop-ups to print this summary.');
    popup.document.open();
    popup.document.write(printableHtml());
    popup.document.close();
    popup.addEventListener('load', () => popup.print(), { once: true });
  }

  async function shareSummary() {
    const filters = activeFilters();
    const lines = [
      `${currentSectionTitle()} Summary`,
      'Filtered summary only',
      ...filters.map(([name, value]) => `${name}: ${value}`),
      ...summaryRows().map(row => `${row.metric}: ${row.value}`),
      location.href
    ];
    const shareText = lines.join('\n');
    try {
      if (navigator.share) await navigator.share({ title: currentSectionTitle(), text: shareText, url: location.href });
      else {
        await navigator.clipboard.writeText(shareText);
        alert('Filtered summary and link copied.');
      }
    } catch (error) {
      if (error?.name !== 'AbortError') prompt('Copy this summary:', shareText);
    }
  }

  function addToolbar() {
    const head = document.querySelector('.page-head');
    if (!head || document.getElementById('sectionExportTools')) return;
    const tools = document.createElement('div');
    tools.id = 'sectionExportTools';
    tools.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-left:auto';
    tools.innerHTML = '<button type="button" class="btn secondary" data-summary-export="csv">Export Summary</button><button type="button" class="btn secondary" data-summary-export="print">Print Summary</button><button type="button" class="btn secondary" data-summary-export="share">Share Summary</button>';
    head.appendChild(tools);
  }

  function scheduleToolbar() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      addToolbar();
    });
  }

  document.addEventListener('click', event => {
    const button = event.target.closest('[data-summary-export]');
    if (!button) return;
    const action = button.dataset.summaryExport;
    if (action === 'csv') downloadCsv();
    if (action === 'print') printSummary();
    if (action === 'share') shareSummary();
  });

  document.addEventListener('DOMContentLoaded', () => {
    new MutationObserver(scheduleToolbar).observe(document.body, { childList: true, subtree: true });
    scheduleToolbar();
  });
})();