window.CampaignApi = {
  async fetchBatch(from, to) {
    const cfg = window.CampaignConfig;
    const url = `${cfg.supabaseUrl}/rest/v1/${encodeURIComponent(cfg.tableName)}?select=*&order=id.asc`;
    const response = await fetch(url, {
      headers: {
        apikey: cfg.supabaseKey,
        Authorization: `Bearer ${cfg.supabaseKey}`,
        Range: `${from}-${to}`,
        'Range-Unit': 'items'
      }
    });
    if (!response.ok) {
      throw new Error(`Supabase ${response.status}: ${await response.text()}`);
    }
    return response.json();
  },
  async fetchAllRows(onProgress) {
    const cfg = window.CampaignConfig;
    let all = [];
    let from = 0;
    while (true) {
      if (onProgress) onProgress(all.length);
      const batch = await this.fetchBatch(from, from + cfg.batchSize - 1);
      all = all.concat(batch || []);
      if (!batch || batch.length < cfg.batchSize) break;
      from += cfg.batchSize;
    }
    return all;
  },
  async updateRecord(id, patch) {
    const cfg = window.CampaignConfig;
    const url = `${cfg.supabaseUrl}/rest/v1/${encodeURIComponent(cfg.tableName)}?id=eq.${encodeURIComponent(id)}`;
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        apikey: cfg.supabaseKey,
        Authorization: `Bearer ${cfg.supabaseKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation'
      },
      body: JSON.stringify(patch)
    });
    if (!response.ok) {
      throw new Error(`Save failed ${response.status}: ${await response.text()}`);
    }
    return response.json();
  }
};
