/* MODULE: Resident Row Selection Assignment Workflow | VERSION: 1.2.0 */
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
        #residentSelectionBar input{min-width:210px}
        .resident-selectable-row{cursor:pointer;transition:background-color .15s ease,box-shadow .15s ease}
        .resident-selectable-row:hover{background:#f8fbff}
        .resident-selectable-row.is-selected{background:#dbeafe!important;box-shadow:inset 4px 0 0 #2563eb}
        .resident-selectable-row.is-selected td{background:transparent!important}
        .resident-gallery-card.resident-selectable-card{cursor:pointer;transition:box-shadow .15s ease,transform .15s ease}
        .resident-gallery-card.resident-selectable-card.is-selected{box-shadow:0 0 0 3px #2563eb!important;background:#eff6ff}
        .resident-selection-mark{display:none;margin-left:8px;padding:2px 7px;border-radius:999px;background:#2563eb;color:#fff;font-size:11px;font-weight:800;vertical-align:middle}
        .is-selected .resident-selection-mark{display:inline-block}
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
          <small>Click a resident row to select or unselect it. Green labels show saved assignments.</small>
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
      card.classList.add('resident-selectable-card');
      card.dataset.residentSelectId = id;
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');
      card.setAttribute('aria-label', 'Select resident');

      const body = card.querySelector('.resident-gallery-body');
      if (body) {
        body.querySelector('.resident-assigned-badge')?.remove();
        body.insertAdjacentHTML('beforeend', assignedBadge(id));
        if (!body.querySelector('.resident-selection-mark')) {
          body.insertAdjacentHTML('beforeend', '<span class="resident-selection-mark">Selected</span>');
        }
      }
    });

    document.querySelectorAll('.data-table tbody tr').forEach(row => {
      const edit = row.querySelector('[data-edit-section="residents"][data-edit-id]');
      if (!edit) return;
      const id = String(edit.dataset.editId);
      row.classList.add('resident-selectable-row');
      row.dataset.residentSelectId = id;
      row.setAttribute('role', 'button');
      row.setAttribute('tabindex', '0');
      row.setAttribute('aria-label', 'Select resident');

      const nameCell = row.querySelectorAll('td')[3] || row.querySelectorAll('td')[1];
      if (nameCell) {
        nameCell.querySelector('.resident-assigned-badge')?.remove();
        nameCell.querySelector('.resident-selection-mark')?.remove();
        nameCell.insertAdjacentHTML('beforeend', assignedBadge(id));
        nameCell.insertAdjacentHTML('beforeend', '<span class="resident-selection-mark">Selected</span>');
      }
    });

    syncSelectionState();
  }

  function updateSelectionCount() {
    const count = document.getElementById('residentSelectionCount');
    if (count) count.textContent = `${selectedIds.size} selected`;
  }

  function syncSelectionState() {
    document.querySelectorAll('[data-resident-select-id]').forEach(element => {
      const selected = selectedIds.has(String(element.dataset.residentSelectId));
      element.classList.toggle('is-selected', selected);
      element.setAttribute('aria-pressed', selected ? 'true' : 'false');
    });
    updateSelectionCount();
  }

  function toggleResidentSelection(element) {
    const id = String(element?.dataset?.residentSelectId || '');
    if (!id) return;
    if (selectedIds.has(id)) selectedIds.delete(id);
    else selectedIds.add(id);
    syncSelectionState();
  }

  async function loadAssigneeSelection(name) {
    activeAssignee = text(name);
    selectedIds.clear();
    localStorage.setItem('campaign_active_assignee', activeAssignee);

    const input = document.getElementById('residentSelectionAssignee');
    if (input && input.value !== activeAssignee) input.value = activeAssignee;

    if (!activeAssignee) {
      syncSelectionState();
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
    syncSelectionState();
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
      .filter(item => !query || [item.resident.id, item.resident.name, item.resident.national_id, item.resident.phone, item.resident.house, item.assignment.assignee_name]
        .map(text).join(' ').toLowerCase().includes(query));

    const table = document.querySelector('#pageContent .data-table');
    if (!table) return;
    table.innerHTML = `
      <thead><tr><th>ID</th><th>Photo</th><th>ID Number</th><th>Name</th><th>Official Address</th><th>Living Now</th><th>Mobile</th><th>Sex</th><th>Age</th><th>Assignee</th><th>Assigned At</th><th>Action</th></tr></thead>
      <tbody>${rows.map(({ assignment, resident }) => `
        <tr>
          <td>${resident.id}</td>
          <td>${resident.photo_url ? `<img class="avatar avatar-image" src="${String(resident.photo_url).replace(/"/g, '&quot;')}" alt="">` : '<span class="avatar">?</span>'}</td>
          <td>${text(resident.national_id) || 'No ID'}</td>
          <td><strong>${text(resident.name) || 'No name'}</strong></td>
          <td>${text(resident.house) || 'No Address'}</td>
          <td>${text(resident.lives_in || resident.living_place) || 'Not recorded'}</td>
          <td>${text(resident.phone) || '-'}</td>
          <td>${text(resident.sex) || '-'}</td>
          <td>${text(resident.age) || '-'}</td>
          <td>${text(assignment.assignee_name)}</td>
          <td>${assignment.assigned_at ? new Date(assignment.assigned_at).toLocaleString('en-GB') : '-'}</td>
          <td><button class="btn primary" data-edit-id="${resident.id}" data-edit-section="assign">Edit</button></td>
        </tr>`).join('') || '<tr><td colspan="12">No saved assignments found</td></tr>'}</tbody>`;

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
    if (event.target.id === 'residentSelectionAssignee') {
      loadAssigneeSelection(event.target.value).catch(error => alert(error.message));
    }
  });

  document.addEventListener('click', event => {
    if (event.target.closest('#loadResidentSelection')) {
      const name = document.getElementById('residentSelectionAssignee')?.value;
      loadAssigneeSelection(name).catch(error => alert(error.message));
      return;
    }
    if (event.target.closest('#saveResidentSelection')) {
      saveSelection();
      return;
    }

    const selectable = event.target.closest('[data-resident-select-id]');
    if (!selectable || app()?.state?.section !== 'residents') return;
    if (event.target.closest('button,a,input,select,textarea,label,[data-photo-click]')) return;
    toggleResidentSelection(selectable);
  });

  document.addEventListener('keydown', event => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    const selectable = event.target.closest('[data-resident-select-id]');
    if (!selectable || app()?.state?.section !== 'residents') return;
    if (event.target.closest('button,a,input,select,textarea')) return;
    event.preventDefault();
    toggleResidentSelection(selectable);
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