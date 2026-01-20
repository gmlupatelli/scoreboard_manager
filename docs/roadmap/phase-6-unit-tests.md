# Phase 6: Unit Tests & Testing Infrastructure

**Priority:** 🟡 Medium
**Dependencies:** None (can be done in parallel with ongoing work)
**Estimated Scope:** Small → Medium (setup + convert a subset of existing tests)

## Overview

Add reliable unit testing to the project: choose and configure a test runner, add conventions and a CI job, convert a representative set of existing unit tests (hooks) to run under the new runner, and document testing guidelines for contributors.

This phase will enable quicker feedback loops, prevent regressions, and increase confidence for future refactors.

---

## Issues

### Issue 6.1: Choose and configure test runner

**Title:** Add Jest (recommended) or Vitest configuration and basic scripts

**Description:**
- Install and configure a TypeScript-friendly test runner (Jest with ts-jest is recommended to keep existing tests unchanged).
- Add `test:unit` script and map project path alias `@/` to `src/` in the test resolver.

**Acceptance Criteria:**
- [ ] `package.json` has `test:unit` script (e.g., `jest --runInBand`).
- [ ] `jest.config.js` (or `jest.config.ts`) exists and supports TypeScript and `@/` path alias.
- [ ] `jest` runs the converted hook tests and they pass locally.

**Technical Notes:**
- Dev dependencies: `jest`, `@types/jest`, `ts-jest`, `jest-environment-jsdom`, `@testing-library/react`, `@testing-library/jest-dom` (and `@testing-library/react-hooks` if needed for renderHook).
- Key config: `testEnvironment: 'jsdom'`, `transform` setup for `ts-jest`, and `moduleNameMapper: {'^@/(.*)$': '<rootDir>/src/$1'}`.

---

### Issue 6.2: Add CI job to run unit tests

**Title:** Add GitHub Actions workflow step to run `npm ci && npm run test:unit` on PRs and pushes

**Acceptance Criteria:**
- [ ] New workflow or existing test workflow runs unit tests on PRs targeting `main`.
- [ ] Build fails if unit tests fail.

**Technical Notes:**
- Can place the job in an existing CI workflow or create `.github/workflows/test-unit.yml`.
- Optionally include a coverage threshold check (e.g., 80% line coverage).

---

### Issue 6.3: Convert & restore existing hook tests

**Title:** Convert existing orphan hook tests and re-enable them inside unit test runner

**Description:**
- Bring the existing hook tests (`src/hooks/__tests__/*`) back under test control (or keep them if already compatible).
- Ensure the tests use the compatible `renderHook` implementation for the chosen runner and `jsdom` environment.

**Acceptance Criteria:**
- [ ] The `useAbortableFetch`, `useTimeoutRef`, and `useAuthGuard` tests run under `test:unit` and pass.
- [ ] Tests are placed in `src/**/__tests__` or next to tested files (`*.test.ts`), following repository conventions.

---

### Issue 6.4: Add testing guidelines to CONTRIBUTING / docs

**Title:** Document testing conventions and best practices

**Acceptance Criteria:**
- [ ] Short `docs/testing.md` or `CONTRIBUTING` section describing how to run unit tests, how to write tests, naming conventions, and recommended testing patterns (hooks, services, components).

**Guidance highlights:**
- Locate unit tests in `src/**/__tests__` or `.test.ts(x)` adjacent to implementation.
- Use `@/` alias in imports to avoid long relative paths.
- Prefer `renderHook` for hook tests and `@testing-library/react` for component tests.

---

### Issue 6.5: Incremental rollout

**Title:** Gradual adoption and coverage targets

**Description:**
- Start by enabling the hook tests (small, fast), then add tests for critical services and utilities.
- Track coverage and increase goals over time.

**Acceptance Criteria:**
- [ ] Hook tests run on CI and pass.
- [ ] Coverage report produced on CI (optional) and integrated into PR checks later.

---

## Notes & Rationale

- Jest + ts-jest is recommended because the current tests use Jest globals and React Testing Library semantics; this minimizes rewrite work.
- Vitest is an alternative (faster) but will require small test adaptations.

---

> This phase will improve dev confidence and reduce risk for refactors. Start by enabling hook tests (the smallest surface) and grow coverage during later sprints.
