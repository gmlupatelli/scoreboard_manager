# Kiosk Mode E2E Tests

Comprehensive test suite for kiosk mode functionality including settings, image uploads, carousel behavior, PIN protection, and accessibility.

## Test Structure

### Fast Tests `@fast` (7 tests)
Quick development feedback - **~2-3 minutes**
- ✅ Expand/collapse kiosk settings section
- ✅ Toggle kiosk mode enabled/disabled
- ✅ Change slide duration setting
- ✅ Toggle PIN protection visibility
- ✅ Open kiosk preview in new tab
- ✅ Load kiosk view for public scoreboard
- ✅ Respond to keyboard controls

### Full Tests `@full` (16 tests)
Comprehensive testing - **~5-10 minutes**

**Image Upload & Management:**
- Upload valid image and display in slide list
- Reject invalid file types
- Display thumbnail after upload
- Delete slide from list
- Support drag-and-drop reordering

**Carousel Functionality:**
- Auto-advance slides in carousel
- Pause and resume carousel
- Toggle fullscreen mode
- Configure scoreboard position
- Display images in kiosk view
- Auto-hide control bar after inactivity

**PIN Protection:**
- Show PIN modal when protection enabled
- Validate correct and incorrect PIN

### Accessibility Tests `@full` (3 tests)
- Proper ARIA labels on controls
- Keyboard-only navigation support
- Live regions for screen reader announcements

## Running Tests

### Prerequisites
```bash
# Install Playwright dependencies (one-time setup)
npx playwright install-deps

# Or with npm
npm run playwright:install-deps
```

### Quick Start (Fast Tests)
```bash
# Run only fast tests on Desktop Chrome
npm run test:e2e -- --grep "@fast" --project="Desktop Chrome"

# Run fast tests on all configured browsers
npm run test:e2e -- --grep "@fast"
```

### Comprehensive Testing (Full Tests)
```bash
# Run full tests on Desktop Chrome
npm run test:e2e -- --grep "@full" --project="Desktop Chrome"

# Run all tests (fast + full)
npm run test:e2e -- e2e/kiosk.spec.ts
```

### Specific Test Selection
```bash
# Run a specific test by name
npm run test:e2e -- --grep "should upload a valid image"

# Run with video recording
npm run test:e2e -- --grep "@fast" --project="Desktop Chrome" --video=on

# Run with headed browser (see what's happening)
npm run test:e2e -- --grep "@fast" --project="Desktop Chrome" --headed

# Debug mode with step-by-step execution
npm run test:e2e -- --grep "@fast" --project="Desktop Chrome" --debug
```

## Test Fixtures

- **Test Image:** `e2e/fixtures/test-image.png` (10x10 PNG, 72 bytes)
- **Test Users:**
  - John (regular user) - `john@example.com`
  - Sarah (regular user) - `sarah@example.com`
  - Admin - `admin@example.com`

## Browser Configurations

Tests run on:
- **Fast Config** (`playwright.config.fast.ts`): Desktop Chrome only
- **Full Config** (`playwright.config.ts`): Desktop Chrome, Mobile iPhone 12, Mobile Minimum (320px)

## Key Features Tested

### Settings Section
- Kiosk mode toggle
- Slide duration configuration (5s, 10s, 15s, 30s)
- PIN code setup and visibility toggle
- Scoreboard position in carousel

### Carousel
- Auto-advance with configurable duration
- Play/pause controls
- Keyboard navigation (Arrow keys)
- Image slides + scoreboard slide mixing
- Drag-and-drop reordering

### PIN Protection
- PIN input validation
- Modal presentation
- Correct/incorrect PIN handling
- Kiosk access control

### Image Uploads
- File type validation (PNG, JPG, WebP)
- File size limits (max 10MB)
- Thumbnail generation
- Storage and retrieval

### Accessibility
- ARIA labels on interactive elements
- Keyboard-only navigation support
- Screen reader announcements

## Troubleshooting

### Mobile Browser Issues
If mobile tests fail with browser launch errors:
```bash
# Reinstall all browser dependencies
npx playwright install-deps

# Just install browsers without system deps
npx playwright install
```

### Test Data Setup Failures
The global setup (`e2e/global-setup.ts`) creates test scoreboards:
```bash
# Manually run setup
npx playwright test --only-changed  # This runs setup first

# Or check if test users exist in the database
```

### Specific Test Failures

**"should expand and collapse kiosk settings section"**
- Verifies the kiosk section expands and shows "Slide Duration" label
- May skip if no scoreboard found for John

**"should upload a valid image"**
- Uses `e2e/fixtures/test-image.png`
- Requires valid JWT token in Authorization header
- May fail if storage bucket not configured

**"should show PIN modal"**
- Opens kiosk in unauthenticated context to verify PIN modal appears
- PIN must be enabled and kiosk mode must be enabled

## Continuous Integration

For CI/CD pipelines:
```bash
# Run fast tests only (quick feedback)
CI=true npm run test:e2e -- --grep "@fast"

# Run full test suite
CI=true npm run test:e2e

# Generate HTML report
npm run test:e2e
# Report available at: playwright-report/index.html
```

## Performance Notes

- **Fast tests:** ~2-3 minutes (Desktop Chrome)
- **Full tests:** ~5-10 minutes (Desktop Chrome)
- **All tests:** ~20-30 minutes (all browsers)
- **Test data setup:** ~30-60 seconds

## Debugging

View test traces and recordings:
```bash
# Show trace of last test run
npx playwright show-trace test-results/kiosk-*/trace.zip

# Run tests with trace enabled
npm run test:e2e -- --grep "@fast" --trace on
```

## Code Structure

- **Tests:** `e2e/kiosk.spec.ts` (855 lines)
- **Fixtures:** `e2e/fixtures/auth.ts` (authenticated test users)
- **Images:** `e2e/fixtures/test-image.png`
- **Config (Fast):** `playwright.config.fast.ts` (Desktop Chrome only)
- **Config (Full):** `playwright.config.ts` (all browsers)

## Related Documentation

- [Scoreboard Manager Copilot Instructions](../../.github/copilot-instructions.md)
- [Playwright Documentation](https://playwright.dev)
- [E2E Test README](./README.md)
