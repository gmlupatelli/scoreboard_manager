# Testing Guide

This document describes the testing strategy, infrastructure, and best practices for the Scoreboard Manager project.

## Testing Strategy Overview

We use a **two-tier testing approach**:

### 1. **Unit Tests** (Fast, Local Feedback)
- **Framework**: Jest + TypeScript
- **Environment**: jsdom
- **Speed**: ~30 seconds for full suite
- **Coverage Target**: 70-80% (critical paths)
- **Run**: `npm run test:unit` (local) or on every PR (CI)
- **Focus**: Pure functions, services, hooks, business logic

### 2. **E2E Tests** (Integration Verification)
- **Framework**: Playwright
- **Speed**: ~10 minutes for full suite (multiple viewports)
- **Coverage**: User workflows, real-time updates, accessibility
- **Run**: Daily at 2 AM UTC (nightly) or manually
- **Focus**: Full user journeys, multi-viewport, real database integration

**Why this split?**
- Developers get instant feedback on PRs with fast unit tests (~30s)
- Confident deployments backed by unit test validation
- Regressions caught daily with full E2E suite without blocking every PR
- Real-time subscription testing done at E2E level where it matters

---

## Unit Testing

### Running Unit Tests

```bash
# Run all tests once
npm run test:unit

# Run tests in watch mode (re-runs on file changes)
npm run test:unit:watch

# Run tests matching a pattern
npm run test:unit -- --testNamePattern="timeUtils"

# Run with verbose output
npm run test:unit -- --verbose

# Run a single file
npm run test:unit -- src/utils/__tests__/timeUtils.test.ts
```

### Coverage Report

The unit test command automatically generates a coverage report in `coverage/`:

```bash
# Open HTML coverage report
open coverage/lcov-report/index.html
```

**Coverage Targets:**
- **Utilities** (`src/utils/`): 90% lines, functions, branches
- **Services & Hooks**: 50-80% depending on Supabase/external dependencies
- **Global threshold**: 50% (minimum)

### Test File Location

Place tests adjacent to implementation files or in `__tests__` directories:

```
src/
  utils/
    timeUtils.ts
    __tests__/
      timeUtils.test.ts    ✅ GOOD
  hooks/
    useTimeoutRef.ts
    __tests__/
      useTimeoutRef.test.ts ✅ GOOD
  lib/
    supabase/
      client.ts
      __tests__/
        client.test.ts     ✅ GOOD
```

### Writing Unit Tests

#### Test File Template

```typescript
import { functionToTest } from '../module';

describe('Module Name', () => {
  describe('Specific Feature', () => {
    it('should do something specific', () => {
      const result = functionToTest(input);
      expect(result).toBe(expectedOutput);
    });
  });
});
```

#### Test Naming Conventions

- Use `describe()` for logical grouping
- Use `it()` for individual test cases
- Start test descriptions with "should" or "must"
- Be specific: "should parse hh:mm format correctly" ✅ not "should work" ❌

#### Common Patterns

**Testing Pure Functions:**
```typescript
it('should parse time format correctly', () => {
  expect(parseTimeToMilliseconds('01:30', 'hh:mm')).toBe(5400000);
  expect(parseTimeToMilliseconds('invalid', 'hh:mm')).toBeNull();
});
```

**Testing with Setup/Teardown:**
```typescript
describe('Service Layer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Cleanup
  });

  it('should call API', () => {
    // Test
  });
});
```

**Testing Async Functions:**
```typescript
it('should fetch data', async () => {
  const result = await fetchData('id');
  expect(result.id).toBe('id');
});
```

**Testing Hooks (with React Testing Library):**
```typescript
import { renderHook, act } from '@testing-library/react';

it('should update state', () => {
  const { result } = renderHook(() => useState(0));
  
  act(() => {
    result.current[1](1);
  });
  
  expect(result.current[0]).toBe(1);
});
```

### Mocking Strategy

#### Supabase Client

Mocks are centralized in `src/__mocks__/supabase.ts`:

```typescript
import { createMockSupabaseClient } from '@/__mocks__/supabase';

jest.mock('@/lib/supabase/client', () => ({
  supabase: createMockSupabaseClient(),
}));
```

