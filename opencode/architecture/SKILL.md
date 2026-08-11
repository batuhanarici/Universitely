---

name: architecture
description: Analyze and evolve the Universitely application architecture without introducing unnecessary complexity or duplication.
------------------------------------------------------------------------------------------------------------------------------------

# Architecture

## Goal

Maintain a coherent architecture as Universitely grows.

## Before Architectural Changes

Inspect:

* current folder structure
* data flow
* authentication
* authorization
* database relationships
* server/client boundaries
* existing abstractions

## Principles

### Prefer Existing Patterns

If the project already has a pattern for:

* data fetching
* validation
* authentication
* authorization
* error handling
* forms
* database access

reuse it.

### Minimize Abstractions

Do not create abstractions merely because they appear architecturally elegant.

An abstraction should solve an actual repeated problem.

### Separate Responsibilities

When appropriate:

```text
UI
↓
application logic
↓
data access
↓
database
```

Avoid mixing unrelated responsibilities inside one component or function.

## Database Architecture

Database design should prioritize:

* correct relationships
* data integrity
* appropriate indexes
* RLS
* predictable queries

Do not duplicate the same source of truth across multiple tables unless there is a documented reason.

## Business Logic

Business rules must have one clear source of truth.

For example, exam scoring should not be calculated differently in:

* the student dashboard
* teacher dashboard
* reports
* notifications

If a business rule changes, locate all consumers.

## Architectural Decisions

When making a significant architectural decision:

1. Explain the problem.
2. Consider alternatives.
3. Choose the simplest viable solution.
4. Record the decision in `docs/decisions.md`.
