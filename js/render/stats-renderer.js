window.CampaignStatsRenderer = {
  metrics(section) {
    const h = window.CampaignHelpers;
    const d = h.defaults;
    const rows = window.CampaignState.rows;
    const base = window.CampaignSections.rowsFor(section);
    return [
      { label: 'Total', value: base.length },
      { label: 'Unassigned', value: rows.filter(row => !h.text(row.vote_assigned_by)).length },
      { label: 'Need Call', value: rows.filter(row => h.value(row.phone_status, d.phone_status) === 'need-call').length },
      { label: 'Need Decision', value: rows.filter(row => h.value(row.vote_status, d.vote_status) === 'not-decided').length }
    ];
  },

  render(section) {
    const h = window.CampaignHelpers;
    const cards = this.metrics(section);
    return `
      <div class="section-stats">
        ${cards.map(card => `
          <div class="mini-stat">
            <span>${h.escape(card.label)}</span>
            <strong>${Number(card.value || 0).toLocaleString()}</strong>
          </div>
        `).join('')}
      </div>
    `;
  }
};
