# Scoreboard Manager

## Overview

Scoreboard Manager is a modern Next.js 14 application for creating, managing, and displaying real-time scoreboards for competitions, tournaments, and events. The platform supports both public and private scoreboards with live updates optimized for TV displays, comprehensive administrative controls, and user-friendly interfaces for participants and spectators.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: Next.js 14 with App Router
- Server-side rendering (SSR) for improved performance and SEO
- Client components for interactive features with 'use client' directive
- TypeScript for type safety across the application
- Custom path aliases (`@/*`) for cleaner imports

**Styling System**:
- Tailwind CSS with custom theme configuration
- CSS variables for theming (coral #f77174, orange #eba977, navy #38385e/#20203e)
- Custom utility classes for animations, elevations, and transitions
- Responsive design with mobile-first approach
- Google Fonts integration (Nunito Sans, JetBrains Mono)

**Component Architecture**:
- Reusable UI components (Icon, Logo, SearchableSelect, AppImage)
- Feature-specific components organized by route
- Common components (Header, Footer, SearchInterface, AuthStatusIndicator)
- Modal components for user interactions
- Custom hooks for shared logic (useInfiniteScroll)

**State Management**:
- React Context API for global authentication state (AuthContext)
- Local component state using useState
- Derived state with useMemo for performance optimization
- URL-based state via Next.js searchParams for shareable views

### Backend Integration

**Database**: Supabase PostgreSQL
- Relational database with three main tables:
  - `user_profiles`: User accounts with role-based access (system_admin, user)
  - `scoreboards`: Scoreboard metadata with ownership and visibility controls
  - `scoreboard_entries`: Individual entries with name, score, and ranking data
- TypeScript database types generated from Supabase schema

**Authentication**:
- Supabase Auth with email/password authentication
- Server-side session management via middleware
- Cookie-based session persistence
- Protected routes using middleware pattern
- Role-based access control (system admin vs regular users)

**Real-time Updates**:
- Supabase Realtime for live scoreboard updates
- Automatic refresh when entries are modified
- Optimized for TV display scenarios with minimal flash/flickering
- Separate load patterns for initial vs. incremental updates

**API Communication**:
- Service layer pattern (scoreboardService, profileService)
- Type-safe API calls with TypeScript interfaces
- Error handling with user-friendly messages
- Pagination support with infinite scroll capability

### Key Architectural Decisions

**Server-Side Rendering (SSR)**:
- **Problem**: Need for SEO-friendly pages and faster initial page loads
- **Solution**: Next.js 14 App Router with SSR for public pages
- **Rationale**: Improves discoverability and performance for public scoreboards while maintaining interactivity

**Infinite Scroll Implementation**:
- **Problem**: Large scoreboard lists causing performance issues
- **Solution**: Custom useInfiniteScroll hook with IntersectionObserver
- **Details**: 30 items per page, server-side pagination, 300ms debounced search
- **Pros**: Better performance, reduced server load, smooth user experience
- **Cons**: More complex state management, requires careful loading state handling

**Middleware Authentication**:
- **Problem**: Session management across client and server components
- **Solution**: Supabase SSR with middleware.ts for session handling
- **Details**: Cookie-based session with automatic refresh, avoiding circular dependencies
- **Pros**: Seamless auth across app, server and client compatibility
- **Cons**: Additional middleware complexity, careful cookie management required

**Service Layer Pattern**:
- **Problem**: Scattered API logic and duplicate code across components
- **Solution**: Centralized service modules (scoreboardService, profileService)
- **Pros**: Single source of truth, easier testing, consistent error handling
- **Alternatives Considered**: Direct Supabase calls in components (rejected due to code duplication)

**Component-Based Modals**:
- **Problem**: Need for user confirmations and forms without route navigation
- **Solution**: Dedicated modal components with local state management
- **Pros**: Better UX, no route changes, easy to reuse
- **Cons**: Manage multiple modal states in parent components

**Real-time Update Strategy**:
- **Problem**: Multiple devices viewing same scoreboard need live updates
- **Solution**: Supabase Realtime subscriptions with optimistic UI updates
- **Details**: Load-only-entries pattern to prevent flash on updates
- **Pros**: True real-time collaboration, minimal perceived latency
- **Cons**: Connection management complexity, potential race conditions

**CSV Import Feature**:
- **Problem**: Bulk entry creation for large competitions
- **Solution**: Client-side CSV parsing with validation
- **Pros**: No server processing needed, instant feedback
- **Cons**: Limited to browser memory constraints

### External Dependencies

**Core Framework Dependencies**:
- `next@14.2.0` - React framework with App Router
- `react@18.2.0` & `react-dom@18.2.0` - UI library
- `typescript@^5` - Type safety and developer experience

**Supabase Integration**:
- `@supabase/supabase-js@^2.86.0` - Supabase client library
- `@supabase/ssr@^0.8.0` - Server-side rendering support
- `@supabase/auth-helpers-nextjs@^0.15.0` - Next.js authentication helpers
- **Purpose**: PostgreSQL database, authentication, and real-time subscriptions
- **Configuration**: Environment variables (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)

**UI Component Libraries**:
- `@headlessui/react@^2.2.9` - Unstyled accessible UI components (Combobox, transitions)
- `@heroicons/react@^2.2.0` - Icon library (outline and solid variants)
- `tailwindcss@3.4.6` - Utility-first CSS framework
- `@tailwindcss/forms@^0.5.10` - Form styling plugin
- `@tailwindcss/typography@^0.5.16` - Typography plugin
- `tailwindcss-animate@^1.0.7` - Animation utilities

**Charting & Visualization**:
- `recharts@^2.15.2` - React charting library (for potential analytics features)

**Development Tools**:
- `eslint@^9` with Next.js config and TypeScript support
- `prettier@^3.5.3` - Code formatting
- `autoprefixer@10.4.2` & `postcss@8.4.8` - CSS processing

**Deployment Configuration**:
- Custom Next.js server binding to `0.0.0.0:5000` for Replit proxy compatibility
- Cache-Control headers to prevent caching issues
- Build optimization for production deployment