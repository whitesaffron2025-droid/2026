window.CampaignVotes = {
  rows() {
    const h = window.CampaignHelpers;
    const d = h.defaults;
    return window.CampaignSections.baseRows().filter(row => h.value(row.vote_status, d.vote_status) === 'not-decided');
  },

  fields(row) {
    const h = window.CampaignHelpers;
    const d = h.defaults;
    return `
      ${h.field('Vote Status', h.select('vote_status', h.value(row.vote_status, d.vote_status), [
        ['not-decided', 'Not Decided'],
        ['will-vote', 'Will Vote'],
        ['not-vote', 'Not Vote']
      ]))}
      ${h.field('Support Level', h.select('support_level', h.value(row.support_level, d.support_level), [
        ['normal', 'Normal'],
        ['not-guaranteed', 'Not Guaranteed'],
        ['guaranteed', 'Guaranteed']
      ]))}
      ${h.remarksField(row)}
    `;
  },

  patch(data) {
    const h = window.CampaignHelpers;
    const d = h.defaults;
    const vote_status = h.value(data.vote_status, d.vote_status);
    const support_level = h.value(data.support_level, d.support_level);
    const patch = { vote_status, support_level, remarks: h.text(data.remarks) || null };
    if (vote_status === 'will-vote' || vote_status === 'not-vote' || support_level === 'guaranteed') patch.reach_status = 'reached';
    if (vote_status === 'not-decided' && support_level !== 'guaranteed') patch.reach_status = 'not-reached';
    return patch;
  }
};
