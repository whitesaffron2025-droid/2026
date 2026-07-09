# 2026 Campaign Dashboard

A static GitHub Pages campaign management dashboard connected to Supabase project `tkuivkhghmeljcuqwwdy` and table `public."2026"`.

The purpose of this app is to help campaign teams track voter outreach, calls, D2D visits, assignments, support level, transport needs, analytics, reports, and bulk operations from one browser-based dashboard.

## Live URL

```text
https://whitesaffron2025-droid.github.io/2026/
```

For cache-busting while testing:

```text
https://whitesaffron2025-droid.github.io/2026/?v=latest
```

Current compatibility/cache test URL:

```text
https://whitesaffron2025-droid.github.io/2026/?v=ids1
```

## Current status

Implemented:

- GitHub Pages static deployment.
- Supabase REST connection.
- Batched loading for all records, avoiding the 1,000 row default limit.
- Single-page dashboard architecture.
- KPI dashboard cards.
- Voter records table.
- Search filter.
- Party filter.
- Outreach/status filter.
- Dedicated D2D filter.
- Call Status filter.
- Call Outcome filter.
- Assigner dropdown filter.
- Unassigned filter.
- Pagination.
- Party analytics.
- D2D analytics counts.
- Call center analytics.
- Call agent analytics.
- Assigner summary analytics.
- Priority insight block.
- Chart.js visual charts.
- Vote Status chart.
- Call Status chart.
- D2D Status chart.
- Assigner Performance chart.
- Full View/Edit modal.
- Save to Supabase.
- Will Vote → Reach auto-logic.
- Call Outcome `promised-to-vote` → Will Vote + Reached auto-logic.
- Call center fields in modal.
- Call attempts / last call time tracking.
- SMS and email sent flags.
- Bulk select / select all.
- Bulk update Vote Status.
- Bulk update Call Status.
- Bulk update D2D Status.
- Bulk assign to team member.
- Bulk export selected records.
- Bulk delete selected records with confirmation.
- CSV export.
- Print / PDF using browser print.
- Simple report builder with selectable report sections.
- Public filtered share links.
- Public safe-view table.
- Active Filters label above table.
- URL filters for assigner, unassigned, D2D, call status, call outcome, house, ID, and search.
- Required compatibility DOM IDs.
- Global `window.*` compatibility function aliases.
- Modular `/js/` architecture.
- Function-return render pattern.

Still missing / requires backend/auth:

- True private/authenticated share links.
- Password-protected share links.
- Access logs for private links.
- Scheduled email reports.
- Automatic cloud delivery of reports.

## Compatibility DOM IDs

The following stable IDs exist in `index.html` for testing, automation, and external scripts:

| ID | Purpose |
|---|---|
| `dashboard-header` | Top dashboard header. |
| `dashboard-stats` | KPI/stat card container. |
| `filter-bar` | Filter control container. |
| `table-body` | Voter records table body. |
| `pagination` | Pagination container. |

The app also keeps internal IDs used by the modular renderer, such as `campaignsView`, `recordsHead`, `activeFilterSummary`, `pageInfo`, and the filter dropdown IDs.

## Global compatibility functions

These aliases are exposed on `window` for tests and external scripts:

| Function | Maps to |
|---|---|
| `window.fetchRecords()` | `CampaignApi.fetchAllRows()` |
| `window.fetchStats()` | Fetch records and calculate stats. |
| `window.updateRecord(id, patch)` | `CampaignApi.updateRecord(id, patch)` |
| `window.bulkUpdateRecords(ids, patch)` | `CampaignApi.bulkUpdate(ids, patch)` |
| `window.bulkDeleteRecords(ids)` | `CampaignApi.bulkDelete(ids)` |
| `window.applyFilters()` | `CampaignFilters.apply()` |
| `window.filterByD2D(records, status)` | `CampaignFilters.filterByD2D(records, status)` |
| `window.applyUrlFilters()` | `CampaignFilters.applyUrlParams()` |
| `window.calculateStats(rows)` | `CampaignMetrics.calculate(rows)` |
| `window.getAssignerStats(rows)` | `CampaignMetrics.assignerStats(rows)` |
| `window.getCallAgentStats(rows)` | `CampaignMetrics.callAgentStats(rows)` |
| `window.renderDashboard()` | `CampaignRenderDashboard.render()` |
| `window.renderCampaigns()` | `CampaignRenderCampaigns.render()` |
| `window.openModal(row)` | `CampaignModals.openRecord(row)` |
| `window.openRecord(row)` | `CampaignModals.openRecord(row)` |
| `window.closeModal()` | `CampaignModals.close()` |
| `window.saveRecord(id, form)` | `CampaignActions.saveRecord(id, form)` |
| `window.exportCampaignData()` | `CampaignActions.exportData()` |
| `window.exportSelectedRecords()` | `CampaignActions.exportSelected()` |

