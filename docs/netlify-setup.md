# Netlify Setup Guide

This guide walks through deploying Scoreboard Manager to Netlify using the existing `netlify.toml` configuration.

## Prerequisites

- A Netlify account
- A Supabase project
- Environment variables ready (see `.env.example`)

## Recommended Flow

1. **Fork or clone the repo** and push it to GitHub.
2. **Create a new site on Netlify** and connect the GitHub repository.
3. **Netlify will read `netlify.toml` automatically** and apply build settings.

## Build Settings (from `netlify.toml`)

- Build command: `npm run build:prod`
- Publish directory: `.next`
- Node version: `20`

Netlify contexts override the build command for production and previews:

- **Production**: Runs Supabase migrations before build
- **Deploy Preview / Branch Deploy**: Skips migrations

## Required Environment Variables

Configure these in Netlify → Site settings → Environment variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY`
- `SUPABASE_PROJECT_REF`
- `SUPABASE_ACCESS_TOKEN` (required for production migrations)
- `SUPABASE_DB_PASSWORD` (required for production migrations)
- `NEXT_PUBLIC_SITE_URL` (set per environment)

For manual Supabase setup steps, see [supabase-manual-setup.md](supabase-manual-setup.md).

## Production Migrations

The production context runs:

- `npx supabase link --project-ref "$SUPABASE_PROJECT_REF"`
- `npx supabase db push`

This requires valid Supabase credentials in Netlify environment variables.

## Deploy Preview Notes

Deploy previews and branch deploys skip migrations by default. Use this for testing and staging changes without affecting production.

## Troubleshooting

- **Build fails with missing env vars**: Ensure all required variables are set in Netlify.
- **Migration failures**: Double-check Supabase project ref, access token, and database password.
- **Preview build errors**: Confirm `NODE_VERSION=20` is applied.
