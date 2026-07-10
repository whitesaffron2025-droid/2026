// ============================================================
// DASHBOARD RENDER
// ============================================================

function renderDashboard(config) {
  const container = document.getElementById('dashboard-container');
  if (!container) return;

  let html = '';
  
  for (const section of Object.keys(config)) {
    // ✅ FIXED: Null-safe stats mapping
    const statItems = (config[section]?.stats || []).map(stat => {
      return `
        <div class="stat-item">
          <span class="stat-label">${stat.label}</span>
          <span class="stat-value">${stat.value || 0}</span>
        </div>
      `;
    }).join('');

    html += `
      <div class="dashboard-section">
        <h3>${config[section].title || section}</h3>
        <div class="stats-grid">${statItems || '<p>No stats available</p>'}</div>
      </div>
    `;
  }

  container.innerHTML = html;
  
  // ✅ FIXED: Loading indicator now clears properly
  const loader = document.getElementById('loading-indicator');
  if (loader) {
    loader.style.display = 'none';
  }
}
