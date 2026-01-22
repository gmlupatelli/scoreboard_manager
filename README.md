# Scoreboard Manager

## Overview

A modern Next.js 14 scoreboard management application with TypeScript, Tailwind CSS, and Supabase authentication. This app provides a comprehensive platform for creating, managing, and viewing scoreboards with real-time updates optimized for TV displays.

## Project Status

- **Current State**: Fully configured and running on Replit
- **Last Updated**: January 15, 2026
- **Framework**: Next.js 14.2.0 with React 18.2.0
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth with SSR support

## Recent Changes

### January 15, 2026 - PDF Upload Support for Kiosk Slides

- **PDF to image conversion** for kiosk slide uploads
  - Upload PDF files (up to 50MB, max 50 pages) which are automatically converted to slide images
  - Client-side processing using `pdfjs-dist` library - no server-side dependencies required
  - Each PDF page is rendered at 2x scale for crisp display on TV screens
  - Uses CDN-hosted pdf.js worker for optimal performance
- **Unified upload progress UI** for both PDF and image uploads
  - Real-time progress feedback during file processing
  - Blue progress bar during upload, green checkmark on success, red indicator on error
  - Progress displays current page/total pages for PDFs or upload status for images
- **Bug fix**: Enabled badge now visible immediately when kiosk section is collapsed
  - Previously required expanding the section to see the enabled status
- **New utility**: `src/utils/pdfToImages.ts` with `convertPdfToImages()` and `isPdfFile()` functions
- **Dependency added**: `pdfjs-dist@4.10.38`

### January 15, 2026 - Migration Baseline Update

- **Consolidated all migrations** into single executable baseline (`20260115000000_baseline.sql`)
- Archived 12 previous migrations to `docs/migrations-archive/`
- Baseline now includes everything needed to replicate database from scratch:
  - All extensions, ENUM types, tables, constraints, and indexes
  - RLS helper functions with fixed search_path (security best practice)
  - All RLS policies for all tables
  - Storage bucket and policies for kiosk slides
  - Realtime publication configuration
  - Table and column documentation (COMMENT statements)
- Created **Manual Setup Guide** (`docs/supabase-manual-setup.md`) for items that can't be in migrations:
  - Auth trigger for syncing users to profiles
  - Initial system settings row
  - First admin user promotion
  - Email template configuration

### January 2026 - Kiosk/TV Mode

- **Full-screen kiosk display mode** optimized for TV screens and public displays
  - Dedicated `/kiosk/[id]` route with immersive full-screen experience
  - Auto-rotating carousel with configurable slide duration (3-300 seconds)
  - Support for multiple content types: scoreboard displays and uploaded images
  - Smooth CSS transitions between slides with fade/slide animations
- **Kiosk management interface** integrated into scoreboard management
  - Enable/disable kiosk mode per scoreboard
  - Configure slide duration and scoreboard position in carousel
  - Add/remove/reorder slides with drag-and-drop
  - Upload custom images (PNG, JPG, WebP) up to 10MB each
  - Upload PDF files (up to 50MB, max 50 pages) - auto-converted to slide images
  - Optional PIN protection for private scoreboards
- **Keyboard controls for kiosk view**:
  - `Space` - Play/pause carousel
  - `←`/`→` - Navigate between slides
  - `F` - Toggle fullscreen mode
  - `Escape` - Exit fullscreen
- **Database schema**: New `kiosk_configs` and `kiosk_slides` tables with RLS policies
- **E2E tests** for kiosk functionality in `e2e/kiosk.spec.ts`

### January 2026 - Race Condition Fixes & Custom Hooks

- **Created three new reusable hooks** to eliminate race conditions:
  - `useAuthGuard`: Centralized auth guard with role-based access, prevents redirect loops
  - `useAbortableFetch`: AbortController wrapper that auto-cancels on unmount
  - `useTimeoutRef`: Safe setTimeout with auto-cleanup and mount state tracking
