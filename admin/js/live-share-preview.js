/* Live Public Share v4 */
(() => {
  'use strict';
  let busy = false;

  const pick = id => {
    const el = document.getElementById(id);
    if (!el) return '';
    return el.tagName === 'SELECT'
      ? (el.options[el.selectedIndex]?.text || '')
      : (el.value || '').trim();
  };

  const normalized = value => String(value || '').trim().toLowerCase();
  const rows = () => [...document.querySelectorAll('#residentRows tr[data-resident-id]')];

  const payloadRow = row => {
    const c = row.querySelectorAll('td');
    return {
      id: c[0]?.textContent.trim() || '',
      photo: c[1]?.querySelector('img')?.src || '',
      idNumber: c[2]?.textContent.trim() || '',
      name: c[3]?.querySelector('strong')?.textContent.trim() || '',
      address: c[4]?.textContent.trim() || '',
      livingNow: c[5]?.textContent.trim() || '',
      mobile: c[6]?.textContent.trim() || '',
      sex: c[7]?.textContent.trim() || '',
      age: c[8]?.textContent.trim() || '',
      campaignVote: pick('campaignVoteFilter'),
      turnout: c[9]?.querySelector('.vote-toggle span:last-child')?.textContent.trim() || 'Not Yet'
    };
  };

  async function createLink() {
    if (busy) return;

    const sharedRows = rows()
      .map(payloadRow)
      .filter(row => normalized(row.address) !== 'dhafthar');

    if (!sharedRows.length) {
      alert('There are no shareable residents for the current filters.');
      return;
    }

    const btn = document.getElementById('sharePreview');
    busy = true;
    btn.disabled = true;
    btn.textContent = 'Creating Link…';

    try {
      const cfg = window.CampaignConfig;
      const db = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseKey);
      const voted = sharedRows.filter(row => row.turnout === 'Voted').length;
      const notYet = sharedRows.length - voted;

      const payload = {
        generated: new Date().toLocaleString('en-GB'),
        counts: {
          visible: sharedRows.length,
          voted,
          notYet,
          total: sharedRows.length
        },
        filters: {
          Address: pick('addressFilter'),
          'Campaign Vote': pick('campaignVoteFilter'),
          Search: pick('searchInput') || 'None',
          Turnout: pick('statusFilter')
        },
        rows: sharedRows
      };

      const { data: token, error } = await db.rpc('create_live_turnout_share', {
        p_payload: payload,
        p_expires_hours: 168
      });
      if (error) throw error;

      const url = new URL('live-preview.html', location.href);
      url.searchParams.set('s', token);
      try { await navigator.clipboard.writeText(url.href); } catch (_) {}
      window.open(url.href, '_blank', 'noopener');
      alert('Public link created and copied. Dhafthar and assignment details are excluded.');
    } catch (error) {
      console.error(error);
      alert('Public link could not be created. Please log in again and retry.');
    } finally {
      busy = false;
      btn.disabled = false;
      btn.textContent = 'Share Preview';
    }
  }

  document.addEventListener('click', event => {
    if (event.target.closest('#sharePreview')) createLink();
  });
})();