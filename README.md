# 2026 Campaign Dashboard

A static GitHub Pages campaign management dashboard connected to Supabase project `tkuivkhghmeljcuqwwdy` and table `public."2026"`.

The purpose of this app is to help campaign teams track voter outreach, calls, D2D visits, assignments, support level, transport needs, analytics, and reports from one browser-based dashboard.

## Live URL

```text
https://whitesaffron2025-droid.github.io/2026/
```

For cache-busting while testing:

```text
https://whitesaffron2025-droid.github.io/2026/?v=latest
```

## Current status

Implemented:

- GitHub Pages static deployment.
- Supabase REST connection.
- Batched loading for all records, avoiding the 1,000 row default limit.
- KPI dashboard cards.
- Voter records table.
- Search filter.
- Party filter.
- Outreach/status filter.
- Pagination.
- Party analytics.
- Priority insight block.
- Report text generation.
- CSV export.
- Modular `/js/` architecture.
- Function-return render pattern.

Planned next:

- Full edit/save modal in the modular architecture.
- D2D-specific filters.
- Assigner dropdown filter.
- Share links for public/private filtered views.
- Bulk actions.
- Chart.js visualizations.
- Voter profile modal.

## Supabase config

```text
URL: https://tkuivkhghmeljcuqwwdy.supabase.co
Table: public."2026"
Frontend key: stored in js/config.js
```

The frontend uses the publishable key only. Do not place service-role keys in this repository.

## File structure

```text
2026/
├── .nojekyll
├── README.md
├── PURPOSE.md
├── SECTION-STRUCTURE.md
├── FUNCTION-ARCHITECTURE.md
├── index.html
├── styles.css
├── app-native.js        # backup monolithic/reference version
├── app-fixed.js         # backup alternative loader
├── app.js               # old backup
└── js/
    ├── config.js
    ├── state.js
    ├── api.js
    ├── utils.js
    ├── filters.js
    ├── metrics.js
    ├── charts.js
    ├── render-dashboard.js
    ├── render-campaigns.js
    ├── render-analytics.js
    ├── actions.js
    ├── share.js
    ├── modals.js
    └── app.js
```

## Main files

| File | Purpose |
|---|---|
| `index.html` | Main SAHA entry point and page shell. |
| `styles.css` | Styling, layout, badges, tables, mobile responsiveness. |
| `js/config.js` | Supabase URL/key, table name, status enums, defaults. |
| `js/state.js` | App state, active page, filters, pagination, selected records. |
| `js/api.js` | Supabase REST fetch/update operations. |
| `js/utils.js` | Formatters, labels, badges, CSV helpers, row normalization. |
| `js/filters.js` | Search, party, status, and future D2D/assigner filters. |
| `js/metrics.js` | KPI/statistics calculations. |
| `js/render-dashboard.js` | KPI cards, progress bars, priority blocks. |
| `js/render-campaigns.js` | Records table and pagination output. |
| `js/render-analytics.js` | Party analytics, insights, report output. |
| `js/actions.js` | Export/copy actions and future CRUD/bulk actions. |
| `js/share.js` | Future public/private share link logic. |
| `js/modals.js` | Modal and voter profile logic. |
| `js/app.js` | Main orchestrator: load, render, and event listeners. |

## Architecture rule

Every major component should be a function that returns a result first.

Examples:

- API functions return data arrays or action results.
- Metric functions return statistics objects.
- Utility functions return formatted strings or HTML snippets.
- Render functions return HTML strings or HTML result objects.
- App functions orchestrate and inject returned results into the DOM.

Preferred pattern:

```javascript
function getCardHtml(data) {
  return `<div class="card">${data.title}</div>`;
}

function injectCard(html) {
  document.getElementById('target').innerHTML = html;
}

function renderCard(data) {
  const html = getCardHtml(data);
  injectCard(html);
  return html;
}
```

## Data loading

Supabase/PostgREST can return only 1,000 rows by default if not paged. This app uses batched loading through `js/api.js`:

```text
0–999
1000–1999
2000–2999
3000–3263
```

Expected status after loading:

```text
Connected • 3,264 records
```

## Dashboard sections

Current live sections:

- Dashboard
- Campaigns
- Analytics
- Reports

Planned sections are documented in:

```text
SECTION-STRUCTURE.md
```

The project purpose is documented in:

```text
PURPOSE.md
```

The function-return architecture is documented in:

```text
FUNCTION-ARCHITECTURE.md
```

## Deployment

This is a static app. No build step is required.

GitHub Pages settings:

```text
Source: Deploy from branch
Branch: main
Folder: / root
```

`.nojekyll` is included so GitHub Pages serves static files directly.

## Testing checklist

After every update:

1. Open the live URL.
2. Hard refresh with `Ctrl + F5`.
3. Confirm the status shows `Connected • 3,264 records`.
4. Test search.
5. Test party filter.
6. Test status filter.
7. Test pagination.
8. Test CSV export.
9. Check browser console if the page does not load.

## Safety notes

- Keep `app-native.js` as backup until the modular version is fully stable.
- Do not delete backup scripts during active migration.
- Do not commit service-role Supabase keys.
- Keep large features modular and section-based.
