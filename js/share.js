window.CampaignShare = {
  currentUrl() {
    return window.location.href;
  },
  async copyCurrentUrl() {
    await navigator.clipboard.writeText(this.currentUrl());
  }
};
