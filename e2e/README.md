# Testing Guide

## Overview
Comprehensive E2E testing setup using Playwright for mobile, desktop, and accessibility testing.

## Installation

```bash
npm install
npx playwright install
```

## Test Data Management

### Refresh Test Data (Default - Automated Users Only)
**Resets automated test users while preserving manual testing users:**
```bash
npm run refresh-test-data
```

This script:
- ✅ Deletes and recreates 3 automated test users (admin, john, sarah)
- ✅ Removes test data for automated users only
- ✅ Seeds fresh data for john and sarah (scoreboards + invitations)
- ✅ **Preserves siteadmin and jane data intact**
- ✅ All passwords reset to `test123`

**When to run:**
- Before first test run on a new environment
- When automated test users are in an inconsistent state
- After database schema changes

### Full Reset (All Users)
**Completely resets ALL test users including manual testing users:**
```bash
npm run refresh-test-data:full
```

Use this when:
- Manual user data is impacting automated tests
- You want a completely clean slate
- Setting up a fresh test environment

### Automated Test Users
| User | Role | Data |
|------|------|------|
| `admin@example.com` | system_admin | Clean for testing |
| `john@example.com` | user | 2 scoreboards, 2 invitations |
| `sarah@example.com` | user | 2 scoreboards with entries |

### Manual Test Users (Preserved by default)
| User | Role | Notes |
|------|------|-------|
| `siteadmin@example.com` | system_admin | For manual testing |
| `jane@example.com` | user | For manual testing |

**All passwords: `test123`**

## Running Tests

### All Tests (Standard)
```bash
npm run test:e2e
```
Runs tests across all enabled projects: Desktop Chrome, Mobile iPhone 12, Mobile Minimum.
Uses HTML reporter with traces and videos on failure.

### Fast Mode (Development)
```bash
npm run test:e2e:fast
```
Optimized for rapid development feedback:
- ✅ Only Desktop Chrome (single project)
- ✅ 6 parallel workers
- ✅ No retries
- ✅ Minimal traces/videos
- ✅ List reporter for quick output

### UI Mode (Interactive)
```bash
npm run test:e2e:ui
```

### Debug Mode
```bash
npm run test:e2e:debug
```

### Specific Test File
```bash
npx playwright test e2e/mobile.spec.ts
```

### Specific Browser
```bash
npx playwright test --project="Desktop Chrome"
```

### Fast Mode with Specific File
```bash
npm run test:e2e:fast -- e2e/desktop.spec.ts
```

## Test Projects

### Currently Enabled Projects

| Project | Viewport | Description |
|---------|----------|-------------|
| **Desktop Chrome** | 1920x1080 | Primary desktop browser |
| **Mobile iPhone 12** | 390x844 | Standard mobile |
| **Mobile Minimum** | 320x568 | Smallest supported viewport |

### Available (Commented Out)
Additional projects can be enabled in `playwright.config.ts`:
- Desktop Firefox - 1920x1080
- Desktop Safari - 1920x1080
- Tablet (iPad Pro) - 1024x768
- Mobile iPhone SE - 375x667
- Mobile Landscape - 844x390
- Mobile Android (Pixel 5) - 393x851

### Configuration Files

| Config | Command | Use Case |
|--------|---------|----------|
| `playwright.config.ts` | `npm run test:e2e` | Full test suite with all enabled projects |
| `playwright.config.fast.ts` | `npm run test:e2e:fast` | Fast iteration, Desktop Chrome only |

## Test Coverage

### Mobile Tests (`e2e/mobile.spec.ts`)
- ✅ Touch target sizes (minimum 44x44px)
- ✅ Mobile header display
- ✅ Metadata wrapping on narrow screens
- ✅ Swipe-to-delete gestures
- ✅ Progressive swipe feedback
- ✅ Landscape orientation adjustments
- ✅ Minimum viewport (320px) compatibility
- ✅ Button stacking in modals
- ✅ Accessibility on mobile

### Desktop Tests (`e2e/desktop.spec.ts`)
- ✅ Authentication flows (login, registration)
- ✅ Dashboard CRUD operations
- ✅ Scoreboard management (add, edit, delete)
- ✅ Keyboard navigation
- ✅ Real-time updates
- ✅ Responsive breakpoints
- ✅ Filter and search functionality

### Accessibility Tests (`e2e/accessibility.spec.ts`)
- ✅ WCAG compliance
- ✅ Keyboard navigation
- ✅ Screen reader support
- ✅ ARIA labels and roles
- ✅ Focus management
- ✅ Form accessibility
- ✅ Color contrast
- ✅ Semantic HTML
- ✅ Reduced motion support
- ✅ RTL direction support

## CI/CD Integration

Tests are configured to run in CI environments with:
- Retry on failure (2 retries)
- Single worker for stability
- Automatic screenshots on failure
- HTML report generation
- Trace capture on first retry
- Video retention on failure only
- Fail-fast if `.only()` is left in tests

## Debugging Tips

1. **Run in headed mode:**
   ```bash
   npx playwright test --headed
   ```

2. **Slow down execution:**
   ```bash
   npx playwright test --slow-mo=500
   ```

3. **Pause execution:**
   ```typescript
   await page.pause();
   ```

4. **View trace:**
   ```bash
   npx playwright show-trace trace.zip
   ```

## Known Limitations

- Real-time WebSocket connections may not work in test environment
- Some tests require authenticated session mocking
- Swipe gestures tested with mouse events (not actual touch)

## Contributing

When adding new features:
1. Add corresponding E2E tests
2. Test on minimum viewport (320px)
3. Verify keyboard navigation
4. Check accessibility with screen reader
5. Run full test suite before committing
