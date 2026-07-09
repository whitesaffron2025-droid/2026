window.CampaignCalls = {
  rows() {
    const h = window.CampaignHelpers;
    const d = h.defaults;
    return window.CampaignSections.baseRows().filter(row => h.value(row.phone_status, d.phone_status) === 'need-call');
  },

  fields(row) {
    const h = window.CampaignHelpers;
    const d = h.defaults;
    return `
      ${h.field('Call Status', h.select('phone_status', h.value(row.phone_status, d.phone_status), [
        ['need-call', 'Need Call'],
        ['called', 'Called'],
        ['busy', 'Busy'],
        ['not-answer', 'Not Answer'],
        ['disconnected', 'Disconnected'],
        ['wrong-number', 'Wrong Number'],
        ['out-of-coverage', 'Out of Coverage'],
        ['no-phone', 'No Phone']
      ]))}
      ${h.remarksField(row)}
    `;
  },

  patch(data) {
    const h = window.CampaignHelpers;
    const d = h.defaults;
    const phone_status = h.value(data.phone_status, d.phone_status);
    const patch = { phone_status, remarks: h.text(data.remarks) || null };
    if (phone_status === 'called') patch.reach_status = 'reached';
    if (phone_status === 'need-call') patch.reach_status = 'not-reached';
    return patch;
  }
};
