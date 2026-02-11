# Phase 2: Supporter Recognition

**Priority:** 🔴 High  
**Status:** Not Started  
**Estimated Effort:** Medium (1-2 weeks)

## Overview

Build a public supporters recognition system that displays active supporters on the `/supporters` page with privacy controls. Replace the post-checkout toast with an onboarding modal that collects supporter preferences.

## Goals

- **Public Recognition**: Display supporters by tier on a public page
- **Privacy Control**: Allow supporters to opt-out or customize their display name
- **Onboarding Experience**: Welcome new supporters with a modal that sets preferences
- **Content Moderation**: Prevent inappropriate display names

## Background

Database fields already exist:
- `subscriptions.show_on_supporters_page` (BOOLEAN, default true)
- `subscriptions.supporter_display_name` (TEXT, nullable)
- `user_profiles.full_name` (TEXT, general account name)

The distinction:
- `full_name`: Internal account display name (used in dashboard, header, admin views)
- `supporter_display_name`: Public-facing name for supporters page (optional, for privacy)

## Implementation Tasks

### Issue 3.1: Welcome Modal Component

**Description**: Create a modal that appears after successful LemonSqueezy checkout, replacing the current toast notification.

**Acceptance Criteria:**
- [ ] Modal shows when user returns to dashboard with `?subscription=success` query param
- [ ] Modal displays "Welcome, Supporter!" heading with tier badge
- [ ] Two form fields:
  - Display name input (pre-filled with `full_name` from user profile)
  - "Show me on supporters page" checkbox (default: checked)
- [ ] "Continue to Dashboard" button saves preferences and closes modal
- [ ] "Skip for now" link closes modal without saving (uses defaults)
- [ ] Modal cannot be dismissed by clicking outside (must use buttons)
- [ ] Form validates display name before submission
- [ ] Success/error messages shown inline

**Technical Notes:**
- Location: `src/app/dashboard/components/WelcomeModal.tsx`
- Trigger logic: Update `AdminDashboardInteractive.tsx` line 119-145 (current subscription refresh code)
- API call: New endpoint `PATCH /api/user/supporter-preferences`
- Clear query param after modal shown to prevent re-trigger
- Use existing modal pattern (see `CreateScoreboardModal.tsx`)

**UI/UX:**
- Center modal, max-width 600px
- Include illustration or confetti animation
- Show benefits of being listed: "Your support will be visible to all users"
- Display name character limit: 50 characters
- Real-time character counter

---

### Issue 3.2: Display Name Validation (Server-Side)

**Description**: Add profanity filtering and content moderation for supporter display names.

**Acceptance Criteria:**
- [ ] Install `bad-words` npm package (MIT license)
- [ ] Server-side validation in API endpoint
- [ ] Client shows error message if display name contains profanity
- [ ] Validation runs on both initial submission (welcome modal) and profile updates
- [ ] Error message: "Display name contains inappropriate language. Please choose another name."
- [ ] Allow empty display name (falls back to `full_name`)

**Technical Notes:**
```typescript
// Install package
npm install bad-words

// API validation
import Filter from 'bad-words';
const filter = new Filter();

if (displayName && filter.isProfane(displayName)) {
  return NextResponse.json(
    { error: 'Display name contains inappropriate language' },
    { status: 400 }
  );
}
```

**Edge Cases:**
- Handle false positives with optional whitelist if needed
- Trim and normalize input (remove extra spaces)
- Prevent excessively long names (max 50 chars)
- Prevent names that are just spaces or special characters

---

### Issue 3.3: Supporter Preferences API Endpoint

**Description**: Create API endpoint to update supporter preferences.

**File:** `src/app/api/user/supporter-preferences/route.ts`

**Request Body:**
```typescript
{
  showOnSupportersPage: boolean;
  supporterDisplayName?: string | null;
}
```

**Acceptance Criteria:**
- [ ] `PATCH /api/user/supporter-preferences` endpoint created
- [ ] Validates user authentication (JWT token)
- [ ] Validates display name (profanity filter)
- [ ] Updates `subscriptions` table columns:
  - `show_on_supporters_page`
  - `supporter_display_name`
- [ ] Returns updated subscription object
- [ ] Returns 401 if not authenticated
- [ ] Returns 400 if validation fails
- [ ] Returns 404 if user has no active subscription

**Technical Notes:**
- Use `getAuthClient()` from `@/lib/supabase/apiClient`
- Update only the user's own subscription (filter by `user_id`)
- Log changes to `admin_audit_log` if supporter becomes hidden/visible
- Handle case where user has multiple subscriptions (update most recent active one)

---

### Issue 3.4: Profile Settings - Supporter Section

**Description**: Add supporter preferences section to user profile settings page.

**Location:** `src/app/user-profile-management/components/SupporterSection.tsx`

**Acceptance Criteria:**
- [ ] New section appears in profile page (only if user is active supporter)
- [ ] Shows current tier badge
- [ ] Two editable fields:
  - Public display name (input)
  - "Show me on supporters page" (toggle switch)
- [ ] Edit/Save/Cancel buttons with loading states
- [ ] Displays current values from subscription
- [ ] Info text: "Your display name will appear on the public supporters page"
- [ ] Link to view supporters page: "Preview supporters page →"
- [ ] Save button validates display name before submission

