/* MODULE: Campaign Workflow Hotfix | VERSION: 1.0.0 | BUILD: 2026.07.10 */
(() => {
  'use strict';

  const text = value => String(value ?? '').trim();
  let client = null;
  let assignmentTableAvailable = true;

  function getClient() {
    if (client) return client;
    const cfg = window.CampaignConfig;
    if (!cfg?.supabaseUrl || !cfg?.supabaseKey || !window.supabase) return null;
    client = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    });
    return client;
  }

  function appReady() {
    return !!window.CampaignApp?.state;
  }

  function rebuildMissingHistory() {
    if (!appReady()) return;
    const { state } = window.CampaignApp;
    const existing = new Set(
      state.assignments.map(item => `${String(item.resident_id)}|${text(item.assignee_name).toLowerCase()}`)
    );

    for (const resident of state.rows) {
      const assignee = text(resident.vote_assigned_by);
      if (!assignee) continue;
      const key = `${String(resident.id)}|${assignee.toLowerCase()}`;
      if (existing.has(key)) continue;
      state.assignments.push({
        resident_id: resident.id,
        assignee_name: assignee,
        assigned_at: resident.vote_assigned_at || resident.updated_at || new Date(0).toISOString(),
        recovered: true
      });
      existing.add(key);
    }

    state.assignments.sort((a, b) => new Date(b.assigned_at || 0) - new Date(a.assigned_at || 0));
  }

  async function insertAssignmentHistory(residentId, assignee, assignedAt) {
    const db = getClient();
    if (!db || !assignmentTableAvailable) return false;

    const payload = {
      resident_id: residentId,
      assignee_name: assignee,
      assigned_at: assignedAt
    };

    const { error } = await db.from('resident_assignments').insert(payload);
    if (!error) return true;

    assignmentTableAvailable = false;
    console.error('Assignment history could not be saved:', error);
    showWarning(`Assignment saved to the resident record, but assignment history could not be written: ${error.message}`);
    return false;
  }

  function showWarning(message) {
    let warning = document.getElementById('workflowHotfixWarning');
    if (!warning) {
      warning = document.createElement('div');
      warning.id = 'workflowHotfixWarning';
      warning.style.cssText = 'position:fixed;left:16px;right:16px;bottom:16px;z-index:99999;max-width:760px;margin:auto;padding:14px 16px;border-radius:12px;background:#fff3cd;color:#664d03;border:1px solid #ffecb5;box-shadow:0 10px 30px rgba(0,0,0,.18);font:600 14px/1.45 Inter,system-ui,sans-serif';
      document.body.appendChild(warning);
    }
    warning.textContent = message;
    clearTimeout(warning._timer);
    warning._timer = setTimeout(() => warning.remove(), 9000);
  }

  function validateAssignmentForm(event) {
    const form = event.target;
    if (!(form instanceof HTMLFormElement) || form.id !== 'editorForm' || form.dataset.section !== 'assign') return;

    const status = text(form.elements.assign_status?.value);
    const assignee = text(form.elements.vote_assigned_by?.value);
    if (status !== 'unassigned' && !assignee) {
      event.preventDefault();
      event.stopImmediatePropagation();
      const input = form.elements.vote_assigned_by;
      input?.focus();
      input?.setCustomValidity('Assigner name is required for Assigned or Completed status.');
      input?.reportValidity();
      input?.addEventListener('input', () => input.setCustomValidity(''), { once: true });
      return;
    }

    const app = window.CampaignApp;
    const residentId = form.dataset.id;
    const before = appReady()
      ? app.state.rows.find(row => String(row.id) === String(residentId))
      : null;
    const previousAssignee = text(before?.vote_assigned_by);

    if (status === 'unassigned' || !assignee || assignee.toLowerCase() === previousAssignee.toLowerCase()) return;

    const assignedAt = new Date().toISOString();
    setTimeout(async () => {
      for (let attempt = 0; attempt < 30; attempt += 1) {
        await new Promise(resolve => setTimeout(resolve, 150));
        if (!document.getElementById('sectionEditor')) break;
      }

      if (!appReady()) return;
      const saved = app.state.rows.find(row => String(row.id) === String(residentId));
      if (text(saved?.vote_assigned_by).toLowerCase() !== assignee.toLowerCase()) return;

      const duplicate = app.state.assignments.some(item =>
        String(item.resident_id) === String(residentId) &&
        text(item.assignee_name).toLowerCase() === assignee.toLowerCase()
      );

      if (!duplicate) {
        app.state.assignments.unshift({ resident_id: residentId, assignee_name: assignee, assigned_at: assignedAt });
        await insertAssignmentHistory(residentId, assignee, assignedAt);
        document.dispatchEvent(new CustomEvent('campaign:dashboard'));
      }
    }, 0);
  }

  function waitForApp() {
    let attempts = 0;
    const timer = setInterval(() => {
      attempts += 1;
      if (appReady()) {
        clearInterval(timer);
        rebuildMissingHistory();
        document.dispatchEvent(new CustomEvent('campaign:dashboard'));
      } else if (attempts >= 100) {
        clearInterval(timer);
      }
    }, 100);
  }

  document.addEventListener('submit', validateAssignmentForm, true);
  document.addEventListener('DOMContentLoaded', waitForApp);
})();
