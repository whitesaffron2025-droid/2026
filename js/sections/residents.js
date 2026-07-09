window.CampaignResidents = {
  rows() {
    return window.CampaignSections.baseRows();
  },

  fields(row) {
    const h = window.CampaignHelpers;
    const d = h.defaults;
    return `
      ${h.field('Assign To', `<input name="vote_assigned_by" value="${h.escape(row.vote_assigned_by)}" placeholder="Assignee name">`)}
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
      ${h.field('D2D Status', h.select('d2d_status', h.value(row.d2d_status, d.d2d_status), [
        ['not-visited', 'Not Visited'],
        ['reach', 'Reached / Visited'],
        ['not-home', 'Not Home'],
        ['live-in-another-place', 'Live in Another Place']
      ]))}
      ${h.field('Transport', h.select('transport_status', h.value(row.transport_status, d.transport_status), [
        ['not-needed', 'Not Needed'],
        ['need-transport', 'Need Transport'],
        ['arranged', 'Arranged'],
        ['picked-up', 'Picked Up']
      ]))}
      ${h.field('Living Place', `<input name="living_place" value="${h.escape(row.living_place)}" placeholder="Living place">`)}
      ${h.remarksField(row)}
    `;
  },

  patch(data) {
    const h = window.CampaignHelpers;
    const d = h.defaults;
    const assignee = h.text(data.vote_assigned_by);
    const vote_status = h.value(data.vote_status, d.vote_status);
    const support_level = h.value(data.support_level, d.support_level);
    const phone_status = h.value(data.phone_status, d.phone_status);
    const d2d_status = h.value(data.d2d_status, d.d2d_status);
    const patch = {
      vote_assigned_by: assignee || null,
      vote_assigned_at: assignee ? new Date().toISOString() : null,
      vote_status,
      support_level,
      phone_status,
      d2d_status,
      transport_status: h.value(data.transport_status, d.transport_status),
      living_place: h.text(data.living_place) || null,
      remarks: h.text(data.remarks) || null
    };
    if (phone_status === 'called') patch.reach_status = 'reached';
    if (phone_status === 'need-call') patch.reach_status = 'not-reached';
    if (vote_status === 'will-vote' || vote_status === 'not-vote' || support_level === 'guaranteed') patch.reach_status = 'reached';
    if (d2d_status === 'reach') patch.reach_status = 'reached';
    return patch;
  }
};
