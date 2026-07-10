(() => {
  'use strict';

  const cfg = window.CampaignConfig;
  if (!cfg || !window.supabase) return;

  const db = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseKey, {
    auth: { persistSession: true, autoRefreshToken: true }
  });

  const selected = new Set();
  let decorating = false;

  const text = value => String(value ?? '').trim();
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[char]));

  function editorSection(form) {
    return text(form?.dataset?.section).toLowerCase();
  }

  function readonlyBlock(label, value) {
    const box = document.createElement('div');
    box.className = 'editor-field readonly-field section-logic-field';
    box.innerHTML = `<span>${esc(label)}</span><div>${esc(value || 'Not recorded')}</div>`;
    return box;
  }

  function inputBlock(label, name, value) {
    const field = document.createElement('label');
    field.className = 'editor-field section-logic-field';
    field.innerHTML = `<span>${esc(label)}</span><input name="${esc(name)}" value="${esc(value || '')}">`;
    return field;
  }

  async function loadResident(id) {
    const { data, error } = await db
      .from(cfg.tableName)
      .select('id,phone,living_place,lives_in,call_attempts,remarks')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  }

  async function decorateEditor(form) {
    if (!form || form.dataset.logicReady === '1') return;
    form.dataset.logicReady = '1';

    const section = editorSection(form);
    const id = form.dataset.id;
    if (!['assign', 'calls', 'visits'].includes(section)) return;

    try {
      const resident = await loadResident(id);
      const grid = form.querySelector('.editor-grid');
      const livingNow = text(resident.living_place) || text(resident.lives_in) || '';

      if (section === 'calls') {
        const phoneInput = form.querySelector('[name="phone"]');
        if (phoneInput) {
          phoneInput.readOnly = true;
          phoneInput.classList.add('readonly-input');
          const label = phoneInput.closest('label');
          const title = label?.querySelector('span');
          if (title) title.textContent = 'Current Phone (Admin only)';
        } else {
          grid.prepend(readonlyBlock('Current Phone (Admin only)', resident.phone));
        }

        if (!form.querySelector('[name="living_place"]')) {
          const callStatus = form.querySelector('[name="phone_status"]')?.closest('label');
          const field = inputBlock('Current Living Place', 'living_place', livingNow);
          if (callStatus) grid.insertBefore(field, callStatus);
          else grid.append(field);
        }
      }

      if (section === 'visits') {
        if (!form.querySelector('.visit-phone-readonly')) {
          const phone = readonlyBlock('Current Phone (Admin only)', resident.phone);
          phone.classList.add('visit-phone-readonly');
          grid.prepend(phone);
        }
      }

      if (section === 'assign') {
        if (!form.querySelector('.assign-contact-readonly')) {
          const phone = readonlyBlock('Current Phone (Admin only)', resident.phone);
          phone.classList.add('assign-contact-readonly');
          const living = readonlyBlock('Current Living Place', livingNow);
          living.classList.add('assign-contact-readonly');
          grid.prepend(living);
          grid.prepend(phone);
        }
      }
    } catch (error) {
      console.error('Section editor decoration failed:', error);
    }
  }

  async function saveCallEditor(event) {
    const form = event.target;
    if (form?.id !== 'editorForm' || editorSection(form) !== 'calls') return;

    event.preventDefault();
    event.stopImmediatePropagation();

    const id = form.dataset.id;
    const values = Object.fromEntries(new FormData(form));
    const save = form.querySelector('.editor-save');
    if (save) {
      save.disabled = true;
      save.textContent = 'Saving…';
    }

    try {
      const resident = await loadResident(id);
      const status = text(values.phone_status) || 'need-call';
      const patch = {
        living_place: text(values.living_place) || null,
        phone_status: status,
        call_outcome: status,
        call_center_agent: text(values.call_center_agent) || null,
        call_notes: text(values.call_notes) || null,
        last_call_at: new Date().toISOString(),
        call_attempts: Number(resident.call_attempts || 0) + 1
      };
      if (['connected', 'called'].includes(status)) patch.reach_status = 'reached';

      const { error } = await db.from(cfg.tableName).update(patch).eq('id', id);
      if (error) throw error;

      document.getElementById('sectionEditor')?.remove();
      location.reload();
    } catch (error) {
      alert(error.message);
      if (save) {
        save.disabled = false;
        save.textContent = 'Save Changes';
      }
    }
  }

  async function visibleResidentMap(ids) {
    if (!ids.length) return new Map();
    const { data, error } = await db
      .from(cfg.tableName)
      .select('id,phone,living_place,lives_in')
      .in('id', ids);
    if (error) throw error;
    return new Map((data || []).map(row => [String(row.id), row]));
  }

  function addCell(row, beforeCell, html, className) {
    if (row.querySelector(`.${className}`)) return;
    const cell = document.createElement('td');
    cell.className = className;
    cell.innerHTML = html;
    row.insertBefore(cell, beforeCell || null);
  }

  async function decorateAssignPage() {
    const table = document.querySelector('#pageContent table.data-table');
    if (!table || table.dataset.assignLogic === '1') return;
    const heading = document.querySelector('#pageContent .page-head h1');
    if (text(heading?.textContent) !== 'Assign') return;

    table.dataset.assignLogic = '1';
    const header = table.querySelector('thead tr');
    if (header && !header.querySelector('.assign-select-head')) {
      const selectHead = document.createElement('th');
      selectHead.className = 'assign-select-head';
      selectHead.textContent = 'Select';
      header.prepend(selectHead);

      const livingHead = document.createElement('th');
      livingHead.className = 'assign-living-head';
      livingHead.textContent = 'Living Now';
      const phoneHead = [...header.children].find(cell => text(cell.textContent) === 'Phone');
      header.insertBefore(livingHead, phoneHead || null);
    }

    const bodyRows = [...table.querySelectorAll('tbody tr')];
    const ids = bodyRows.map(row => row.querySelector('[data-edit-id]')?.dataset.editId).filter(Boolean);
    const residents = await visibleResidentMap(ids);

    bodyRows.forEach(row => {
      const id = row.querySelector('[data-edit-id]')?.dataset.editId;
      if (!id) return;
      const resident = residents.get(String(id)) || {};
      const living = text(resident.living_place) || text(resident.lives_in) || 'Not recorded';

      addCell(row, row.firstElementChild, `<input type="checkbox" data-bulk-assign-id="${esc(id)}" ${selected.has(String(id)) ? 'checked' : ''}>`, 'assign-select-cell');
      const phoneCell = [...row.children].find(cell => text(cell.textContent) === text(resident.phone));
      addCell(row, phoneCell, esc(living), 'assign-living-cell');
    });

    if (!document.querySelector('.bulk-assign-toolbar')) {
      const wrap = table.closest('.table-wrap');
      const toolbar = document.createElement('div');
      toolbar.className = 'bulk-assign-toolbar';
      toolbar.innerHTML = `
        <label><input id="selectVisibleAssign" type="checkbox"> Select visible</label>
        <strong><span id="bulkAssignCount">${selected.size}</span> selected</strong>
        <input id="bulkAssigneeName" type="text" placeholder="Assignee name">
        <button id="applyBulkAssign" class="btn primary" type="button">Assign Selected</button>
        <button id="copyAssigneeLink" class="btn secondary" type="button">Copy Assignee Link</button>`;
      wrap.parentNode.insertBefore(toolbar, wrap);
    }
  }

  async function decorateCallsPage() {
    const table = document.querySelector('#pageContent table.data-table');
    const heading = document.querySelector('#pageContent .page-head h1');
    if (!table || table.dataset.callsLiving === '1' || text(heading?.textContent) !== 'Calls') return;

    table.dataset.callsLiving = '1';
    const header = table.querySelector('thead tr');
    const livingHead = document.createElement('th');
    livingHead.textContent = 'Living Now';
    const phoneHead = [...header.children].find(cell => text(cell.textContent) === 'Phone');
    header.insertBefore(livingHead, phoneHead || null);

    const rows = [...table.querySelectorAll('tbody tr')];
    const ids = rows.map(row => row.querySelector('[data-edit-id]')?.dataset.editId).filter(Boolean);
    const residents = await visibleResidentMap(ids);

    rows.forEach(row => {
      const id = row.querySelector('[data-edit-id]')?.dataset.editId;
      if (!id) return;
      const resident = residents.get(String(id)) || {};
      const living = text(resident.living_place) || text(resident.lives_in) || 'Not recorded';
      const phoneCell = [...row.children].find(cell => text(cell.textContent) === text(resident.phone));
      addCell(row, phoneCell, esc(living), 'calls-living-cell');
    });
  }

  async function decorateVisitsPage() {
    const heading = document.querySelector('#pageContent .page-head h1');
    if (text(heading?.textContent) !== 'Door to Door') return;

    const cards = [...document.querySelectorAll('#pageContent .record-card')].filter(card => card.dataset.phoneAdded !== '1');
    const ids = cards.map(card => card.querySelector('[data-edit-id]')?.dataset.editId).filter(Boolean);
    const residents = await visibleResidentMap(ids);

    cards.forEach(card => {
      const id = card.querySelector('[data-edit-id]')?.dataset.editId;
      if (!id) return;
      const resident = residents.get(String(id)) || {};
      const field = document.createElement('div');
      field.className = 'field visit-phone-field';
      field.innerHTML = `<span class="label">Phone</span><span class="value">${esc(resident.phone || 'Not recorded')}</span>`;
      card.insertBefore(field, card.querySelector('.card-actions'));
      card.dataset.phoneAdded = '1';
    });
  }

  async function decoratePage() {
    if (decorating) return;
    decorating = true;
    try {
      await decorateAssignPage();
      await decorateCallsPage();
      await decorateVisitsPage();
      const editor = document.getElementById('editorForm');
      if (editor) await decorateEditor(editor);
    } finally {
      decorating = false;
    }
  }

  async function applyBulkAssignment() {
    const ids = [...selected];
    const assignee = text(document.getElementById('bulkAssigneeName')?.value);
    if (!ids.length) return alert('Select at least one resident.');
    if (!assignee) return alert('Enter the assignee name.');

    const { data: authData } = await db.auth.getUser();
    const assignedBy = authData?.user?.email || cfg.adminEmail || 'Admin';
    const assignedAt = new Date().toISOString();

    const { data: rows, error: readError } = await db
      .from(cfg.tableName)
      .select('id,remarks')
      .in('id', ids);
    if (readError) return alert(readError.message);

    const updates = (rows || []).map(row => {
      const existing = text(row.remarks);
      const audit = `Assigned to ${assignee} by ${assignedBy} on ${assignedAt}`;
      return db.from(cfg.tableName).update({
        vote_assigned_by: assignee,
        vote_assigned_at: assignedAt,
        remarks: existing ? `${existing}\n${audit}` : audit
      }).eq('id', row.id);
    });

    const results = await Promise.all(updates);
    const failed = results.find(result => result.error);
    if (failed) return alert(failed.error.message);

    selected.clear();
    alert(`${ids.length} resident(s) assigned to ${assignee}.`);
    location.reload();
  }

  async function copyAssigneeLink() {
    const assignee = text(document.getElementById('bulkAssigneeName')?.value);
    if (!assignee) return alert('Enter the assignee name first.');
    const link = new URL('../shared.html', location.href);
    link.searchParams.set('assignee', assignee);
    try {
      await navigator.clipboard.writeText(link.href);
      alert('Assignee link copied.');
    } catch {
      prompt('Copy this link:', link.href);
    }
  }

  document.addEventListener('submit', saveCallEditor, true);

  document.addEventListener('change', event => {
    if (event.target.matches('[data-bulk-assign-id]')) {
      const id = String(event.target.dataset.bulkAssignId);
      if (event.target.checked) selected.add(id);
      else selected.delete(id);
      const count = document.getElementById('bulkAssignCount');
      if (count) count.textContent = selected.size;
    }

    if (event.target.id === 'selectVisibleAssign') {
      document.querySelectorAll('[data-bulk-assign-id]').forEach(input => {
        input.checked = event.target.checked;
        const id = String(input.dataset.bulkAssignId);
        if (input.checked) selected.add(id);
        else selected.delete(id);
      });
      const count = document.getElementById('bulkAssignCount');
      if (count) count.textContent = selected.size;
    }
  });

  document.addEventListener('click', event => {
    if (event.target.id === 'applyBulkAssign') applyBulkAssignment();
    if (event.target.id === 'copyAssigneeLink') copyAssigneeLink();
  });

  const observer = new MutationObserver(() => {
    clearTimeout(observer.timer);
    observer.timer = setTimeout(decoratePage, 60);
  });

  document.addEventListener('DOMContentLoaded', () => {
    observer.observe(document.body, { childList: true, subtree: true });
    decoratePage();
  });
})();