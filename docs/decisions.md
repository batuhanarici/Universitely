# Universitely Architectural Decisions

This document records important architectural decisions.

---

## ADR-001 — Supabase as Primary Backend

### Status

Accepted

### Decision

Supabase PostgreSQL is the primary backend database.

### Reason

Universitely requires:

* PostgreSQL
* Authentication
* Row Level Security
* Storage
* server-side database functionality

Using one backend platform reduces unnecessary infrastructure complexity.

---

## ADR-002 — Project Memory

### Status

Accepted

### Decision

Universitely maintains persistent AI development memory using:

* Git repository documentation
* Supabase project memory
* Git history

### Reason

AI coding agents need more than source code to understand why architectural decisions exist.

---

## ADR-003 — Database Changes Through Migrations

### Status

Accepted

### Decision

All schema changes must be represented through Supabase migrations.

### Reason

Schema history must remain reproducible and version controlled.

---

## ADR-004 — Authorization Must Not Depend on Client Code

### Status

Accepted

### Decision

Authorization must be enforced server-side and/or through PostgreSQL RLS.

### Reason

Client-side authorization can be bypassed.

---

## ADR-005 — Business Logic Has a Single Source of Truth

### Status

Accepted

### Decision

Important calculations and business rules should have one authoritative implementation.

### Reason

Duplicated business logic can produce inconsistent results between student, teacher and reporting views.
