(() => {
  'use strict';

  const cfg = window.CampaignConfig;
  if (!cfg || !window.supabase) return;

  const db = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseKey, {
    auth: { persistSession: true, autoRefreshToken: true }
  });

  const allowed = new Set(['assign', 'calls', 'votes', 'visits', 'transport']);
  const text = value => String(value ?? '').trim();

  async function fixEditor() {
    const form = document.getElementById('editorForm');
    if (!form || form.dataset.contactHotfix === '1') return;

    const section = text(form.dataset.section).toLowerCase();
    if (!allowed.has(section)) return;

    form.dataset.contactHotfix = '1';

    const { data, error } = await db
      .from(cfg.tableName)
      .select('phone,living_place,lives_in')
      .eq('id', form.dataset.id)
      .single();

    if (error) {
      form.dataset.contactHotfix = '';
      console.error('Editor contact fields failed:', error);
      return;
    }

    const grid = form.querySelector('.editor-grid');
    if (!grid) return;

    let phone = form.querySelector('[name="phone"]');
    if (phone) {
      phone.readOnly = false;
      phone.disabled = false;
      phone.classList.remove('readonly-input');
      phone.value = data.phone || '';
      const title = phone.closest('label')?.querySelector('span');
      if (title) title.textContent = 'Phone Number';
    } else {
      const field = document.createElement('label');
      field.className = 'editor-field section-contact-field';
      field.innerHTML = '<span>Phone Number</span><input name="phone">';
      field.querySelector('input').value = data.phone || '';
      const identity = grid.querySelector('.locked-identity');
      identity ? identity.insertAdjacentElement('afterend', field) : grid.prepend(field);
      phone = field.querySelector('input');
    }

    let living = form.querySelector('[name="living_place"]');
    const livingValue = data.living_place || data.lives_in || '';
    if (living) {
      living.readOnly = false;
      living.disabled = false;
      living.classList.remove('readonly-input');
      living.value = livingValue;
      const title = living.closest('label')?.querySelector('span');
      if (title) title.textContent = 'Current Living Place';
    } else {
      const field = document.createElement('label');
      field.className = 'editor-field section-contact-field';
      field.innerHTML = '<span>Current Living Place</span><input name="living_place">';
      field.querySelector('input').value = livingValue;
      phone.closest('label').insertAdjacentElement('afterend', field);
    }
  }

  document.addEventListener('click', event => {
    if (event.target.closest('[data-edit-id]')) {
      setTimeout(fixEditor, 0);
      setTimeout(fixEditor, 100);
      setTimeout(fixEditor, 350);
    }
  }, true);

  new MutationObserver(() => {
    if (document.getElementById('editorForm')) fixEditor();
  }).observe(document.body, { childList: true, subtree: true });
})();