**UI/UX:**
- Section appears after "Personal Information" and before "Subscription"
- Use same card styling as other sections
- Show tier badge next to section heading
- Display name placeholder: "Leave blank to use your account name"
- Toggle switch styled like existing UI patterns

**Technical Notes:**
- Fetch subscription via `subscriptionService.getSubscription()`
- Call new preferences API on save
- Refresh subscription context after successful update
- Show success toast: "Supporter preferences updated"

---

### Issue 3.5: Public Supporters List Page

**Description**: Transform `/supporters` page from static content to dynamic list of active supporters.

**File:** `src/app/supporters/page.tsx`

**Acceptance Criteria:**
- [ ] Page shows active supporters grouped by tier (Hall of Famer → Legend → Champion → Supporter)
- [ ] Within each tier, sort alphabetically by display name
- [ ] Display logic for names:
  1. Use `supporter_display_name` if set
  2. Else use `full_name` if set
  3. Else use email (first part before @)
- [ ] Only show users where `show_on_supporters_page = true` AND tier is not null
- [ ] Responsive grid layout (4 columns desktop, 2 mobile)
- [ ] Each supporter shown with:
  - Display name
  - Tier badge emoji
  - Join date (month + year, e.g., "Since Jan 2026")
- [ ] Empty state for tiers with no supporters
- [ ] Keep existing "Why support?" and benefits sections above the list

**Technical Notes:**
- New API endpoint: `GET /api/public/supporters`
- Server component (no auth required, public data)
- Query:
```sql
SELECT 
  u.full_name,
  s.supporter_display_name,
  s.tier,
  s.created_at
FROM user_profiles u
JOIN subscriptions s ON s.user_id = u.id
WHERE s.show_on_supporters_page = true
  AND s.tier IS NOT NULL
  AND s.status IN ('active', 'trialing')
ORDER BY 
  CASE s.tier 
    WHEN 'hall_of_famer' THEN 1
    WHEN 'legend' THEN 2
    WHEN 'champion' THEN 3
    WHEN 'supporter' THEN 4
  END,
  COALESCE(s.supporter_display_name, u.full_name) ASC
```

**UI/UX:**
- Tier sections with headings: "👑 Hall of Famers", "🌟 Legends", etc.
- Cards with elevation and hover effect
- Tier badge integrated into design
- Animate appearance on page load (stagger effect)
- Add "Become a supporter" CTA at bottom

---

### Issue 3.6: Remove Current Toast Notification

**Description**: Remove the existing toast notification that appears after checkout success.

**Files to Modify:**
- `src/app/dashboard/components/AdminDashboardInteractive.tsx` (lines 119-145)

**Changes:**
- Remove toast notification code
- Keep subscription refresh logic with retry
- Trigger welcome modal instead of toast
- Pass necessary data to modal (tier, subscription status)

---

## Database Schema

No new tables required. Existing schema already supports this feature:

```sql
-- subscriptions table (already exists)
CREATE TABLE subscriptions (
  -- ... other fields
  show_on_supporters_page BOOLEAN NOT NULL DEFAULT true,
  supporter_display_name TEXT,
  -- ... other fields
);
```

## API Endpoints

### New Endpoints

1. **PATCH /api/user/supporter-preferences**
   - Updates supporter display preferences
   - Auth required
   - Body: `{ showOnSupportersPage: boolean, supporterDisplayName?: string }`

2. **GET /api/public/supporters**
   - Returns list of supporters grouped by tier
   - Public endpoint (no auth)
   - Returns: `{ supporters: Supporter[] }`

## Testing Requirements

### Unit Tests
- [ ] Display name validation function (profanity filter)
- [ ] Display name fallback logic (supporter_display_name → full_name → email)

### Integration Tests
- [ ] Supporter preferences API endpoint (update, validation, auth)
- [ ] Supporters list API (filtering, sorting, data transformation)

### E2E Tests
- [ ] Welcome modal appears after checkout
- [ ] Modal saves preferences correctly
- [ ] Profile settings update supporter preferences
- [ ] Supporters page displays correct users
- [ ] Opt-out removes user from supporters page
- [ ] Invalid display names rejected (profanity)

## Dependencies

- `bad-words` npm package (MIT license)

## Migration Plan

No database migration required - fields already exist.

## Rollout Plan

1. **Phase 1**: Deploy welcome modal and preferences API (no public page yet)
2. **Phase 2**: Add profile settings section for supporters
3. **Phase 3**: Deploy public supporters list page
4. **Phase 4**: Monitor and adjust profanity filter as needed

## Success Metrics

- % of supporters who opt-in to public listing (target: >80%)
- % of supporters who customize their display name (target: 20-30%)
- Number of profanity filter rejections (should be low)
- User feedback on supporters page

## Open Questions

- [ ] Should we add a "supporter since" badge for long-term supporters?
- [ ] Should we show total number of supporters at top of page?
- [ ] Should we add supporter testimonials/messages?
- [ ] Should we allow supporters to add a personal website/social link?

## Related Issues

- Depends on: Phase 1b (LemonSqueezy Integration) - ✅ Complete
- Depends on: Phase 1d (Supporter Tiers) - ✅ Complete
- Related to: Future feature - Supporter badges on scoreboards
