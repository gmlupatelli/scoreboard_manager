# Scoreboard Manager - Replit Project

## Overview
A modern Next.js 14 scoreboard management application with TypeScript, Tailwind CSS, and Supabase authentication. This app provides a comprehensive platform for creating, managing, and viewing scoreboards with real-time updates.

## Project Status
- **Current State**: Fully configured and running on Replit
- **Last Updated**: November 29, 2025
- **Framework**: Next.js 14.2.0 with React 18.2.0
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth with SSR support

## Recent Changes
### November 29, 2025 - Infinite Scrolling Implementation
- Added paginated service functions with limit/offset support (30 items per page)
- Created reusable `useInfiniteScroll` hook with IntersectionObserver
- Implemented infinite scrolling in PublicScoreboardInteractive component
- Implemented infinite scrolling in AdminDashboardInteractive component
- Added "X of Y items loaded" stats display
- Fixed observer re-attachment issue using state-based node tracking

### November 29, 2025 - Initial Replit Setup
- Installed Node.js dependencies
- Fixed middleware.ts circular dependency by implementing proper Supabase SSR middleware
- Implemented server-side Supabase client with cookie-aware authentication
- Configured Next.js to run on 0.0.0.0:5000 for Replit proxy compatibility
- Added Cache-Control headers to prevent caching issues in Replit's iframe proxy
- Set up workflow for Next.js Dev Server on port 5000
- Configured deployment settings for autoscale deployment

## Project Architecture

### Frontend
- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS with custom theme
- **Components**: React components with TypeScript
- **State Management**: React Context (AuthContext)

### Backend Integration
- **Database**: Supabase PostgreSQL
- **Authentication**: Supabase Auth with email/password
- **Session Management**: Server-side session handling with middleware

### Key Features
1. Public scoreboard browsing
2. User authentication (login/register)
3. Scoreboard creation and management
4. Admin dashboard
5. User profile management
6. CSV import for scoreboard entries

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
│   ├── components/       # Reusable UI components
│   ├── contexts/         # React contexts (AuthContext)
│   ├── lib/              # Library code (Supabase clients)
│   ├── services/         # API services
│   ├── types/            # TypeScript type definitions
│   └── utils/            # Utility functions
├── public/               # Static assets
├── supabase/             # Database migrations
└── middleware.ts         # Next.js middleware for auth
```

## Database Schema
The Supabase database includes:
- `user_profiles` - User profile information
- `scoreboards` - Scoreboard metadata
- `scoreboard_entries` - Individual scoreboard entries
- Row Level Security (RLS) policies for secure data access

## Notes
- The application uses Supabase for both authentication and data storage
- Middleware handles session refresh on every request
- The app is configured to work with Replit's proxy environment
- Cache-Control headers prevent stale content in the iframe proxy
