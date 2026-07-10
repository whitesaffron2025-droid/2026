(() => {
  'use strict';

  const cfg = window.CampaignConfig;
  if (!cfg || !window.supabase) return;

  const db = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseKey, {
    auth: { persistSession: true, autoRefreshToken: true }
  });

  const selected = new Set();
  let busy = false;

  const text = value => String(value ?? '').trim();
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[char]));

  const sectionOf = form => text(form?.dataset?.section).toLowerCase();
  const livingOf = row => text(row.living_place) || text(row.lives_in) || '';

  async function getResident(id) {
    const { data, error } = await db.from(cfg.tableName)
      .select('id,name,national_id,house,phone,living_place,lives_in,call_attempts,remarks')
      .eq('id', id).single();
    if (error) throw error;
    return data;
  }

  function inputField(label, name, value) {
    const wrap = document.createElement('label');
    wrap.className = 'editor-field section-logic-field';
    wrap.innerHTML = `<span>${esc(label)}</span><input name="${esc(name)}" value="${esc(value || '')}">`;
    return wrap;
  }

  async function decorateEditor(form) {
    if (!form || form.dataset.workflowReady === '1') return;
    const section = sectionOf(form);
    if (!['assign','calls','votes','visits','transport'].includes(section)) return;

    form.dataset.workflowReady = '1';
    const resident = await getResident(form.dataset.id);
    const grid = form.querySelector('.editor-grid');
    if (!grid) return;

    form.querySelector('[name="phone"]')?.closest('label')?.remove();
    form.querySelector('[name="living_place"]')?.closest('label')?.remove();

    const identity = grid.querySelector('.locked-identity');
    const anchor = identity?.nextSibling || grid.firstChild;

    grid.insertBefore(inputField('Phone Number', 'phone', resident.phone), anchor);
    grid.insertBefore(inputField('Current Living Place', 'living_place', livingOf(resident)), anchor);
  }

  async function saveWorkflow(event) {
    const form = event.target;
    if (form?.id !== 'editorForm') return;

    const section = sectionOf(form);
    if (!['assign','calls','votes','visits','transport'].includes(section)) return;

    event.preventDefault();
    event.stopImmediatePropagation();

    const values = Object.fromEntries(new FormData(form));
    const id = form.dataset.id;
    const resident = await getResident(id);

    const patch = {
      phone: text(values.phone) || null,
      living_place: text(values.living_place) || null
    };

    if (section === 'assign') {
      patch.vote_assigned_by = values.assign_status === 'unassigned' ? null : (text(values.vote_assigned_by) || null);
      patch.vote_assigned_at = values.assign_status === 'unassigned' ? null : new Date().toISOString();
      patch.remarks = text(values.remarks) || null;
      if (values.assign_status === 'completed') patch.reach_status = 'reached';
    }

    if (section === 'calls') {
      const status = text(values.phone_status) || 'need-call';
      patch.phone_status = status;
      patch.call_outcome = status;
      patch.call_center_agent = text(values.call_center_agent) || null;
      patch.call_notes = text(values.call_notes) || null;
      patch.last_call_at = new Date().toISOString();
      patch.call_attempts = Number(resident.call_attempts || 0) + 1;
      if (['connected','called'].includes(status)) patch.reach_status = 'reached';
    }

    if (section === 'votes') {
      patch.vote_status = text(values.vote_status) || 'not-decided';
      patch.support_level = text(values.support_level) || 'normal';
      patch.remarks = text(values.remarks) || null;
      if (['will-vote','not-vote'].includes(patch.vote_status) || patch.support_level === 'guaranteed') {
        patch.reach_status = 'reached';
      }
    }

    if (section === 'visits') {
      patch.d2d_status = text(values.d2d_status) || 'not-visited';
      patch.remarks = text(values.remarks) || null;
      if (patch.d2d_status === 'reach') patch.reach_status = 'reached';
    }

    if (section === 'transport') {
      patch.transport_status = text(values.transport_status) || 'not-needed';
      patch.remarks = text(values.remarks) || null;
    }

    const save = form.querySelector('.editor-save');
    if (save) {
      save.disabled = true;
      save.textContent = 'Saving…';
    }

    const { error } = await db.from(cfg.tableName).update(patch).eq('id', id);

    if (error) {
      if (save) {
        save.disabled = false;
        save.textContent = 'Save Changes';
      }
      alert(error.message);
      return;
    }

    document.getElementById('sectionEditor')?.remove();
    location.reload();
  }

  async function residentMap(ids) {
    if (!ids.length) return new Map();
    const { data, error } = await db.from(cfg.tableName)
      .select('id,phone,living_place,lives_in')
      .in('id', ids);
    if (error) throw error;
    return new Map((data || []).map(row => [String(row.id), row]));
  }

  function insertCell(row, before, html, className) {
    if (row.querySelector('.' + className)) return;
    const cell = document.createElement('td');
    cell.className = className;
    cell.innerHTML = html;
    row.insertBefore(cell, before || null);
  }

  async function decorateAssignPage() {
    const heading = document.querySelector('#pageContent .page-head h1');
    const table = document.querySelector('#pageContent table.data-table');

    if (text(heading?.textContent) !== 'Assign' || !table || table.dataset.workflowReady === '1') return;
    table.dataset.workflowReady = '1';

    const header = table.querySelector('thead tr');

    const selectHead = document.createElement('th');
    selectHead.textContent = 'Select';
    header.prepend(selectHead);

    const livingHead = document.createElement('th');
    livingHead.textContent = 'Living Now';
    const phoneHead = [...header.children].find(cell => text(cell.textContent) === 'Phone');
    header.insertBefore(livingHead, phoneHead || null);

    const rows = [...table.querySelectorAll('tbody tr')];
    const ids = rows.map(row => row.querySelector('[data-edit-id]')?.dataset.editId).filter(Boolean);
    const map = await residentMap(ids);

    rows.forEach(row => {
      const id = row.querySelector('[data-edit-id]')?.dataset.editId;
      if (!id) return;

      const resident = map.get(String(id)) || {};
      insertCell(
        row,
        row.firstElementChild,
        `<input type="checkbox" data-share-id="${esc(id)}" ${selected.has(String(id)) ? 'checked' : ''}>`,
        'share-select-cell'
      );

      const phoneCell = [...row.children].find(cell => text(cell.textContent) === text(resident.phone));
      insertCell(row, phoneCell, esc(livingOf(resident) || 'Not recorded'), 'share-living-cell');
    });

    if (!document.querySelector('.share-toolbar')) {
      const toolbar = document.createElement('div');
      toolbar.className = 'share-toolbar';
      toolbar.innerHTML = `
        <label><input id="selectVisibleShare" type="checkbox"> Select visible</label>
        <strong><span id="shareCount">${selected.size}</span> selected</strong>
        <input id="shareAssignee" type="text" placeholder="Assignee name">
        <select id="shareWorkflow">
          <option value="assign">Assignment</option>
          <option value="calls">Calls</option>
          <option value="votes">Votes</option>
          <option value="visits">Visits</option>
          <option value="transport">Transport</option>
        </select>
        <button id="assignSelected" class="btn primary" type="button">Assign Selected</button>
        <button id="copyShareLink" class="btn secondary" type="button">Copy Shared Link</button>`;

      const wrap = table.closest('.table-wrap');
      wrap.parentNode.insertBefore(toolbar, wrap);
    }
  }

  async function assignSelected() {
    const ids = [...selected];
    const assignee = text(document.getElementById('shareAssignee')?.value);

    if (!ids.length) return alert('Select at least one resident.');
    if (!assignee) return alert('Enter the assignee name.');

    const { data: authData } = await db.auth.getUser();
    const assignedBy = authData?.user?.email || cfg.adminEmail || 'Admin';
    const assignedAt = new Date().toISOString();

    const results = await Promise.all(ids.map(id =>
      db.from(cfg.tableName).update({
        vote_assigned_by: assignee,
        vote_assigned_at: assignedAt,
        remarks: `Assigned to ${assignee} by ${assignedBy} on ${assignedAt}`
      }).eq('id', id)
    ));

    const failed = results.find(result => result.error);
    if (failed) return alert(failed.error.message);

    alert(`${ids.length} resident(s) assigned to ${assignee}.`);
    location.reload();
  }

  function copySharedLink() {
    const ids = [...selected];
    const assignee = text(document.getElementById('shareAssignee')?.value);
    const workflow = text(document.getElementById('shareWorkflow')?.value) || 'assign';

    if (!ids.length) return alert('Select at least one resident.');
    if (!assignee) return alert('Enter the assignee name.');

    const link = new URL('../shared.html', location.href);
    link.searchParams.set('assignee', assignee);
    link.searchParams.set('workflow', workflow);
    link.searchParams.set('ids', ids.join(','));

    navigator.clipboard?.writeText(link.href)
      .then(() => alert('Shared link copied.'))
      .catch(() => prompt('Copy this shared link:', link.href));
  }

  async function decorate() {
    if (busy) return;
    busy = true;
    try {
      await decorateAssignPage();
      const form = document.getElementById('editorForm');
      if (form) await decorateEditor(form);
    } finally {
      busy = false;
    }
  }

  document.addEventListener('submit', saveWorkflow, true);

  document.addEventListener('change', event => {
    if (event.target.matches('[data-share-id]')) {
      const id = String(event.target.dataset.shareId);
      event.target.checked ? selected.add(id) : selected.delete(id);
      const count = document.getElementById('shareCount');
      if (count) count.textContent = selected.size;
    }

    if (event.target.id === 'selectVisibleShare') {
      document.querySelectorAll('[data-share-id]').forEach(input => {
        input.checked = event.target.checked;
        const id = String(input.dataset.shareId);
        event.target.checked ? selected.add(id) : selected.delete(id);
      });

      const count = document.getElementById('shareCount');
      if (count) count.textContent = selected.size;
    }
  });

  document.addEventListener('click', event => {
    if (event.target.id === 'assignSelected') assignSelected();
    if (event.target.id === 'copyShareLink') copySharedLink();
  });

  new MutationObserver(decorate).observe(document.documentElement, {
    childList: true,
    subtree: true
  });

  decorate();
})();
