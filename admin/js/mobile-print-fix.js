/* MODULE: Mobile Summary Print Fix | VERSION: 1.0.0 */
(() => {
  'use strict';

  const text = value => String(value ?? '').trim();
  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[char]));

  function sectionTitle() {
    return text(document.querySelector('.page-head h1')?.textContent) || 'Summary';
  }

  function summaryRows() {
    return [...document.querySelectorAll('.stats-grid .stat-card')]
      .map(card => ({
        label: text(card.querySelector('span')?.textContent),
        value: text(card.querySelector('strong')?.textContent)
      }))
      .filter(row => row.label && row.value);
  }

  function activeFilters() {
    const rows = [];
    const party = document.getElementById('globalParty');
    if (party?.selectedOptions?.[0]) rows.push(['Party', text(party.selectedOptions[0].textContent)]);

    document.querySelectorAll('.filter-bar label').forEach(label => {
      const control = label.querySelector('select,input');
      if (!control) return;
      const labelText = text(label.childNodes[0]?.textContent);
      const value = control.tagName === 'SELECT'
        ? text(control.selectedOptions?.[0]?.textContent)
        : text(control.value);
      if (!labelText || !value || /^all\b/i.test(value)) return;
      rows.push([labelText, value]);
    });

    return rows;
  }

  function buildHtml() {
    const filters = activeFilters();
    const filterRows = filters.length
      ? filters.map(([name, value]) => `<tr><th>${escapeHtml(name)}</th><td>${escapeHtml(value)}</td></tr>`).join('')
      : '<tr><th>Filters</th><td>None</td></tr>';
    const statRows = summaryRows()
      .map(row => `<tr><th>${escapeHtml(row.label)}</th><td>${escapeHtml(row.value)}</td></tr>`)
      .join('');

    return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(sectionTitle())} Summary</title><style>body{font-family:Arial,sans-serif;margin:20px;color:#111;background:#fff}.actions{display:flex;gap:10px;margin-bottom:20px}.actions button{padding:11px 14px;border:1px solid #bbb;border-radius:8px;background:#fff;font-weight:700}h1{margin:0 0 6px;font-size:25px}p{margin:0 0 20px;color:#666}table{width:100%;border-collapse:collapse;margin-bottom:20px}th,td{border:1px solid #bbb;padding:11px;text-align:left}th{background:#f3f4f6;width:55%}@media print{.actions{display:none}body{margin:0}}</style></head><body><div class="actions"><button onclick="window.print()">Print / Save PDF</button><button onclick="window.close()">Close</button></div><h1>${escapeHtml(sectionTitle())} Summary</h1><p>Generated ${escapeHtml(new Date().toLocaleString('en-GB'))}</p><table>${filterRows}</table><table>${statRows}</table></body></html>`;
  }

  document.addEventListener('click', event => {
    const button = event.target.closest('[data-summary-export="print"]');
    if (!button) return;

    event.preventDefault();
    event.stopImmediatePropagation();

    if (!summaryRows().length) {
      alert('No summary data is available to print.');
      return;
    }

    const blob = new Blob([buildHtml()], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const popup = window.open(url, '_blank');

    if (!popup) {
      URL.revokeObjectURL(url);
      alert('Allow pop-ups to open the printable summary.');
      return;
    }

    setTimeout(() => URL.revokeObjectURL(url), 60000);
  }, true);
})();