window.CampaignUtils = {
  el(id) { return document.getElementById(id); },
  text(value) { return value === null || value === undefined ? '' : String(value).trim(); },
  lower(value) { return this.text(value).toLowerCase(); },
  fmt(number) { return Number(number || 0).toLocaleString(); },
  pct(value, total) { return total ? ((value / total) * 100).toFixed(1) : '0.0'; },
  label(value) {
    return this.text(value).replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'None';
  },
  badge(value) {
    const v = this.text(value) || 'none';
    let cls = '';
    if (['will-vote', 'called', 'reach', 'reached', 'guaranteed', 'arranged', 'picked-up'].includes(v)) cls = 'ok';
    if (['need-call', 'not-decided', 'not-visited', 'need-transport', 'not-guaranteed', 'busy', 'not-answer'].includes(v)) cls = 'warn';
    if (['not-vote', 'disconnected', 'wrong-number', 'out-of-coverage'].includes(v)) cls = 'danger';
    return `<span class="badge ${cls}">${this.label(v)}</span>`;
  },
  normalize(row) {
    return {
      ...row,
      vote_status: row.vote_status || 'not-decided',
      phone_status: row.phone_status || 'need-call',
      d2d_status: row.d2d_status || 'not-visited',
      reach_status: row.reach_status || 'not-reached',
      support_level: row.support_level || 'normal',
      transport_status: row.transport_status || 'not-needed'
    };
  },
  escapeCsv(value) {
    return '"' + this.text(value).replace(/"/g, '""') + '"';
  }
};
