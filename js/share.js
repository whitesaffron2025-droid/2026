window.CampaignShare = {
  buildPublicUrl() {
    const u = window.CampaignUtils;
    const base = `${window.location.origin}${window.location.pathname}`;
    const params = new URLSearchParams();
    const search = u.text(u.el('searchInput').value);
    const assigner = u.el('assignerFilter').value;
    const d2d = u.el('d2dFilter').value;
    const callStatus = u.el('callStatusFilter').value;
    const callOutcome = u.el('callOutcomeFilter').value;
    const status = u.el('statusFilter').value;

    params.set('public', 'true');
    if (search) params.set('search', search);
    if (d2d && d2d !== 'all') params.set('d2d', d2d);
    if (callStatus && callStatus !== 'all') params.set('call', callStatus);
    if (callOutcome && callOutcome !== 'all') params.set('outcome', callOutcome);
    if (assigner === 'unassigned') params.set('unassigned', 'true');
    if (assigner && assigner !== 'all' && assigner !== 'unassigned') params.set('assigner', assigner);
    if (status === 'unassigned') params.set('unassigned', 'true');

    return `${base}?${params.toString()}`;
  },
  async copyPublicUrl() {
    const url = this.buildPublicUrl();
    await navigator.clipboard.writeText(url);
    alert(`Public link copied:\n${url}`);
    return url;
  },
  currentUrl() {
    return window.location.href;
  },
  async copyCurrentUrl() {
    await navigator.clipboard.writeText(this.currentUrl());
  }
};
