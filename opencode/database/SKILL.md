---

name: database
description: Safely design, modify, inspect, and optimize the Universitely Supabase PostgreSQL database.
--------------------------------------------------------------------------------------------------------

# Database

## Primary Rule

Supabase PostgreSQL is the authoritative data store.

## Before Changing Schema

Inspect:

* existing tables
* columns
* foreign keys
* indexes
* constraints
* RLS policies
* existing migrations
* dependent application code

Use Supabase MCP when available.

## Schema Changes

Every schema change must be represented by a migration.

Never rely on an undocumented manual production change.

## Migration Rules

Prefer migrations that are:

* explicit
* reversible where practical
* narrowly scoped
* safe for existing data

Before destructive changes, require explicit approval.

## RLS

Every table containing user-specific data must be reviewed for RLS.

Ask:

* Who can SELECT?
* Who can INSERT?
* Who can UPDATE?
* Who can DELETE?
* Is ownership verified server-side?
* Can another student access this record?

Never assume frontend filtering is sufficient authorization.

## Query Rules

Avoid:

* `select *` when unnecessary
* N+1 queries
* duplicated queries
* unbounded queries
* missing pagination on large collections

Use indexes for frequently filtered or joined columns when justified.

## Data Integrity

Prefer database constraints for invariants that must always be true.

Examples:

* foreign keys
* unique constraints
* not-null constraints
* check constraints

## After Schema Changes

Verify:

1. migration
2. types
3. RLS
4. affected queries
5. tests
6. documentation
