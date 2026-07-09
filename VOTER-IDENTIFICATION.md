# Voter Identification on the Single Page Dashboard

The single-page dashboard is enough for identifying voters and managing outreach. Separate pages are not required for the current purpose.

## Table-at-a-glance identification

Each voter can be identified directly from the table using the core visible fields:

| Field | Purpose |
|---|---|
| Name | Identifies the voter. |
| House | Shows address/location. |
| Phone | Shows contact number and supports phone calling. |
| Party | Shows political affiliation. |
| Vote | Shows vote intention/status. |
| Call | Shows call status. |
| D2D | Shows door-to-door visit status. |
| Assign | Shows who is responsible for the voter. |
| Action | Opens full details/profile view. |

## Current single-page workflow

```text
Search or filter
  -> table updates
  -> voter remains identifiable by name, house, phone
  -> View button opens detail/profile view
  -> status/actions can be updated from the same dashboard
```

## Full voter detail view

The View/Profile action should show the extended voter record:

- Photo/image if available.
- Name.
- National ID.
- House/address.
- Phone.
- Age.
- Sex.
- Party.
- Vote status.
- Reach status.
- Phone status.
- D2D status.
- Transport status.
- Support level.
- Election box.
- Living place.
- Assigned person.
- Remarks/notes.
- Image filename/key if useful for admin review.
- Last updated information when available.

## Visual identification rules

Use color-coded badges for fast scanning:

| Status group | Positive | Pending/Warning | Negative |
|---|---|---|---|
| Vote | Will Vote | Not Decided | Not Vote |
| Call | Called | Need Call / Busy / Not Answer | Disconnected / Wrong Number / Out of Coverage |
| D2D | Reach / Visited | Not Visited / Not Home | Live in Another Place when used as blocker |
| Assign | Assigned name | Unassigned | — |

## Search behavior

The search box should match:

- Name.
- National ID.
- Phone.
- House.
- Lives in / living place.
- Party.
- Remarks.
- Assigned person.

## Filter behavior

Filters should update only the table and dependent counts, not reload the whole page.

Current filters:

- Party.
- Outreach/status.
- Page size.
- Search.

Planned filters:

- D2D status.
- Assigner.
- Transport status.
- Support level.
- Election box.
- Area/location.

## Photo handling decision

Photos are optional in the table. The recommended approach is:

1. Keep table compact.
2. Show photo in the View/Profile modal.
3. Later add a small thumbnail column only if it helps field teams.

## Final decision

Keep voter identification inside the single-page dashboard.

The table gives enough information to identify voters quickly, and the View action can expose the full record without needing a separate page.
