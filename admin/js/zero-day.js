/* Aggregate Zero Day Operations */
(() => {
  'use strict';
  const cfg = window.CampaignConfig;
  let db;

  function client() {
    if (db) return db;
    if (!window.supabase || !cfg?.supabaseUrl || !cfg?.supabaseKey) return null;
    db = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    });
    return db;
  }

  function addStyles() {
    if (document.getElementById('zeroDayCss')) return;
    const style = document.createElement('style');
    style.id = 'zeroDayCss';
    style.textContent = '.zd-title{display:flex;justify-content:space-between;align-items:center;margin-bottom:18px}.zd-title h1{margin:0;font-size:32px}.zd-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:18px}.zd-card,.zd-panel{background:#fff;border-radius:18px;padding:20px;box-shadow:0 8px 28px rgba(20,42,78,.08)}.zd-card span{display:block;color:#637a98;font-size:12px;font-weight:800;text-transform:uppercase}.zd-card strong{display:block;margin-top:8px;font-size:30px}.zd-actions{display:flex;gap:10px;flex-wrap:wrap}.zd-actions button,.zd-refresh{border:0;border-radius:12px;padding:12px 18px;background:#4f7df3;color:#fff;font-weight:800;cursor:pointer}.zd-actions button[data-delta="-1"],.zd-refresh{background:#8290a5}.zd-hours{display:grid;gap:10px;margin-top:14px}.zd-hour{display:grid;grid-template-columns:70px 1fr 50px;gap:12px;align-items:center}.zd-bar{height:10px;background:#e8eef7;border-radius:999px;overflow:hidden}.zd-bar i{display:block;height:100%;background:#4f7df3}.zd-note{margin-top:12px;color:#68788d;font-size:13px}@media(max-width:900px){.zd-grid{grid-template-columns:repeat(2,1fr)}}';
    document.head.appendChild(style);
  }

  function addNav() {
    const nav = document.querySelector('.nav');
    if (!nav || nav.querySelector('[data-zero-day-nav]')) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.zeroDayNav = '1';
    button.textContent = 'Zero Day';
    nav.appendChild(button);
  }

  async function readEvents() {
    const c = client();
    if (!c) throw new Error('Database connection unavailable');
    const { data, error } = await c.from('zero_day_events').select('delta,created_at').order('created_at');
    if (error) throw error;
    return data || [];
  }

  function hourRows(events) {
    const map = new Map();
    events.forEach(event => {
      const date = new Date(event.created_at);
      if (Number.isNaN(date.getTime())) return;
      const hour = `${String(date.getHours()).padStart(2, '0')}:00`;
      map.set(hour, (map.get(hour) || 0) + Number(event.delta || 0));
    });
    return [...map.entries()].map(([hour, total]) => ({ hour, total })).filter(item => item.total !== 0);
  }

  async function render() {
    if (location.hash !== '#zeroday') return;
    addStyles();
    addNav();
    document.querySelectorAll('.nav button').forEach(button => button.classList.toggle('active', button.dataset.zeroDayNav === '1'));
    const host = document.getElementById('pageContent');
    if (!host) return;
    host.innerHTML = '<div class="md-loading">Loading Zero Day operations…</div>';
    try {
      const events = await readEvents();
      const target = 420;
      const recorded = Math.max(0, events.reduce((sum, event) => sum + Number(event.delta || 0), 0));
      const remaining = Math.max(0, target - recorded);
      const progress = target ? Math.round(recorded / target * 100) : 0;
      const hours = hourRows(events);
      const max = Math.max(1, ...hours.map(item => Math.abs(item.total)));
      host.innerHTML = `
        <section class="zd-title"><h1>Zero Day Operations</h1><button class="zd-refresh" id="zeroDayRefresh">Refresh</button></section>
        <section class="zd-grid">
          <article class="zd-card"><span>Operational Target</span><strong>${target}</strong></article>
          <article class="zd-card"><span>Recorded Turnout</span><strong>${recorded}</strong></article>
          <article class="zd-card"><span>Remaining</span><strong>${remaining}</strong></article>
          <article class="zd-card"><span>Progress</span><strong>${progress}%</strong></article>
        </section>
        <section class="zd-panel">
          <h2>Record Aggregate Turnout</h2>
          <div class="zd-actions">
            <button data-delta="1">+1</button>
            <button data-delta="5">+5</button>
            <button data-delta="10">+10</button>
            <button data-delta="-1">−1 correction</button>
          </div>
          <div class="zd-note">Totals only. No names, IDs, or person-level turnout are stored.</div>
        </section>
        <section class="zd-panel"><h2>Hourly Activity</h2><div class="zd-hours">${hours.length ? hours.map(item => `<div class="zd-hour"><strong>${item.hour}</strong><div class="zd-bar"><i style="width:${Math.min(100,Math.round(Math.abs(item.total)/max*100))}%"></i></div><span>${item.total}</span></div>`).join('') : '<div class="zd-note">No turnout entries yet.</div>'}</div></section>
      `;
    } catch (error) {
      host.innerHTML = `<section class="zd-panel">Zero Day could not load: ${String(error.message || error)}</section>`;
    }
  }

  async function add(delta) {
    const c = client();
    if (!c) return;
    const { error } = await c.from('zero_day_events').insert({ event_type: delta < 0 ? 'correction' : 'vote', delta });
    if (error) return alert(error.message);
    render();
  }

  document.addEventListener('click', event => {
    if (event.target.closest('[data-zero-day-nav]')) {
      location.hash = '#zeroday';
      render();
      return;
    }
    const button = event.target.closest('[data-delta]');
    if (button && location.hash === '#zeroday') add(Number(button.dataset.delta));
    if (event.target.closest('#zeroDayRefresh')) render();
  });

  window.addEventListener('hashchange', render);
  document.addEventListener('DOMContentLoaded', () => {
    addNav();
    const observer = new MutationObserver(addNav);
    observer.observe(document.body, { childList: true, subtree: true });
    render();
  });
})();