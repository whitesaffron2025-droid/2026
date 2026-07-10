/* MODULE: Dashboard Navigation | VERSION: 1.0.0 */
(() => {
  'use strict';

  function applyPendingHouse() {
    if (location.hash !== '#residents') return;
    const house = sessionStorage.getItem('campaign_prefilter_house');
    if (!house) return;
    const select = document.querySelector('[data-filter="address"]');
    if (!select) return;
    const option = [...select.options].find(item => item.value === house);
    if (!option) return;
    select.value = house;
    select.dispatchEvent(new Event('change', { bubbles: true }));
    sessionStorage.removeItem('campaign_prefilter_house');
  }

  document.addEventListener('click', event => {
    const house = event.target.closest('[data-house]');
    if (!house) return;
    sessionStorage.setItem('campaign_prefilter_house', house.dataset.house);
  }, true);

  window.addEventListener('hashchange', () => {
    setTimeout(applyPendingHouse, 100);
    setTimeout(applyPendingHouse, 350);
  });

  new MutationObserver(applyPendingHouse).observe(document.body, {
    childList: true,
    subtree: true
  });
})();