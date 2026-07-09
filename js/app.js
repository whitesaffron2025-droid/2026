// js/app.js
// Modular 2026 Campaign Manager
// Dashboard is separate. All work sections use the shared renderer.

(function () {
  'use strict';

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

      if (section === 'dashboard') {
        window.CampaignDashboard.render();
        return;
      }

      window.CampaignWorkPageRenderer.render(section);
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
      window.CampaignState.search = searchInput ? searchInput.value.trim() : '';
      window.CampaignState.resetPage();
      this.render();
    },

    clearSearch() {
      const searchInput = document.getElementById('searchInput');
      if (searchInput) searchInput.value = '';
      window.CampaignState.search = '';
      window.CampaignState.address = 'all';
      window.CampaignState.party = 'all';
      window.CampaignState.voteStatus = 'all';
      window.CampaignState.visitStatus = 'all';
      window.CampaignState.transportStatus = 'all';
      if (window.CampaignAssign) {
        window.CampaignAssign.mode = 'unassigned';
        window.CampaignAssign.assignee = 'all';
      }
      window.CampaignState.resetPage();
      this.render();
    },

    goToPage(page) {
      const rows = window.CampaignSections.rowsFor(window.CampaignState.section);
      const totalPages = Math.max(1, Math.ceil(rows.length / window.CampaignState.pageSize));
      window.CampaignState.page = Math.min(Math.max(1, page), totalPages);
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

        if (event.target.closest('#clearSearchBtn')) {
          self.clearSearch();
          return;
        }

        if (event.target.closest('#firstPage')) {
          self.goToPage(1);
          return;
        }

        if (event.target.closest('#prevPage')) {
          self.goToPage(window.CampaignState.page - 1);
          return;
        }

        if (event.target.closest('#nextPage')) {
          self.goToPage(window.CampaignState.page + 1);
          return;
        }

        if (event.target.closest('#lastPage')) {
          const rows = window.CampaignSections.rowsFor(window.CampaignState.section);
          self.goToPage(Math.ceil(rows.length / window.CampaignState.pageSize));
          return;
        }

        const editButton = event.target.closest('[data-edit]');
        if (editButton) {
          const row = window.CampaignState.rows.find(function (item) { return String(item.id) === String(editButton.dataset.edit); });
          if (row) window.CampaignModal.open(row);
        }
      });

      document.addEventListener('keydown', function (event) {
        if (event.target && event.target.id === 'searchInput' && event.key === 'Enter') {
          event.preventDefault();
          self.applySearch();
        }
      });

      document.addEventListener('input', function (event) {
        const target = event.target;
        if (!target || !target.id) return;

        if (target.id === 'searchInput') {
          window.CampaignState.search = target.value.trim();
          window.CampaignState.resetPage();
          self.render();
        }
        if (target.id === 'addressFilter') {
          window.CampaignState.address = target.value;
          window.CampaignState.resetPage();
          self.render();
        }
        if (target.id === 'partyFilter') {
          window.CampaignState.party = target.value;
          window.CampaignState.resetPage();
          self.render();
        }
        if (target.id === 'assignMode') {
          window.CampaignAssign.mode = target.value;
          window.CampaignState.resetPage();
          self.render();
        }
        if (target.id === 'assignerMode') {
          window.CampaignAssign.assignee = target.value;
          window.CampaignState.resetPage();
          self.render();
        }
        if (target.id === 'voteStatusFilter') {
          window.CampaignState.voteStatus = target.value;
          window.CampaignState.resetPage();
          self.render();
        }
        if (target.id === 'visitStatusFilter') {
          window.CampaignState.visitStatus = target.value;
          window.CampaignState.resetPage();
          self.render();
        }
        if (target.id === 'transportStatusFilter') {
          window.CampaignState.transportStatus = target.value;
          window.CampaignState.resetPage();
          self.render();
        }
        if (target.id === 'pageSize') {
          window.CampaignState.pageSize = Number(target.value || 20);
          window.CampaignState.resetPage();
          self.render();
        }
      });
    },

    async init() {
      window.CampaignShell.render();
      this.bindEvents();

      const params = new URLSearchParams(window.location.search);
      window.CampaignState.setSection(params.get('section') || 'dashboard');
      window.CampaignState.party = params.get('party') || 'all';
      window.CampaignState.address = params.get('address') || 'all';
      window.CampaignState.search = params.get('q') || '';

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
