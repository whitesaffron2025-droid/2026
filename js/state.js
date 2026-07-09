window.CampaignState = {
  rows: [],
  section: 'dashboard',
  search: '',
  searchCategory: 'any',
  address: 'all',
  party: 'all',
  page: 1,
  pageSize: 20,
  structureMode: true,

  setRows(rows) {
    this.rows = Array.isArray(rows) ? rows : [];
  },

  setSection(section) {
    this.section = window.CampaignHelpers.validSection(section);
    this.page = 1;
  },

  resetPage() {
    this.page = 1;
  }
};
