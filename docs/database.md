# Universitely Database

## Database Platform

Supabase PostgreSQL.

---

## Application Data

Application tables should be documented here as they are introduced.

Example structure:

```text
profiles
students
teachers
parents
exams
exam_results
questions
student_answers
topics
student_progress
notifications
```

The actual schema in Supabase and migration files are authoritative.

---

# Agent Memory Tables

The development intelligence layer uses:

## project_knowledge

Reusable project knowledge.

Important fields:

* category
* title
* content
* importance
* tags

## architectural_decisions

Historical architectural decisions.

Important fields:

* decision_key
* title
* context
* decision
* reason
* alternatives
* consequences
* status

## agent_sessions

Important development session summaries.

Important fields:

* task
* summary
* files_changed
* decisions
* problems
* tests_run
* next_steps

---

# Security

Agent-memory tables are not application-user tables.

Do not expose them to normal Student, Teacher or Parent clients.

Application-level authorization must be handled independently.
