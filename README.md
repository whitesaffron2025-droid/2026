# 2026 Campaign Manager

Stable baseline for the 2026 campaign voter-management application.

## Stack

- HTML5, CSS3, Vanilla JavaScript
- Supabase Auth and PostgreSQL
- GitHub Pages
- Master table: `public."2026"`

## Core architecture

Residents is the single source of truth. Assign, Calls, Votes, Door to Door, and Transport are workflow views of the same resident records. There is no duplicate voter storage.

## Locked identity fields

These fields are treated as identity-linked master data and cannot be edited from workflow screens:

- Name
- National ID
- Official address (`house`)
- Sex
- Age

## Correctable resident fields

- Current living place can be corrected from Residents and Door to Door.
- Phone number can be corrected from Residents and Calls.
- Updating current living place does not change the official ID-linked address.

## Section ownership

### Residents

Gallery view shows:

- Resident image
- Name
- National ID
- Official address
- Current living place

Residents can update only current living place and phone number.

### Assign

Updates only assignment status, assignee, assignment time, and remarks.

### Calls

Updates phone number, phone/call status, call agent, call notes, last-call time, and call attempts. This is where wrong phone numbers can be corrected.

### Votes

Updates vote status, support level, and remarks.

### Door to Door

Updates visit status, current living place, and remarks. Use this section when a resident is confirmed to live elsewhere.

### Transport

Updates transport status and remarks.

## Status logic

- Will Vote, Not Vote, Guaranteed, successful Calls, and Reached visits set `reach_status` to `reached`.
- Unassigned clears assignment owner and assignment time.
- A saved Call increases `call_attempts` and records `last_call_at`.

## Security

- Admin uses Supabase email/password authentication.
- Passwords are not stored in localStorage.
- Database access must remain protected by Supabase Row Level Security policies.

## Current milestone

Resident gallery, persistent filtering, section-owned editors, live Supabase records, and locked identity fields.
