/* MODULE: Clickable Section Stat Filters | VERSION: 1.1.0 */
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
      'not decided': { type: 'filter', name: 'voteStatus', value: 'pending', fallback: 'not-decided' }
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

  function hasPendingVotes() {
    return !!window.CampaignApp?.state?.rows?.some(row => text(row.vote_status) === 'pending');
  }

  function resolvedValue(action) {
    if (action?.name === 'voteStatus' && action.value === 'pending' && !hasPendingVotes()) {
      return action.fallback || 'not-decided';
    }
    return action?.value;
  }

  function ensureOption(select, value, label) {
    if (!select || [...select.options].some(option => option.value === value)) return;
    const option = document.createElement('option');
    option.value = value;
    option.textContent = label;
    select.appendChild(option);
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
    const value = resolvedValue(action);
    if (value === 'pending') ensureOption(select, 'pending', 'Not Decided');
    select.value = value;
    select.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function isActive(action) {
    if (!action) return false;
    if (action.type === 'party') {
      return document.getElementById('globalParty')?.value === action.value;
    }
    const select = document.querySelector(`[data-filter="${action.name}"]`);
    return select?.value === resolvedValue(action);
  }

  function decorateCards() {
    const section = sectionName();
    const map = mappings[section] || {};
    document.querySelectorAll('.stats-grid .stat-card').forEach(card => {
      const label = text(card.querySelector('span')?.textContent);
      const action = map[label];
      const active = isActive(action);
      card.dataset.statFilter = action ? label : '';
      card.style.cursor = action ? 'pointer' : 'default';
      card.style.userSelect = action ? 'none' : '';
      card.style.outline = active ? '3px solid #2563eb' : '';
      card.style.outlineOffset = active ? '2px' : '';
      card.style.transform = active ? 'translateY(-2px)' : '';
      card.title = action ? `Filter by ${card.querySelector('span')?.textContent || label}` : '';
      card.setAttribute('role', action ? 'button' : 'group');
      card.setAttribute('aria-pressed', action ? String(active) : 'false');
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
    setTimeout(scheduleDecorate, 0);
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

  document.addEventListener('change', scheduleDecorate, true);
  document.addEventListener('DOMContentLoaded', () => {
    new MutationObserver(scheduleDecorate).observe(document.body, { childList: true, subtree: true });
    scheduleDecorate();
  });
})();
