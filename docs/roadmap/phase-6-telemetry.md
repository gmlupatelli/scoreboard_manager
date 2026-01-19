# Phase 6 — Telemetry & Observability (Telemetry / Logging)

**Priority:** 🔴 High

## Goal
Add robust telemetry, error reporting, and observability so we can monitor production health, capture One‑Tap/OAuth errors, and understand auth adoption and failure patterns.

## Why this matters
- Quickly detect and debug production sign-in issues (OAuth redirects, One‑Tap failures, PKCE/code exchange errors).
- Measure adoption and UX for Google One‑Tap vs button sign-in.
- Gain actionable alerts for outages, auth errors, and critical failures.

## Deliverables
- Integrate Sentry (or chosen provider) for error reporting (client + server) and breadcrumbs.
- Add server-side logging for critical auth flows (auth callback errors, exchange failures).
- Add telemetry events for One‑Tap lifecycle (initialize, prompt shown, prompt dismissed, sign-in success, sign-in failure) and OAuth flow errors (redirect mismatch, token exchange errors, provider errors).
- Dashboard and alerting: create a couple of dashboards for auth errors and set basic alerts (e.g., increase in `auth_callback_error` rate, repeated `signInWithIdToken` failures).
- Privacy and PII: ensure logs do not contain tokens or emails — log only non-PII metadata plus correlation ids.

## Implementation notes
- Use Sentry or similar for exceptions; use custom events/metrics for auth flow counters.
- Add a simple server endpoint to receive optional non-sensitive logs if no third-party tool is chosen.
- Add instrumentation points in: `src/components/auth/GoogleOneTap.tsx`, `src/components/auth/GoogleSignInButton.tsx`, `src/app/auth/callback/route.ts`, `src/contexts/AuthContext.tsx`.

## Timeline / Phases
1. Proof of concept: Sentry client on login page + server errors captured in callbacks.
2. Add One‑Tap event telemetry + counters.
3. Build dashboards and alerts for auth error spikes.
4. Iterate on metrics and logging fields (add correlation ids where useful).

## Acceptance criteria
- Errors from sign-in and callback are visible in Sentry within 5 minutes of occurrence.
- Dashboard displays One‑Tap adoption (impressions vs sign-ins) and overall OAuth success rate.
- Alerts trigger when sign-in failure rate exceeds a defined threshold.

**Note:** Per your instruction, we will *not implement telemetry immediately*. This Phase 6 item has been added to the roadmap so we can prioritize and schedule it later.