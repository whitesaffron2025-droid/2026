# 2026 Campaign Manager — Full Website Backup Manifest

Generated: 11 July 2026

Build: `2026.07.11-live-turnout`

Repository: `whitesaffron2025-droid/2026`

## Active website structure

```text
2026/
├── index.html
├── public.html
├── shared.html
├── README.md
├── SHAS.md
├── js/
│   └── config.js
├── assets/
│   ├── css/
│   │   ├── public.css
│   │   └── shared.css
│   └── js/
│       ├── public.js
│       └── self-assign.js
├── admin/
│   ├── index.html
│   ├── live.html
│   ├── css/
│   │   ├── admin.css
│   │   ├── auth.css
│   │   ├── compact-gallery.css
│   │   ├── dashboard-modern.css
│   │   ├── live-checkin.css
│   │   ├── modern-editors.css
│   │   └── workflow-clean.css
│   └── js/
│       ├── app.js
│       ├── dashboard-modern.js
│       ├── export-tools.js
│       ├── filter-export-layout.js
│       ├── live-checkin.js
│       ├── live-nav.js
│       ├── mobile-print-fix.js
│       ├── photo-click-fix.js
│       ├── resident-table-columns.js
│       ├── stat-card-filters.js
│       └── workflow-hotfix.js
└── docs/
    └── FILE-STRUCTURE-BACKUP.md
```

## Active database configuration

Main table:

```text
public.campaign
```

Assignment table:

```text
public.resident_assignments
```

Live turnout fields:

```text
has_voted boolean
voted_at timestamptz
```

## Admin workspace loader order

`admin/index.html` loads:

```text
1. Supabase JavaScript SDK
2. js/config.js
3. admin/js/app.js
4. admin/js/resident-table-columns.js
5. admin/js/live-nav.js
6. admin/js/workflow-hotfix.js
7. admin/js/dashboard-modern.js
8. admin/js/photo-click-fix.js
9. admin/js/export-tools.js
10. admin/js/stat-card-filters.js
11. admin/js/mobile-print-fix.js
12. admin/js/filter-export-layout.js
```

## PNC Live Turnout runtime

Page:

```text
admin/live.html
```

Runtime order:

```text
1. admin/css/admin.css
2. admin/css/live-checkin.css
3. Supabase JavaScript SDK
4. js/config.js
5. admin/js/live-checkin.js
```

### Live page rules

- Loads only rows with `party = PNC`.
- Displays Voted, Not Yet, and PNC Total cards.
- Dashboard cards filter the resident table.
- Search covers ID, National ID, name, address, living place, mobile, sex, and age.
- Vote changes remain local until `Save Changes` is pressed.
- Saves only `has_voted` and `voted_at`.
- Update query also checks `party = PNC`.
- Warns before leaving with unsaved changes.
- Exports the current filtered list to CSV.

### Live table order

```text
ID | Photo | ID Number | Name | Official Address | Living Now | Mobile | Sex | Age | Vote Status
```

### CSV order

```text
ID | ID Number | Name | Official Address | Living Now | Mobile | Sex | Age | Vote Status | Voted At
```

## Current active file blob SHAs

These are GitHub blob SHAs, not commit SHAs.

| File | Role | Blob SHA |
|---|---|---|
| `README.md` | Current architecture and page documentation | `c1aa6d6b0e54423c10cba5b5a113d6230a311877` |
| `admin/index.html` | Admin application loader | `def97b9afd5e65faa6b312f2f8b8e01745ffd845` |
| `admin/live.html` | PNC Live Turnout page | `4880320b2dcba04916f6f68a71dc2d15da0b15e1` |
| `admin/js/app.js` | Main admin application | `0b5ecd93d4140c1fa8a061669cf6f2a66df05b03` |
| `admin/js/live-checkin.js` | PNC turnout logic and CSV export | `6db150d670806147f963449b2cb5d211c23d2236` |
| `admin/css/live-checkin.css` | Live page layout and responsive table | `0ac371f88c82b9dc83854ddd82d85c8805d8d67d` |
| `admin/js/dashboard-modern.js` | Admin dashboard | `3850ba66127eab5907a20d5e0bb35451457012ef` |
| `admin/css/workflow-clean.css` | Workflow styling | `ab11f940e63af585d460f0ea68480361ba4c86df` |
| `js/config.js` | Supabase/runtime configuration | `dda83a801ff3cfa1f6a2b1f22ad2ef7615e31ca8` |

## Latest backup commits

| Change | Commit SHA |
|---|---|
| Add filtered CSV export to PNC live page | `9226f31cd3032c35a65e4c28ac500ffdba31c028` |
| Export active PNC turnout filter | `ac80215a7c437aa3c375a6eb6825bdc709a15724` |
| Document current architecture and PNC Live page | `a14ea672b5c8afd14903a5bd9042efd3bc746829` |
| Update this full website backup manifest | Commit containing this file |

## Restore procedure

1. Restore the repository at the desired commit.
2. Confirm `js/config.js` points to the correct Supabase project and `campaign` table.
3. Confirm `admin/index.html` loads the modules listed in this document.
4. Confirm `admin/live.html` loads `live-checkin.css?v=6` and `live-checkin.js?v=6`.
5. Hard-refresh the site.
6. Test admin authentication.
7. Test Residents loading, searching, filtering, editing, and CSV export.
8. Test Assign, Calls, Votes, Visits, and Transport.
9. Test `/admin/live.html` with PNC Total, Voted, Not Yet, search, save, undo-before-save, and filtered CSV export.
10. Confirm Supabase updates `has_voted` and `voted_at` only for the selected PNC resident IDs.
11. Confirm there are no repeating MutationObserver loops or duplicate event listeners.

## Permanent backup rule

After any completed website change:

1. Update the affected file version or cache query string when required.
2. Update `README.md` when behavior or architecture changes.
3. Update this backup manifest.
4. Update `SHAS.md` with the new blob and commit SHAs.
5. Verify the live GitHub Pages deployment.
6. Do not delete or remove any file, page, feature, field, or module without asking the owner first.