#### Mocking Responses

```typescript
import { mockSupabaseResponse } from '@/__mocks__/supabase';

it('should return data', async () => {
  const mockData = { id: '1', title: 'Test' };
  mockSupabaseResponse(supabase, mockData);
  
  const result = await functionUnderTest();
  expect(result).toEqual(mockData);
});
```

#### Next.js Router/Navigation

Router is mocked in `src/test-setup.ts` automatically:

```typescript
import { useRouter } from 'next/navigation';

it('should navigate on submit', () => {
  const router = useRouter();
  expect(router.push).toHaveBeenCalledWith('/success');
});
```

### Real-Time Subscription Testing

**Why real-time matters**: Broken subscriptions silently fail in production (no compile-time errors).

Tests in `src/services/__tests__/scoreboardService.test.ts` verify:
- ✅ Subscription setup with correct channel name
- ✅ Correct postgres_changes filters for entries and scoreboards
- ✅ Callback invocation on database events
- ✅ Cleanup on unsubscribe

Example:
```typescript
it('should set up channel with correct filter', () => {
  scoreboardService.subscribeToScoreboardChanges('board-id', {
    onEntriesChange: jest.fn(),
  });

  expect(supabase.channel).toHaveBeenCalledWith('scoreboard-board-id');
  expect(supabase.on).toHaveBeenCalled();
  expect(supabase.subscribe).toHaveBeenCalled();
});
```

---

## E2E Testing

### Running E2E Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run fast tests only (Desktop Chrome, @fast tag)
npm run test:e2e:fast

# Run with UI browser
npm run test:e2e:ui

# Debug mode (step through)
npm run test:e2e:debug

# Run specific test file
npm run test:e2e -- e2e/scoreboard.spec.ts

# Run tests matching pattern
npm run test:e2e -- --grep "real-time"
```

### Test Organization

Tests are in `e2e/` directory with clear descriptions:

- `auth.spec.ts` - Authentication flows
- `scoreboard.spec.ts` - Scoreboard CRUD, search, ownership, **real-time updates**
- `invitations.spec.ts` - User invitations
- `kiosk.spec.ts` - TV/kiosk mode display
- `admin.spec.ts` - Admin functionality
- `subscription.spec.ts` - Subscription plan display, billing, cancellation, gifted tiers
- `tier-limits.spec.ts` - Free-tier limit enforcement, supporter unlocks
- `supporter-recognition.spec.ts` - Welcome modal, supporter preferences, public supporters page
- `accessibility.spec.ts` - WCAG compliance
- `responsive.spec.ts` - Mobile/tablet/desktop
- `loadTestEnv.js` - Test data setup

### Test Tagging Strategy

Tests use tags for selective running:

```typescript
authTest('@fast scoreboard displays', async ({ johnAuth }) => {
  // Runs quickly - no image uploads, no full setup
});

authTest('@full @desktop-only create modal', async ({ johnAuth }) => {
  // Runs on desktop only, takes longer (image uploads, etc)
});

authTest('@no-mobile responsive layout', async ({ user }) => {
  // Skipped on mobile viewports
});
```

**Run by tag:**
```bash
npm run test:e2e -- --grep "@fast"
npm run test:e2e -- --grep "@no-mobile"
```

### Real-Time Updates Testing

Current E2E tests have weak real-time coverage. The `Real-time Updates` section in `scoreboard.spec.ts` should be enhanced to:

```typescript
authTest('@full real-time entries sync across browsers', async ({ johnAuth, janeAuth }) => {
  // Open scoreboard in two browser contexts
  await johnAuth.goto('/scoreboard/123');
  await janeAuth.goto('/scoreboard/123');
  
  // John adds entry
  // Jane's page should update WITHOUT reload (verify with subscription listener)
  
  // Jane adds entry  
  // John's page should update (verify with subscription listener)
});