- **Fixed 11 race condition issues** across the codebase:
  - Eliminated arbitrary 500ms timeout patterns in favor of proper auth state checks
  - Added mount state tracking to prevent state updates after unmount
  - Replaced raw `setTimeout` calls with `setTimeoutSafe` for proper cleanup
  - Fixed Supabase client recreation issues by using shared client instances
  - Added `isMounted()` checks in async callbacks
- **Removed unused imports** and cleaned up dependency arrays
- **Added hook unit tests** for `useAuthGuard`, `useAbortableFetch`, and `useTimeoutRef`

### January 11, 2026 - Mobile Optimization & E2E Testing

- **Comprehensive mobile responsiveness** targeting minimum viewport of 320px (iPhone SE)
  - Optimized all modals for iPhone SE with responsive padding and stacked buttons
  - Fixed ScoreboardCard metadata wrapping and increased touch targets to 20px (44x44px minimum)
  - Added landscape orientation support with custom Tailwind variant (`landscape-mobile`)
  - Adjusted breakpoints to treat tablets (1024px+) as desktop view
- **Undo toast system** with batching and 5-second timers
  - 3-toast stacking with countdown progress bars
  - Batch actions (4+ within 2 seconds) to reduce notification spam
  - Navigation cancellation for clean UX
- **Invitations page conversion** to responsive card view
- **Playwright E2E testing infrastructure**
  - 9 device profiles: Desktop (Chrome/Firefox/Safari), Tablet, Mobile (iPhone 12/SE/Minimum/Landscape), Android
  - 3 comprehensive test suites: mobile.spec.ts, desktop.spec.ts, accessibility.spec.ts
  - Tests cover: touch interactions, keyboard navigation, WCAG compliance, RTL support
  - Manual testing checklist for 320px viewport validation

### January 10, 2026 - JWT Migration & Build Safety Improvements

- **Migrated to modern JWT signing keys** (ECC P-256) from legacy shared secrets
  - Enabled JWT signing keys in both Dev and Prod Supabase projects
  - Generated new publishable and secret API keys for enhanced security
  - Updated all 20+ files to use modern key nomenclature
