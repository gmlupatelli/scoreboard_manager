# Testing Guide

## Overview
Comprehensive E2E testing setup using Playwright for mobile, desktop, and accessibility testing.

## Installation

```bash
npm install
npx playwright install
```

## Running Tests

### All Tests
```bash
npm run test:e2e
```

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

## Test Projects

### Desktop
- **Desktop Chrome** - 1920x1080
- **Desktop Firefox** - 1920x1080
- **Desktop Safari** - 1920x1080

### Tablet
- **Tablet** - 1024x768 (iPad Pro)

### Mobile
- **Mobile iPhone 12** - 390x844
- **Mobile iPhone SE** - 375x667
- **Mobile Minimum** - 320x568 (smallest target)
- **Mobile Landscape** - 844x390
- **Mobile Android** - 393x851 (Pixel 5)

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

## Manual Testing Checklist (320px)

### Visual Verification
- [ ] No horizontal overflow on any page
- [ ] All text is readable (minimum 14px)
- [ ] Touch targets are at least 44x44px
- [ ] Images scale properly
- [ ] Modals fit within viewport

### Interaction Testing
- [ ] All buttons are tappable
- [ ] Forms are usable
- [ ] Swipe gestures work smoothly
- [ ] Scrolling is smooth
- [ ] No content is hidden or cut off

### Landscape Mode
- [ ] Header reduces height (64px → 48px)
- [ ] Vertical spacing reduces (25%)
- [ ] Content is accessible
- [ ] No excessive scrolling needed

### Performance
- [ ] Page loads in < 3 seconds
- [ ] Animations are smooth (60fps)
- [ ] No layout shifts
- [ ] Touch response is immediate

## CI/CD Integration

Tests are configured to run in CI environments with:
- Retry on failure (2 retries)
- Single worker for stability
- Automatic screenshots on failure
- HTML report generation

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
