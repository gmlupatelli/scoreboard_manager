# Scoreboard Manager

## Overview

Scoreboard Manager is a modern web application built with Next.js 14 that enables users to create, manage, and display scoreboards for competitions, tournaments, and events. The platform features real-time updates optimized for TV displays, comprehensive scoreboard management tools, and public/private visibility controls. Users can create scoreboards, add entries, import data from CSV files, and share live rankings with participants and spectators.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Routing**
- Next.js 14 with App Router for file-based routing and server-side rendering
- React 18 for UI components with TypeScript for type safety
- Client-side navigation using Next.js router for seamless transitions

**Styling & UI Components**
- Tailwind CSS for utility-first styling with custom theme configuration
- Custom color palette: coral (#f77174), orange (#eba977), navy (#38385e/#20203e)
- Headless UI for accessible component primitives (comboboxes, modals)
- Heroicons for consistent iconography with outline and solid variants
- Responsive design with mobile-first approach

**State Management**
- React Context API for authentication state (AuthContext)
- Local component state using React hooks (useState, useEffect, useCallback)
- Custom hooks for reusable logic (useInfiniteScroll for pagination)

**Performance Optimizations**
- Infinite scrolling with IntersectionObserver for efficient large lists
- Server-side search with 300ms debouncing to reduce API calls
- Pagination with 30 items per page for dashboard views, 50 for public views
- Real-time updates using Supabase Realtime subscriptions

### Backend & Data Layer

**Database**
- Supabase PostgreSQL for relational data storage
- Tables: user_profiles, scoreboards, scoreboard_entries
- Row Level Security (RLS) policies for access control

**Authentication & Authorization**
- Supabase Auth with email/password authentication
- Server-side session management using @supabase/ssr
- Middleware for session refresh and cookie handling
- Role-based access: system_admin and user roles

**API Architecture**
- Service layer pattern (scoreboardService, profileService)
- Type-safe data models mapping database rows to application types
- Pagination support with limit/offset queries
- Search functionality with server-side filtering

**Real-time Features**
- Supabase Realtime for live scoreboard updates
- Automatic re-subscription on scoreboard changes
- Optimized for TV display scenarios with minimal flash

### Data Models

**User Profile**
- Fields: id, email, fullName, role, timestamps
- Linked to Supabase auth.users table

**Scoreboard**
- Fields: id, ownerId, title, subtitle, sortOrder (asc/desc), visibility (public/private), timestamps
- Computed field: entryCount (populated via join)

**Scoreboard Entry**
- Fields: id, scoreboardId, name, score, details, timestamps
- Computed field: rank (calculated client-side based on score and sortOrder)

### External Dependencies

**Third-Party Services**
- Supabase: PostgreSQL database, authentication, real-time subscriptions
- Configured via NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables

**Key NPM Packages**
- @supabase/supabase-js: Supabase client library
- @supabase/ssr: Server-side rendering support for Supabase
- @headlessui/react: Accessible UI components
- @heroicons/react: Icon library
- @tailwindcss/forms, @tailwindcss/typography: Tailwind plugins
- recharts: Charting library (installed but not currently used)

**Development Tools**
- TypeScript for type safety
- ESLint with Next.js, TypeScript, and Prettier configurations
- Tailwind CSS with custom configuration
- PostCSS for CSS processing

### Deployment Configuration

**Environment Setup**
- Configured to run on 0.0.0.0:5000 for Replit proxy compatibility
- Cache-Control headers to prevent caching issues
- Middleware handles session management without circular dependencies

**Build & Development**
- Next.js build system with TypeScript compilation
- Development server with hot reload
- Production builds with static optimization where possible