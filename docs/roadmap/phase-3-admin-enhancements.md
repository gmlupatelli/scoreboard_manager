# Phase 3: Admin Enhancements

**Priority:** 🟡 Medium  
**Status:** ✅ Complete  
**Estimated Effort:** Small (3-5 days)

## Overview

Enhance the admin subscription management page with a user detail modal that provides comprehensive information about individual users, their subscription history, and scoreboard activity.

## Goals

- **Consolidated User View**: Single modal showing all user information
- **Subscription History**: Paginated payment history for each user
- **Scoreboard Activity**: Quick view of user's scoreboards with links
- **Avoid Duplication**: Enhance existing subscription page instead of creating new user management page

## Background

The current subscription management page (`/system-admin/subscriptions`) shows:
- User email, name, role
- Subscription status, tier, amount
- Actions: Link, Gift, Cancel, Refetch

This phase adds a **"Details" button** to each row that opens a comprehensive modal with deeper user information.

## Implementation Summary

### Files Created

| File | Purpose |
|------|---------|
| `src/app/system-admin/subscriptions/types.ts` | Shared types for `UserSubscription`, `FilterType`, and all user details API response types |
| `src/app/api/admin/users/[userId]/details/route.ts` | Admin-only API endpoint returning comprehensive user data |
| `src/app/system-admin/subscriptions/components/UserDetailsModal.tsx` | Tabbed modal component with Profile, Payments, Scoreboards, Activity tabs |

### Files Modified

| File | Change |
|------|--------|
| `src/app/system-admin/subscriptions/components/SubscriptionsInteractive.tsx` | Imports shared types, adds Details button (first action), renders `UserDetailsModal` |
| `src/app/system-admin/subscriptions/components/CancelConfirmModal.tsx` | Imports `UserSubscription` from shared types instead of defining locally |
| `src/app/system-admin/subscriptions/components/GiftTierModal.tsx` | Imports `UserSubscription` from shared types instead of defining locally |
| `src/app/system-admin/subscriptions/components/LinkAccountModal.tsx` | Imports `UserSubscription` from shared types instead of defining locally |
| `src/services/subscriptionService.ts` | Added `getUserDetailsAdmin()` method with section-based fetching |

---

### Shared Types (`types.ts`)

Extracted `UserSubscription` and `FilterType` from `SubscriptionsInteractive.tsx` to eliminate duplication across 4 component files. Added API response types:
- `UserDetailsResponse` — top-level response shape
- `UserDetailsProfile` — profile with auth metadata (emailVerified, lastSignInAt)
- `UserDetailsSubscription` — subscription with card info (cardBrand, cardLastFour)
- `ScoreboardSummary` — scoreboard with entry count
- `AuditLogEntry` — audit log with admin info
- `PaginationMeta` — shared pagination shape

---

### API Endpoint

**`GET /api/admin/users/[userId]/details`**

Auth: Bearer token + `system_admin` role verification.

**Query params:**
- `section` — `'all'` (default) | `'payments'` | `'scoreboards'` | `'auditLog'` — controls what data is returned
- `paymentsPage` / `scoreboardsPage` / `auditLogPage` — pagination (default: 1, 10 per page)

When `section=all` (initial load), the endpoint fetches profile + auth metadata + subscription in parallel, then fetches payments + scoreboards + audit log in a second parallel batch. When a specific section is given (for "Load More"), only that section is fetched — avoiding unnecessary DB queries.

**Data sources:**
- `user_profiles` — profile info
- `supabase.auth.admin.getUserById()` — email_confirmed_at, last_sign_in_at
- `subscriptions` — latest subscription with card info
- `payment_history` — paginated, ordered by created_at DESC
- `scoreboards` with `scoreboard_entries(count)` — paginated
- `admin_audit_log` filtered by `target_user_id` — paginated, with admin email/name join

---

### Tabbed Modal Component

**Layout:** Fixed overlay (`z-[1100]`), 800px max-width, `max-h-[90vh]` with flex column layout:
- **Header** (fixed): user name/email, role badge, tier badge, close button
- **Tab bar** (fixed): Profile, Payments, Scoreboards, Activity — with icons, responsive (icons only on mobile)
- **Content** (scrollable): renders active tab panel

**Tabs:**
1. **Profile** — account info grid (email, name, role, created, last sign-in, email verified) + subscription summary (status, tier, billing, card info)
2. **Payments** — data table (date, product, amount, status badge, receipt link) + Load More
3. **Scoreboards** — data table (title as link → new tab, visibility badge, entry count, created) + Load More
4. **Activity** — data table (date, action label, admin email, details summary) + Load More

**Keyboard:** Escape key closes modal. Backdrop click closes modal.

---

### Details Button

Added as the **first action button** in each subscription table row (before Link, Refetch, Gift, Cancel). Uses `InformationCircleIcon` at size 18 with blue hover state, matching the existing button pattern. Tooltip: "View user details".

---

## Database Schema

No new tables or migrations required. Uses existing tables:
- `user_profiles`
- `subscriptions`
- `payment_history`
- `scoreboards`
- `scoreboard_entries` (for count)
- `admin_audit_log` (filtered by `target_user_id`, column + index already exist)

## Resolved Open Questions

- **Audit log entries**: ✅ Included — Activity tab shows admin actions targeting this user
- **Invitation history**: Not included — can be added in a future iteration
- **CSV export for payment history**: Not included — future enhancement
- **Locked scoreboards count**: Not included — visible indirectly via scoreboard list

## Related Issues

- Depends on: Phase 1e (Admin Management) - ✅ Complete
- Related to: Phase 3 (Supporter Recognition) - Profile info reuse
- Future: Could extend to show usage analytics per user
