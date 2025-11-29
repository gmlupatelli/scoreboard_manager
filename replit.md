# Scoreboard Manager - Replit Project

## Overview
A modern Next.js 14 scoreboard management application with TypeScript, Tailwind CSS, and Supabase authentication. This app provides a comprehensive platform for creating, managing, and viewing scoreboards with real-time updates optimized for TV displays.

## Project Status
- **Current State**: Fully configured and running on Replit
- **Last Updated**: November 29, 2025
- **Framework**: Next.js 14.2.0 with React 18.2.0
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth with SSR support

## Recent Changes

### November 29, 2025 - Code Cleanup & Search Fix
- Fixed Dashboard search bug caused by double debouncing (SearchInterface + component-level)
- Replaced SearchInterface with direct input control in Dashboard for consistency
- Removed all console.log/console.error statements from scoreboardService
- Removed unused state variables (isLoading) from AdminDashboardInteractive
- Cached isSystemAdmin() result to prevent callback recreation on every render

### November 29, 2025 - Server-Side Search Implementation
- Added server-side search with 300ms debounce for all scoreboard lists
- Created `getAllScoreboardOwners()` function for admin owner dropdown
- Updated pagination functions to support both search and owner filtering
- Fixed race condition bug where Dashboard search results would reset

### November 29, 2025 - Infinite Scrolling Implementation
- Added paginated service functions with limit/offset support (30 items per page)
- Created reusable `useInfiniteScroll` hook with IntersectionObserver
- Implemented infinite scrolling in PublicScoreboardInteractive component
- Implemented infinite scrolling in AdminDashboardInteractive component
- Added "X of Y items loaded" stats display

### November 29, 2025 - Initial Replit Setup
- Fixed middleware.ts circular dependency with proper Supabase SSR middleware
- Configured Next.js to run on 0.0.0.0:5000 for Replit proxy compatibility
- Added Cache-Control headers to prevent caching issues
- Configured deployment settings for autoscale deployment

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
2. User authentication (login/register)
3. Scoreboard creation and management
4. System admin dashboard (oversight only, no scoreboard creation)
5. Real-time score updates without screen flashing
6. Server-side search across all scoreboards
7. Owner filtering for admin users
8. CSV import for scoreboard entries

## Environment Configuration

### Required Environment Variables
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anonymous key

These are already configured in the `.env` file.

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
│   ├── app/              # Next.js app router pages
│   │   ├── dashboard/    # User/Admin dashboard
│   │   ├── login/        # Authentication pages
│   │   ├── public-scoreboard-list/  # Public browsing
│   │   └── scoreboard-management/   # Scoreboard editing
│   ├── components/       # Reusable UI components
│   ├── contexts/         # React contexts (AuthContext)
│   ├── hooks/            # Custom hooks (useInfiniteScroll)
│   ├── lib/              # Library code (Supabase clients)
│   ├── services/         # API services (scoreboardService)
│   ├── types/            # TypeScript type definitions
│   └── utils/            # Utility functions
├── public/               # Static assets
├── supabase/             # Database migrations
└── middleware.ts         # Next.js middleware for auth
```

## Database Schema
The Supabase database includes:
- `user_profiles` - User profile information with roles
- `scoreboards` - Scoreboard metadata with owner references
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
