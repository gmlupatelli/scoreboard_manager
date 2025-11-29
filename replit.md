# Scoreboard Manager

## Overview
A modern Next.js 14 scoreboard management application with TypeScript, Tailwind CSS, and Supabase authentication. This app provides a comprehensive platform for creating, managing, and viewing scoreboards with real-time updates optimized for TV displays.

## Project Status
- **Current State**: Fully configured and running on Replit
- **Last Updated**: November 29, 2025
- **Framework**: Next.js 14.2.0 with React 18.2.0
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth with SSR support

## Recent Changes

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

## Environment Configuration

### Required Environment Variables
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anonymous key

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
