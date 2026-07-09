window.CampaignApi = {
  async fetchAllRows(onProgress) {
    const cfg = window.CampaignConfig;
    if (!cfg || !cfg.supabaseUrl || !cfg.supabaseKey || !cfg.tableName) {
      throw new Error('Missing CampaignConfig in js/config.js');
    }

    const batchSize = cfg.batchSize || 1000;
    let all = [];
    let from = 0;

    while (true) {
      if (onProgress) onProgress(all.length);
      const url = `${cfg.supabaseUrl}/rest/v1/${encodeURIComponent(cfg.tableName)}?select=*&order=house.asc.nullslast&order=id.asc`;
      const response = await fetch(url, {
        headers: {
          apikey: cfg.supabaseKey,
          Authorization: `Bearer ${cfg.supabaseKey}`,
          Range: `${from}-${from + batchSize - 1}`,
          'Range-Unit': 'items'
        }
      });

      if (!response.ok) {
        throw new Error(`Supabase load failed ${response.status}: ${await response.text()}`);
      }

      const batch = await response.json();
      all = all.concat(batch || []);
      if (!batch || batch.length < batchSize) break;
      from += batchSize;
    }

    return all;
  },

  async updateRecord(id, patch) {
    const cfg = window.CampaignConfig;
    const response = await fetch(`${cfg.supabaseUrl}/rest/v1/${encodeURIComponent(cfg.tableName)}?id=eq.${encodeURIComponent(id)}`, {
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
