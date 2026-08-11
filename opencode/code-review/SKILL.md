---

name: code-review
description: Perform a structured code review of Universitely changes focusing on correctness, security, maintainability, database integrity, and regressions.
--------------------------------------------------------------------------------------------------------------------------------------------------------------

# Code Review

Review changes as if they were a pull request.

## Review Order

### 1. Correctness

Does the implementation actually satisfy the requested behavior?

### 2. Regression

Could existing functionality break?

### 3. Security

Check:

* authentication
* authorization
* RLS
* data exposure
* secrets
* input validation

### 4. Database

Check:

* schema consistency
* migrations
* indexes
* foreign keys
* RLS

### 5. Maintainability

Check:

* duplication
* unnecessary abstraction
* confusing naming
* oversized components
* hidden side effects

### 6. Performance

Check:

* unnecessary database queries
* N+1 behavior
* expensive client rendering
* unnecessary network requests

## Review Severity

Use:

* CRITICAL
* HIGH
* MEDIUM
* LOW
* INFO

Do not report stylistic preferences as defects.

## Review Output

For each finding provide:

* severity
* location
* problem
* impact
* recommended fix

If there are no meaningful findings, say so explicitly.
