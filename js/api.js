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
  normalizePatch(patch) {
    const clean = { ...patch };
    if (clean.vote_status === 'will-vote') {
      clean.reach_status = 'reached';
    }
    if (Object.prototype.hasOwnProperty.call(clean, 'vote_assigned_by') && !clean.vote_assigned_by) {
      clean.vote_assigned_at = null;
    }
    return clean;
  },
  async updateRecord(id, patch) {
    const cfg = window.CampaignConfig;
    const cleanPatch = this.normalizePatch(patch);
    const url = `${cfg.supabaseUrl}/rest/v1/${encodeURIComponent(cfg.tableName)}?id=eq.${encodeURIComponent(id)}`;
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        apikey: cfg.supabaseKey,
        Authorization: `Bearer ${cfg.supabaseKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation'
      },
      body: JSON.stringify(cleanPatch)
    });
    if (!response.ok) {
      throw new Error(`Save failed ${response.status}: ${await response.text()}`);
    }
    return response.json();
  },
  async bulkUpdate(ids, patch) {
    if (!ids.length) return [];
    const cfg = window.CampaignConfig;
    const cleanPatch = this.normalizePatch({ ...patch, election_review_updated_at: new Date().toISOString() });
    const url = `${cfg.supabaseUrl}/rest/v1/${encodeURIComponent(cfg.tableName)}?id=in.(${ids.map(id => encodeURIComponent(id)).join(',')})`;
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        apikey: cfg.supabaseKey,
        Authorization: `Bearer ${cfg.supabaseKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation'
      },
      body: JSON.stringify(cleanPatch)
    });
    if (!response.ok) throw new Error(`Bulk update failed ${response.status}: ${await response.text()}`);
    return response.json();
  },
  async bulkDelete(ids) {
    if (!ids.length) return [];
    const cfg = window.CampaignConfig;
    const url = `${cfg.supabaseUrl}/rest/v1/${encodeURIComponent(cfg.tableName)}?id=in.(${ids.map(id => encodeURIComponent(id)).join(',')})`;
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        apikey: cfg.supabaseKey,
        Authorization: `Bearer ${cfg.supabaseKey}`,
        Prefer: 'return=representation'
      }
    });
    if (!response.ok) throw new Error(`Bulk delete failed ${response.status}: ${await response.text()}`);
    return response.json();
  }
};

Object.assign(window, {
  fetchRecords: (...args) => window.CampaignApi.fetchAllRows(...args),
  fetchStats: async () => window.CampaignMetrics.calculate(await window.CampaignApi.fetchAllRows()),
  updateRecord: (...args) => window.CampaignApi.updateRecord(...args),
  bulkUpdateRecords: (...args) => window.CampaignApi.bulkUpdate(...args),
  bulkDeleteRecords: (...args) => window.CampaignApi.bulkDelete(...args)
});
