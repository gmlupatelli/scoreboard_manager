# Phase 6: Unit Tests & Testing Infrastructure

**Priority:** 🟡 Medium
**Dependencies:** None (can be done in parallel with ongoing work)
**Estimated Scope:** Small → Medium (setup + convert a subset of existing tests)
**Status:** ✅ **COMPLETED**

## Overview

✅ **DONE**: Added reliable unit testing to the project with Jest configuration, comprehensive test files, CI integration, and testing documentation.

Implemented a **two-tier testing strategy**: Fast unit tests run on every PR (~30 seconds, blocks merge), comprehensive E2E tests run nightly (2 AM UTC, ~10 minutes, no blocking). This enables quicker feedback loops, prevents regressions, and increases confidence for future refactors while keeping developer workflow efficient.

---

## Issues

### Issue 6.1: Choose and configure test runner

**Title:** Add Jest (recommended) or Vitest configuration and basic scripts

**Description:**
- Install and configure a TypeScript-friendly test runner (Jest with ts-jest is recommended to keep existing tests unchanged).
- Add `test:unit` script and map project path alias `@/` to `src/` in the test resolver.

**Acceptance Criteria:**
- [x] `package.json` has `test:unit` script (e.g., `jest --runInBand`).
- [x] `jest.config.js` (or `jest.config.ts`) exists and supports TypeScript and `@/` path alias.
- [x] `jest` runs hook tests and they pass locally.

**✅ Implementation Complete:**
- Added `jest.config.js` with TypeScript support (ts-jest), jsdom environment, `@/` path alias
- Added `test:unit` and `test:unit:watch` scripts to `package.json`
- Created `src/test-setup.ts` with Jest configuration and Next.js router mocks
- Added all test dependencies: jest, @types/jest, ts-jest, jest-environment-jsdom, @testing-library/react, @testing-library/jest-dom
- Coverage thresholds: 90% for utils, 50% global minimum

---

### Issue 6.2: Add CI job to run unit tests

**Title:** Add GitHub Actions workflow step to run `npm ci && npm run test:unit` on PRs and pushes

**Acceptance Criteria:**
- [x] New workflow runs unit tests on PRs targeting `main`.
- [x] Build fails if unit tests fail.

**✅ Implementation Complete:**
- Created `.github/workflows/test-unit.yml` that runs on push/PR to main/dev
- Unit tests block merge on failure (required status check)
- Includes type check, npm cache, coverage reporting to Codecov
- Also created `.github/workflows/test-e2e-nightly.yml` for nightly E2E at 2 AM UTC

---

### Issue 6.3: Convert & restore existing hook tests

**Title:** Convert existing orphan hook tests and re-enable them inside unit test runner

**Description:**
- Bring the existing hook tests (`src/hooks/__tests__/*`) back under test control (or keep them if already compatible).
- Ensure the tests use the compatible `renderHook` implementation for the chosen runner and `jsdom` environment.

**Acceptance Criteria:**
- [x] Hook tests run under `test:unit` and pass.
- [x] Tests are placed in `src/**/__tests__` following repository conventions.

**✅ Implementation Complete:**
- Created `src/hooks/__tests__/useTimeoutRef.test.ts` (14 tests, timer cleanup)
- Created `src/utils/__tests__/timeUtils.test.ts` (30+ tests, all time formats)
- Created `src/utils/__tests__/stylePresets.test.ts` (25+ tests, all presets)
- Created `src/utils/__tests__/localStorage.test.ts` (20+ tests, storage)
- Created `src/services/__tests__/scoreboardService.test.ts` (**real-time subscriptions** ⭐)
- All tests use React Testing Library `renderHook` and Jest fake timers
- Tests verify cleanup on unmount (prevents memory leaks)

---

### Issue 6.4: Add testing guidelines to CONTRIBUTING / docs

**Title:** Document testing conventions and best practices

**Acceptance Criteria:**
- [x] Comprehensive testing documentation created
- [x] CONTRIBUTING section added with testing guidelines
- [x] Testing patterns documented (hooks, services, utilities)

**✅ Implementation Complete:**
- Created comprehensive `docs/testing.md` (500+ lines) with:
  - Two-tier testing strategy
  - Unit test running and coverage
  - Test file location conventions
  - Writing unit tests (template, naming, patterns)
  - Mocking strategy (Supabase, router, timers)
  - **Real-time subscription testing** ⭐
  - E2E test organization and tagging
  - CI/CD integration details
  - Coverage goals by category
  - Troubleshooting guide
- Updated `CONTRIBUTING.md` with testing workflow
- Includes real-time feature updating checklist

---

### Issue 6.5: Incremental rollout

**Title:** Gradual adoption and coverage targets

**Description:**
- Start by enabling the hook tests (small, fast), then add tests for critical services and utilities.
- Track coverage and increase goals over time.

**Acceptance Criteria:**
- [x] Hook tests run on CI and pass.
- [x] Coverage reports produced on CI and uploaded to Codecov.

**✅ Implementation Complete:**
- Test infrastructure fully operational
- Coverage thresholds configured: 90% for utils, 50% global
- CI jobs active for automatic testing
- Gradual adoption strategy ready
- Next phase: 70-80% coverage for utils/services

---

## Test Files Created

```
src/
  __mocks__/
    supabase.ts                    # Reusable Supabase mock
  utils/__tests__/
    timeUtils.test.ts              # 30+ tests
    stylePresets.test.ts           # 25+ tests
    localStorage.test.ts           # 20+ tests
  hooks/__tests__/
    useTimeoutRef.test.ts          # 14 tests (timer cleanup)
  services/__tests__/
    scoreboardService.test.ts      # Real-time subscriptions ⭐

.github/workflows/
  test-unit.yml                     # Unit tests every PR
  test-e2e-nightly.yml              # E2E tests daily 2 AM UTC

docs/
  testing.md                         # 500+ line testing guide
```

## Coverage Goals

| Category | Target | Rationale |
|----------|--------|-----------|
| Utilities | **90%** | Pure functions, high ROI |
| Services | **70%** | Exclude I/O |
| Hooks | **60%** | React complexity |
| Global | **50%** | Critical paths |

## Notes & Rationale

- **Jest + ts-jest**: Chosen because existing tests use Jest globals; minimizes rewrite work
- **Real-time subscriptions**: Critical—test setup in unit tests + multi-browser in E2E
- **Two-tier strategy**: Unit tests on every PR (~30s) + E2E nightly (comprehensive)
- **Vitest**: Faster alternative available for future migration if needed

---

> **Phase 6 Complete.** Fast unit tests provide instant feedback on PRs. Nightly E2E tests catch integration issues. Real-time subscription testing now first-class. Ready for incremental coverage growth.
