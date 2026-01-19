# Netlify Environment Variables (Scoreboard Manager)

This guide lists all environment variables used by Scoreboard Manager, what they do, and where to set them in Netlify (Build / Functions / Runtime contexts). It includes both public values (safe to expose to client code) and secrets (server-only).

> NOTE: Never commit real secrets to the repository. Use the Netlify UI (Site settings → Build & deploy → Environment) or a secret manager.

---

## How Netlify contexts work

- **Production**: values used for production builds & runtime.
- **Deploy Previews**: values used for preview deploys (pull/PR previews).
- **Branch deploys**: values used when building branches.
- **Preview Server & Agent Runners**: used by Netlify's preview runner services.
- **Local development (Netlify CLI)**: you can add values locally by copying `.env.example` to `.env.local` (or use `netlify dev` with env substitution).

Set variables as: **Build, Functions, Runtime** when those variables are needed at build time, inside serverless functions, and during runtime request handlers.

---

## Recommended Netlify environment variables

| Variable | Purpose | Scope (set in Netlify) | Secret? | Recommended contexts to set |
| --- | --- | --- | --- | --- |
| NEXT_PUBLIC_GOOGLE_CLIENT_ID | Google OAuth web client id (public) — used by One‑Tap and client-side Google libs | Build, Functions, Runtime | No (public) | Production, Deploy Previews, Branch deploys, Preview Server |
| NEXT_PUBLIC_ENABLE_GOOGLE_ONE_TAP | Toggle for enabling Google One‑Tap on the client (true/false) | Build, Runtime | No | **Set to `true` in Production + Deploy Previews + Branch deploys + Preview Server** if you want One‑Tap enabled in all contexts. Leave `false` locally or omit to disable. |
| NEXT_PUBLIC_SUPABASE_URL | Supabase project URL (public) | Build, Functions, Runtime | No (public) | All contexts; set to project URL per environment |
| NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY | Supabase publishable/anon key (used in client) | Build, Functions, Runtime | No (public) | All contexts |
| SUPABASE_SECRET_KEY | Supabase Secret (service role / secret key) | Build, Functions, Runtime | Yes **(keep secret)** | Production, Deploy Previews (optional), Branch deploys (optional) |
| SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_SECRET | Google OAuth Client Secret used by Supabase provider (server-only) | Build, Functions, Runtime | Yes | Production, Deploy Previews, Branch deploys |
| SUPABASE_ACCESS_TOKEN | Supabase CLI personal access token (used for migrations & CI) | Build | Yes | Production (CI), Deploy Previews (optional) |
| SUPABASE_DB_PASSWORD | Supabase DB password (for migration tasks) | Build, Functions, Runtime | Yes | Production, Previews (if needed) |
| SUPABASE_PROJECT_REF | Supabase project ref id (use per-environment values) | Build, Functions, Runtime | Yes/No | Set to different values per deploy contexts (prod vs dev) |
| TEST_CLEANUP_API_KEY | API key used by Playwright / E2E to clean test data | Build, Functions, Runtime | Yes | Only E2E contexts (Preview Server or CI) |
| SECRETS_SCAN_OMIT_KEYS | Utility: keys to omit from automated secret scanning | All scopes | No | Set to your organization preference |
| NEXT_PUBLIC_SENTRY_DSN (optional) | Sentry DSN for client reporting | Build, Functions, Runtime | Yes (partial public) | Production (set to Sentry DSN) |

---

## Example: What to set in each context

- **Production**: Set all runtime secrets (SUPABASE_SECRET_KEY, SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_SECRET, SUPABASE_DB_PASSWORD) and public keys (NEXT_PUBLIC_*).
- **Deploy Previews / Branch Deploys**: Set public keys and any secrets required for preview functionality. Consider redacting or using development/test-only values for secrets.
- **Preview Server & Agent Runners**: Useful for preview builds that need DB access; set the same values as Deploy Previews.
- **Local development (Netlify CLI)**: Use `.env.local` or your local secret manager.

---

## How to add variables in Netlify UI

1. Go to `Site settings` → `Build & deploy` → `Environment` → `Environment variables` → `Add variable`.
2. Enter the **Name** and **Value** and choose the appropriate deploy contexts.
3. For secrets (service keys), mark them as masked/secret (Netlify masks values by default) and keep usage minimal.
4. After adding or updating, trigger a new deploy (clear cache and redeploy when necessary).

---

## Security best-practices

- Rotate `SUPABASE_SECRET_KEY` and Google client secret if accidentally exposed. Use Google Cloud Secret Manager for production.
- Avoid using production secrets in branch previews unless necessary for proper testing. Use test-specific credentials if possible.
- Keep `NEXT_PUBLIC_*` variables strictly public and free of sensitive values.

---

## Quick checklist for adding Google OAuth variables to Netlify

- [ ] Add `NEXT_PUBLIC_GOOGLE_CLIENT_ID` to Build/Runtime contexts for the site.
- [ ] Add `SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_SECRET` to the secret store (Build/Functions/Runtime) for the site.
- [ ] (Optional) Add `NEXT_PUBLIC_ENABLE_GOOGLE_ONE_TAP=true` to enable One‑Tap for the site if you choose to enable it.
- [ ] Trigger a site redeploy after adding the vars.

## Post-deploy testing checklist for Google OAuth / One‑Tap

- [ ] Visit `/login` and `/register` on the deployed site and verify the `Sign in with Google` button initiates the OAuth flow.
- [ ] If `NEXT_PUBLIC_ENABLE_GOOGLE_ONE_TAP=true`, verify the One‑Tap prompt appears for users who are eligible; check browser console for any `gsi` or origin errors.
- [ ] Complete a sign-in and verify the redirect to `/auth/callback` then onward to the Dashboard or target page.
- [ ] If you encounter `redirect_uri_mismatch`, confirm the exact callback URIs in the Google Cloud Console match the deployed origins.
- [ ] Confirm the Google provider is enabled in the Supabase Authentication settings and that the Client ID / Client Secret values match what you set in Netlify.

---

If you want, I can also produce a one‑click checklist for adding the exact values to the Netlify UI (copy/paste-ready values) or prepare a minimal CI secret injection script for secure deployments.