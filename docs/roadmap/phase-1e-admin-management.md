# Phase 1e: Admin Management Pages

**Priority:** 🔴 High  
**Dependencies:** Phase 1b (LemonSqueezy Integration)  
**Estimated Scope:** Medium

## Overview

Create system admin pages for managing tiers, users, and subscriptions:

- **Tier Management** - Configure appreciation tier thresholds and limits
- **User Management** - View all users with subscription status
- **Gift Subscriptions** - Admin ability to grant free subscriptions

These pages are for `system_admin` users only.

---

## Issues

### Issue 1e.1: Create Tier Management Page

**Title:** Create admin page for managing appreciation tier configuration

**Description:**
Create an admin page at `/system-admin/tier-management` where admins can:

- View current tier thresholds
- Modify tier amount ranges
- Update tier names and badges
- Configure tier-based feature limits

**Acceptance Criteria:**

- [ ] Page at `/system-admin/tier-management`
- [ ] Requires `system_admin` role (useAuthGuard with role check)
- [ ] Display current tier configuration
- [ ] Edit tier thresholds (min/max amounts)
- [ ] Edit tier display (name, emoji badge)
- [ ] Edit tier limits (scoreboards, entries, snapshots)
- [ ] Validation (no overlapping ranges, min < max)
- [ ] Save changes to database
- [ ] Audit log of changes

**UI Layout:**

```
┌─────────────────────────────────────────────────────────────┐
│ Tier Management                                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ Free Tier                                            │    │
│  │ Amount: $0                                           │    │
│  │ Limits: 5 boards, 50 entries, 10 snapshots          │    │
│  │ [Edit Limits]                                        │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ 🙌 Supporter                                         │    │
│  │ Amount: $5.00 - $9.99/mo                            │    │
│  │ Limits: Unlimited                                    │    │
│  │ [Edit Range] [Edit Badge]                            │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ 🏆 Champion                                          │    │
│  │ Amount: $10.00 - $24.99/mo                          │    │
│  │ Limits: Unlimited                                    │    │
│  │ [Edit Range] [Edit Badge]                            │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ 🌟 Legend                                            │    │
│  │ Amount: $25.00 - $49.99/mo                          │    │
│  │ Limits: Unlimited                                    │    │
│  │ [Edit Range] [Edit Badge]                            │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ 👑 Hall of Famer                                     │    │
│  │ Amount: $50.00+/mo                                   │    │
│  │ Limits: Unlimited                                    │    │
│  │ [Edit Range] [Edit Badge]                            │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Database Schema:**

```sql
-- Add tier_configuration to system_settings
-- Store as JSONB for flexibility

ALTER TABLE system_settings
ADD COLUMN tier_configuration JSONB DEFAULT '{
  "free": {
    "maxScoreboards": 5,
    "maxEntriesPerScoreboard": 50,
    "maxSnapshotsPerScoreboard": 10
  },
  "supporter": {
    "minAmountCents": 500,
    "maxAmountCents": 999,
    "badge": "🙌",
    "displayName": "Supporter"
  },
  "champion": {
    "minAmountCents": 1000,
    "maxAmountCents": 2499,
    "badge": "🏆",
    "displayName": "Champion"
  },
  "legend": {
    "minAmountCents": 2500,
    "maxAmountCents": 4999,
    "badge": "🌟",
    "displayName": "Legend"
  },
  "hall_of_famer": {
    "minAmountCents": 5000,
    "maxAmountCents": null,
    "badge": "👑",
    "displayName": "Hall of Famer"
  }
}'::jsonb;
```

---

### Issue 1e.2: Create User Management Page

**Title:** Create admin page for viewing and managing users

**Description:**
Create an admin page at `/system-admin/user-management` where admins can:

- View all registered users
- See user subscription status
- Filter by subscription tier
- Search users by email/name
- View user details

**Acceptance Criteria:**

- [ ] Page at `/system-admin/user-management`
- [ ] Requires `system_admin` role
- [ ] Paginated user list
- [ ] Columns: Name, Email, Role, Subscription Status, Tier, Created
- [ ] Filter dropdown for tier (Free, Supporter, Champion, etc.)
- [ ] Search by email or name
- [ ] Click row to view user details
- [ ] Sort by any column
- [ ] Export to CSV (optional)

**UI Layout:**

```
┌─────────────────────────────────────────────────────────────────────────┐
│ User Management                                                          │
├─────────────────────────────────────────────────────────────────────────┤
│ [Search: _______________] [Tier: All ▼] [Status: All ▼] [Export CSV]    │
├─────────────────────────────────────────────────────────────────────────┤
│ Name          │ Email              │ Tier       │ Status   │ Created    │
├───────────────┼────────────────────┼────────────┼──────────┼────────────┤
│ John Doe      │ john@example.com   │ 🏆 Champion│ Active   │ 2025-01-01 │
│ Jane Smith    │ jane@example.com   │ Free       │ -        │ 2025-01-02 │
│ Bob Wilson    │ bob@example.com    │ 🙌 Supporter│ Active   │ 2025-01-03 │
│ Alice Brown   │ alice@example.com  │ 🌟 Legend  │ Cancelled│ 2025-01-04 │
├───────────────┴────────────────────┴────────────┴──────────┴────────────┤
│ Showing 1-25 of 142 users                             [< 1 2 3 4 5 6 >] │
└─────────────────────────────────────────────────────────────────────────┘
```

**API Endpoint:**

```typescript
// GET /api/admin/users
// Query params: page, limit, search, tier, status, sortBy, sortOrder

