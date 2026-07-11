/* MODULE: Resident Selection Assignment Workflow | VERSION: 1.1.0 */
(() => {
  'use strict';

  const text = value => String(value ?? '').trim();
  const selectedIds = new Set();
  let client = null;
  let observerQueued = false;
  let activeAssignee = text(localStorage.getItem('campaign_active_assignee'));

  function db() {
    if (client) return client;
    const cfg = window.CampaignConfig;
    if (!cfg?.supabaseUrl || !cfg?.supabaseKey || !window.supabase) return null;
    client = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    });
    return client;
  }

  function app() {
    return window.CampaignApp;
  }

  function residentById(id) {
    return app()?.state?.rows?.find(row => String(row.id) === String(id));
  }

  function assignmentsForResident(id) {
    return (app()?.state?.assignments || []).filter(
      item => String(item.resident_id) === String(id)
    );
  }

  function assignmentNames(id) {
    return [...new Set(assignmentsForResident(id).map(item => text(item.assignee_name)).filter(Boolean))];
  }

  function assigneeOptions() {
    return [...new Set((app()?.state?.assignments || [])
      .map(item => text(item.assignee_name))
      .filter(Boolean))]
      .sort((a, b) => a.localeCompare(b));
  }

  function assignedBadge(id) {
    const names = assignmentNames(id);
    if (!names.length) return '';
    return `<span class="resident-assigned-badge" title="${names.join(', ').replace(/"/g, '&quot;')}">Assigned: ${names.join(', ')}</span>`;
  }

  function addResidentSelectionUi() {
    if (app()?.state?.section !== 'residents') return;
    const panel = document.querySelector('#pageContent .panel');
    if (!panel) return;

    if (!document.getElementById('residentSelectionStyle')) {
      const style = document.createElement('style');
      style.id = 'residentSelectionStyle';
      style.textContent = `
        .resident-assigned-badge{display:inline-block;margin-top:6px;padding:3px 8px;border-radius:999px;background:#dcfce7;color:#166534;font-size:12px;font-weight:700;line-height:1.25}
        .resident-selection-cell{display:flex;align-items:center;gap:8px}
        #residentSelectionBar input{min-width:210px}
      `;
      document.head.appendChild(style);
    }

    if (!document.getElementById('residentSelectionBar')) {
      const bar = document.createElement('div');
      bar.id = 'residentSelectionBar';
      bar.className = 'assignment-share-bar';
      bar.innerHTML = `
        <div>
          <strong>Select residents and save</strong>
          <small>Choose an assignee to reload saved selections. Green labels show every saved assignment.</small>
        </div>
        <label style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
          <span>Assignee</span>
          <input id="residentSelectionAssignee" list="residentAssigneeList" value="${activeAssignee.replace(/"/g, '&quot;')}" placeholder="Write or choose assignee" autocomplete="off">
          <datalist id="residentAssigneeList">${assigneeOptions().map(name => `<option value="${name.replace(/"/g, '&quot;')}"></option>`).join('')}</datalist>
          <button id="loadResidentSelection" type="button" class="btn secondary">Load Saved</button>
          <button id="saveResidentSelection" type="button" class="btn primary">Save Selection</button>
          <span id="residentSelectionCount">${selectedIds.size} selected</span>
        </label>`;
      panel.prepend(bar);
    }

    const list = document.getElementById('residentAssigneeList');
    if (list) list.innerHTML = assigneeOptions().map(name => `<option value="${name.replace(/"/g, '&quot;')}"></option>`).join('');

    document.querySelectorAll('.resident-gallery-card').forEach(card => {
      const edit = card.querySelector('[data-edit-section="residents"][data-edit-id]');
      if (!edit) return;
      const id = String(edit.dataset.editId);

      if (!card.querySelector('.resident-select-checkbox')) {
        const box = document.createElement('input');
        box.type = 'checkbox';
        box.className = 'resident-select-checkbox';
        box.dataset.residentId = id;
        box.setAttribute('aria-label', 'Select resident');
        box.style.cssText = 'position:absolute;top:10px;left:10px;width:22px;height:22px;z-index:3';
        card.style.position = 'relative';
        card.prepend(box);
      }

      const body = card.querySelector('.resident-gallery-body');
      if (body) {
        body.querySelector('.resident-assigned-badge')?.remove();
        body.insertAdjacentHTML('beforeend', assignedBadge(id));
      }
    });

    document.querySelectorAll('.data-table tbody tr').forEach(row => {
      const edit = row.querySelector('[data-edit-section="residents"][data-edit-id]');
      if (!edit) return;
      const id = String(edit.dataset.editId);
      const firstCell = row.querySelector('td');
      const nameCell = row.querySelectorAll('td')[1];
      if (!firstCell) return;

      if (!row.querySelector('.resident-select-checkbox')) {
        const box = document.createElement('input');
        box.type = 'checkbox';
        box.className = 'resident-select-checkbox';
        box.dataset.residentId = id;
        box.setAttribute('aria-label', 'Select resident');
        box.style.cssText = 'width:20px;height:20px;margin-right:10px;vertical-align:middle';
        firstCell.prepend(box);
      }

      if (nameCell) {
        nameCell.querySelector('.resident-assigned-badge')?.remove();
        nameCell.insertAdjacentHTML('beforeend', assignedBadge(id));
      }
    });

    syncCheckboxes();
  }

  function updateSelectionCount() {
    const count = document.getElementById('residentSelectionCount');
    if (count) count.textContent = `${selectedIds.size} selected`;
  }

  async function loadAssigneeSelection(name) {
    activeAssignee = text(name);
    selectedIds.clear();
    localStorage.setItem('campaign_active_assignee', activeAssignee);

    const input = document.getElementById('residentSelectionAssignee');
    if (input && input.value !== activeAssignee) input.value = activeAssignee;

    if (!activeAssignee) {
      syncCheckboxes();
      return;
    }

    const database = db();
    if (!database) throw new Error('Supabase is not available.');
    const { data, error } = await database
      .from('resident_assignments')
      .select('resident_id')
      .ilike('assignee_name', activeAssignee);
    if (error) throw error;
    (data || []).forEach(row => selectedIds.add(String(row.resident_id)));
    syncCheckboxes();
  }

  function syncCheckboxes() {
    document.querySelectorAll('.resident-select-checkbox').forEach(box => {
      box.checked = selectedIds.has(String(box.dataset.residentId));
    });
    updateSelectionCount();
  }

  async function saveSelection() {
    const input = document.getElementById('residentSelectionAssignee');
    const assignee = text(input?.value);
    if (!assignee) {
      alert('Write or choose the assignee name before saving.');
      input?.focus();
      return;
    }

    const button = document.getElementById('saveResidentSelection');
    if (button) {
      button.disabled = true;
      button.textContent = 'Saving…';
    }

    try {
      const database = db();
      if (!database) throw new Error('Supabase is not available.');

      const { data: existing, error: existingError } = await database
        .from('resident_assignments')
        .select('resident_id')
        .ilike('assignee_name', assignee);
      if (existingError) throw existingError;

      const existingIds = new Set((existing || []).map(row => String(row.resident_id)));
      const nextIds = new Set(selectedIds);
      const removeIds = [...existingIds].filter(id => !nextIds.has(id));
      const addIds = [...nextIds].filter(id => !existingIds.has(id));

      if (removeIds.length) {
        const { error } = await database
          .from('resident_assignments')
          .delete()
          .ilike('assignee_name', assignee)
          .in('resident_id', removeIds.map(Number));
        if (error) throw error;
      }

      if (addIds.length) {
        const now = new Date().toISOString();
        const state = app()?.state || {};
        const payload = addIds.map(id => {
          const resident = residentById(id);
          return {
            resident_id: Number(id),
            assignee_name: assignee,
            assigned_at: now,
            source_house: text(resident?.house) || null,
            source_party: text(resident?.party) || null,
            source_search: text(state.search) || null
          };
        });
        const { error } = await database.from('resident_assignments').insert(payload);
        if (error && error.code !== '23505') throw error;
      }

      activeAssignee = assignee;
      localStorage.setItem('campaign_active_assignee', activeAssignee);
      await refreshAssignmentState();
      await loadAssigneeSelection(activeAssignee);
      queueApply();
      alert(`Saved ${selectedIds.size} resident${selectedIds.size === 1 ? '' : 's'} for ${assignee}.`);
    } catch (error) {
      console.error('Save selection failed:', error);
      alert(`Selection was not saved: ${error.message}`);
    } finally {
      if (button) {
        button.disabled = false;
        button.textContent = 'Save Selection';
      }
    }
  }

  async function refreshAssignmentState() {
    const database = db();
    const application = app();
    if (!database || !application?.state) return;
    const { data, error } = await database
      .from('resident_assignments')
      .select('resident_id,assignee_name,assigned_at')
      .order('assigned_at', { ascending: false });
    if (error) throw error;
    application.state.assignments = data || [];
  }

  function renderAssignPageFromTable() {
    if (app()?.state?.section !== 'assign') return;
    const state = app().state;
    const assignments = state.assignments || [];
    const residents = state.rows || [];
    const byId = new Map(residents.map(row => [String(row.id), row]));
    const party = state.party;
    const query = text(state.search).toLowerCase();
    const addressFilter = state.filters?.address;
    const assigneeFilter = state.filters?.assigner;

    const rows = assignments
      .map(item => ({ assignment: item, resident: byId.get(String(item.resident_id)) }))
      .filter(item => item.resident)
      .filter(item => party === 'all' || String(item.resident.party || '').toUpperCase() === party)
      .filter(item => !addressFilter || addressFilter === 'all' || text(item.resident.house) === addressFilter)
      .filter(item => !assigneeFilter || assigneeFilter === 'all' || text(item.assignment.assignee_name) === assigneeFilter)
      .filter(item => !query || [item.resident.name, item.resident.national_id, item.resident.phone, item.resident.house, item.assignment.assignee_name]
        .map(text).join(' ').toLowerCase().includes(query));

    const table = document.querySelector('#pageContent .data-table');
    if (!table) return;
    table.innerHTML = `
      <thead><tr><th>Photo</th><th>Name / ID</th><th>Official Address</th><th>Phone</th><th>Assignee</th><th>Assigned At</th><th>Action</th></tr></thead>
      <tbody>${rows.map(({ assignment, resident }) => `
        <tr>
          <td>${resident.photo_url ? `<img class="avatar avatar-image" src="${String(resident.photo_url).replace(/"/g, '&quot;')}" alt="">` : '<span class="avatar">?</span>'}</td>
          <td><strong>${text(resident.name) || 'No name'}</strong><br><small>${text(resident.national_id) || 'No ID'}</small></td>
          <td>${text(resident.house) || 'No Address'}</td>
          <td>${text(resident.phone) || '-'}</td>
          <td>${text(assignment.assignee_name)}</td>
          <td>${assignment.assigned_at ? new Date(assignment.assigned_at).toLocaleString('en-GB') : '-'}</td>
          <td><button class="btn primary" data-edit-id="${resident.id}" data-edit-section="assign">Edit</button></td>
        </tr>`).join('') || '<tr><td colspan="7">No saved assignments found</td></tr>'}</tbody>`;

    const pill = document.querySelector('#pageContent .record-pill');
    if (pill) pill.textContent = `${rows.length.toLocaleString()} records`;
  }

  function applyWorkflow() {
    addResidentSelectionUi();
    renderAssignPageFromTable();
  }

  function queueApply() {
    if (observerQueued) return;
    observerQueued = true;
    requestAnimationFrame(() => {
      observerQueued = false;
      applyWorkflow();
    });
  }

  document.addEventListener('change', event => {
    const box = event.target.closest('.resident-select-checkbox');
    if (box) {
      const id = String(box.dataset.residentId);
      if (box.checked) selectedIds.add(id);
      else selectedIds.delete(id);
      updateSelectionCount();
      return;
    }

    if (event.target.id === 'residentSelectionAssignee') {
      loadAssigneeSelection(event.target.value).catch(error => alert(error.message));
    }
  });

  document.addEventListener('click', event => {
    if (event.target.closest('#loadResidentSelection')) {
      const name = document.getElementById('residentSelectionAssignee')?.value;
      loadAssigneeSelection(name).catch(error => alert(error.message));
    }
    if (event.target.closest('#saveResidentSelection')) saveSelection();
  });

  document.addEventListener('DOMContentLoaded', () => {
    const root = document.getElementById('adminApp') || document.body;
    new MutationObserver(queueApply).observe(root, { childList: true, subtree: true });
    setTimeout(async () => {
      try {
        await refreshAssignmentState();
        if (activeAssignee) await loadAssigneeSelection(activeAssignee);
        queueApply();
      } catch (error) {
        console.error('Assignment load failed:', error);
      }
    }, 500);
  });
})();