- **Renamed environment variables for consistency**:
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` → `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY` → `SUPABASE_SECRET_KEY`
- **Implemented build-safe Supabase client initialization**:
  - Added empty string fallbacks for missing environment variables during build
  - Implemented runtime error guards in middleware, auth callback, and client pages
  - Prevents build failures when env vars missing (Netlify/CI/CD compatibility)
  - Graceful error handling instead of cryptic crashes
- **Fixed Netlify automated migrations**:
  - Updated Supabase CLI download URL to use latest release endpoint
  - Added fail-fast curl flags for better error reporting
  - Automated production database migrations via Netlify build hooks
- **Consolidated environment variables**:
  - Merged `SUPABASE_PROJECT_REF_DEV` and `SUPABASE_PROJECT_REF_PROD` into single `SUPABASE_PROJECT_REF`
  - Context-specific values set in Netlify (Production vs Deploy Previews)

### January 10, 2026 - Git Workflow & Supabase CLI Integration

- Created comprehensive Git workflow guide at `.github/GIT_WORKFLOW.md`
- Created JWT migration checklist at `docs/JWT_MIGRATION_CHECKLIST.md`
- Documented branch strategy (main → production, dev → staging, feature branches)
- Added Supabase CLI setup and migration instructions
- Updated `.env.example` with modern key names and CLI environment variables
- See [Database Migrations](#database-migrations) section below for workflow

### January 10, 2026 - Advanced Styling & UX Improvements

- Added **Alternate Row Text Color** custom property for better readability in alternating table rows
  - Property added to all 6 style presets (light, dark, transparent, high-contrast, minimal, custom)
  - Applied to desktop table view, mobile card view, embed view, and preview table
- Enhanced color picker with **RGBA/transparency support**
  - Replaced native color inputs with custom ColorPicker component using react-colorful
  - Visual color picker with hue, saturation, lightness controls
  - Alpha/opacity slider (0-100%) for all 21+ color properties
  - Text input supporting HEX, RGBA, and transparent formats
  - Smart format conversion (opaque→HEX, transparent→keyword, partial→RGBA)
  - Checkerboard pattern for transparency preview
- Fixed embed view to include subtitle and match main view font sizes
- Fixed header user icon to use correct primary brand color
- Improved login form to trigger Chrome password save prompt

### January 9, 2026 - Time-Based Scoreboards & Flexible Score Types

- Added flexible score types: number (default) or time-based scoreboards
- Configurable sort order: ascending (lowest/fastest first) or descending (highest/slowest first)
- Multiple time formats supported: hh:mm, hh:mm:ss, mm:ss, mm:ss.s, mm:ss.ss, mm:ss.sss
- Time stored as milliseconds for accurate sorting, displayed based on format settings
- Updated CreateScoreboardModal and EditScoreboardModal with score type options
- Confirmation dialog when changing score type (warns about entry deletion)
- Updated all entry display components to format scores correctly based on type
- Applied database migrations to both development and production Supabase projects

### November 30, 2025 - Settings API & Registration Form Fixes

- Fixed settings API caching issues by adding Next.js cache busting (`fetchCache`, `revalidate`)
- Fixed service role client configuration with `detectSessionInUrl: false` to prevent session conflicts
- Fixed settings API GET endpoint to use service role client, bypassing RLS for accurate reads
- Registration page now properly hides all form fields in invite-only mode (not just name/password)
- Form fields only appear when public registration is enabled OR user has valid invitation
- Fixed account deletion redirect by navigating before signing out

### November 30, 2025 - Email Confirmation Redirect Improvements

- Created dedicated `/email-confirmed` page with success messages and auto-redirect
- Enhanced `/auth/callback` route to handle signup and email change confirmations
- Updated Supabase email templates documentation with custom redirect URLs
- Email confirmations now redirect to proper pages instead of root URL with hash fragments:
  - Signup confirmation → shows success page → auto-redirects to Dashboard
  - Email change → shows success page → auto-redirects to Profile
  - Password reset → uses Supabase's built-in flow (unchanged)
- Dashboard "Invite" button now opens InviteUserModal directly

### November 30, 2025 - Production API Routes & Dynamic Export Fix

- Fixed 405 Method Not Allowed error in production by adding dynamic exports to all API routes
- Added `export const dynamic = 'force-dynamic'` and `export const runtime = 'nodejs'` to prevent static optimization
- Added Cache-Control headers to settings API to prevent caching issues
- Updated all API routes to use service role client with auth client fallback pattern:
  - Service role client when available (production) for reliable RLS bypass
  - Auth client fallback when service role key is missing (development)
- All routes validate JWT for user identity before any database operations
- Admin operations check user role before performing privileged actions
- Profile updates now sync to both user_profiles table AND Supabase Auth metadata

### November 29, 2025 - System Admin Invitations Management Page

- Created dedicated System Admin Invitations page at /system-admin/invitations
- Added search by invitee email, filter by status, and filter by inviter
- Implemented page-based pagination (20 items per page) for performance
- Added API endpoint for fetching inviters list (/api/invitations/inviters)
- Updated /api/invitations with optional paginated mode (paginated=true query param)
- Added navigation link to Invitations page from System Admin Dashboard

### November 29, 2025 - User Invitation System

- Added system_settings and invitations database tables with RLS policies
- Created API routes for invitation management (send, list, check, accept, cancel)
- Built system admin settings page at /system-admin/settings for toggling public registration
- Added user invite functionality to dashboard with InviteUserModal and InvitationsSection components
- Created accept-invite page for invited users to complete account setup
- Updated registration page to check public registration status and validate invitations
- Uses Supabase's inviteUserByEmail() function for secure email delivery

### November 29, 2025 - Landing Page & Icon Fixes

- Made marketing landing page the root page (no redirect needed)
- Fixed visibility icon on scoreboard management screen to use standardized icons

### November 29, 2025 - Visibility Toggle & UI Standardization

- Added ability to change scoreboard visibility (public/private) when editing
- Standardized visibility icons (GlobeAltIcon for public, LockClosedIcon for private)
- Added visibility indicator to scoreboard cards in dashboard

### November 29, 2025 - Code Cleanup & Search Fix

- Fixed Dashboard search bug caused by double debouncing
- Removed all console.log/console.error statements from services
- Removed unused state variables from components

### November 29, 2025 - Server-Side Search & Infinite Scrolling

- Added server-side search with 300ms debounce for all scoreboard lists
- Implemented infinite scrolling with 30 items per page
- Created reusable `useInfiniteScroll` hook with IntersectionObserver

### November 29, 2025 - Initial Replit Setup

- Fixed middleware.ts circular dependency with proper Supabase SSR middleware
- Configured Next.js to run on 0.0.0.0:5000 for Replit proxy compatibility
- Added Cache-Control headers to prevent caching issues

## Project Architecture

### Frontend

- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS with custom theme (coral #f77174, orange #eba977, navy #38385e/#20203e)
- **Components**: React components with TypeScript
- **State Management**: React Context (AuthContext)
- **Custom Hooks**: See below

### Custom Hooks

Located in `src/hooks/` with barrel export from `@/hooks`:

| Hook                | Purpose                                                                                                                                        |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `useAuthGuard`      | Authentication guard with role-based access. Returns `{isAuthorized, isChecking, user, userProfile, getAuthHeaders}`. Prevents redirect loops. |
| `useAbortableFetch` | AbortController wrapper for fetch. Auto-cancels on unmount. Returns `{execute, abort, abortAll}`.                                              |
| `useTimeoutRef`     | Safe setTimeout with auto-cleanup. Returns `{set, clear, clearAll, isMounted}`.                                                                |
| `useInfiniteScroll` | IntersectionObserver-based infinite scroll.                                                                                                    |
| `useUndoQueue`      | Undo queue with toast notifications.                                                                                                           |

### Backend Integration

- **Database**: Supabase PostgreSQL
- **Authentication**: Supabase Auth with email/password
- **Real-time**: Supabase Realtime for live scoreboard updates (optimized for TV displays)
- **Session Management**: Server-side session handling with middleware

### Key Features

1. Public scoreboard browsing with infinite scroll
2. User authentication (login/register/forgot password)
3. Scoreboard creation and management with public/private visibility
4. **Kiosk/TV Mode**: Full-screen display with auto-rotating carousel for public displays
5. System admin dashboard (oversight only, no scoreboard creation)
6. Real-time score updates without screen flashing
7. Server-side search across all scoreboards
8. Owner filtering for admin users
9. CSV import for scoreboard entries
10. User invitation system with email notifications
11. Invite-only registration mode (controllable by system admin)
12. Flexible score types: number or time-based scoreboards
13. Configurable sort order: ascending or descending
14. Multiple time formats: hh:mm, hh:mm:ss, mm:ss, mm:ss.s, mm:ss.ss, mm:ss.sss
15. Embeddable scoreboards via `/embed/[id]` with custom styling
16. Advanced style customization with 21+ properties including alternate row text color
17. RGBA/transparency support in all color pickers with alpha slider

## Environment Configuration

### Required Environment Variables

- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: Supabase publishable key (modern) or anon key (legacy)
- `SUPABASE_SECRET_KEY`: Secret key for admin operations (modern) or service_role key (legacy)
- `SUPABASE_PROJECT_REF`: Project reference ID for Supabase CLI migrations
- `SUPABASE_ACCESS_TOKEN`: Personal access token for Supabase CLI (production migrations only)
- `SUPABASE_DB_PASSWORD`: Database password for Supabase CLI (production migrations only)

**Environment loading order (tests):** Playwright and E2E tooling load `.env.local` first, then apply `.env.test` overrides. Keep Supabase credentials in `.env.local`; use `.env.test` for test users, cleanup key, and test-only overrides.

### Security Notes

- **JWT Signing Keys**: Application uses modern ECC P-256 signing keys (enabled January 10, 2026)
- **API Keys**: Publishable key is safe for client-side use; Secret key must never be exposed
- **Build Safety**: Application can build without environment variables (uses empty string fallbacks)
- **Runtime Guards**: Graceful error handling when configuration is missing

## Development

### Running the Application

The application runs automatically via the configured workflow:

- **Command**: `npm run dev`
- **Port**: 5000
- **Host**: 0.0.0.0 (for Replit proxy)

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run build:prod` - Build with production database migrations (Netlify only)
- `npm run migrate:prod` - Run Supabase migrations on production
- `npm run start` - Start production server
- `npm run serve` - Start production server (alias)
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run format` - Format code with Prettier
- `npm run type-check` - TypeScript type checking
- `npm run test:e2e` - Run Playwright E2E tests
- `npm run test:e2e:fast` - Run Playwright E2E @fast suite on Desktop Chrome (fast config)
- `npm run test:e2e:ui` - Run Playwright tests in UI mode
- `npm run test:e2e:debug` - Run Playwright tests in debug mode

## Testing

### E2E Testing with Playwright

The application includes comprehensive end-to-end tests using Playwright.

> **📖 Full Testing Documentation**: See [e2e/README.md](e2e/README.md) for comprehensive testing guide including:
>
> - Manual testing checklist (320px viewport)
> - CI/CD integration details
> - Debugging tips and troubleshooting
> - Known limitations and contributing guidelines

**Setup:**

```bash
npm install
npx playwright install