## Public share links

The dashboard supports public filtered links on the same single page.

Examples:

```text
https://whitesaffron2025-droid.github.io/2026/?public=true&assigner=Shaam
```

```text
https://whitesaffron2025-droid.github.io/2026/?public=true&unassigned=true
```

```text
https://whitesaffron2025-droid.github.io/2026/?public=true&d2d=not-visited
```

```text
https://whitesaffron2025-droid.github.io/2026/?public=true&call=called&outcome=promised-to-vote
```

```text
https://whitesaffron2025-droid.github.io/2026/?public=true&house=Dhafthar
```

Public mode shows only safe basic voter fields:

- Image.
- Name.
- Phone.
- National ID.
- House.

Public mode hides sensitive campaign fields:

- Party.
- Vote status.
- Call status.
- Call outcome.
- D2D status.
- Assigner.
- Internal actions.

Public mode still shows the Active Filters label so users can see why the visible list is filtered.

## URL filter parameters

| Parameter | Example | Purpose |
|---|---|---|
| `public=true` | `?public=true` | Turns on public safe-view mode. |
| `assigner=` | `?assigner=Shaam` | Shows voters assigned to one person. |
| `unassigned=true` | `?unassigned=true` | Shows unassigned voters. |
| `d2d=` | `?d2d=not-visited` | Shows voters by D2D status. |
| `call=` | `?call=called` | Shows voters by phone/call status. |
| `phone_status=` | `?phone_status=called` | Alias for call status. |
| `outcome=` | `?outcome=promised-to-vote` | Shows voters by call outcome. |
| `house=` | `?house=Dhafthar` | Shows voters by house/area text. |
| `id=` | `?id=A123456` | Shows a specific National ID. |
| `voter=` | `?voter=A123456` | Alias for ID lookup. |
| `search=` | `?search=Ali` | Searches name, ID, phone, house, remarks, assignee, call agent, call notes, and call outcome. |

Supported D2D values:

```text
reach
not-visited
not-home
live-in-another-place
```

Supported call status values:

```text
need-call
called
busy
switched-off
not-answer
disconnected
wrong-number
out-of-coverage
out-of-range
no-phone
```

Supported call outcome values:

```text
promised-to-vote
undecided
will-not-vote
callback
no-answer
```

## Supabase config

```text
URL: https://tkuivkhghmeljcuqwwdy.supabase.co
Table: public."2026"
Frontend key: stored in js/config.js
```

The frontend uses the publishable key only. Do not place service-role keys in this repository.

## Supabase fields used by the app

Core voter fields:

```text
id
photo_url
name
national_id
house
lives_in
phone
sex
age
party
image_number
image_filename
image_key
living_place
remarks
area
```

Campaign status fields:

```text
vote_status
reach_status
support_level
phone_status
d2d_status
transport_status
vote_assigned_by
vote_assigned_at
election_review_updated_at
```

Call center fields:

```text
call_attempts
last_call_at
call_duration
call_notes
callback_scheduled_at
call_center_agent
call_outcome
sms_sent
email_sent
```

## Status logic

Vote logic:

```text
vote_status = will-vote
→ reach_status = reached
```

Call outcome logic:

```text
phone_status = called
call_outcome = promised-to-vote
→ vote_status = will-vote
→ reach_status = reached
```

Call tracking logic:

```text
phone_status != need-call
→ call_attempts minimum becomes 1
→ last_call_at updates automatically
```

## Bulk actions

Bulk actions are available in the Campaigns table:

- Select individual rows.
- Select all visible rows.
- Bulk update Vote Status.
- Bulk update Call Status.
- Bulk update D2D Status.
- Bulk assign selected voters.
- Export selected voters to CSV.
- Delete selected voters after confirmation.

