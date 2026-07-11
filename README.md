# 2026 Campaign Manager

Campaign-management application for the 2026 election workflow.

## Current build

- Build: `2026.07.11-live-turnout`
- Frontend: HTML5, CSS3, Vanilla JavaScript
- Backend: Supabase Auth + PostgreSQL
- Hosting: GitHub Pages
- Main resident table: `public.campaign`
- Assignment table: `public.resident_assignments`

## Main links

- Landing page: `/index.html`
- Public resident view: `/public.html`
- Shared assignment page: `/shared.html`
- Admin workspace: `/admin/`
- PNC Live Turnout: `/admin/live.html`

## Architecture

The `campaign` table is the resident source of truth. The admin sections show workflow views of the same resident records. Assignment records are stored separately in `resident_assignments`.

```text
Supabase public.campaign
        │
        ├── Dashboard
        ├── Residents
        ├── Assign
        ├── Calls
        ├── Votes
        ├── Visits
        ├── Transport
        └── PNC Live Turnout
```

## Admin resident table

The standard resident list column order is:

```text
ID | Photo | ID Number | Name | Official Address | Living Now | Mobile | Sex | Age | Action
```

- `ID` is the Supabase database row ID.
- `ID Number` is the resident National ID.
- Residents remain the master editing page.

## PNC Live Turnout page

Path:

```text
/admin/live.html
```

Purpose: election-day check-in and turnout tracking for PNC residents only.

### Data scope

The page loads only rows where:

```text
party = PNC
```

It does not show MDP or No Party residents.

### Displayed columns

```text
ID | Photo | ID Number | Name | Official Address | Living Now | Mobile | Sex | Age | Vote Status
```

### Dashboard cards

- `Voted` — filters the table to voted residents.
- `Not Yet` — filters the table to residents not yet marked voted.
- `PNC Total` — displays all PNC residents.

The selected card stays synchronized with the status dropdown.

### Search

Searches the loaded PNC list using:

- Database ID
- National ID
- Name
- Official address
- Current living place
- Mobile number
- Sex
- Age

### Turnout workflow

1. Click the resident's Vote Status button.
2. The row changes to `Voted` or `Not Yet` locally.
3. The row is marked `Pending save`.
4. Click `Save Changes`.
5. Supabase updates the matching PNC row.

Saved fields:

```text
has_voted
voted_at
```

When marked voted:

```text
has_voted = true
voted_at = current timestamp
```

When changed back to not voted:

```text
has_voted = false
voted_at = null
```

The page warns before closing when pending changes have not been saved.

### Filtered CSV export

`Export Filtered CSV` exports exactly the current visible PNC result after applying search and vote-status filters.

CSV column order:

```text
ID | ID Number | Name | Official Address | Living Now | Mobile | Sex | Age | Vote Status | Voted At
```

### Live page runtime files

```text
admin/live.html
admin/js/live-checkin.js
admin/css/live-checkin.css
```

## Current admin loader

`admin/index.html` currently loads:

```text
admin/js/app.js
admin/js/resident-table-columns.js
admin/js/live-nav.js
admin/js/workflow-hotfix.js
admin/js/dashboard-modern.js
admin/js/photo-click-fix.js
admin/js/export-tools.js
admin/js/stat-card-filters.js
admin/js/mobile-print-fix.js
admin/js/filter-export-layout.js
```

## Field ownership

### Residents

- Phone: editable
- Current living place: editable
- Remarks: editable
- Identity fields: locked

### Assign

- Reads assignment rows from `resident_assignments`
- Supports multiple assignees per resident

### Calls

- Updates call workflow fields

### Votes

- Updates vote intention/support workflow fields

### Visits

- Updates visit and living-place workflow fields

### Transport

- Updates transport workflow fields

### Live Turnout

- Updates only `has_voted` and `voted_at`
- Restricted in the page logic to PNC rows

## Security

- Admin uses Supabase authentication.
- Passwords must not be stored in localStorage.
- Supabase Row Level Security should remain enabled.
- Public pages remain read-only unless explicitly designed for authenticated saving.

## Backup and SHA documents

See:

```text
docs/FILE-STRUCTURE-BACKUP.md
SHAS.md
```

## Permanent change-control rule

After any completed website change:

1. Update `README.md` when behavior or architecture changes.
2. Update `docs/FILE-STRUCTURE-BACKUP.md`.
3. Update `SHAS.md` with current file and commit references.
4. Do not delete or remove a file, page, feature, database field, or module without asking the owner first.
