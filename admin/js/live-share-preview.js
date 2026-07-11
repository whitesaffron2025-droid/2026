/* Live Public Share v3 */
(() => {
  'use strict';
  let busy = false;
  const pick = id => {
    const el = document.getElementById(id);
    if (!el) return '';
    return el.tagName === 'SELECT' ? (el.options[el.selectedIndex]?.text || '') : (el.value || '').trim();
  };
  const rows = () => [...document.querySelectorAll('#residentRows tr[data-resident-id]')];
  const payloadRow = row => {
    const c = row.querySelectorAll('td');
    return {
      id: c[0]?.textContent.trim() || '',
      photo: c[1]?.querySelector('img')?.src || '',
      idNumber: c[2]?.textContent.trim() || '',
      name: c[3]?.querySelector('strong')?.textContent.trim() || '',
      assignees: (c[3]?.querySelector('.assignment-note')?.textContent || '').replace(/^Assigned:\s*/i, '').trim(),
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
    const visible = rows();
    if (!visible.length) return alert('There are no filtered residents to share.');
    const btn = document.getElementById('sharePreview');
    busy = true;
    btn.disabled = true;
    btn.textContent = 'Creating Link…';
    try {
      const cfg = window.CampaignConfig;
      const db = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseKey);
      const payload = {
        generated: new Date().toLocaleString('en-GB'),
        counts: {
          visible: visible.length,
          voted: document.getElementById('votedCount')?.textContent || '0',
          notYet: document.getElementById('notVotedCount')?.textContent || '0',
          total: document.getElementById('totalCount')?.textContent || '0'
        },
        filters: {
          Address: pick('addressFilter'),
          Assignment: pick('assignmentFilter'),
          'Campaign Vote': pick('campaignVoteFilter'),
          Search: pick('searchInput') || 'None',
          Turnout: pick('statusFilter')
        },
        rows: visible.map(payloadRow)
      };
      const { data: token, error } = await db.rpc('create_live_turnout_share', { p_payload: payload, p_expires_hours: 168 });
      if (error) throw error;
      const url = new URL('live-preview.html', location.href);
      url.searchParams.set('s', token);
      try { await navigator.clipboard.writeText(url.href); } catch (_) {}
      window.open(url.href, '_blank', 'noopener');
      alert('Public link created and copied. It works for 7 days.');
    } catch (error) {
      console.error(error);
      alert('Public link could not be created. Please log in again and retry.');
    } finally {
      busy = false;
      btn.disabled = false;
      btn.textContent = 'Share Preview';
    }
  }
  document.addEventListener('click', e => {
    if (e.target.closest('#sharePreview')) createLink();
  });
})();