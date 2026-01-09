# Scoreboard Manager

## Overview
The Scoreboard Manager is a modern Next.js 14 application designed for creating, managing, and displaying scoreboards with real-time updates. It targets a comprehensive platform for various scoring needs, optimized for TV display. The project aims to provide an intuitive user experience for both scoreboard creators and viewers, with robust authentication and customization options.

## User Preferences
- Real-time updates optimized for TV displays (no screen flashing)
- Infinite scroll with 30 items per page for performance
- Server-side search with 300ms debounce to reduce API calls
- System admin role is for oversight only - admins cannot create scoreboards
- Brand colors: Coral (#f77174), Orange (#eba977), Navy (#38385e, #20203e)

## System Architecture

### Frontend
- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS with custom theme
- **Components**: React components with TypeScript
- **State Management**: React Context (AuthContext)
- **UI/UX**:
    - Per-rank customization with colors and icons for top 3 positions.
    - Custom styling system with guided properties (colors, fonts, borders).
    - Six style presets: Light, Dark, Transparent, High Contrast, Minimal, Brand Colors.
    - Style scope selector to apply styles to main view, embed only, or both.
    - Standardized visibility icons (GlobeAltIcon for public, LockClosedIcon for private).

### Backend Integration
- **Database**: Supabase PostgreSQL
- **Authentication**: Supabase Auth with email/password and SSR support.
- **Real-time**: Supabase Realtime for live scoreboard updates.
- **Session Management**: Server-side session handling with middleware.
- **Technical Implementations**:
    - Server-side search with debouncing.
    - Infinite scrolling using `useInfiniteScroll` hook with IntersectionObserver.
    - Dynamic exports (`export const dynamic = 'force-dynamic'`) and `runtime = 'nodejs'` for API routes to prevent static optimization and resolve 405 errors in production.
    - Service role client for API routes with auth client fallback for development.
    - JWT validation for user identity and role-based checks for admin operations.
    - Email confirmation system with dedicated pages and auto-redirects.
    - Password manager support for all authentication forms.

### Core Features
- Public scoreboard browsing with infinite scroll.
- User authentication (login, register, forgot password).
- Scoreboard creation and management with public/private visibility.
- System admin dashboard for oversight and public registration toggle.
- Real-time score updates.
- Server-side search across all scoreboards.
- Owner filtering for admin users.
- CSV import for scoreboard entries.
- User invitation system with email notifications and invite-only registration mode.
- Embeddable scoreboards via `/embed/[id]` route with custom styling.
- Flexible score types: number or time-based scoreboards.
- Configurable sort order: ascending (lowest first) or descending (highest first).
- Multiple time formats: hh:mm, hh:mm:ss, mm:ss, mm:ss.s, mm:ss.ss, mm:ss.sss.
- Time stored as milliseconds for accurate sorting and displayed based on format settings.

## External Dependencies
- **Supabase**: Used for PostgreSQL database, authentication, and real-time functionalities.
- **Next.js**: Primary web framework.
- **React**: Frontend library for UI.
- **Tailwind CSS**: Utility-first CSS framework for styling.