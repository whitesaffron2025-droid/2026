(() => {
  'use strict';

  const cfg = window.CampaignConfig;
  const params = new URLSearchParams(location.search);
  const assignee = params.get('assignee') || 'Assignee';
  const workflow = params.get('workflow') || 'assign';
  const ids = (params.get('ids') || '').split(',').map(v => v.trim()).filter(Boolean);

  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[char]));

  const text = value => String(value ?? '').trim();
  const living = row => text(row.living_place) || text(row.lives_in) || 'Not recorded';

  let db;
  let rows = [];

  function login(message = '') {
    sharedApp.innerHTML = `
      <main class="login-card">
        <h1>${esc(assignee)} Workspace</h1>
        <p>This shared link is separate from the Admin Master page.</p>
        ${message ? `<p>${esc(message)}</p>` : ''}
        <form id="sharedLogin">
          <label>Email<input id="sharedEmail" type="email" required></label>
          <label>Password<input id="sharedPassword" type="password" required></label>
          <button class="primary" type="submit">Sign In</button>
        </form>
      </main>`;

    sharedLogin.onsubmit = async event => {
      event.preventDefault();
      const { error } = await db.auth.signInWithPassword({
        email: sharedEmail.value.trim(),
        password: sharedPassword.value
      });

      if (error) return login(error.message);
      load();
    };
  }

  async function load() {
    if (!ids.length) {
      sharedApp.innerHTML = '<div class="empty">This shared link has no selected residents.</div>';
      return;
    }

    const { data, error } = await db.from(cfg.tableName)
      .select('*')
      .in('id', ids)
      .order('house', { ascending:true, nullsFirst:false })
      .order('name', { ascending:true });

    if (error) {
      sharedApp.innerHTML = `<div class="empty">${esc(error.message)}</div>`;
      return;
    }

    rows = data || [];
    render();
  }

  function render() {
    sharedApp.innerHTML = `
      <header class="shared-header">
        <h1>${esc(assignee)} · ${esc(workflow)}</h1>
        <p>${rows.length} assigned resident(s)</p>
      </header>
      <main class="shell">
        <div class="grid">
          ${rows.map(row => `
            <article class="card" data-id="${esc(row.id)}">
              <div class="card-top">
                ${row.photo_url ? `<img class="photo" src="${esc(row.photo_url)}" alt="">` : '<div class="photo"></div>'}
                <div>
                  <h3>${esc(row.name || 'No name')}</h3>
                  <p class="meta">ID: ${esc(row.national_id || '-')}</p>
                  <p class="meta">${esc(row.house || 'No address')}</p>
                  <p class="meta">Living now: ${esc(living(row))}</p>
                  <p class="meta">Phone: ${esc(row.phone || 'Not recorded')}</p>
                </div>
              </div>
            </article>
          `).join('')}
        </div>
      </main>`;
  }

  function openEditor(row) {
    const modal = document.createElement('div');
    modal.className = 'editor-backdrop';

    let fields = `
      <div class="locked">${esc(row.name)} · ${esc(row.national_id)} · ${esc(row.house || 'No address')}</div>
      <label>Phone Number<input name="phone" value="${esc(row.phone || '')}"></label>
      <label>Current Living Place<input name="living_place" value="${esc(living(row) === 'Not recorded' ? '' : living(row))}"></label>`;

    if (workflow === 'calls') {
      fields += `
        <label>Call Status<select name="phone_status">
          <option value="need-call">Need Call</option>
          <option value="connected">Connected</option>
          <option value="busy">Busy</option>
          <option value="not-answer">Not Answer</option>
          <option value="wrong-number">Wrong Number</option>
          <option value="disconnected">Disconnected</option>
          <option value="out-of-coverage">Out of Coverage</option>
        </select></label>
        <label>Call Notes<textarea name="call_notes"></textarea></label>`;
    }

    if (workflow === 'votes') {
      fields += `
        <label>Vote Status<select name="vote_status">
          <option value="not-decided">Not Decided</option>
          <option value="will-vote">Will Vote</option>
          <option value="not-vote">Not Vote</option>
        </select></label>
        <label>Remarks<textarea name="remarks"></textarea></label>`;
    }

    if (workflow === 'visits') {
      fields += `
        <label>Visit Status<select name="d2d_status">
          <option value="not-visited">Not Visited</option>
          <option value="reach">Reached</option>
          <option value="not-home">Not Home</option>
          <option value="live-in-another-place">Lives Elsewhere</option>
        </select></label>
        <label>Remarks<textarea name="remarks"></textarea></label>`;
    }

    if (workflow === 'transport') {
      fields += `
        <label>Transport Status<select name="transport_status">
          <option value="not-needed">Not Needed</option>
          <option value="need-transport">Need Transport</option>
          <option value="arranged">Arranged</option>
          <option value="picked-up">Picked Up</option>
        </select></label>
        <label>Remarks<textarea name="remarks"></textarea></label>`;
    }

    if (workflow === 'assign') {
      fields += `<label>Assignment Remarks<textarea name="remarks"></textarea></label>`;
    }

    modal.innerHTML = `
      <section class="editor">
        <div class="editor-head">
          <div><small>${esc(workflow)}</small><h2>${esc(row.name)}</h2></div>
          <button class="secondary" data-close>×</button>
        </div>
        <form id="sharedEditor">${fields}
          <div class="editor-actions">
            <button type="button" class="secondary" data-close>Cancel</button>
            <button type="submit" class="primary">Save</button>
          </div>
        </form>
      </section>`;

    document.body.appendChild(modal);

    sharedEditor.onsubmit = async event => {
      event.preventDefault();
      const values = Object.fromEntries(new FormData(sharedEditor));
      const patch = {
        phone: text(values.phone) || null,
        living_place: text(values.living_place) || null
      };

      if (workflow === 'calls') {
        patch.phone_status = values.phone_status;
        patch.call_outcome = values.phone_status;
        patch.call_notes = text(values.call_notes) || null;
        patch.call_center_agent = assignee;
        patch.last_call_at = new Date().toISOString();
        patch.call_attempts = Number(row.call_attempts || 0) + 1;
      }

      if (workflow === 'votes') {
        patch.vote_status = values.vote_status;
        patch.remarks = text(values.remarks) || null;
      }

      if (workflow === 'visits') {
        patch.d2d_status = values.d2d_status;
        patch.remarks = text(values.remarks) || null;
      }

      if (workflow === 'transport') {
        patch.transport_status = values.transport_status;
        patch.remarks = text(values.remarks) || null;
      }

      if (workflow === 'assign') {
        patch.vote_assigned_by = assignee;
        patch.vote_assigned_at = new Date().toISOString();
        patch.remarks = text(values.remarks) || null;
      }

      const { error } = await db.from(cfg.tableName).update(patch).eq('id', row.id);
      if (error) return alert(error.message);

      modal.remove();
      await load();
    };
  }

  document.addEventListener('click', event => {
    if (event.target.closest('[data-close]')) {
      event.target.closest('.editor-backdrop')?.remove();
      return;
    }

    const card = event.target.closest('.card');
    if (!card) return;

    const row = rows.find(item => String(item.id) === String(card.dataset.id));
    if (row) openEditor(row);
  });

  document.addEventListener('DOMContentLoaded', async () => {
    if (!cfg || !cfg.supabaseUrl || !cfg.supabaseKey || !window.supabase) {
      sharedApp.innerHTML = '<div class="empty">Configuration unavailable.</div>';
      return;
    }

    db = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseKey, {
      auth: { persistSession:true, autoRefreshToken:true }
    });

    const { data: { session } } = await db.auth.getSession();
    if (!session) return login();

    load();
  });
})();
