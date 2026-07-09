window.CampaignAssign = {
  rows() {
    const h = window.CampaignHelpers;
    return window.CampaignSections.baseRows().filter(row => !h.text(row.vote_assigned_by));
  },

  fields(row) {
    const h = window.CampaignHelpers;
    return `
      ${h.field('Assign To', `<input name="vote_assigned_by" value="${h.escape(row.vote_assigned_by)}" placeholder="Assignee name">`)}
      ${h.remarksField(row)}
    `;
  },

  patch(data) {
    const h = window.CampaignHelpers;
    const assignee = h.text(data.vote_assigned_by);
    return {
      vote_assigned_by: assignee || null,
      vote_assigned_at: assignee ? new Date().toISOString() : null,
      remarks: h.text(data.remarks) || null
    };
  }
};
