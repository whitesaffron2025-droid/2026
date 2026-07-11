/* MODULE: Section Summary Export Tools | VERSION: 1.0.0 */
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

  function filename(extension) {
    const section = currentSectionTitle().replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'summary';
    const date = new Date().toISOString().slice(0, 10);
    return `${section}-${date}.${extension}`;
  }

  function downloadCsv() {
    const rows = summaryRows();
    if (!rows.length) return alert('No summary data is available to export.');
    const csv = [
      ['Section', currentSectionTitle()],
      ['Generated', new Date().toLocaleString('en-GB')],
      [],
      ['Metric', 'Value'],
      ...rows.map(row => [row.metric, row.value])
    ].map(row => row.map(value => `"${String(value ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename('csv');
    link.click();
    URL.revokeObjectURL(url);
  }

  function printableHtml() {
    const rows = summaryRows();
    const body = rows.map(row => `<tr><th>${escapeHtml(row.metric)}</th><td>${escapeHtml(row.value)}</td></tr>`).join('');
    return `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(currentSectionTitle())}</title><style>body{font-family:Arial,sans-serif;margin:32px;color:#111}h1{margin:0 0 8px}p{color:#555;margin:0 0 24px}table{border-collapse:collapse;width:100%;max-width:720px}th,td{border:1px solid #bbb;padding:12px;text-align:left}th{background:#f3f4f6;width:60%}@media print{button{display:none}}</style></head><body><h1>${escapeHtml(currentSectionTitle())}</h1><p>Generated ${escapeHtml(new Date().toLocaleString('en-GB'))}</p><table>${body}</table></body></html>`;
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
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
    const rows = summaryRows();
    const lines = [currentSectionTitle(), ...rows.map(row => `${row.metric}: ${row.value}`), location.href];
    const shareText = lines.join('\n');
    try {
      if (navigator.share) {
        await navigator.share({ title: currentSectionTitle(), text: shareText, url: location.href });
      } else {
        await navigator.clipboard.writeText(shareText);
        alert('Summary and link copied.');
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
    tools.innerHTML = '<button type="button" class="btn secondary" data-summary-export="csv">Excel</button><button type="button" class="btn secondary" data-summary-export="print">PDF / Print</button><button type="button" class="btn secondary" data-summary-export="share">Share</button>';
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
