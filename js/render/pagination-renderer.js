window.CampaignPaginationRenderer = {
  render(totalRows) {
    const state = window.CampaignState;
    if (state.structureMode) {
      return `
        <div class="pager structure-pager">
          <button class="secondary" disabled>&lt;&lt;</button>
          <button class="secondary" disabled>&lt;</button>
          <span>Page 1 of 1</span>
          <button class="secondary" disabled>&gt;</button>
          <button class="secondary" disabled>&gt;&gt;</button>
          <span>Showing structure preview</span>
        </div>
      `;
    }

    const totalPages = Math.max(1, Math.ceil(totalRows / state.pageSize));
    const start = totalRows ? ((state.page - 1) * state.pageSize) + 1 : 0;
    const end = Math.min(totalRows, state.page * state.pageSize);

    return `
      <div class="pager">
        <button class="secondary" id="firstPage" ${state.page <= 1 ? 'disabled' : ''}>&lt;&lt;</button>
        <button class="secondary" id="prevPage" ${state.page <= 1 ? 'disabled' : ''}>&lt;</button>
        <span>Page ${state.page} of ${totalPages}</span>
        <button class="secondary" id="nextPage" ${state.page >= totalPages ? 'disabled' : ''}>&gt;</button>
        <button class="secondary" id="lastPage" ${state.page >= totalPages ? 'disabled' : ''}>&gt;&gt;</button>
        <span>Showing ${start}-${end} of ${totalRows.toLocaleString()}</span>
      </div>
    `;
  }
};
