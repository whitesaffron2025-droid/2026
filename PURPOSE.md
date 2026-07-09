# Complete Purpose Breakdown

This document explains the purpose of the campaign dashboard, the current Single HTML Application approach, and the modular architecture now added under `/js/`.

## Complete overview

### 1. Campaign Dashboard

The dashboard is a campaign management system for tracking voter outreach, door-to-door visits, assigner performance, voter status, phone banking, transport needs, and overall campaign progress.

### 2. SAHA Structure

SAHA means Single HTML Application. The app remains simple to deploy on GitHub Pages because the main page is `index.html`, with static CSS and JavaScript files.

### 3. Modular Split

The previous monolithic script is being split into focused modules so each dashboard area can be fixed, extended, and audited independently.

## File purposes

| File | Purpose |
|---|---|
| `SECTION-STRUCTURE.md` | Complete reference for all dashboard sections and phases. |
| `PURPOSE.md` | Explains why the project exists and how the architecture should be used. |
| `index.html` | Main entry point and page layout. |
| `styles.css` | Visual styling, layout, responsive behavior, badges, panels, and tables. |
| `app-native.js` | Backup monolithic working/reference version. |
| `app-fixed.js` | Backup alternate loader version. |
| `app.js` | Older backup. |
| `/js/` | Modular application architecture. |

## Module purposes

| Module | Purpose |
|---|---|
| `js/config.js` | Supabase config, table name, pagination, status enums. |
| `js/state.js` | Global app state, filters, pagination, active view, selected records. |
| `js/api.js` | Supabase REST fetch and update operations. |
| `js/utils.js` | Formatting, labels, badges, CSV escaping, row normalization. |
| `js/filters.js` | Search, party, status, D2D, assigner, and future filter logic. |
| `js/metrics.js` | Dashboard metric calculations. |
| `js/charts.js` | Chart rendering placeholder for future Chart.js integration. |
| `js/render-dashboard.js` | KPI cards, progress bars, and priority blocks. |
| `js/render-campaigns.js` | Records table and pagination rendering. |
| `js/render-analytics.js` | Party analytics, insights, and report text. |
| `js/actions.js` | Export and report copy actions. Future CRUD and bulk actions go here. |
| `js/share.js` | Public/private share link functionality placeholder. |
| `js/modals.js` | Modal and record view management. |
| `js/app.js` | Main orchestrator: loads data, sets events, renders all sections. |

## Feature purposes

### D2D features

Purpose: Track and manage door-to-door voter visits.

- Filter records by D2D status.
- Track D2D progress.
- Identify not visited, not home, and follow-up voters.
- Assign visits to team members.

### Assigner features

Purpose: Manage campaign team workload and performance.

- Filter by assigned team member.
- Track assigned and unassigned voters.
- Measure conversion and progress by assignee.
- Balance workload across teams.

### Share features

Purpose: Share filtered dashboard views.

- Public read-only links.
- Private/authenticated links.
- Persisted filters in shared URLs.
- Future share table integration through Supabase.

## Developer purpose

- Keep code organized.
- Add features section by section.
- Reduce risk when fixing bugs.
- Keep GitHub Pages deployment simple.
- Keep `app-native.js` as a fallback reference.

## Campaign team purpose

- Track voter outreach progress.
- Manage D2D visits and calls.
- Monitor team performance.
- Identify pending voters quickly.
- Support data-driven decisions.

## Campaign purpose

- Increase voter reach.
- Optimize volunteer/team resources.
- Improve voter conversion and follow-up.
- Prepare transport and turnout support.
- Build a stronger election-day operation.

## Current implementation status

Implemented:

- Static GitHub Pages app.
- Supabase REST loading.
- Batched loading for all records.
- Modular `/js/` structure.
- KPI dashboard.
- Campaign records table.
- Search, party, and status filters.
- Pagination.
- Party analytics.
- CSV export.
- Report copy.

Planned next:

- Restore full edit/save modal inside modular architecture.
- Add D2D-specific filter group.
- Add assigner filter dropdown.
- Add share link generation.
- Add bulk actions.
- Add charts.
- Add voter profile modal.
