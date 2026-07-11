/* MODULE: Clickable Section Stat Filters | VERSION: 1.0.0 */
(() => {
  'use strict';

  const text = value => String(value ?? '').trim().toLowerCase();
  let scheduled = false;

  const mappings = {
    residents: {
      total: { type: 'party', value: 'all' },
      pnc: { type: 'party', value: 'PNC' },
      mdp: { type: 'party', value: 'MDP' }
    },
    assign: {
      total: { type: 'filter', name: 'assignStatus', value: 'all' },
      unassigned: { type: 'filter', name: 'assignStatus', value: 'unassigned' },
      assigned: { type: 'filter', name: 'assignStatus', value: 'assigned' },
      completed: { type: 'filter', name: 'assignStatus', value: 'completed' }
    },
    calls: {
      total: { type: 'filter', name: 'callStatus', value: 'all' },
      connected: { type: 'filter', name: 'callStatus', value: 'connected' }
    },
    votes: {
      total: { type: 'filter', name: 'voteStatus', value: 'all' },
      'will vote': { type: 'filter', name: 'voteStatus', value: 'will-vote' },
      'not vote': { type: 'filter', name: 'voteStatus', value: 'not-vote' },
      'not decided': { type: 'filter', name: 'voteStatus', value: 'not-decided' }
    },
    visits: {
      total: { type: 'filter', name: 'visitStatus', value: 'all' },
      reached: { type: 'filter', name: 'visitStatus', value: 'reach' },
      'not home': { type: 'filter', name: 'visitStatus', value: 'not-home' },
      'not visited': { type: 'filter', name: 'visitStatus', value: 'not-visited' }
    },
    transport: {
      total: { type: 'filter', name: 'transportStatus', value: 'all' },
      'need transport': { type: 'filter', name: 'transportStatus', value: 'need-transport' },
      arranged: { type: 'filter', name: 'transportStatus', value: 'arranged' },
      'not needed': { type: 'filter', name: 'transportStatus', value: 'not-needed' }
    }
  };

  function sectionName() {
    return window.CampaignApp?.state?.section || location.hash.replace('#', '') || 'residents';
  }

  function applyAction(action) {
    if (!action) return;

    if (action.type === 'party') {
      const select = document.getElementById('globalParty');
      if (!select) return;
      select.value = action.value;
      select.dispatchEvent(new Event('change', { bubbles: true }));
      return;
    }

    const select = document.querySelector(`[data-filter="${action.name}"]`);
    if (!select) return;
    select.value = action.value;
    select.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function decorateCards() {
    const section = sectionName();
    const map = mappings[section] || {};
    document.querySelectorAll('.stats-grid .stat-card').forEach(card => {
      const label = text(card.querySelector('span')?.textContent);
      const action = map[label];
      card.dataset.statFilter = action ? label : '';
      card.style.cursor = action ? 'pointer' : 'default';
      card.style.userSelect = action ? 'none' : '';
      card.title = action ? `Filter by ${card.querySelector('span')?.textContent || label}` : '';
      card.setAttribute('role', action ? 'button' : 'group');
      card.tabIndex = action ? 0 : -1;
    });
  }

  function scheduleDecorate() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      decorateCards();
    });
  }

  function activate(card) {
    const section = sectionName();
    const label = text(card.querySelector('span')?.textContent);
    applyAction(mappings[section]?.[label]);
  }

  document.addEventListener('click', event => {
    const card = event.target.closest('.stats-grid .stat-card[data-stat-filter]');
    if (!card || !card.dataset.statFilter) return;
    activate(card);
  });

  document.addEventListener('keydown', event => {
    if (!['Enter', ' '].includes(event.key)) return;
    const card = event.target.closest('.stats-grid .stat-card[data-stat-filter]');
    if (!card || !card.dataset.statFilter) return;
    event.preventDefault();
    activate(card);
  });

  document.addEventListener('DOMContentLoaded', () => {
    new MutationObserver(scheduleDecorate).observe(document.body, { childList: true, subtree: true });
    scheduleDecorate();
  });
})();