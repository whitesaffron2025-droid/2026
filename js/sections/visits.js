window.CampaignVisits = {
  rows() {
    const h = window.CampaignHelpers;
    const d = h.defaults;
    return window.CampaignSections.baseRows().filter(row => h.value(row.d2d_status, d.d2d_status) === 'not-visited');
  },

  fields(row) {
    const h = window.CampaignHelpers;
    const d = h.defaults;
    return `
      ${h.field('D2D Status', h.select('d2d_status', h.value(row.d2d_status, d.d2d_status), [
        ['not-visited', 'Not Visited'],
        ['reach', 'Reached / Visited'],
        ['not-home', 'Not Home'],
        ['live-in-another-place', 'Live in Another Place']
      ]))}
      ${h.field('Living Place', `<input name="living_place" value="${h.escape(row.living_place)}" placeholder="Living place">`)}
      ${h.remarksField(row)}
    `;
  },

  patch(data) {
    const h = window.CampaignHelpers;
    const d = h.defaults;
    const d2d_status = h.value(data.d2d_status, d.d2d_status);
    const patch = {
      d2d_status,
      living_place: h.text(data.living_place) || null,
      remarks: h.text(data.remarks) || null
    };
    if (d2d_status === 'reach') patch.reach_status = 'reached';
    return patch;
  }
};