interface AdminUserListResponse {
  users: AdminUserView[];
  totalCount: number;
  page: number;
  totalPages: number;
}

interface AdminUserView {
  id: string;
  email: string;
  fullName: string | null;
  role: 'user' | 'system_admin';
  createdAt: string;
  subscription: {
    status: 'active' | 'cancelled' | 'past_due' | null;
    tier: 'supporter' | 'champion' | 'legend' | 'hall_of_famer' | null;
    currentPeriodEnd: string | null;
  } | null;
  stats: {
    scoreboardCount: number;
    totalEntries: number;
  };
}
```

---

### Issue 1e.3: Create User Detail View

**Title:** Create admin view for individual user details

**Description:**
Create a detail view (modal or page) showing:

- Full user profile
- Subscription history
- Scoreboards owned
- Activity summary
- Admin actions (gift subscription, change role)

**Acceptance Criteria:**

- [ ] Accessible from user management list
- [ ] Shows complete user profile
- [ ] Shows subscription history (all past subscriptions)
- [ ] Shows scoreboard count and list
- [ ] Shows recent activity
- [ ] Action buttons for admin operations
- [ ] Breadcrumb navigation back to list

**UI Layout:**

```
┌─────────────────────────────────────────────────────────────┐
│ ← Back to User Management                                    │
├─────────────────────────────────────────────────────────────┤
│ John Doe                                      [Gift Sub ▼]  │
│ john@example.com                              [Change Role] │
│ Member since: January 1, 2025                               │
├─────────────────────────────────────────────────────────────┤
│ SUBSCRIPTION                                                 │
│ ─────────────────────────────────────────────────────────── │
│ Current: 🏆 Champion ($15/month)                            │
│ Status: Active                                               │
│ Next billing: February 1, 2025                              │
│ Member since: January 5, 2025                               │
│                                                              │
│ History:                                                     │
│ • Jan 5, 2025 - Upgraded to Champion ($15/mo)              │
│ • Jan 5, 2025 - Started as Supporter ($5/mo)               │
├─────────────────────────────────────────────────────────────┤
│ SCOREBOARDS (3)                                              │
│ ─────────────────────────────────────────────────────────── │
│ • Weekly Gaming League (45 entries)                         │
│ • Office Pool 2025 (12 entries)                             │
│ • Fantasy Football (10 entries)                             │
├─────────────────────────────────────────────────────────────┤
│ ACTIVITY                                                     │
│ ─────────────────────────────────────────────────────────── │
│ Last login: 2 hours ago                                     │
│ Scoreboards created: 3                                       │
│ Total entries: 67                                            │
└─────────────────────────────────────────────────────────────┘
```

---

### Issue 1e.4: Implement Gift Subscription Feature

**Title:** Allow admins to gift subscriptions to users

**Description:**
Allow system admins to grant free subscription access to users:

- Select a tier to grant
- Set duration (1 month, 3 months, 1 year, lifetime)
- Optional internal note (reason for gift)
- Does not involve LemonSqueezy (purely internal)

**Acceptance Criteria:**

- [ ] "Gift Subscription" button on user detail page
- [ ] Modal to select tier and duration
- [ ] Optional note field for admin
- [ ] Creates subscription record with `source: 'gift'`
- [ ] Sets appropriate expiration date
- [ ] User immediately gains Supporter benefits
- [ ] Audit log entry created
- [ ] Email notification to user (optional toggle)

**UI Layout:**

```
┌─────────────────────────────────────────┐
│ Gift Subscription                        │
├─────────────────────────────────────────┤
│ User: John Doe (john@example.com)       │
│                                          │
│ Tier: [Supporter ▼]                      │
│                                          │
│ Duration:                                │
│ ○ 1 month                               │
│ ○ 3 months                              │
│ ○ 1 year                                │
│ ○ Lifetime                              │
│                                          │
│ Note (optional):                         │
│ ┌─────────────────────────────────────┐ │
│ │ Beta tester thank you gift          │ │
│ └─────────────────────────────────────┘ │
│                                          │
│ ☑ Send email notification to user       │
│                                          │
│ [Cancel]                    [Gift Sub]   │
└─────────────────────────────────────────┘
```

**Database Changes:**

```sql
-- Add source field to subscriptions table (if not already present)
ALTER TABLE subscriptions
ADD COLUMN source TEXT NOT NULL DEFAULT 'lemonsqueezy'
CHECK (source IN ('lemonsqueezy', 'gift', 'promotional'));

