window.CampaignState = {
  rows: [],
  filtered: [],
  page: 1,
  pageSize: window.CampaignConfig.pageSize,
  activeView: 'dashboard',
  selectedIds: new Set(),
  publicView: false,
  urlFiltersApplied: false,
  filters: {
    search: '',
    party: 'all',
    status: 'all',
    d2d: 'all',
    assigner: 'all',
    house: '',
    id: ''
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
