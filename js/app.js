window.CampaignApp = {
  populateAssigners() {
    const u = window.CampaignUtils;
    const select = u.el('assignerFilter');
    const current = select.value;
    const names = [...new Set(window.CampaignState.rows.map(row => u.text(row.vote_assigned_by)).filter(Boolean))].sort((a, b) => a.localeCompare(b));
    select.innerHTML = '<option value="all">All assigners</option><option value="unassigned">Unassigned</option>' + names.map(name => `<option value="${name}">${name}</option>`).join('');
    if ([...select.options].some(option => option.value === current)) select.value = current;
  },
  async load() {
    const u = window.CampaignUtils;
    try {
      u.el('connectionStatus').textContent = 'Loading… 0';
      const rows = await window.CampaignApi.fetchAllRows(count => {
        u.el('connectionStatus').textContent = `Loading… ${u.fmt(count)}`;
      });
      window.CampaignState.setRows(rows.map(row => u.normalize(row)));
      this.populateAssigners();
      if (!window.CampaignState.urlFiltersApplied) window.CampaignFilters.applyUrlParams();
      u.el('connectionStatus').textContent = `${window.CampaignState.publicView ? 'Public view' : 'Connected'} • ${u.fmt(window.CampaignState.rows.length)} records`;
      u.el('lastUpdated').textContent = new Date().toLocaleString();
      window.CampaignState.resetPage();
      this.render();
      if (window.CampaignState.publicView) {
        document.querySelectorAll('.nav-btn').forEach(button => button.classList.toggle('active', button.dataset.view === 'campaigns'));
        document.querySelectorAll('.view').forEach(view => view.classList.remove('active'));
        u.el('campaignsView').classList.add('active');
      }
    } catch (error) {
      console.error(error);
      u.el('connectionStatus').textContent = 'Load error';
      document.body.insertAdjacentHTML('afterbegin', `<div style="background:#fee;color:#900;padding:12px;font-weight:700">${error.message || error}</div>`);
    }
  },
  render() {
    window.CampaignFilters.apply();
    window.CampaignRenderDashboard.render();
    window.CampaignRenderCampaigns.render();
    window.CampaignRenderAnalytics.render();
    window.CampaignCharts.render();
  },
  setupEvents() {
    const u = window.CampaignUtils;
    ['searchInput', 'partyFilter', 'statusFilter', 'assignerFilter', 'pageSize'].forEach(id => {
      u.el(id).addEventListener('input', () => {
        window.CampaignState.resetPage();
        this.render();
      });
    });
    u.el('prevPage').onclick = () => {
      if (window.CampaignState.page > 1) {
        window.CampaignState.page--;
        window.CampaignRenderCampaigns.render();
      }
    };
    u.el('nextPage').onclick = () => {
      window.CampaignState.page++;
      window.CampaignRenderCampaigns.render();
    };
    u.el('refreshBtn').onclick = () => this.load();
    u.el('exportBtn').onclick = () => window.CampaignActions.exportData();
    u.el('shareBtn').onclick = () => window.CampaignShare.copyPublicUrl();
    u.el('copyReportBtn').onclick = () => window.CampaignActions.copyReport();
    document.addEventListener('click', event => {
      const viewButton = event.target.closest('[data-view]');
      if (viewButton) {
        document.querySelectorAll('.nav-btn').forEach(button => button.classList.toggle('active', button === viewButton));
        document.querySelectorAll('.view').forEach(view => view.classList.remove('active'));
        u.el(`${viewButton.dataset.view}View`).classList.add('active');
      }
      const editButton = event.target.closest('[data-edit-id]');
      if (editButton) {
        const id = Number(editButton.dataset.editId);
        const row = window.CampaignState.rows.find(item => Number(item.id) === id);
        if (row) window.CampaignModals.openRecord(row);
      }
    });
  },
  init() {
    this.setupEvents();
    this.load();
  }
};

document.addEventListener('DOMContentLoaded', () => window.CampaignApp.init());
