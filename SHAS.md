# 2026 Campaign Manager — SHA Ledger

Updated: 11 July 2026

Build: `2026.07.11-live-turnout`

Repository: `whitesaffron2025-droid/2026`

## Purpose

This file records the current backup points for the website. Blob SHAs identify exact file contents. Commit SHAs identify repository restore points.

## Current active file blob SHAs

| File | Blob SHA |
|---|---|
| `README.md` | `c1aa6d6b0e54423c10cba5b5a113d6230a311877` |
| `docs/FILE-STRUCTURE-BACKUP.md` | `c47949fce0eafaf9e63332d5c68212b2dab4a060` |
| `admin/index.html` | `def97b9afd5e65faa6b312f2f8b8e01745ffd845` |
| `admin/live.html` | `4880320b2dcba04916f6f68a71dc2d15da0b15e1` |
| `admin/js/app.js` | `0b5ecd93d4140c1fa8a061669cf6f2a66df05b03` |
| `admin/js/live-checkin.js` | `6db150d670806147f963449b2cb5d211c23d2236` |
| `admin/css/live-checkin.css` | `0ac371f88c82b9dc83854ddd82d85c8805d8d67d` |
| `admin/js/dashboard-modern.js` | `3850ba66127eab5907a20d5e0bb35451457012ef` |
| `admin/css/workflow-clean.css` | `ab11f940e63af585d460f0ea68480361ba4c86df` |
| `js/config.js` | `dda83a801ff3cfa1f6a2b1f22ad2ef7615e31ca8` |

## Latest commit restore points

| Change | Commit SHA |
|---|---|
| Fix Live first-row/header offset | `cdf0983198933a8bc365a068eb5edea7af31f5b9` |
| Refresh Live CSS after first-row fix | `728c8b403c54e2654b431dc199a41c0a4d2fb781` |
| Lock Live page to PNC only | `d3a76b2d20a6b096806d8b7ce27b238befcd2207` |
| Filter Supabase Live loading and saving to PNC | `cb2e25855b1a831553050da56cf03e159f6e3eb8` |
| Add filtered CSV button | `9226f31cd3032c35a65e4c28ac500ffdba31c028` |
| Add filtered CSV export logic | `ac80215a7c437aa3c375a6eb6825bdc709a15724` |
| Update README with current architecture | `a14ea672b5c8afd14903a5bd9042efd3bc746829` |
| Update full backup manifest | `59e614aaf6df68c1517f55c2ba303aebf3ee6854` |
| Create this SHA ledger | Commit containing this file |

## Current Live Turnout contract

```text
Page: admin/live.html
Scope: party = PNC only
Save fields: has_voted, voted_at
Save trigger: Save Changes
Export: current filtered visible result
```

## Change-control rule

After every completed website change:

1. Record the affected file blob SHA.
2. Record the commit SHA.
3. Update `README.md` when functionality changes.
4. Update `docs/FILE-STRUCTURE-BACKUP.md`.
5. Update this `SHAS.md` ledger.
6. Verify the live deployment.
7. Never delete or remove a file, page, feature, field, or module without asking the owner first.
