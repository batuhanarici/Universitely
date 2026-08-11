# Universitely Development Conventions

## General

Prefer simple, explicit implementations.

Do not introduce abstractions without a clear benefit.

---

## Naming

Use descriptive names.

Avoid abbreviations unless they are already established in the project.

---

## Components

Components should have a clear responsibility.

Avoid very large components that contain:

* data fetching
* business logic
* validation
* UI
* unrelated state

all together.

---

## Data Access

Keep database access predictable.

Reuse existing query patterns.

Do not duplicate database queries unnecessarily.

---

## Types

Prefer shared types over duplicated interfaces.

Avoid `any`.

---

## Error Handling

Errors should be handled explicitly.

Do not silently ignore failures.

---

## Database

Schema changes require migrations.

Do not manually modify production schema without recording the change.

---

## Documentation

Document decisions that future developers would otherwise have to rediscover.

---

## AI Development

AI agents should:

1. inspect before editing
2. reuse before duplicating
3. verify before claiming success
4. document significant decisions
5. avoid unrelated changes