-- Add admin_note for gift subscriptions
ALTER TABLE subscriptions
ADD COLUMN admin_note TEXT;

-- Add gifted_by for tracking who granted the gift
ALTER TABLE subscriptions
ADD COLUMN gifted_by UUID REFERENCES user_profiles(id);
```

**API Endpoint:**

```typescript
// POST /api/admin/users/:userId/gift-subscription
interface GiftSubscriptionRequest {
  tier: 'supporter' | 'champion' | 'legend' | 'hall_of_famer';
  durationMonths: number | null; // null = lifetime
  note?: string;
  sendEmail: boolean;
}
```

---

### Issue 1e.5: Create Admin Audit Log

**Title:** Create audit log for admin actions

**Description:**
Track all admin actions for accountability:

- Gift subscriptions granted
- Tier configuration changes
- User role changes
- Any destructive admin actions

**Acceptance Criteria:**

- [ ] `admin_audit_log` table created
- [ ] All admin actions logged automatically
- [ ] Log includes: admin user, action type, target, details, timestamp
- [ ] Viewable audit log page for admins
- [ ] Filterable by action type and date range
- [ ] Cannot be deleted (append-only)

**Database Schema:**

```sql
CREATE TABLE admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES user_profiles(id),
  action_type TEXT NOT NULL,
  target_type TEXT,  -- 'user', 'subscription', 'tier_config', etc.
  target_id TEXT,    -- ID of affected entity
  details JSONB,     -- Action-specific details
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for common queries
CREATE INDEX idx_audit_log_admin ON admin_audit_log(admin_id);
CREATE INDEX idx_audit_log_action ON admin_audit_log(action_type);
CREATE INDEX idx_audit_log_created ON admin_audit_log(created_at DESC);

-- RLS: Only system_admins can view, nobody can delete
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY admin_audit_log_select ON admin_audit_log
  FOR SELECT
  USING (is_system_admin());

-- No UPDATE or DELETE policies = append-only
```

**Action Types:**

- `gift_subscription_created`
- `gift_subscription_revoked`
- `user_role_changed`
- `tier_config_updated`
- `user_deleted`

---

### Issue 1e.6: Add Admin Navigation

**Title:** Add admin pages to system admin navigation

**Description:**
Update the existing system admin navigation to include new pages:

- Tier Management
- User Management
- Audit Log

**Acceptance Criteria:**

- [ ] Navigation links added to admin sidebar/header
- [ ] Active state shown for current page
- [ ] Icons for each section
- [ ] Consistent with existing admin UI

**Files to Update:**

- `src/app/system-admin/layout.tsx` or equivalent
- Add navigation items for new pages

---

## Testing Considerations

- [ ] Non-admin users cannot access any admin pages (403)
- [ ] Tier configuration changes apply correctly
- [ ] Gift subscriptions grant correct access
- [ ] Audit log captures all admin actions
- [ ] User search and filters work correctly
- [ ] Pagination works on user list
- [ ] Gift subscription expiration is calculated correctly
- [ ] Lifetime gifts never expire

---

## Security Considerations

1. **Role Verification** - Double-check role on both client and server
2. **Audit Everything** - Log all administrative actions
3. **Rate Limiting** - Prevent bulk operations abuse
4. **Input Validation** - Validate all tier/amount inputs
5. **Gift Limits** - Consider daily/weekly gift limits to prevent abuse
