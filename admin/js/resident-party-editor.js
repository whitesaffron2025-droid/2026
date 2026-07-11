/* MODULE: Resident Party Editor | VERSION: 1.0.0 */
(() => {
  'use strict';

  let client = null;
  const text = value => String(value ?? '').trim();

  function db() {
    if (client) return client;
    const cfg = window.CampaignConfig;
    if (!cfg?.supabaseUrl || !cfg?.supabaseKey || !window.supabase) return null;
    client = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    });
    return client;
  }

  function normalizeParty(value) {
    const party = text(value).toUpperCase();
    if (party === 'PNC') return 'PNC';
    if (party === 'MDP') return 'MDP';
    return null;
  }

  function installPartyField() {
    const form = document.querySelector('#editorForm[data-section="residents"]');
    if (!form || form.querySelector('[name="party"]')) return;

    const id = form.dataset.id;
    const resident = window.CampaignApp?.state?.rows?.find(row => String(row.id) === String(id));
    if (!resident) return;

    const current = normalizeParty(resident.party) || '';
    const label = document.createElement('label');
    label.className = 'editor-field';
    label.innerHTML = `<span>Party</span><select name="party">
      <option value="" ${current === '' ? 'selected' : ''}>No Party</option>
      <option value="PNC" ${current === 'PNC' ? 'selected' : ''}>PNC</option>
      <option value="MDP" ${current === 'MDP' ? 'selected' : ''}>MDP</option>
    </select>`;

    const grid = form.querySelector('.editor-grid');
    grid?.insertBefore(label, grid.firstElementChild?.nextSibling || grid.firstElementChild);
  }

  async function saveResident(event) {
    const form = event.target;
    if (!(form instanceof HTMLFormElement) || form.id !== 'editorForm' || form.dataset.section !== 'residents') return;

    event.preventDefault();
    event.stopImmediatePropagation();

    const database = db();
    if (!database) return alert('Database connection is unavailable.');

    const app = window.CampaignApp;
    const id = form.dataset.id;
    const resident = app?.state?.rows?.find(row => String(row.id) === String(id));
    if (!resident) return alert('Resident record could not be found.');

    const values = Object.fromEntries(new FormData(form));
    const previousParty = normalizeParty(resident.party);
    const nextParty = normalizeParty(values.party);
    const patch = {
      party: nextParty,
      living_place: text(values.living_place) || null,
      phone: text(values.phone) || null,
      remarks: text(values.remarks) || null
    };

    const saveButton = form.querySelector('.editor-save');
    if (saveButton) {
      saveButton.disabled = true;
      saveButton.textContent = 'Saving…';
    }

    const table = window.CampaignConfig?.tableName || 'campaign';
    const { data, error } = await database.from(table).update(patch).eq('id', id).select().single();

    if (error) {
      if (saveButton) {
        saveButton.disabled = false;
        saveButton.textContent = 'Save Changes';
      }
      return alert(error.message);
    }

    const index = app.state.rows.findIndex(row => String(row.id) === String(id));
    if (index >= 0) app.state.rows[index] = data;

    const partyChanged = previousParty !== nextParty;
    if (partyChanged) {
      const { error: shareError } = await database.rpc('invalidate_live_turnout_shares');
      if (shareError) console.warn('Old public share links could not be invalidated:', shareError);
    }

    document.getElementById('sectionEditor')?.remove();

    if (partyChanged) {
      alert('Party updated. Existing public turnout links were expired. Create a new Share Preview link.');
    }

    location.reload();
  }

  document.addEventListener('submit', saveResident, true);
  document.addEventListener('DOMContentLoaded', () => {
    const observer = new MutationObserver(installPartyField);
    observer.observe(document.body, { childList: true, subtree: true });
    installPartyField();
  });
})();