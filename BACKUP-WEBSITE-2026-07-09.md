# Website Backup — 2026 Campaign Manager

Backup date: 2026-07-09
Repository: whitesaffron2025-droid/2026
Default branch: main
Live URL: https://whitesaffron2025-droid.github.io/2026/
Supabase table: 2026

## Purpose

This file records the current website architecture before further UI changes. The Supabase data is not changed by this backup. The application data remains in the existing Supabase table named `2026`.

## Current active entry file

- `index.html`

The website is currently loading the modular JavaScript architecture from `index.html`.

## Active script structure

```text
js/config.js
js/helpers.js
js/state.js
js/api.js
js/ui/shell.js
js/ui/table.js
js/ui/modal.js
js/sections/dashboard.js
js/sections/residents.js
js/sections/sections.js
js/sections/assign.js
js/sections/calls.js
js/sections/votes.js
js/sections/visits.js
js/sections/transport.js
js/sections/reports.js
js/app.js
```

## Active CSS

```text
styles.css
```

## Current workflow

```text
Dashboard
Residents
Assign
Calls
Votes
Visits
Transport
Reports
```

## Important current behavior

### Residents
- Shows all residents after filters.
- Uses address, party, search, and page size controls.

### Assign
- Has assignment category filter.
- Shows unassigned / assigned / all residents.
- Shows assigner filter.
- Shows photo, name/ID, address, mobile, assigned-to, remarks, action.
- Update modal asks who the assigner is.
- Save updates:
  - `vote_assigned_by`
  - `vote_assigned_at`
  - `remarks`

### Calls
- Shows `phone_status = need-call` queue.
- Updating `called` sets `reach_status = reached`.
- Updating `need-call` sets `reach_status = not-reached`.

### Votes
- Shows `vote_status = not-decided` queue.
- Updating `will-vote`, `not-vote`, or support `guaranteed` sets `reach_status = reached`.

### Visits
- Shows `d2d_status = not-visited` queue.
- Updating `reach` sets `reach_status = reached`.

### Transport
- Shows `transport_status = need-transport` queue.

### Reports
- Shows campaign totals and copyable report.

## Configuration rule

Do not change `js/config.js` unless the Supabase project or table changes.

Current required config keys:

```javascript
window.CampaignConfig = {
  supabaseUrl: '...',
  supabaseKey: '...',
  tableName: '2026',
  pageSize: 20,
  batchSize: 1000
};
```

## Restore instructions

If a future UI change breaks the site:

1. Open GitHub repository `whitesaffron2025-droid/2026`.
2. Go to the commit history on `main`.
3. Restore to the commit immediately before the broken change.
4. Confirm that `index.html` loads the modular files listed above.
5. Confirm `js/config.js` still points to table `2026`.
6. Open the live URL with a cache refresh.

## Notes

This is a code-structure backup, not a database backup. Supabase data remains separate and should be backed up from Supabase if a full data backup is needed.
