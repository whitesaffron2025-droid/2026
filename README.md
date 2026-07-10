# 2026 Campaign Manager

Stable campaign-management application for the 2026 election workflow.

## Current stable build

- Build: `2026.07.10-clean-stable`
- Frontend: HTML5, CSS3, Vanilla JavaScript
- Backend: Supabase Auth + PostgreSQL
- Hosting: GitHub Pages
- Master resident table: `public."2026"`
- Assignment history table: `public.resident_assignments`

## Architecture

Residents is the single source of truth. Assign, Calls, Votes, Door to Door, and Transport are workflow views of the same resident records. No workflow stores a duplicate resident record.

```text
Supabase public."2026"
        │
        ├── Residents Master
        ├── Assign
        ├── Calls
        ├── Votes
        ├── Visits
        └── Transport
```

Assignment history is stored separately so one resident can have multiple assignees without overwriting earlier assignment records.

## Active pages

- `/index.html` — visual landing page
- `/public.html` — read-only public resident gallery
- `/shared.html` — filtered self-assignment workspace
- `/admin/` — authenticated admin master workspace

## Active admin modules

The current `admin/index.html` intentionally loads only these JavaScript modules:

```text
admin/js/app.js
admin/js/dashboard-modern.js
```

The current active workflow styling is:

```text
admin/css/workflow-clean.css
```

Older patch modules remain in the repository only as historical files and are not loaded by the stable admin build.

## Field permissions

| Field | Residents | Assign | Calls | Votes | Visits | Transport |
|---|---:|---:|---:|---:|---:|---:|
| Name | Locked | Locked | Locked | Locked | Locked | Locked |
| National ID | Locked | Locked | Locked | Locked | Locked | Locked |
| Official Address | Locked | Locked | Locked | Locked | Locked | Locked |
| Sex | Locked | Locked | Locked | Locked | Locked | Locked |
| Age | Locked | Locked | Locked | Locked | Locked | Locked |
| Phone | Editable | Read-only | Read-only | Read-only | Read-only | Read-only |
| Current Living Place | Editable | Read-only | Read-only | Read-only | Editable | Read-only |
| Suggested Phone Number | — | Editable suggestion | Editable suggestion | Editable suggestion | Editable suggestion | Editable suggestion |

A suggested phone number does not overwrite the master `phone` field. The actual phone number is changed only from Residents Master.

## Section ownership

### Residents

- Gallery and list views
- Party, address, sex, and search filtering
- Edits only phone, current living place, and remarks

### Assign

- Generates filtered self-assignment links
- Shows all assignee names and assignment times from `resident_assignments`
- Supports one resident being assigned to multiple people

### Calls

- Updates call status, call outcome, agent, notes, call attempts, and last-call time
- Shows phone and current living place as read-only

### Votes

- Updates vote status, support level, and remarks
- Shows phone and current living place as read-only

### Door to Door

- Updates visit status, current living place, and remarks
- Phone remains read-only

### Transport

- Updates transport status and remarks
- Phone and current living place remain read-only

## Party filtering

The global Party filter uses one consistent classification:

```text
All
PNC
MDP
No Party
```

Any value other than exact `PNC` or `MDP` is classified as `No Party`.

## Dashboard logic

- Dashboard totals respect the selected Party filter
- Percentages use `matching records ÷ selected total × 100`
- Today's Call Goal uses `last_call_at` from the current calendar day
- Clicking a house opens Residents filtered to that official address
- Assignment feed reads from `resident_assignments`

## Security

- Admin uses Supabase email/password authentication
- Passwords are not stored in localStorage
- Shared assignment users must authenticate before saving
- Supabase Row Level Security should remain enabled
- The public resident page is read-only

## Backup and SHA manifest

See:

```text
docs/FILE-STRUCTURE-BACKUP.md
```

That file records the active structure, current module versions, and GitHub blob SHAs for the stable build.