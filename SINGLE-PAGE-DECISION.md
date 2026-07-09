# Single Page Dashboard Decision

The campaign dashboard will remain a Single HTML Application.

No separate pages are needed for the current workflow. The dashboard should stay on `index.html`, and each section should update independently without a full page reload.

## Current structure

```text
index.html
├── Header / connection status
├── Stats cards
├── Search and filters
├── Voter records table
├── Pagination
├── Analytics
└── Reports
```

## Why this structure works

- One page shows the full campaign workspace.
- Filters update only the data/table output.
- Stats update when the underlying data changes.
- Pagination updates only the visible row range.
- Analytics and reports can refresh from the same loaded dataset.
- No page reload is required for normal dashboard use.

## Section update rules

| Section | Updates when | Responsible module |
|---|---|---|
| Header / connected count | Data loads or refreshes | `js/app.js`, `js/api.js` |
| Stats cards | Data changes or refreshes | `js/render-dashboard.js`, `js/metrics.js` |
| Filters | User changes search/party/status | `js/filters.js` |
| Records table | Filters, pagination, or data changes | `js/render-campaigns.js` |
| Pagination | Page or page size changes | `js/render-campaigns.js`, `js/state.js` |
| Analytics | Data changes or refreshes | `js/render-analytics.js` |
| Reports | Data changes or refreshes | `js/render-analytics.js` |

## Required function behavior

Each function should do one job and return a result.

```text
updateStats()       -> stats/cards HTML or DOM update from stats result
applyFilters()      -> filtered record array
renderTable()       -> table row HTML
updatePagination()  -> pagination state or DOM update from pagination result
refreshData()       -> fresh rows from Supabase and full re-render
```

## Core flow

```text
User action
  -> event listener
  -> update state/filter/page
  -> function returns data or HTML
  -> target section updates
  -> no full page reload
```

## Final decision

Keep the app as a single-page dashboard.

Do not split into separate HTML pages unless there is a strong future reason, such as a public read-only share page, an admin-only settings page, or a mobile-only simplified page.
