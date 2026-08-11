---

name: project-context
description: Build a reliable understanding of the Universitely project before making non-trivial changes.
----------------------------------------------------------------------------------------------------------

# Project Context

Use this skill before implementing any non-trivial feature, refactor, database change, authentication change, or architectural change.

## Objective

Build a concise mental model of the affected part of Universitely before editing code.

## Workflow

1. Read `AGENTS.md`.
2. Identify the feature or subsystem affected.
3. Inspect relevant files.
4. Search for existing implementations.
5. Inspect relevant database schema and migrations.
6. Inspect relevant architectural decisions.
7. Search project memory when available.
8. Identify dependencies and side effects.
9. Produce a short implementation plan.
10. Only then modify code.

## Search Strategy

Prefer targeted searches over reading the entire repository.

Look for:

* component names
* route names
* database table names
* TypeScript types
* server actions
* API endpoints
* Supabase queries
* RLS policies
* related tests

## Important Rule

Do not create a new implementation before confirming that an equivalent implementation does not already exist.

## Output

Before substantial implementation, internally establish:

* Current behavior
* Desired behavior
* Affected files
* Affected database objects
* Security implications
* Testing strategy

Keep the final user-facing explanation concise.
