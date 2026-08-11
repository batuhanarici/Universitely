# Universitely Architecture

## Overview

Universitely is a web-based education management and student progress tracking platform.

The primary user roles are:

* Student
* Teacher / Coach
* Parent

---

# Architectural Layers

```text
UI
↓
Application Logic
↓
Data Access
↓
Supabase
↓
PostgreSQL
```

Authentication and authorization operate across these layers.

---

# AI Development Architecture

```text
                 OpenCode
                    │
        ┌───────────┼───────────┐
        │           │           │
        ▼           ▼           ▼
     GitHub      Supabase    OpenCode
     Context      Memory       Skills
        │           │           │
        └───────────┼───────────┘
                    ▼
             Project Context
                    │
                    ▼
                 AI Agent
```

---

# Project Memory

Persistent AI memory consists of:

### Repository Memory

* AGENTS.md
* docs/
* source code
* migrations
* Git history

### Supabase Memory

* project_knowledge
* architectural_decisions
* agent_sessions

---

# Database

Supabase PostgreSQL is the authoritative application database.

Database schema changes must be represented through migrations.

---

# Security

Authorization must not depend exclusively on frontend checks.

RLS should protect user-specific database resources.

---

# Development Principle

Prefer extending existing architecture over introducing parallel systems.
