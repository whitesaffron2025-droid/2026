window.CampaignState = {
  rows: [],
  filtered: [],
  page: 1,
  pageSize: window.CampaignConfig.pageSize,
  activeView: 'dashboard',
  selectedIds: new Set(),
  filters: {
    search: '',
    party: 'all',
    status: 'all'
  },
  setRows(rows) {
    this.rows = rows || [];
  },
  setFiltered(rows) {
    this.filtered = rows || [];
  },
  resetPage() {
    this.page = 1;
  }
};