# Linux/WSL only (install system dependencies)
sudo npx playwright install-deps
```

**Running Tests:**

```bash
# All tests
npm run test:e2e

# Fast @fast suite (Desktop Chrome via fast config)
npm run test:e2e:fast

# Interactive UI mode
npm run test:e2e:ui

# Debug mode
npm run test:e2e:debug

# Specific test file
npx playwright test e2e/mobile.spec.ts

# Specific browser/device
npx playwright test --project="Desktop Chrome"
npx playwright test --project="Mobile iPhone SE"
```

**Test Coverage:**

- **Mobile Tests** (`e2e/mobile.spec.ts`): Touch targets (44x44px), landscape orientation, 320px viewport
- **Desktop Tests** (`e2e/desktop.spec.ts`): Auth flows, CRUD operations, keyboard navigation, real-time updates
- **Accessibility Tests** (`e2e/accessibility.spec.ts`): WCAG compliance, ARIA labels, screen readers, focus management

**Test Devices:**

- Desktop: Chrome (1920x1080), Firefox (1920x1080), Safari (1920x1080)
- Tablet: iPad Pro (1024x768)
- Mobile: iPhone 12 (390x844), iPhone SE (375x667), Minimum (320x568), Landscape (844x390), Android Pixel 5 (393x851)

**Documentation:**

- Full testing guide: `e2e/README.md`
- Manual testing checklist: `docs/mobile-testing-checklist.md`
- Mobile optimization summary: `docs/mobile-optimization-summary.md`

## Deployment

### Netlify Deployment (Production)

The application is deployed to Netlify with automated database migrations:

- **Site**: https://myscoreboardmanager.netlify.app
- **Build Command**: Automated via `netlify.toml` (downloads Supabase CLI, runs migrations, builds app)
- **Deploy Contexts**:
  - **Production** (main branch): Uses prod Supabase project, runs migrations automatically
  - **Deploy Previews**: Uses dev Supabase project, standard build only
  - **Branch Deploys**: Uses dev Supabase project, standard build only
- **Environment Variables Required**:
  - `NEXT_PUBLIC_SUPABASE_URL` (all contexts)
  - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (all contexts)
  - `SUPABASE_SECRET_KEY` (all contexts)
  - `SUPABASE_PROJECT_REF` (context-specific: prod for Production, dev for others)
  - `SUPABASE_ACCESS_TOKEN` (production only, for migrations)
  - `SUPABASE_DB_PASSWORD` (production only, for migrations)

### Replit Deployment (Development)

The application can also run on Replit:

- **Target**: Autoscale
- **Build Command**: `npm run build`
- **Run Command**: `npm run serve`
- **Port**: 5000 (configured for Replit proxy)

## File Structure

```
├── src/
│   ├── app/                          # Next.js App Router pages
│   │   ├── about/                    # About page
│   │   ├── admin/seed/               # Admin seed data tool
│   │   ├── auth/callback/            # Auth callback route
│   │   ├── contact/                  # Contact page
│   │   ├── cookies/                  # Cookie policy
│   │   ├── dashboard/                # User/Admin dashboard
│   │   │   └── components/           # Dashboard components
│   │   ├── embed/[id]/               # Embedded scoreboard view
│   │   ├── forgot-password/          # Password reset request
│   │   ├── individual-scoreboard-view/  # Single scoreboard display
│   │   │   └── components/           # Scoreboard view components
│   │   ├── invitations/              # User invitations
│   │   │   └── components/           # Invitation cards
│   │   ├── login/                    # Login page
│   │   ├── privacy/                  # Privacy policy
│   │   ├── public-scoreboard-list/   # Public scoreboard browsing
│   │   │   └── components/           # Public list components
│   │   ├── register/                 # Registration page
│   │   ├── reset-password/           # Password reset
│   │   ├── scoreboard-management/    # Scoreboard editing
│   │   │   └── components/           # Management components
│   │   ├── support/                  # Support page
│   │   ├── system-admin/             # System admin page
│   │   │   ├── invitations/          # Invitations management
│   │   │   └── settings/             # System settings
│   │   ├── terms/                    # Terms of service
│   │   ├── user-profile-management/  # User profile settings
│   │   │   └── components/           # Profile components
│   │   ├── layout.tsx                # Root layout
│   │   ├── not-found.tsx             # 404 page
│   │   ├── page.tsx                  # Home page
│   │   └── providers.tsx             # Context providers
│   ├── components/
│   │   ├── common/                   # Shared components
│   │   │   ├── AuthStatusIndicator.tsx
│   │   │   ├── ErrorBoundary.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── Header.tsx
│   │   │   ├── SearchInterface.tsx
│   │   │   ├── UndoToast.tsx         # Undo toast component
│   │   │   └── UndoToastContainer.tsx
│   │   └── ui/                       # UI primitives
│   │       ├── AppIcon.tsx
│   │       ├── AppImage.tsx
│   │       ├── ColorPicker.tsx       # RGBA color picker
│   │       ├── Logo.tsx
│   │       └── SearchableSelect.tsx
│   ├── contexts/
│   │   └── AuthContext.tsx           # Authentication context
│   ├── hooks/
│   │   ├── useInfiniteScroll.ts      # Infinite scroll hook
│   │   └── useUndoQueue.ts           # Undo queue management
│   ├── lib/
│   │   └── supabase/
│   │       ├── client.ts             # Browser Supabase client
│   │       └── server.tsx            # Server Supabase client
│   ├── services/
│   │   ├── profileService.ts         # User profile API
│   │   └── scoreboardService.ts      # Scoreboard API
│   ├── styles/
│   │   ├── index.css
│   │   └── tailwind.css
│   ├── types/
│   │   ├── database.types.ts         # Supabase types
│   │   └── models.ts                 # App models
│   └── utils/
│       ├── localStorage.ts           # Local storage utils
│       ├── stylePresets.ts           # Style presets
│       └── timeUtils.ts              # Time formatting utils
├── e2e/                              # Playwright E2E tests
│   ├── accessibility.spec.ts         # Accessibility tests
│   ├── desktop.spec.ts               # Desktop tests
│   ├── mobile.spec.ts                # Mobile tests
│   └── README.md                     # Testing guide
├── docs/                             # Documentation
│   ├── supabase-manual-setup.md      # Post-migration setup guide
│   ├── supabase-email-templates.md   # Email template customization
│   ├── realtime-setup.md             # Realtime configuration
│   ├── dependency-upgrade-policy.md  # Dependency management
│   ├── mobile-optimization-summary.md
│   ├── mobile-testing-checklist.md
│   ├── JWT_MIGRATION_CHECKLIST.md
│   └── migrations-archive/           # Archived database migrations
├── public/                           # Static assets
├── supabase/                         # Database migrations
├── middleware.ts                     # Next.js auth middleware
├── next.config.mjs                   # Next.js configuration
├── playwright.config.ts              # Playwright configuration
├── tailwind.config.js                # Tailwind configuration
├── tsconfig.json                     # TypeScript configuration
└── package.json                      # Dependencies
```

## Database Schema

The Supabase database includes:

- `user_profiles` - User profile information with roles (synced from auth.users via trigger)
- `scoreboards` - Scoreboard metadata with owner references, visibility, score_type, sort_order, time_format
- `scoreboard_entries` - Individual scoreboard entries (score stored as number/milliseconds)
- `kiosk_configs` - Kiosk mode settings per scoreboard (duration, position, PIN protection)
- `kiosk_slides` - Custom slides for kiosk carousel (images, scoreboard positions)
- `kiosk_file_registry` - Tracks uploaded files for orphan detection and cleanup
- `system_settings` - App-wide configuration (public registration toggle, email verification)
- `invitations` - User invitation tracking with status (pending/accepted/expired/cancelled)
- Row Level Security (RLS) policies for secure data access
- Real-time subscriptions for scoreboards and entries

### Database Setup

**For new Supabase projects:**

1. Run the baseline migration: `supabase db push`
2. Complete manual setup steps in [docs/supabase-manual-setup.md](docs/supabase-manual-setup.md)

**Manual setup includes:**
- Auth trigger for syncing users to profiles
- Initial system settings row
- First admin user promotion
- Email template configuration (optional)

### Running Migrations

```bash
# Link to target project
supabase link --project-ref <project-ref>

# Check migration status
supabase migration list

# Repair if needed (for remote-only migrations)
supabase migration repair --status reverted <migration-ids>

# Push migrations
supabase db push
```

### Creating New Migrations

Place SQL migration files in `supabase/migrations/` with timestamp prefix (e.g., `20260109120000_add_feature.sql`).

## User Preferences & Design Notes

- Brand colors: Coral (#f77174), Orange (#eba977), Navy (#38385e, #20203e)
- System admin role is for oversight only - admins cannot create scoreboards
- Real-time updates optimized for TV displays (no screen flashing)
- Infinite scroll with 30 items per page for performance
- Server-side search with 300ms debounce to reduce API calls
- Mobile-first responsive design with 320px minimum viewport support
- Touch targets meet WCAG 2.1 Level AA standards (44x44px minimum)
- Landscape orientation optimized for mobile devices (<500px height)

## Technical Notes

- Uses state-based node tracking in useInfiniteScroll hook for proper observer re-attachment
- Debounced search uses direct state control (not SearchInterface component) to avoid double-debouncing
- All database functions have SET search_path = public, pg_temp for security
- Cache-Control headers prevent stale content in Replit's iframe proxy
- Undo toast system batches rapid actions (4+ within 2 seconds) to reduce notification spam
