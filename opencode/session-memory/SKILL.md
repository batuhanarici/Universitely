---

name: session-memory
description: Summarize important Universitely development sessions and preserve reusable project knowledge for future agents.
-----------------------------------------------------------------------------------------------------------------------------

# Session Memory

Use after substantial implementation work.

## Purpose

Create durable context for future development.

## Capture

Record:

### Task

What was requested?

### Implementation

What changed?

### Files

Which important files changed?

### Database

Were tables, migrations, policies, indexes, or queries changed?

### Decisions

Were important architectural or implementation decisions made?

### Problems

Were any issues discovered?

### Verification

What was tested?

### Remaining Work

What should happen next?

## Do Not Record

Do not store:

* secrets
* credentials
* tokens
* temporary logs
* irrelevant conversation
* trivial formatting changes

## Quality Standard

A future developer should be able to understand the session without reading the entire conversation.

## Suggested Record

```text
Task:
...

Implementation:
...

Important Files:
...

Database:
...

Decisions:
...

Problems:
...

Verification:
...

Next Steps:
...
```

If Supabase project memory is available, store important session information in `agent_sessions`.
