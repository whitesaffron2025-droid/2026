/* Live Share Preview v1.0.0 */
(() => {
  'use strict';

  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[char]));

  function selectedText(id) {
    const element = document.getElementById(id);
    if (!element) return '';
    if (element.tagName === 'SELECT') return element.options[element.selectedIndex]?.text || '';
    return element.value?.trim() || '';
  }

  function buildFilterSummary() {
    const filters = [
      ['Address', selectedText('addressFilter')],
      ['Assignment', selectedText('assignmentFilter')],
      ['Campaign Vote', selectedText('campaignVoteFilter')],
      ['Search', selectedText('searchInput') || 'None'],
      ['Turnout', selectedText('statusFilter')]
    ];
    return filters.map(([label, value]) => `<span><strong>${esc(label)}:</strong> ${esc(value)}</span>`).join('');
  }

  function visibleRowsCount() {
    return [...document.querySelectorAll('#residentRows tr')]
      .filter(row => !row.querySelector('.no-results') && row.querySelectorAll('td').length > 1).length;
  }

  function cleanedTableHtml() {
    const table = document.querySelector('.live-table');
    if (!table) return '';
    const clone = table.cloneNode(true);
    clone.querySelectorAll('button.vote-toggle').forEach(button => {
      const text = button.textContent.replace(/\s+/g, ' ').trim();
      const badge = document.createElement('span');
      badge.className = text.includes('Voted') && !text.includes('Not Yet') ? 'status voted' : 'status not-yet';
      badge.textContent = text;
      button.replaceWith(badge);
    });
    clone.querySelectorAll('.pending-label').forEach(label => {
      label.textContent = 'Pending save';
    });
    return clone.outerHTML;
  }

  function openSharePreview() {
    const count = visibleRowsCount();
    if (!count) {
      alert('There are no filtered residents to preview.');
      return;
    }

    const voted = document.getElementById('votedCount')?.textContent || '0';
    const notYet = document.getElementById('notVotedCount')?.textContent || '0';
    const total = document.getElementById('totalCount')?.textContent || '0';
    const generated = new Date().toLocaleString('en-GB');
    const summaryText = `PNC Live Turnout — ${count} visible residents. Voted: ${voted}. Not Yet: ${notYet}. Total: ${total}.`;
    const preview = window.open('', '_blank', 'noopener,noreferrer');
    if (!preview) {
      alert('The preview window was blocked. Please allow pop-ups for this site.');
      return;
    }

    preview.document.write(`<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>PNC Live Turnout Share Preview</title>
<style>
*{box-sizing:border-box}body{margin:0;background:#f4f7fc;color:#172033;font-family:Segoe UI,Arial,sans-serif}.page{max-width:1300px;margin:auto;padding:24px}.head{display:flex;justify-content:space-between;gap:20px;align-items:flex-start;margin-bottom:16px}.head h1{margin:0 0 5px;font-size:26px}.muted{color:#64748b;font-size:13px}.actions{display:flex;gap:8px}.actions button{border:0;border-radius:10px;padding:10px 14px;font-weight:700;cursor:pointer}.primary{background:#4f7cff;color:white}.secondary{background:#e8eef7;color:#172033}.stats{display:grid;grid-template-columns:repeat(4,minmax(120px,1fr));gap:10px;margin:14px 0}.card{background:white;border:1px solid #dce5f1;border-radius:14px;padding:13px}.card strong{display:block;font-size:22px}.filters{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:14px}.filters span{background:white;border:1px solid #dce5f1;border-radius:999px;padding:7px 10px;font-size:12px}.table-wrap{overflow:auto;background:white;border:1px solid #dce5f1;border-radius:14px}.live-table{width:100%;min-width:1100px;border-collapse:collapse;font-size:12px}.live-table th,.live-table td{padding:10px 8px;border-bottom:1px solid #edf1f6;text-align:left;vertical-align:middle}.live-table th{background:#f8faff;text-transform:uppercase;font-size:10px}.live-table img,.avatar{width:38px!important;height:38px!important;object-fit:cover;border-radius:10px}.assignment-note{display:block;color:#166534;font-size:9px;font-weight:700;margin-top:3px}.status{display:inline-block;border-radius:999px;padding:6px 10px;font-weight:700}.status.voted{background:#dcfce7;color:#166534}.status.not-yet{background:#fef3e8;color:#b45309}.pending-label{display:block;color:#2563eb;font-size:9px}.footer{margin-top:10px;text-align:right;color:#64748b;font-size:11px}@media print{body{background:white}.page{max-width:none;padding:0}.actions{display:none}.table-wrap{border:0}.live-table{min-width:0}.filters span,.card{break-inside:avoid}}
</style></head><body><main class="page">
<div class="head"><div><h1>PNC · Vilimale Dhaaira Turnout</h1><div class="muted">Share preview generated ${esc(generated)}</div></div><div class="actions"><button class="secondary" id="shareBtn">Share</button><button class="primary" onclick="window.print()">Print</button></div></div>
<div class="stats"><div class="card"><strong>${esc(count)}</strong><span>Visible</span></div><div class="card"><strong>${esc(voted)}</strong><span>Voted</span></div><div class="card"><strong>${esc(notYet)}</strong><span>Not Yet</span></div><div class="card"><strong>${esc(total)}</strong><span>PNC Total</span></div></div>
<div class="filters">${buildFilterSummary()}</div><div class="table-wrap">${cleanedTableHtml()}</div><div class="footer">Read-only preview. No database changes can be made here.</div>
<script>document.getElementById('shareBtn').addEventListener('click',async()=>{const text=${JSON.stringify(summaryText)};if(navigator.share){try{await navigator.share({title:'PNC Live Turnout',text});}catch(e){}}else{await navigator.clipboard.writeText(text);alert('Summary copied to clipboard.');}});<\/script>
</main></body></html>`);
    preview.document.close();
  }

  document.addEventListener('click', event => {
    if (event.target.closest('#sharePreview')) openSharePreview();
  });
})();
