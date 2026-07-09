window.CampaignWorkPageRenderer = {
  render(section) {
    const h = window.CampaignHelpers;
    const config = window.CampaignSectionConfigs[section];
    if (!config) return;

    const rows = window.CampaignSections.rowsFor(section);
    document.getElementById('dashboard').style.display = 'none';
    document.getElementById('content').innerHTML = `
      <article class="panel work-page" data-work-section="${h.escape(section)}">
        <div class="panel-head">
          <h2>${h.escape(config.title)}</h2>
          <span>${window.CampaignState.structureMode ? 'Structure mode' : rows.length.toLocaleString() + ' records'}</span>
        </div>
        ${window.CampaignStatsRenderer.render(section)}
        ${window.CampaignFiltersRenderer.render(section)}
        ${window.CampaignTableRenderer.render(section, rows)}
        ${window.CampaignPaginationRenderer.render(rows.length)}
      </article>
    `;
  }
};
