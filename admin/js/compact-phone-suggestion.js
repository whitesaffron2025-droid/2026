/* MODULE: Compact Phone Suggestion | VERSION: 1.0.0 */
(() => {
  'use strict';
  const cfg = window.CampaignConfig;
  if (!cfg || !window.supabase) return;

  const db = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseKey, {
    auth: { persistSession: true, autoRefreshToken: true }
  });
  const workflows = new Set(['assign', 'calls', 'votes', 'visits', 'transport']);
  const text = value => String(value ?? '').trim();

  async function decorate() {
    const form = document.getElementById('editorForm');
    if (!form) return;
    const section = text(form.dataset.section).toLowerCase();
    if (!workflows.has(section)) return;

    form.querySelectorAll('.phone-review-panel').forEach(node => node.remove());

    const phone = form.querySelector('[name="phone_display"], [name="phone"]');
    if (phone && phone.type !== 'hidden') {
      phone.readOnly = true;
      phone.disabled = false;
      phone.classList.add('readonly-input');
      if (phone.name === 'phone') phone.name = 'phone_display';
      const label = phone.closest('label')?.querySelector('span');
      if (label) label.textContent = 'Phone Number';
    }

    if (form.querySelector('[name="phone_suggested"]')) return;

    const { data } = await db.from(cfg.tableName)
      .select('phone_suggested')
      .eq('id', form.dataset.id)
      .single();

    const field = document.createElement('label');
    field.className = 'editor-field compact-phone-suggestion';
    field.innerHTML = '<span>Suggested Phone Number</span><input name="phone_suggested" inputmode="tel" placeholder="Write corrected number only">';
    field.querySelector('input').value = data?.phone_suggested || '';

    const grid = form.querySelector('.editor-grid');
    const remarks = [...grid.querySelectorAll('.editor-field')].find(item => /remarks|notes/i.test(item.querySelector('span')?.textContent || ''));
    remarks ? remarks.insertAdjacentElement('afterend', field) : grid.appendChild(field);
  }

  document.addEventListener('submit', async event => {
    const form = event.target;
    if (form?.id !== 'editorForm') return;
    const section = text(form.dataset.section).toLowerCase();
    if (!workflows.has(section)) return;
    const suggested = text(form.querySelector('[name="phone_suggested"]')?.value);
    if (!suggested) return;
    await db.from(cfg.tableName).update({ phone_suggested: suggested }).eq('id', form.dataset.id);
  }, true);

  new MutationObserver(decorate).observe(document.body, { childList: true, subtree: true });
  decorate();
})();