Bulk delete is available because frontend RLS currently allows deletes if Supabase policy permits it. Use carefully.

## Reports and PDF

The Reports section includes:

- Selectable report sections.
- Summary section.
- Call Center section.
- D2D section.
- Assigner section.
- Active Filters section.
- Copy Summary button.
- Print / PDF button.

PDF export is handled through the browser print dialog:

```text
Reports → Print / PDF → Save as PDF
```

## File structure

```text
2026/
├── .nojekyll
├── README.md
├── PURPOSE.md
├── SECTION-STRUCTURE.md
├── FUNCTION-ARCHITECTURE.md
├── SINGLE-PAGE-DECISION.md
├── VOTER-IDENTIFICATION.md
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
| `index.html` | Main single-page entry point and page shell. |
| `styles.css` | Styling, layout, badges, tables, bulk toolbar, charts, mobile responsiveness, and print layout. |
| `js/config.js` | Supabase URL/key, table name, status enums, defaults. |
| `js/state.js` | App state, public mode, filters, pagination, selected records. |
| `js/api.js` | Supabase REST fetch/update/delete operations, including bulk update/delete. |
| `js/utils.js` | Formatters, labels, badges, CSV helpers, row normalization. |
| `js/filters.js` | Search, party, status, D2D, call status, call outcome, assigner, URL filters. |
| `js/metrics.js` | KPI, D2D, call center, assigner, and call agent statistics. |
| `js/charts.js` | Chart.js dashboard visualizations. |
| `js/render-dashboard.js` | KPI cards, progress bars, priority blocks. |
| `js/render-campaigns.js` | Normal table, public safe table, active filters, bulk checkboxes, pagination output. |
| `js/render-analytics.js` | Party analytics, D2D analytics, call center analytics, assigner summary, report builder output. |
| `js/actions.js` | Save, export, bulk actions, selected export, print/PDF, copy report. |
| `js/share.js` | Public filtered share link generation. |
| `js/modals.js` | View/Edit modal and voter profile editing logic. |
| `js/app.js` | Main orchestrator: load, render, public mode, events, bulk actions, report buttons. |

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

Expected status after loading in normal mode:

```text
Connected • 3,264 records
```

Expected status after loading in public mode:

```text
Public view • 3,264 records
```

## Dashboard sections

Current live sections:

- Dashboard.
- Campaigns.
- Analytics.
- Reports.

Planned / reference documents:

```text
PURPOSE.md
SECTION-STRUCTURE.md
FUNCTION-ARCHITECTURE.md
SINGLE-PAGE-DECISION.md
VOTER-IDENTIFICATION.md
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
3. Confirm normal mode shows `Connected • 3,264 records`.
4. Confirm the required IDs exist: `dashboard-header`, `dashboard-stats`, `filter-bar`, `table-body`, `pagination`.
5. Confirm global aliases exist: `fetchRecords`, `applyFilters`, `calculateStats`, `renderDashboard`, `renderCampaigns`, `openModal`, `closeModal`.
6. Test search.
7. Test party filter.
8. Test outreach/status filter.
9. Test D2D filter.
10. Test Call Status filter.
11. Test Call Outcome filter.
12. Test assigner filter.
13. Test unassigned filter.
14. Test filter combinations.
15. Test public share link copy.
16. Test public mode hides sensitive fields.
17. Test Active Filters label.
18. Test pagination.
19. Test View/Edit modal save.
20. Test Will Vote → Reached auto-logic.
21. Test Call Outcome `promised-to-vote` auto-logic.
22. Test bulk select and bulk update.
23. Test selected CSV export.
24. Test normal CSV export.
25. Test dashboard charts.
26. Test report builder.
27. Test Print / PDF.
28. Check browser console if the page does not load.

## Safety notes

- Keep `app-native.js` as backup until the modular version is fully stable.
- Do not delete backup scripts during active migration.
- Do not commit service-role Supabase keys.
- Keep large features modular and section-based.
- Public mode must continue hiding party, vote, call, call outcome, D2D, assigner, and edit actions.
- True private links and scheduled reports need Supabase Auth and/or an Edge Function. Do not describe current public links as secure private links.
