window.CampaignApp = {
  async load() {
    const u = window.CampaignUtils;
    try {
      u.el('connectionStatus').textContent = 'Loading… 0';
      const rows = await window.CampaignApi.fetchAllRows(count => {
        u.el('connectionStatus').textContent = `Loading… ${u.fmt(count)}`;
      });
      window.CampaignState.setRows(rows.map(row => u.normalize(row)));
      u.el('connectionStatus').textContent = `Connected • ${u.fmt(window.CampaignState.rows.length)} records`;
      u.el('lastUpdated').textContent = new Date().toLocaleString();
      window.CampaignState.resetPage();
      this.render();
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
    ['searchInput', 'partyFilter', 'statusFilter', 'pageSize'].forEach(id => {
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
