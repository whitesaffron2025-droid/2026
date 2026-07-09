// js/app.js
// Modular 2026 Campaign Manager
// Orchestrates modules only. Supabase config/table remain in js/config.js.

(function () {
  'use strict';

  function sectionRenderer(section) {
    return {
      dashboard: window.CampaignDashboard,
      residents: { render: function () { window.CampaignTable.render(window.CampaignResidents.rows(), window.CampaignSections.title('residents')); } },
      assign: { render: function () { window.CampaignAssign.render(); } },
      calls: { render: function () { window.CampaignTable.render(window.CampaignCalls.rows(), window.CampaignSections.title('calls')); } },
      votes: { render: function () { window.CampaignTable.render(window.CampaignVotes.rows(), window.CampaignSections.title('votes')); } },
      visits: { render: function () { window.CampaignTable.render(window.CampaignVisits.rows(), window.CampaignSections.title('visits')); } },
      transport: { render: function () { window.CampaignTable.render(window.CampaignTransport.rows(), window.CampaignSections.title('transport')); } },
      reports: window.CampaignReports
    }[section] || window.CampaignDashboard;
  }

  window.CampaignApp = {
    setSection(section) {
      window.CampaignState.setSection(section);
      const url = new URL(window.location.href);
      url.searchParams.set('section', window.CampaignState.section);
      window.history.replaceState({}, '', url);
      this.render();
    },

    render() {
      const section = window.CampaignState.section;
      window.CampaignShell.renderNav();
      window.CampaignShell.setTitle(window.CampaignSections.title(section));
      const renderer = sectionRenderer(section);
      if (renderer && renderer.render) renderer.render();
    },

    async saveEditor(event) {
      event.preventDefault();
      const form = event.target;
      const id = form.dataset.id;
      const section = form.dataset.section || window.CampaignState.section;
      const data = Object.fromEntries(new FormData(form).entries());
      const patch = window.CampaignModal.buildPatch(section, data);

      try {
        const updatedRows = await window.CampaignApi.updateRecord(id, patch);
        const updated = updatedRows[0] || patch;
        const rows = window.CampaignState.rows;
        const index = rows.findIndex(function (row) { return String(row.id) === String(id); });
        if (index >= 0) rows[index] = Object.assign({}, rows[index], updated);
        window.CampaignModal.close();
        window.CampaignApp.render();
        alert('Saved.');
      } catch (error) {
        alert(error.message || error);
      }
    },

    applySearch() {
      const searchInput = document.getElementById('searchInput');
      const category = document.getElementById('searchCategory');
      window.CampaignState.search = searchInput ? searchInput.value.trim() : '';
      window.CampaignState.searchCategory = category ? category.value : 'any';
      window.CampaignState.resetPage();
      this.render();
    },

    clearSearch() {
      const searchInput = document.getElementById('searchInput');
      const category = document.getElementById('searchCategory');
      if (searchInput) searchInput.value = '';
      if (category) category.value = 'any';
      window.CampaignState.search = '';
      window.CampaignState.searchCategory = 'any';
      window.CampaignState.resetPage();
      this.render();
    },

    bindEvents() {
      const self = this;
      document.addEventListener('click', function (event) {
        const sectionButton = event.target.closest('[data-section]');
        if (sectionButton) {
          self.setSection(sectionButton.dataset.section);
          return;
        }

        if (event.target.closest('#searchBtn')) {
          self.applySearch();
          return;
        }

        if (event.target.closest('#clearSearchBtn')) {
          self.clearSearch();
          return;
        }

        const editButton = event.target.closest('[data-edit]');
        if (editButton) {
          const row = window.CampaignState.rows.find(function (item) { return String(item.id) === String(editButton.dataset.edit); });
          if (row) window.CampaignModal.open(row);
        }
      });

      document.getElementById('searchInput').addEventListener('keydown', function (event) {
        if (event.key === 'Enter') {
          event.preventDefault();
          self.applySearch();
        }
      });

      document.getElementById('searchCategory').addEventListener('input', function () {
        window.CampaignState.searchCategory = this.value;
      });

      document.getElementById('partyFilter').addEventListener('input', function () {
        window.CampaignState.party = this.value;
        window.CampaignState.resetPage();
        self.render();
      });

      document.getElementById('pageSize').addEventListener('input', function () {
        window.CampaignState.pageSize = Number(this.value || 20);
        window.CampaignState.resetPage();
        self.render();
      });
    },

    async init() {
      window.CampaignShell.render();
      this.bindEvents();

      const params = new URLSearchParams(window.location.search);
      window.CampaignState.setSection(params.get('section') || 'dashboard');
      window.CampaignState.party = params.get('party') || 'all';
      window.CampaignState.searchCategory = params.get('searchBy') || 'any';
      window.CampaignState.search = params.get('q') || '';
      document.getElementById('partyFilter').value = window.CampaignState.party;
      document.getElementById('searchCategory').value = window.CampaignState.searchCategory;
      document.getElementById('searchInput').value = window.CampaignState.search;

      try {
        window.CampaignShell.setStatus('Loading records...');
        const rows = await window.CampaignApi.fetchAllRows();
        window.CampaignState.setRows(rows);
        window.CampaignShell.setStatus(`Connected • ${rows.length.toLocaleString()} records`);
        this.render();
      } catch (error) {
        window.CampaignShell.setStatus('Load failed');
        document.getElementById('content').innerHTML = `<div class="panel"><h2>Load Error</h2><p>${window.CampaignHelpers.escape(error.message || error)}</p></div>`;
      }
    }
  };

  document.addEventListener('DOMContentLoaded', function () {
    window.CampaignApp.init();
  });
})();
