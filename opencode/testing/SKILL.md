---

name: testing
description: Verify Universitely changes using the project's available type checking, linting, tests, builds, and focused validation.
-------------------------------------------------------------------------------------------------------------------------------------

# Testing

## Goal

Never claim functionality works without verification.

## Before Testing

Identify:

* changed code
* dependent code
* database changes
* user flows affected

## Verification Order

Prefer:

1. focused checks
2. type checking
3. lint
4. unit tests
5. integration tests
6. build

Use the commands actually defined by the repository.

Do not invent commands.

## Database Changes

For database-related changes verify:

* migration validity
* constraints
* RLS
* affected queries
* relevant application behavior

## UI Changes

Verify:

* loading state
* empty state
* error state
* successful state
* responsive behavior where relevant
* authorization behavior

## Regression Awareness

A successful build does not prove correct behavior.

Check the actual feature flow when practical.

## Reporting

After verification report:

* what was tested
* what passed
* what failed
* what could not be tested

Never fabricate test results.
