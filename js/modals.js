window.CampaignModals = {
  openRecord(row) {
    const u = window.CampaignUtils;
    alert(`${u.text(row.name) || 'No name'}\n${u.text(row.house)}\n${u.text(row.phone)}`);
  },
  close() {
    const dialog = window.CampaignUtils.el('editDialog');
    if (dialog && dialog.open) dialog.close();
  }
};
