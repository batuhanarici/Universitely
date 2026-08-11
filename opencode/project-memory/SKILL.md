---

name: project-memory
description: Retrieve and maintain Universitely project knowledge, architectural decisions, and previous agent session context.
-------------------------------------------------------------------------------------------------------------------------------

# Project Memory

Universitely has a persistent project-memory layer backed by Supabase.

## Memory Tables

Use these logical sources:

* `project_knowledge`
* `architectural_decisions`
* `agent_sessions`

## When to Search Memory

Search memory when:

* a feature has historical complexity
* the reason behind an implementation is unclear
* a task modifies an existing architecture
* a previous agent may have solved a similar problem
* a database design decision is unclear
* a bug may have historical context

Do not search memory for trivial changes.

## Reliability Rule

Project memory is historical context, not absolute truth.

Always compare historical information against:

* current source code
* current database schema
* current migrations
* current AGENTS.md

Current code and explicit user requirements take precedence.

## Recording Knowledge

Record knowledge when it is:

* reusable
* architectural
* non-obvious
* likely to help future development

Do not record:

* trivial edits
* temporary debugging output
* ordinary conversations
* redundant information

## Knowledge Quality

Prefer entries that answer:

* What is true?
* Why is it true?
* Where does it apply?
* What should future agents avoid?

Avoid vague notes such as:

> "Changed dashboard."

Prefer:

> "Student progress aggregation is performed server-side because client-side aggregation caused inconsistent results between teacher and student views."

## Security

Never store:

* passwords
* access tokens
* API keys
* service-role keys
* personal secrets
* sensitive production credentials

in project memory.
