# Universitely — AI Development Rules

## 1. Project Identity

Universitely is an education management and student progress tracking platform.

The system is designed primarily around three roles:

* Student
* Teacher / Coach
* Parent

The platform allows students and educators to track:

* Exams
* Exam results
* Correct answers
* Wrong answers
* Blank answers
* Topic-level performance
* Progress over time
* Repeated mistakes
* Student development
* Notifications and recommendations

The primary objective is to provide accurate, explainable and maintainable educational tracking.

---

# 2. Core Development Principle

Do not treat the repository as a collection of isolated files.

Treat Universitely as a single evolving system.

Before making a non-trivial change, understand:

1. Existing architecture
2. Existing implementation
3. Database schema
4. Authentication and authorization
5. Related components
6. Existing architectural decisions
7. Previous agent sessions when relevant
8. Possible side effects

Do not immediately start editing code when the task requires architectural understanding.

---

# 3. Project Memory Protocol

Universitely uses three layers of project memory.

### Layer 1 — Repository Memory

Stored in:

* AGENTS.md
* docs/
* .opencode/skills/
* source code
* database migrations

This is the authoritative technical knowledge of the project.

### Layer 2 — Supabase Memory

Stored in:

* project_knowledge
* architectural_decisions
* agent_sessions

This contains dynamic project knowledge and historical agent context.

### Layer 3 — Git History

Git commits, branches, pull requests and issues represent implementation history.

When investigating why something exists, inspect Git history when appropriate.

---

# 4. Before Implementing Non-Trivial Changes

Follow this sequence.

### Step 1 — Understand

Restate the requested outcome internally.

Identify:

* What is changing?
* Why is it changing?
* Which users are affected?
* Which existing functionality may be affected?

### Step 2 — Inspect Instructions

Read:

* AGENTS.md
* relevant documentation
* relevant skills

### Step 3 — Inspect Existing Code

Search for:

* related components
* functions
* hooks
* database queries
* API routes
* server actions
* types
* validation logic

Do not create a duplicate implementation when an existing implementation can be extended.

### Step 4 — Inspect Database

If the task involves data:

* inspect relevant tables
* inspect relationships
* inspect indexes
* inspect RLS policies
* inspect migrations

Use Supabase MCP when available.

### Step 5 — Inspect Project Memory

For significant changes, search:

* architectural_decisions
* project_knowledge
* agent_sessions

Do not blindly follow historical decisions if the current architecture has changed. Verify them against the current code.

### Step 6 — Plan

Before editing multiple files, establish:

* implementation approach
* affected files
* database changes
* security implications
* testing requirements
* migration requirements

### Step 7 — Implement

Make the smallest coherent change that solves the problem.

Avoid unrelated refactoring.

---

# 5. Database Rules

Supabase/PostgreSQL is the authoritative application database.

Never:

* modify production schema manually without a migration
* expose service-role credentials to client code
* bypass RLS without a documented reason
* store secrets in source code
* create duplicate tables for functionality that already exists
* silently change column semantics

Database changes must be represented by migrations.

When a schema changes, also consider updating:

* docs/database.md
* generated types
* related queries
* RLS policies
* indexes
* tests

---

# 6. Supabase Rules

Use Supabase MCP for development investigation when available.

Prefer:

1. Inspect
2. Understand
3. Plan
4. Modify
5. Verify

Do not perform destructive database operations without explicit user approval.

Examples of destructive operations:

* DROP TABLE
* DROP COLUMN
* DELETE without a narrow condition
* TRUNCATE
* destructive migrations
* disabling security policies

When MCP is connected to production, be especially conservative.

---

# 7. Authentication and Authorization

Authentication and authorization are separate concerns.

Authentication answers:

> Who is this user?

Authorization answers:

> What is this user allowed to do?

Never rely only on client-side role checks.

Sensitive authorization must be enforced server-side and/or through PostgreSQL RLS.

Roles must not be trusted merely because a value came from the browser.

---

# 8. Student Data

Student-related information must be treated as private application data.

Do not expose another student's information through:

* URLs
* API responses
* client-side queries
* predictable IDs
* unrestricted database queries

Every student-specific data access path must be reviewed for authorization.

---

# 9. Frontend Rules

Prefer existing components and patterns.

Before creating a new component:

1. Search for an existing equivalent.
2. Determine whether it can be reused.
3. Extend existing functionality when appropriate.

Avoid:

* duplicate UI components
* unnecessary global state
* unnecessary dependencies
* large components containing unrelated business logic

Separate:

* presentation
* state
* business logic
* data access

when complexity justifies it.

---

# 10. TypeScript Rules

Use strict typing.

Avoid:

* `any`
* unnecessary type assertions
* duplicated interfaces
* silently ignoring TypeScript errors

Prefer existing shared types.

When a database type exists, use it instead of recreating the same structure manually.

---

# 11. Error Handling

Errors must be explicit.

Do not:

* silently swallow errors
* return fake successful responses
* hide database errors
* use empty catch blocks

User-facing errors should be understandable.

Developer-facing errors should contain enough information for debugging without exposing secrets.

---

# 12. Testing

After meaningful changes, verify the affected functionality.

Depending on the project configuration, run:

* type checking
* linting
* unit tests
* integration tests
* build

Do not claim that something works unless it has actually been verified.

If verification cannot be performed, explicitly state what was not verified.

---

# 13. Documentation

Documentation is part of the implementation.

Update documentation when a change affects:

* architecture
* database structure
* authentication
* authorization
* important business logic
* project conventions
* development workflow

Do not update documentation merely to create noise.

---

# 14. Architectural Decisions

Significant architectural decisions should be recorded.

Examples:

* choosing Supabase
* changing authentication strategy
* introducing a new major data model
* changing where business logic executes
* changing the student progress calculation
* introducing a new architectural pattern

Record decisions in:

docs/decisions.md

If the project-memory database is available, important decisions may also be stored in:

architectural_decisions

---

# 15. Agent Session Memory

At the end of a substantial coding task, summarize:

* task
* implementation
* important files
* decisions
* problems
* tests
* remaining work

Use the session-memory skill when appropriate.

Do not record trivial interactions.

---

# 16. Git Rules

Do not:

* force push without explicit approval
* reset unrelated user work
* delete branches without approval
* rewrite history unnecessarily

Before committing, inspect:

* git status
* git diff
* affected files

Commits should describe the actual change.

---

# 17. Scope Control

Do not silently expand the task.

If the requested change exposes an unrelated issue:

1. mention it
2. explain its impact
3. do not fix it unless necessary or explicitly requested

Avoid opportunistic refactoring.

---

# 18. Security Priority

When functionality and security conflict, security wins.

Potential security issues must be surfaced immediately.

Particular attention must be paid to:

* authentication
* authorization
* RLS
* exposed environment variables
* server/client boundaries
* SQL injection
* XSS
* insecure direct object references
* sensitive student information
* API abuse
* file uploads

---

# 19. Decision Hierarchy

When instructions conflict, use this priority:

1. User's explicit current request
2. Security requirements
3. Existing architecture
4. AGENTS.md
5. Relevant project documentation
6. Architectural decisions
7. General coding conventions

Do not blindly follow historical documentation if it conflicts with the current code or explicit user request.

---

# 20. Definition of Done

A task is complete only when:

* requested functionality is implemented
* existing functionality is not unintentionally broken
* relevant database changes have migrations
* security implications have been considered
* relevant tests/checks have been run
* documentation has been updated when necessary
* important architectural decisions have been recorded
* remaining limitations are explicitly reported
