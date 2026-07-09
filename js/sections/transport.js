window.CampaignTransport = {
  rows() {
    const h = window.CampaignHelpers;
    const d = h.defaults;
    return window.CampaignSections.baseRows().filter(row => h.value(row.transport_status, d.transport_status) === 'need-transport');
  },

  fields(row) {
    const h = window.CampaignHelpers;
    const d = h.defaults;
    return `
      ${h.field('Transport', h.select('transport_status', h.value(row.transport_status, d.transport_status), [
        ['not-needed', 'Not Needed'],
        ['need-transport', 'Need Transport'],
        ['arranged', 'Arranged'],
        ['picked-up', 'Picked Up']
      ]))}
      ${h.remarksField(row)}
    `;
  },

  patch(data) {
    const h = window.CampaignHelpers;
    const d = h.defaults;
    return {
      transport_status: h.value(data.transport_status, d.transport_status),
      remarks: h.text(data.remarks) || null
    };
  }
};
