/* ===================================================
   MODULE : Phone Verification
   VERSION: 1.0.0
   BUILD  : 2026.07.10-phone-verification
   PURPOSE: Lock phone outside Residents Master and route
            corrections to Admin review.
   =================================================== */
(() => {
  'use strict';

  const cfg = window.CampaignConfig;
  if (!cfg || !window.supabase) return;

  const db = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseKey, {
    auth: { persistSession: true, autoRefreshToken: true }
  });

  const workflowSections = new Set(['assign', 'calls', 'votes', 'visits', 'transport']);
  const text = value => String(value ?? '').trim();
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[char]));

  async function getResident(id) {
    const { data, error } = await db.from(cfg.tableName)
      .select('id,phone,phone_verification_status,phone_suggested,phone_verification_note,phone_verification_updated_at,phone_verification_requested_by')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  }

  function formatDate(value) {
    if (!value) return 'Not recorded';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? 'Not recorded' : date.toLocaleString('en-GB');
  }

  function lockPhoneField(form, currentPhone) {
    const existing = form.querySelector('[name="phone"]');
    if (!existing) return;

    existing.name = 'phone_display';
    existing.readOnly = true;
    existing.disabled = false;
    existing.value = currentPhone || '';
    existing.classList.add('readonly-input');

    const title = existing.closest('label')?.querySelector('span');
    if (title) title.textContent = 'Current Phone (Residents Master only)';

    let hidden = form.querySelector('input[data-phone-preserve]');
    if (!hidden) {
      hidden = document.createElement('input');
      hidden.type = 'hidden';
      hidden.name = 'phone';
      hidden.dataset.phonePreserve = '1';
      form.appendChild(hidden);
    }
    hidden.value = currentPhone || '';
  }

  function workflowPanel(row) {
    const panel = document.createElement('section');
    panel.className = 'phone-review-panel';
    panel.innerHTML = `
      <div class="phone-review-heading">
        <div>
          <strong>Phone Verification</strong>
          <small>The master phone number is locked. Suggest a correction for Admin review.</small>
        </div>
        <span class="phone-review-status ${esc(row.phone_verification_status || 'none')}">${esc(row.phone_verification_status || 'No request')}</span>
      </div>
      <label class="editor-field">
        <span>Suggested Phone Number</span>
        <input id="phoneSuggested" inputmode="tel" value="${esc(row.phone_suggested || '')}" placeholder="Enter corrected number">
      </label>
      <label class="editor-field">
        <span>Verification Note</span>
        <input id="phoneVerificationNote" value="${esc(row.phone_verification_note || '')}" placeholder="Wrong number, disconnected, new number, etc.">
      </label>
      <button type="button" class="btn secondary" id="sendPhoneVerification">Send for Admin Verification</button>`;
    return panel;
  }

  function residentPanel(row) {
    const panel = document.createElement('section');
    panel.className = 'phone-review-panel admin-review';

    if (row.phone_verification_status !== 'pending') {
      panel.innerHTML = `
        <div class="phone-review-heading">
          <div><strong>Phone Verification</strong><small>No pending phone correction.</small></div>
          <span class="phone-review-status ${esc(row.phone_verification_status || 'none')}">${esc(row.phone_verification_status || 'Clear')}</span>
        </div>`;
      return panel;
    }

    panel.innerHTML = `
      <div class="phone-review-heading">
        <div>
          <strong>Pending Phone Correction</strong>
          <small>Requested by ${esc(row.phone_verification_requested_by || 'Unknown')} · ${esc(formatDate(row.phone_verification_updated_at))}</small>
        </div>
        <span class="phone-review-status pending">Pending</span>
      </div>
      <div class="phone-review-suggestion">
        <span>Current</span><strong>${esc(row.phone || 'Not recorded')}</strong>
        <span>Suggested</span><strong>${esc(row.phone_suggested || 'Not recorded')}</strong>
        <span>Note</span><strong>${esc(row.phone_verification_note || 'No note')}</strong>
      </div>
      <div class="phone-review-actions">
        <button type="button" class="btn secondary" id="dismissPhoneSuggestion">Dismiss</button>
        <button type="button" class="btn primary" id="applyPhoneSuggestion">Apply Suggested Number</button>
      </div>`;
    return panel;
  }

  async function decorateEditor() {
    const form = document.getElementById('editorForm');
    if (!form || form.dataset.phoneVerificationReady === '1') return;

    const section = text(form.dataset.section).toLowerCase();
    if (![...workflowSections, 'residents'].includes(section)) return;

    form.dataset.phoneVerificationReady = '1';

    try {
      const row = await getResident(form.dataset.id);
      const grid = form.querySelector('.editor-grid');
      if (!grid) return;

      if (workflowSections.has(section)) {
        lockPhoneField(form, row.phone);
        grid.appendChild(workflowPanel(row));
      } else {
        grid.appendChild(residentPanel(row));
      }
    } catch (error) {
      form.dataset.phoneVerificationReady = '';
      console.error('Phone verification editor failed:', error);
    }
  }

  async function sendVerification() {
    const form = document.getElementById('editorForm');
    if (!form) return;

    const suggested = text(document.getElementById('phoneSuggested')?.value);
    const note = text(document.getElementById('phoneVerificationNote')?.value);
    if (!suggested) return alert('Enter the suggested phone number.');

    const { data: authData } = await db.auth.getUser();
    const requestedBy = authData?.user?.email || cfg.adminEmail || 'Admin';

    const { error } = await db.from(cfg.tableName).update({
      phone_verification_status: 'pending',
      phone_suggested: suggested,
      phone_verification_note: note || null,
      phone_verification_updated_at: new Date().toISOString(),
      phone_verification_requested_by: requestedBy
    }).eq('id', form.dataset.id);

    if (error) return alert(error.message);
    alert('Phone correction sent to Residents Master for verification.');
    document.getElementById('sectionEditor')?.remove();
    location.reload();
  }

  async function applySuggestion() {
    const form = document.getElementById('editorForm');
    if (!form) return;
    const row = await getResident(form.dataset.id);
    if (!text(row.phone_suggested)) return alert('No suggested number found.');

    const { error } = await db.from(cfg.tableName).update({
      phone: row.phone_suggested,
      phone_verification_status: 'verified',
      phone_suggested: null,
      phone_verification_note: null,
      phone_verification_updated_at: new Date().toISOString()
    }).eq('id', form.dataset.id);

    if (error) return alert(error.message);
    alert('Phone number updated and verified.');
    document.getElementById('sectionEditor')?.remove();
    location.reload();
  }

  async function dismissSuggestion() {
    const form = document.getElementById('editorForm');
    if (!form) return;

    const { error } = await db.from(cfg.tableName).update({
      phone_verification_status: 'dismissed',
      phone_suggested: null,
      phone_verification_note: null,
      phone_verification_updated_at: new Date().toISOString()
    }).eq('id', form.dataset.id);

    if (error) return alert(error.message);
    alert('Phone correction dismissed.');
    document.getElementById('sectionEditor')?.remove();
    location.reload();
  }

  async function decorateResidentReviewBadges() {
    if (location.hash !== '#residents') return;
    const buttons = [...document.querySelectorAll('[data-edit-section="residents"]')];
    const ids = buttons.map(button => button.dataset.editId).filter(Boolean);
    if (!ids.length) return;

    const { data, error } = await db.from(cfg.tableName)
      .select('id,phone_verification_status')
      .in('id', ids)
      .eq('phone_verification_status', 'pending');
    if (error) return;

    const pending = new Set((data || []).map(row => String(row.id)));
    buttons.forEach(button => {
      if (!pending.has(String(button.dataset.editId))) return;
      const card = button.closest('.resident-gallery-card');
      const row = button.closest('tr');
      const host = card?.querySelector('.resident-gallery-body') || row?.querySelector('td:nth-child(2)');
      if (host && !host.querySelector('.phone-review-badge')) {
        host.insertAdjacentHTML('afterbegin', '<span class="phone-review-badge">Phone review</span>');
      }
    });
  }

  document.addEventListener('click', event => {
    if (event.target.id === 'sendPhoneVerification') sendVerification();
    if (event.target.id === 'applyPhoneSuggestion') applySuggestion();
    if (event.target.id === 'dismissPhoneSuggestion') dismissSuggestion();
  });

  new MutationObserver(() => {
    decorateEditor();
    decorateResidentReviewBadges();
  }).observe(document.body, { childList:true, subtree:true });

  window.addEventListener('hashchange', () => setTimeout(decorateResidentReviewBadges, 120));
  decorateEditor();
  decorateResidentReviewBadges();
})();