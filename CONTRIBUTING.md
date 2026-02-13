# Contributing to Scoreboard Manager

Thanks for your interest in contributing! This project is open source under the GNU Affero General Public License v3 (AGPL v3). Contributions are welcome and appreciated.

## Getting Started

### Prerequisites

- Node.js 20+
- npm
- A Supabase project (for local development)

### Setup

1. Clone the repository
2. Install dependencies:
   - `npm install`
3. Copy environment variables:
   - `cp .env.example .env.local`
4. Configure Supabase and environment variables in `.env.local`
5. Run the development server:
   - `npm run dev`

For Supabase manual setup steps, see [docs/supabase-manual-setup.md](docs/supabase-manual-setup.md).

## Development Workflow

- **Start dev server:** `npm run dev`
- **Lint:** `npm run lint`
- **Type check:** `npm run type-check`
- **Build:** `npm run build`
- **Unit tests:** `npm run test:unit` (local), runs on every PR
- **Unit tests (watch):** `npm run test:unit:watch`
- **E2E tests:** `npm run test:e2e` (local), runs nightly

## Testing

We use a two-tier testing approach: fast unit tests for PRs, comprehensive E2E tests nightly.

### Unit Tests

Run locally and on every PR (must pass to merge):
```bash
# Run all tests
npm run test:unit

# Watch mode (re-runs on changes)
npm run test:unit:watch

# Coverage report
npm run test:unit  # generates coverage/ directory
```

Unit tests focus on pure functions, services, and business logic. Place tests in `__tests__/` directories or adjacent to implementation:
- `src/utils/__tests__/timeUtils.test.ts`
- `src/hooks/__tests__/useTimeoutRef.test.ts`
- `src/services/__tests__/scoreboardService.test.ts`

**Coverage targets**: 70-80% for utils, 50%+ for critical paths.

### E2E Tests

Run nightly (2 AM UTC) or manually. Tests run against a production build on Desktop Chrome:
```bash
# Run all E2E tests (~96 tests, production build)
npm run test:e2e

# Run with fast config (debug-friendly)
npm run test:e2e:fast

# Interactive UI browser
npm run test:e2e:ui

# Debug mode (step through)
npm run test:e2e:debug

# Update visual regression baselines
npx playwright test visual.spec.ts --update-snapshots
```

E2E tests verify user workflows, accessibility (axe-core WCAG scanning), visual regression, and subscription flows.

**Key rules:**
- Use `data-testid` attributes for element selection (not CSS classes)
- Never use `waitForTimeout` or `waitForLoadState('networkidle')`
- Import shared helpers from `e2e/fixtures/helpers.ts`

### When to Write Tests

- **Unit tests**: All business logic, transformations, utilities, subscription setup
- **E2E tests**: User workflows, real-time updates across browsers, multi-viewport experience
- **Real-time**: Especially important—verify subscription setup in unit tests AND multi-browser verification in E2E

**Example**: Adding a new real-time feature?
1. Unit test: subscription channel name, filters, cleanup
2. E2E test: change in one browser → appears in another without reload

For detailed testing guidelines, see [docs/testing.md](docs/testing.md).

## Code Review

- Maintainers may request changes before merging
- All tests must pass (unit tests block merge, E2E checked nightly)
- Be responsive to feedback
- Keep discussions respectful and constructive

## License

By contributing, you agree that your contributions will be licensed under the AGPL v3.