authTest('@full real-time title changes broadcast', async ({ johnAuth, janeAuth }) => {
  // John edits title
  // Jane viewing the public leaderboard sees update in real-time
});
```

---

## CI/CD Integration

### Unit Tests on Every PR

**Workflow**: `.github/workflows/test-unit.yml`

Runs automatically on:
- Push to `main` or `dev`
- Pull requests targeting `main` or `dev`

**Gates deployment**: MR cannot merge if tests fail.

### E2E Tests Nightly

**Workflow**: `.github/workflows/test-e2e-nightly.yml`

Runs daily at **2 AM UTC** (configurable in workflow). Can also be triggered manually:

```bash
# Via GitHub UI or GitHub CLI
gh workflow run test-e2e-nightly.yml
```

**Why nightly?**
- Full suite takes ~10 minutes (multi-viewport, image uploads)
- Catches regressions daily without blocking PRs
- Real-time subscription testing happens on real infrastructure
- Developers get instant feedback from unit tests instead

### Coverage Reporting

- Unit test coverage uploaded to Codecov after each test run
- Coverage badge available in README: `[![codecov](https://codecov.io/gh/gmlupatelli/scoreboard_manager/branch/dev/graph/badge.svg?token=xxx](https://codecov.io/gh/gmlupatelli/scoreboard_manager)`

---

## Best Practices

### ✅ Do

- Write tests for business logic, transformations, subscriptions
- Test edge cases: null, empty, negative, very large values
- Use type inference: `getJSON<User>()` instead of `as any`
- Mock external dependencies (Supabase, router, timers)
- Keep tests focused on single responsibility
- Use descriptive test names
- Clean up after tests (timers, mocks, DOM)

### ❌ Don't

- Test implementation details—test behavior
- Mock everything—some integration is valuable (e.g., JSON serialization)
- Skip tests for "probably won't break" code—that's when it does
- Write brittle e2e tests that rely on exact DOM structure
- Commit skipped tests (`it.skip`, `describe.skip`)
- Use real Supabase in unit tests (mock it instead)

### Real-Time Testing Checklist

When adding features with real-time subscriptions:

- [ ] Unit test: subscription setup with correct channel name
- [ ] Unit test: subscription cleanup on unmount
- [ ] Unit test: callbacks invoked on events
- [ ] Unit test: error handling for subscription failures
- [ ] E2E test: multi-browser verification (change in one browser, see in another)
- [ ] Manual test: verify WebSocket connection in DevTools

---

## Coverage Goals

| Category | Target | Rationale |
|----------|--------|-----------|
| Utils (`timeUtils`, `stylePresets`) | **90%** | Pure, deterministic, high ROI |
| Services (transformations, validation) | **70%** | Exclude Supabase I/O |
| Hooks (logic, cleanup) | **60%** | React components hard to test in isolation |
| API routes | **50%** | Mostly boilerplate, covered by E2E |
| Components | **30%** | E2E covers render logic, focus on hooks |

**Global minimum**: 50% of critical paths

---

## Troubleshooting

### Test fails with "Cannot find module"

**Problem**: TypeScript can't resolve imports
**Solution**: Check `tsconfig.json` paths, ensure `@/` alias maps to `src/`

### Jest shows "ReferenceError: fetch is not defined"

**Problem**: jsdom doesn't have fetch
**Solution**: Install `node-fetch` or use Jest's built-in support (Node 18+)

### Tests hang or timeout

**Problem**: Timers not cleaned up
**Solution**: Use `jest.useFakeTimers()` + `jest.advanceTimersByTime()` or `jest.runAllTimers()`

### Subscription tests fail with "jest.mock is not defined"

**Problem**: Mocks placed outside test file
**Solution**: Mocks must be at top level, before imports: 
```typescript
jest.mock('@/lib/supabase/client');
import { supabase } from '@/lib/supabase/client';
```

### E2E tests pass locally but fail in CI

**Problem**: Environment differences (timing, network)
**Solution**: Use explicit waits, avoid hard timeouts, ensure test data is reset

---

## Next Steps

1. ✅ Unit test infrastructure in place
2. Next: Increase unit test coverage to 70% for critical modules
3. Then: Enhance E2E tests for real-time subscription verification
4. Later: Add visual regression testing (Percy / Chromatic)

---

## Resources

- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Documentation](https://playwright.dev/)
- [Code Coverage Guide](https://istanbul.js.org/)
