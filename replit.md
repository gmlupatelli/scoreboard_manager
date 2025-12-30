# Scoreboard Manager

## Overview
A modern Next.js 14 scoreboard management application with TypeScript, Tailwind CSS, and Supabase authentication. This app provides a comprehensive platform for creating, managing, and viewing scoreboards with real-time updates optimized for TV displays.

## Project Status
- **Current State**: Fully configured and running on Replit
- **Last Updated**: December 30, 2025
- **Framework**: Next.js 14.2.0 with React 18.2.0
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth with SSR support

## Recent Changes

### December 30, 2025 - Per-Rank Customization with Colors and Icons
- Added per-rank color customization for top 3 positions (gold, silver, bronze defaults)
- Added custom icon selector for top 3 ranks with 8 icon options (Trophy, Star, Sparkles, Fire, Lightning, Heart, Badge, Gift)
- EntryTable, EntryCard, and embed page all use per-rank colors and icons from customStyles
- Style Customization section expanded state persists via localStorage using scoreboardId as key
- Updated all style presets with per-rank color defaults: rank1Color (#ca8a04), rank2Color (#9ca3af), rank3Color (#b45309)
- ScoreboardCustomStyles extended with rank1Color, rank2Color, rank3Color, rank1Icon, rank2Icon, rank3Icon fields
- Fixed light preset not populating on new scoreboard creation by defaulting custom_styles and style_scope in createScoreboard

### December 30, 2025 - Iframe Embedding with Custom Styling
- Added `/embed/[id]` route for clean scoreboard embeds (no header/footer)
- Implemented custom styling system with guided properties (colors, fonts, borders)
- Added 6 style presets: Light, Dark, Transparent, High Contrast, Minimal, Brand Colors
- Added style scope selector: apply styles to main view, embed only, or both
- Created embed code section with copyable iframe snippet
- Custom styles apply to EntryCard, EntryTable, and ScoreboardHeader components
- Embed works for both public and private scoreboards (accessible via direct URL)
- Migration file created: `supabase/migrations/20251130_scoreboard_custom_styles.sql`
- After creating a new scoreboard, users are now redirected to the management page for that scoreboard

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

### Backend Integration
- **Database**: Supabase PostgreSQL
- **Authentication**: Supabase Auth with email/password
- **Real-time**: Supabase Realtime for live scoreboard updates (optimized for TV displays)
- **Session Management**: Server-side session handling with middleware

### Key Features
1. Public scoreboard browsing with infinite scroll
2. User authentication (login/register/forgot password)
3. Scoreboard creation and management with public/private visibility
4. System admin dashboard (oversight only, no scoreboard creation)
5. Real-time score updates without screen flashing
6. Server-side search across all scoreboards
7. Owner filtering for admin users
8. CSV import for scoreboard entries
9. User invitation system with email notifications
10. Invite-only registration mode (controllable by system admin)

## Environment Configuration

### Required Environment Variables
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key for admin operations (invitation emails)

## Development

### Running the Application
The application runs automatically via the configured workflow:
- **Command**: `npm run dev`
- **Port**: 5000
- **Host**: 0.0.0.0 (for Replit proxy)

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run serve` - Start production server (alias)
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run format` - Format code with Prettier

## Deployment
The application is configured for Replit deployment with:
- **Target**: Autoscale
- **Build Command**: `npm run build`
- **Run Command**: `npm run serve`

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
│   │   ├── forgot-password/          # Password reset request
│   │   ├── individual-scoreboard-view/  # Single scoreboard display
│   │   │   └── components/           # Scoreboard view components
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
│   │   │   ├── Footer.tsx
│   │   │   ├── Header.tsx
│   │   │   └── SearchInterface.tsx
│   │   └── ui/                       # UI primitives
│   │       ├── AppIcon.tsx
│   │       ├── AppImage.tsx
│   │       ├── Logo.tsx
│   │       └── SearchableSelect.tsx
│   ├── contexts/
│   │   └── AuthContext.tsx           # Authentication context
│   ├── hooks/
│   │   └── useInfiniteScroll.ts      # Infinite scroll hook
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
│       └── storage.ts                # Local storage utils
├── public/                           # Static assets
├── supabase/                         # Database migrations
├── docs/                             # Documentation
├── middleware.ts                     # Next.js auth middleware
├── next.config.mjs                   # Next.js configuration
├── tailwind.config.js                # Tailwind configuration
├── tsconfig.json                     # TypeScript configuration
└── package.json                      # Dependencies
```

## Database Schema
The Supabase database includes:
- `user_profiles` - User profile information with roles
- `scoreboards` - Scoreboard metadata with owner references and visibility
- `scoreboard_entries` - Individual scoreboard entries
- `system_settings` - App-wide configuration (public registration toggle, email verification)
- `invitations` - User invitation tracking with status (pending/accepted/expired/cancelled)
- Row Level Security (RLS) policies for secure data access

## User Preferences & Design Notes
- Brand colors: Coral (#f77174), Orange (#eba977), Navy (#38385e, #20203e)
- System admin role is for oversight only - admins cannot create scoreboards
- Real-time updates optimized for TV displays (no screen flashing)
- Infinite scroll with 30 items per page for performance
- Server-side search with 300ms debounce to reduce API calls

## Technical Notes
- Uses state-based node tracking in useInfiniteScroll hook for proper observer re-attachment
- Debounced search uses direct state control (not SearchInterface component) to avoid double-debouncing
- All database functions have SET search_path = public, pg_temp for security
- Cache-Control headers prevent stale content in Replit's iframe proxy
