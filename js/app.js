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
    ['searchInput', 'partyFilter', 'statusFilter', 'd2dFilter', 'callStatusFilter', 'callOutcomeFilter', 'assignerFilter', 'pageSize'].forEach(id => {
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
    u.el('printPdfBtn').onclick = () => window.CampaignActions.printPdf();
    u.el('copyReportBtn').onclick = () => window.CampaignActions.copyReport();
    u.el('printReportBtn').onclick = () => window.CampaignActions.printPdf();
    u.el('buildReportBtn').onclick = () => window.CampaignRenderAnalytics.render();
    u.el('bulkVoteBtn').onclick = () => window.CampaignActions.bulkUpdateVote();
    u.el('bulkCallBtn').onclick = () => window.CampaignActions.bulkUpdateCall();
    u.el('bulkD2DBtn').onclick = () => window.CampaignActions.bulkUpdateD2D();
    u.el('bulkAssignBtn').onclick = () => window.CampaignActions.bulkAssign();
    u.el('exportSelectedBtn').onclick = () => window.CampaignActions.exportSelected();
    u.el('bulkDeleteBtn').onclick = () => window.CampaignActions.bulkDelete();
    document.addEventListener('change', event => {
      if (event.target && event.target.id === 'modalVoteStatus') window.CampaignModals.syncReachStatus();
      const rowSelect = event.target.closest('.row-select');
      if (rowSelect) {
        const id = Number(rowSelect.dataset.selectId);
        if (rowSelect.checked) window.CampaignState.selectedIds.add(id);
        else window.CampaignState.selectedIds.delete(id);
        window.CampaignRenderCampaigns.updateSelectionSummary();
      }
      if (event.target && event.target.id === 'selectAllRows') {
        const checked = event.target.checked;
        document.querySelectorAll('.row-select').forEach(input => {
          const id = Number(input.dataset.selectId);
          input.checked = checked;
          if (checked) window.CampaignState.selectedIds.add(id);
          else window.CampaignState.selectedIds.delete(id);
        });
        window.CampaignRenderCampaigns.updateSelectionSummary();
      }
      if (event.target && event.target.classList && event.target.classList.contains('report-field')) {
        window.CampaignRenderAnalytics.render();
      }
    });
    document.addEventListener('submit', async event => {
      if (event.target && event.target.id === 'editForm') {
        event.preventDefault();
        await window.CampaignActions.saveRecord(event.target.dataset.recordId, event.target);
      }
    });
    document.addEventListener('click', event => {
      const closeButton = event.target.closest('[data-close-modal]');
      if (closeButton) window.CampaignModals.close();
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
