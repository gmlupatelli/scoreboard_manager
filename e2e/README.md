# Testing Guide

## Overview
Comprehensive E2E testing setup using Playwright for mobile, desktop, and accessibility testing.

## Installation

```bash
npm install
npx playwright install
```

## Test User Configuration

Test user credentials are configured in `.env.test` using a numbered naming convention that allows you to add more accounts as needed.

### Naming Convention
```bash
# Automated test users (auto-cleaned between test runs)
AUTOMATED_TEST_ADMIN_<N>_EMAIL / AUTOMATED_TEST_ADMIN_<N>_PASSWORD
AUTOMATED_TEST_USER_<N>_EMAIL / AUTOMATED_TEST_USER_<N>_PASSWORD

# Manual test users (NOT auto-cleaned, for manual testing)
MANUAL_TEST_ADMIN_<N>_EMAIL / MANUAL_TEST_ADMIN_<N>_PASSWORD
MANUAL_TEST_USER_<N>_EMAIL / MANUAL_TEST_USER_<N>_PASSWORD
```

### Default Test Users
| Variable | Role | Purpose |
|----------|------|---------|
| `AUTOMATED_TEST_ADMIN_1` | system_admin | Admin for E2E tests |
| `AUTOMATED_TEST_USER_1` | user | First regular user (seeded data) |
| `AUTOMATED_TEST_USER_2` | user | Second regular user (seeded data) |

### Adding More Test Users
Simply add more numbered entries to `.env.test`:
```bash
AUTOMATED_TEST_USER_3_EMAIL=newuser@example.com
AUTOMATED_TEST_USER_3_PASSWORD=secure_password
```

## Test Data Management

### Refresh Test Data (Default - Automated Users Only)
**Resets automated test users while preserving manual testing users:**
```bash
npm run refresh-test-data
```

This script:
- ✅ Deletes and recreates automated test users (from `AUTOMATED_TEST_*` env vars)
- ✅ Removes test data for automated users only
- ✅ Seeds fresh data for the first two regular users (scoreboards + invitations)
- ✅ **Preserves manual test user data intact**
- ✅ Uses passwords from `.env.test` (no more standardized passwords)

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

### Test Users Summary
Automated test users are read dynamically from environment variables.
Manual test users (if configured) are preserved during regular test runs.

### Manual Test Users (Preserved by default)
Manual test users configured with `MANUAL_TEST_*` environment variables are preserved during regular test runs. Configure them in `.env.test` as needed:
```bash
MANUAL_TEST_ADMIN_1_EMAIL=siteadmin@example.com
MANUAL_TEST_ADMIN_1_PASSWORD=your_password
MANUAL_TEST_USER_1_EMAIL=jane@example.com
MANUAL_TEST_USER_1_PASSWORD=your_password
```

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
- ✅ Defaults to @fast-tagged tests (no extra grep needed)

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
npm run test:e2e:fast -- e2e/auth.spec.ts
```

### Run Tests by Tag
Tests are tagged with `@fast` or `@full` for flexible test execution:
- `npm run test:e2e:fast` already runs `@fast` on Desktop Chrome by default.

```bash
# Run only @fast smoke tests (quick validation)
npm run test:e2e -- --grep "@fast"

# Run only @full comprehensive tests
npm run test:e2e -- --grep "@full"

# Run @fast tests on Desktop Chrome only
npm run test:e2e -- --grep "@fast" --project="Desktop Chrome"
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
| `playwright.config.fast.ts` | `npm run test:e2e:fast` | Fast iteration, Desktop Chrome, `@fast` tags only |

## Test Coverage

Tests are organized by feature with `@fast` and `@full` tags:
- **@fast** - Quick smoke tests for essential functionality (~48 tests)
- **@full** - Comprehensive tests for complete coverage (~74 tests)

### Viewport-Specific Tags

To optimize test execution and reduce redundant test runs, certain tests are tagged to run only on specific viewports:

| Tag | Description | Runs On | Skipped On |
|-----|-------------|---------|------------|
| **@desktop-only** | Authorization, validation, and keyboard tests that don't vary by viewport | Desktop Chrome | Mobile iPhone 12, Mobile Minimum |
| **@no-mobile** | Features designed for large screens (e.g., kiosk/TV mode) | Desktop Chrome | Mobile iPhone 12, Mobile Minimum |

#### How It Works
The `playwright.config.ts` uses `grepInvert` to skip tagged tests on mobile projects:
- **Mobile iPhone 12**: Skips `@desktop-only` tests
- **Mobile Minimum**: Skips `@desktop-only` and `@no-mobile` tests

#### When to Use Each Tag

