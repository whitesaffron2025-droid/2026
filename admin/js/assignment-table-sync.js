/* MODULE: Resident Assignment Table Sync | VERSION: 1.0.0 */
(() => {
  'use strict';

  const text = value => String(value ?? '').trim();
  let client = null;

  function getClient() {
    if (client) return client;
    const cfg = window.CampaignConfig;
    if (!cfg?.supabaseUrl || !cfg?.supabaseKey || !window.supabase) return null;
    client = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    });
    return client;
  }

  async function syncAssignment(form) {
    const db = getClient();
    if (!db) throw new Error('Supabase is not available.');

    const values = Object.fromEntries(new FormData(form));
    const residentId = Number(form.dataset.id);
    const status = text(values.assign_status);
    const assigneeName = text(values.vote_assigned_by);
    const app = window.CampaignApp;
    const resident = app?.state?.rows?.find(row => Number(row.id) === residentId);

    if (!residentId) throw new Error('Resident ID is missing.');

    if (status === 'unassigned') {
      const { error } = await db
        .from('resident_assignments')
        .delete()
        .eq('resident_id', residentId);
      if (error) throw error;

      if (app?.state?.assignments) {
        app.state.assignments = app.state.assignments.filter(
          item => Number(item.resident_id) !== residentId
        );
      }
      return;
    }

    if (!assigneeName) {
      throw new Error('Write the assignee name before saving.');
    }

    const { data: existing, error: lookupError } = await db
      .from('resident_assignments')
      .select('id,resident_id,assignee_name,assigned_at')
      .eq('resident_id', residentId)
      .ilike('assignee_name', assigneeName)
      .limit(1);

    if (lookupError) throw lookupError;
    if (existing?.length) return;

    const assignedAt = new Date().toISOString();
    const payload = {
      resident_id: residentId,
      assignee_name: assigneeName,
      assigned_at: assignedAt,
      source_house: text(resident?.house) || null,
      source_party: text(resident?.party) || null,
      source_search: text(app?.state?.search) || null
    };

    const { data, error } = await db
      .from('resident_assignments')
      .insert(payload)
      .select('resident_id,assignee_name,assigned_at')
      .single();

    if (error && error.code !== '23505') throw error;

    if (data && app?.state?.assignments) {
      app.state.assignments.unshift(data);
    }
  }

  document.addEventListener('submit', event => {
    const form = event.target;
    if (!(form instanceof HTMLFormElement)) return;
    if (form.id !== 'editorForm' || form.dataset.section !== 'assign') return;

    const values = Object.fromEntries(new FormData(form));
    if (text(values.assign_status) !== 'unassigned' && !text(values.vote_assigned_by)) {
      event.preventDefault();
      event.stopImmediatePropagation();
      alert('Write the assignee name before saving.');
      return;
    }

    syncAssignment(form).catch(error => {
      console.error('resident_assignments sync failed:', error);
      alert(`Assignment table was not updated: ${error.message}`);
    });
  }, true);
})();
