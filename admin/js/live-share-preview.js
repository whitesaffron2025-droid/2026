/* Live Share Preview v2.0.0 */
(() => {
  'use strict';

  function selectedText(id) {
    const element = document.getElementById(id);
    if (!element) return '';
    if (element.tagName === 'SELECT') return element.options[element.selectedIndex]?.text || '';
    return element.value?.trim() || '';
  }

  function visibleRows() {
    return [...document.querySelectorAll('#residentRows tr')]
      .filter(row => !row.querySelector('.no-results') && row.querySelectorAll('td').length >= 10);
  }

  function rowPayload(row) {
    const cells = row.querySelectorAll('td');
    const turnoutText = cells[9]?.querySelector('.vote-toggle span:last-child')?.textContent?.trim() || 'Not Yet';
    const assignmentText = cells[3]?.querySelector('.assignment-note')?.textContent || '';
    return {
      id: cells[0]?.textContent?.trim() || '',
      photo: cells[1]?.querySelector('img')?.src || '',
      idNumber: cells[2]?.textContent?.trim() || '',
      name: cells[3]?.querySelector('strong')?.textContent?.trim() || '',
      assignees: assignmentText.replace(/^Assigned:\s*/i, '').trim(),
      address: cells[4]?.textContent?.trim() || '',
      livingNow: cells[5]?.textContent?.trim() || '',
      mobile: cells[6]?.textContent?.trim() || '',
      sex: cells[7]?.textContent?.trim() || '',
      age: cells[8]?.textContent?.trim() || '',
      campaignVote: selectedText('campaignVoteFilter') || 'All Vote Statuses',
      turnout: turnoutText
    };
  }

  function openSharePreview() {
    const rows = visibleRows();
    if (!rows.length) {
      alert('There are no filtered residents to preview.');
      return;
    }

    const voted = document.getElementById('votedCount')?.textContent || '0';
    const notYet = document.getElementById('notVotedCount')?.textContent || '0';
    const total = document.getElementById('totalCount')?.textContent || '0';
    const payload = {
      generated: new Date().toLocaleString('en-GB'),
      counts: { visible: rows.length, voted, notYet, total },
      filters: {
        Address: selectedText('addressFilter'),
        Assignment: selectedText('assignmentFilter'),
        'Campaign Vote': selectedText('campaignVoteFilter'),
        Search: selectedText('searchInput') || 'None',
        Turnout: selectedText('statusFilter')
      },
      rows: rows.map(rowPayload)
    };

    try {
      sessionStorage.setItem('pncLiveSharePreview', JSON.stringify(payload));
    } catch (error) {
      console.error('Could not prepare share preview:', error);
      alert('The preview could not be prepared. Please try again.');
      return;
    }

    window.open('live-preview.html', '_blank');
  }

  document.addEventListener('click', event => {
    if (event.target.closest('#sharePreview')) openSharePreview();
  });
})();
