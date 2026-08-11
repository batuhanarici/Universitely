---

name: security
description: Review Universitely code and architecture for authentication, authorization, data exposure, and application security risks.
----------------------------------------------------------------------------------------------------------------------------------------

# Security

Treat security as a design requirement, not a final checklist.

## Authentication

Verify:

* authenticated user identity
* session handling
* server-side validation

Never trust identity information supplied by the browser.

## Authorization

For every protected operation determine:

```text
Who?
↓
What resource?
↓
What operation?
↓
Why is it allowed?
```

Client-side role checks are not sufficient.

## Supabase

Pay special attention to:

* RLS
* service-role keys
* anonymous access
* database functions
* storage policies

Never expose the service-role key to browser code.

## Student Data

Check for:

* IDOR vulnerabilities
* unrestricted queries
* predictable resource URLs
* unauthorized teacher access
* unauthorized parent access
* cross-student data leakage

## Input Validation

Validate untrusted input at the appropriate server boundary.

Do not assume:

* browser validation
* TypeScript types
* UI constraints

provide security.

## Secrets

Never commit:

* API keys
* passwords
* access tokens
* service-role credentials
* private keys

Use environment variables.

## Security Findings

For serious findings:

1. explain the vulnerability
2. explain impact
3. identify affected code
4. propose a fix
5. prioritize remediation

Do not hide security issues to make a task appear complete.
