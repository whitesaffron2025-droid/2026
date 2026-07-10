# Admin Module Map

Build: `2026.07.10-admin-modular`

This file identifies where each admin feature lives. Check this map before changing code.

| Feature | File | Ownership |
|---|---|---|
| Core admin application | `admin/js/app.js` | Login, Supabase loading, navigation, search, filters, stats and base views |
| Workflow editors | `admin/js/section-logic.js` | Assign, Calls, Votes, Visits and Transport updates |
| Editor compatibility | `admin/js/editor-hotfix.js` | Phone and current-living-place editor compatibility |
| Assignment link generator | `admin/js/assignment-share.js` | Filtered self-assignment links and assigned-time display |
| Admin module identification | `admin/js/module-registry.js` | Build ID and module versions |
| Residents gallery layout | `admin/css/compact-gallery.css` | Compact responsive resident cards |
| Main admin styling | `admin/css/admin.css` | Header, navigation, tables, filters and shared layout |
| Editor styling | `admin/css/modern-editors.css` | Slide-in workflow editor |
| Authentication styling | `admin/css/auth.css` | Login and loading screens |
| Self-assignment page | `shared.html` | Separate non-admin assignment page |
| Self-assignment behavior | `assets/js/self-assign.js` | Resident selection, assignee name and assignment save |
| Shared-page styling | `assets/css/shared.css` | Public-style assignment cards |

## Rules

1. Do not place new assignment-link logic inside `app.js`.
2. Do not place Residents gallery CSS inside `admin.css`.
3. Every new JavaScript or CSS module must start with a MODULE, VERSION and PURPOSE header.
4. Update `module-registry.js` and this file whenever a module is added or renamed.
5. Keep `app.js` as the base renderer until the next controlled refactor; do not split it while production workflows are being verified.