**Use `@desktop-only` for:**
- Authorization/permission tests (server-side, viewport doesn't matter)
- Form validation logic tests (same validation on all viewports)
- Keyboard navigation tests (not applicable on mobile)
- Navigation/redirect tests (URL behavior same across viewports)
- API/service-level functionality tests

**Use `@no-mobile` for:**
- Features only available on larger screens (kiosk mode, TV displays)
- UI components hidden on mobile breakpoints
- Features that require hover interactions

#### Adding New Viewport-Specific Tests
```typescript
// Authorization test - runs only on Desktop Chrome
authTest('@fast @desktop-only user cannot access admin pages', async ({ johnAuth }) => {
  // ...
});

// Kiosk feature - not for mobile devices
test('@full @no-mobile should display kiosk carousel', async ({ johnAuth }) => {
  // ...
});
```

#### Test Count Optimization
Before optimization: ~240 total test runs (80 tests × 3 viewports)
After optimization: ~118 total test runs (~51% reduction)

This eliminates redundant viewport-specific runs while maintaining coverage where it matters.

### Authentication Tests (`e2e/auth.spec.ts`)
- ✅ Login/registration page rendering
- ✅ Form validation (email, password)
- ✅ Protected route redirects
- ✅ Admin page restrictions for regular users
- ✅ Public page accessibility

### Scoreboard Tests (`e2e/scoreboard.spec.ts`)
- ✅ Dashboard display and empty states
- ✅ Create scoreboard modal
- ✅ Search and filter functionality
- ✅ CRUD operations (add, edit, delete entries)
- ✅ Ownership and permission checks
- ✅ Keyboard navigation

### Admin Tests (`e2e/admin.spec.ts`)
- ✅ Dashboard oversight (owner filter, multi-owner view)
- ✅ System settings management
- ✅ Invitations oversight
- ✅ Cross-user scoreboard access
- ✅ Admin navigation

### Invitations Tests (`e2e/invitations.spec.ts`)
- ✅ User invitation access and display
- ✅ Invitation form validation
- ✅ Invite-only mode toggle
- ✅ Registration enforcement
- ✅ Settings persistence

### Kiosk Tests (`e2e/kiosk.spec.ts`)

**Fast Tests `@fast` (7 tests) - ~2-3 minutes:**
- ✅ Expand/collapse kiosk settings section
- ✅ Toggle kiosk mode enabled/disabled
- ✅ Change slide duration setting
- ✅ Toggle PIN protection visibility
- ✅ Open kiosk preview in new tab
- ✅ Load kiosk view for public scoreboard
- ✅ Respond to keyboard controls

**Full Tests `@full` - Image Upload & Management:**
- ✅ Upload valid image and display in slide list
- ✅ Reject invalid file types
- ✅ Display thumbnail after upload
- ✅ Delete slide from list
- ✅ Support drag-and-drop reordering

**Full Tests `@full` - Carousel Functionality:**
- ✅ Auto-advance slides in carousel
- ✅ Pause and resume carousel
- ✅ Toggle fullscreen mode
- ✅ Configure scoreboard position
- ✅ Display images in kiosk view
- ✅ Auto-hide control bar after inactivity

**Full Tests `@full` - PIN Protection:**
- ✅ Show PIN modal when protection enabled
- ✅ Validate correct and incorrect PIN

**Full Tests `@full` - Accessibility (3 tests):**
- ✅ Proper ARIA labels on controls
- ✅ Keyboard-only navigation support
- ✅ Live regions for screen reader announcements

### Responsive Tests (`e2e/responsive.spec.ts`)
- ✅ Mobile touch interactions (44x44px targets)
- ✅ Landscape orientation
- ✅ Minimum viewport (320px)
- ✅ Tablet layout
- ✅ Desktop breakpoints (768px, 1024px, 1920px)
- ✅ Mobile accessibility

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

### Kiosk Test Troubleshooting

**"should expand and collapse kiosk settings section"**
- Verifies the kiosk section expands and shows "Slide Duration" label
- May skip if no scoreboard found for the test user

**"should upload a valid image"**
- Uses `e2e/fixtures/test-image.png` (10x10 PNG, 72 bytes)
- Requires valid JWT token in Authorization header
- May fail if storage bucket not configured

**"should show PIN modal"**
- Opens kiosk in unauthenticated context to verify PIN modal appears
- PIN must be enabled and kiosk mode must be enabled

## Known Limitations

- Real-time WebSocket connections may not work in test environment
- Some tests require authenticated session mocking

## Contributing

When adding new features:
1. Add corresponding E2E tests
2. Test on minimum viewport (320px)
3. Verify keyboard navigation
4. Check accessibility with screen reader
5. Run full test suite before committing
