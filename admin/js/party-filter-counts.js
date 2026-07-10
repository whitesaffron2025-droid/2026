/* MODULE: Party Filter Counts | VERSION: 1.0.0 */
(() => {
  'use strict';
  const cfg = window.CampaignConfig;
  if (!cfg || !window.supabase) return;

  const db = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseKey, {
    auth: { persistSession: true, autoRefreshToken: true }
  });
  let counts = null;
  let loading = false;

  const partyKey = value => {
    const v = String(value ?? '').trim().toUpperCase();
    if (v === 'PNC') return 'PNC';
    if (v === 'MDP') return 'MDP';
    return 'NONE';
  };

  async function loadCounts() {
    if (counts || loading) return counts;
    loading = true;
    const rows = [];
    let from = 0;
    const size = Number(cfg.batchSize || 1000);
    while (true) {
      const { data, error } = await db.from(cfg.tableName).select('party').range(from, from + size - 1);
      if (error) break;
      rows.push(...(data || []));
      if (!data || data.length < size) break;
      from += size;
    }
    counts = { all: rows.length, PNC: 0, MDP: 0, NONE: 0 };
    rows.forEach(row => counts[partyKey(row.party)] += 1);
    loading = false;
    return counts;
  }

  async function decorate() {
    const select = document.getElementById('globalParty');
    if (!select || select.dataset.partyCountsReady === '1') return;
    const c = await loadCounts();
    if (!c) return;
    const current = select.value || 'all';
    select.innerHTML = `
      <option value="all">All (${c.all.toLocaleString()})</option>
      <option value="PNC">PNC (${c.PNC.toLocaleString()})</option>
      <option value="MDP">MDP (${c.MDP.toLocaleString()})</option>
      <option value="">No Party (${c.NONE.toLocaleString()})</option>`;
    select.value = current;
    select.dataset.partyCountsReady = '1';
  }

  new MutationObserver(decorate).observe(document.body, { childList: true, subtree: true });
  decorate();
})();