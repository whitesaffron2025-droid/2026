# 2026 Campaign Manager — File Structure Backup

Generated: 10 July 2026

Stable build: `2026.07.10-clean-stable`

Repository: `whitesaffron2025-droid/2026`

## Active structure

```text
2026/
├── index.html
├── public.html
├── shared.html
├── README.md
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
│   ├── css/
│   │   ├── admin.css
│   │   ├── auth.css
│   │   ├── compact-gallery.css
│   │   ├── dashboard-modern.css
│   │   ├── modern-editors.css
│   │   └── workflow-clean.css
│   └── js/
│       ├── app.js
│       └── dashboard-modern.js
└── docs/
    └── FILE-STRUCTURE-BACKUP.md
```

## Active runtime files and blob SHAs

These are GitHub blob SHAs, not commit SHAs.

| File | Version / Role | Blob SHA |
|---|---|---|
| `admin/index.html` | Stable admin loader | `c97236069f94c132aeb9c7c803a5ceaa4d762e96` |
| `admin/js/app.js` | Campaign Admin Core v20.0.0 | `0b5ecd93d4140c1fa8a061669cf6f2a66df05b03` |
| `admin/js/dashboard-modern.js` | Modern Dashboard v2.0.0 | `3850ba66127eab5907a20d5e0bb35451457012ef` |
| `admin/css/workflow-clean.css` | Clean Workflow Editors v1.0.0 | `ab11f940e63af585d460f0ea68480361ba4c86df` |
| `admin/css/dashboard-modern.css` | Dashboard visual system | `8f244a17e83d31cfdd8acadf5d8be67986f19f8f` |
| `shared.html` | Shared self-assignment page | `49dc64162a316b3b9f347349918682005364da14` |
| `assets/js/self-assign.js` | Shared Self Assignment v2.0.0 | `9ea773b0c9f4ffb8ca06859f35982a4517969888` |
| `js/config.js` | Supabase/runtime configuration | `deb5a7b7c8e809225980c851cf66f44d797520c2` |
| `README.md` | Architecture documentation after update | `04385f4613d117e5b3050e49569c078871a2d328` |

## Commit backup points

| Change | Commit SHA |
|---|---|
| Clean stable workflow files uploaded | Current repository state before documentation update |
| README architecture update | `42fc3bbb1aafbdd2e9a2a1e31ca30476689702e2` |
| File structure and SHA manifest | Created by the commit containing this file |

## Active loader order

`admin/index.html` loads:

```text
1. Supabase JavaScript SDK
2. js/config.js
3. admin/js/app.js
4. admin/js/dashboard-modern.js
```

No other admin JavaScript patch modules should be added to the loader without an audit.

## Historical files not loaded

These files may still exist in the repository, but the stable admin loader does not execute them:

```text
admin/js/section-logic.js
admin/js/editor-hotfix.js
admin/js/phone-verification.js
admin/js/compact-phone-suggestion.js
admin/js/party-filter-counts.js
admin/js/dashboard-navigation.js
admin/js/assignment-share.js
admin/js/module-registry.js
```

Do not restore these scripts to `admin/index.html` unless their logic is first merged into the active core and tested for duplicate listeners and MutationObserver loops.

## Database ownership

### Master table

```text
public."2026"
```

Stores resident identity, contact, status, call, vote, visit, transport, and latest assignment summary fields.

### Assignment history

```text
public.resident_assignments
```

Stores one row for every resident/assignee assignment event:

```text
resident_id
assignee_name
assigned_at
```

This table allows multiple assignees for one resident.

## Permanent field rules

```text
Residents:
  Phone               = editable
  Current Living Place = editable

Visits:
  Phone               = read-only
  Current Living Place = editable

Assign / Calls / Votes / Transport:
  Phone               = read-only
  Current Living Place = read-only

All sections:
  Name, National ID, Official Address, Sex, Age = locked
```

## Restore procedure

To restore this stable build:

1. Restore the files listed in the SHA table.
2. Confirm `admin/index.html` loads only `app.js` and `dashboard-modern.js` after configuration.
3. Hard-refresh the Admin page.
4. Test Residents edit, Calls edit, Votes edit, Visits edit, Transport edit, house navigation, and shared assignment.
5. Confirm the browser console has no repeating MutationObserver or duplicate submit-handler errors.

## Next backup rule

Whenever an active runtime file changes:

1. Update its module version header.
2. Update its query-string version in the loading HTML.
3. Update this manifest with the new blob SHA.
4. Record the new commit SHA.
5. Update `README.md` if architecture or permissions changed.
