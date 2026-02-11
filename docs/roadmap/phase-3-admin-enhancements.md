# Phase 3: Admin Enhancements

**Priority:** 🟡 Medium  
**Status:** Not Started  
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

## Implementation Tasks

### Issue 4.1: User Details Modal Component

**Description**: Create a modal component that displays comprehensive user information when admin clicks "Details" button on any user row.

**Location:** `src/app/system-admin/subscriptions/components/UserDetailsModal.tsx`

**Acceptance Criteria:**
- [ ] Center modal, max-width 800px
- [ ] Opens when admin clicks "Details" button in subscription table row
- [ ] Displays user information in organized sections
- [ ] Closes via X button, Escape key, or clicking backdrop
- [ ] Responsive design (scrollable on mobile)
- [ ] Loading state while fetching details

**Modal Sections:**

1. **Header**
   - User's full name (or email if name not set)
   - Tier badge if active supporter
   - Role badge (system_admin or user)
   - Close button (X)

2. **Profile Information**
   - Email address
   - Full name
   - Account created date
   - Last login (if available from auth metadata)
   - Email verification status

3. **Subscription History** (Paginated)
   - Last 10 payment transactions by default
   - Each entry shows:
     - Date
     - Amount (formatted with currency)
     - Status (with colored badge)
     - Receipt link (if available)
   - "Load More" button if more than 10 payments
   - Empty state: "No payment history"

4. **Scoreboard Activity**
   - Total scoreboard count
   - List of scoreboards (max 10 initially):
     - Scoreboard title
     - Visibility (public/private)
     - Entry count
     - "View" link → opens in new tab
   - "Show All" button if more than 10 scoreboards
   - Empty state: "No scoreboards created"

**Technical Notes:**
- Use existing modal styling patterns
- Fetch data from new API endpoint
- Cache fetched data in parent component to avoid re-fetching
- Show loading spinner while fetching

**UI/UX:**
- Tabs for different sections (Profile, Payments, Scoreboards)?
- Or single scrollable modal with sections?
- **Recommendation**: Single scrollable modal (simpler UX)

---

### Issue 4.2: User Details API Endpoint

**Description**: Create API endpoint to fetch comprehensive user details for admin view.

**File:** `src/app/api/admin/users/[userId]/details/route.ts`

**Endpoint:** `GET /api/admin/users/[userId]/details?paymentsPage=1&scoreboardsPage=1`

**Response:**
```typescript
{
  user: {
    id: string;
    email: string;
    fullName: string | null;
    role: 'system_admin' | 'user';
    createdAt: string;
    emailVerified: boolean;
    lastSignInAt: string | null;
  };
  subscription: {
    // Full subscription object (if exists)
  } | null;
  paymentHistory: {
    payments: PaymentHistoryEntry[];
    pagination: {
      page: number;
      perPage: number;
      total: number;
      hasMore: boolean;
    };
  };
  scoreboards: {
    scoreboards: Array<{
      id: string;
      title: string;
      visibility: 'public' | 'private';
      entryCount: number;
      createdAt: string;
    }>;
    pagination: {
      page: number;
      perPage: number;
      total: number;
      hasMore: boolean;
    };
  };
}
```

**Acceptance Criteria:**
- [ ] Endpoint requires system_admin authentication
- [ ] Returns 401 if not authenticated or not admin
- [ ] Returns 404 if user not found
- [ ] Payment history paginated (10 per page)
- [ ] Scoreboards paginated (10 per page)
- [ ] Query params: `paymentsPage` and `scoreboardsPage` (default: 1)
- [ ] Efficient queries (use joins, avoid N+1)

**Technical Notes:**
- Use `getAuthClient()` and verify admin role
- Fetch from multiple tables:
  - `user_profiles` (user info)
  - `subscriptions` (subscription info)
  - `payment_history` (payment transactions)
  - `scoreboards` with entry count
- Order payment history by created_at DESC
- Order scoreboards by created_at DESC
- Use Supabase `.count()` for pagination totals

**Query Example:**
```typescript
// Payment history
const { data: payments, count } = await supabase
  .from('payment_history')
  .select('*', { count: 'exact' })
  .eq('user_id', userId)
  .order('created_at', { ascending: false })
  .range((page - 1) * 10, page * 10 - 1);

// Scoreboards with entry count
const { data: scoreboards, count } = await supabase
  .from('scoreboards')
  .select('id, title, visibility, created_at, scoreboard_entries(count)', { count: 'exact' })
  .eq('owner_id', userId)
  .order('created_at', { ascending: false })
  .range((page - 1) * 10, page * 10 - 1);
```

---

### Issue 4.3: Add "Details" Button to Subscription Table

**Description**: Add a "Details" button to each row in the subscription management table.

**File:** `src/app/system-admin/subscriptions/components/SubscriptionsInteractive.tsx`

**Acceptance Criteria:**
- [ ] "Details" button added to each user row in the table
- [ ] Button positioned before existing action buttons (Link, Gift, Cancel, Refetch)
- [ ] Clicking opens UserDetailsModal
- [ ] Modal receives selected user data as prop
- [ ] Button styled consistently with existing buttons
- [ ] Tooltip: "View user details"

**Technical Notes:**
- Add state: `const [showDetailsModal, setShowDetailsModal] = useState(false)`
- Add state: `const [selectedUserForDetails, setSelectedUserForDetails] = useState<UserSubscription | null>(null)`
- Button click sets both states and opens modal
- Modal fetches additional details via API

**UI:**
```tsx
<button
  onClick={() => {
    setSelectedUserForDetails(user);
    setShowDetailsModal(true);
  }}
  className="text-blue-600 hover:bg-blue-600/10 px-3 py-1.5 rounded-md text-sm transition-colors duration-150"
  title="View user details"
>
  Details
</button>
```

---

### Issue 4.4: Pagination Controls in Modal

**Description**: Add "Load More" buttons for payment history and scoreboards in the modal.

**Acceptance Criteria:**
- [ ] Payment history section has "Load More" button if `hasMore = true`
- [ ] Scoreboards section has "Load More" button if `hasMore = true`
- [ ] Clicking loads next page and appends to existing data
- [ ] Loading state shown while fetching next page
- [ ] Button disabled while loading
- [ ] If no more data, button disappears

**Technical Notes:**
- Track pages separately: `paymentsPage`, `scoreboardsPage`
- Fetch next page and append results
- Update pagination state
- Show loading spinner inside button: "Loading..."

---

### Issue 4.5: Scoreboard Quick Links

**Description**: Each scoreboard in the modal should be clickable and open in a new tab.

**Acceptance Criteria:**
- [ ] Scoreboard title is a link
- [ ] Links open in new tab (target="_blank")
- [ ] Links point to individual scoreboard view: `/individual-scoreboard-view?id=[scoreboardId]`
- [ ] Hover state shows it's clickable
- [ ] Icon indicates external link

**UI:**
```tsx
<a
  href={`/individual-scoreboard-view?id=${scoreboard.id}`}
  target="_blank"
  rel="noopener noreferrer"
  className="text-primary hover:underline flex items-center gap-1"
>
  {scoreboard.title}
  <Icon name="ArrowTopRightOnSquareIcon" size={14} />
</a>
```

---

## Database Schema

No new tables or migrations required. Uses existing tables:
- `user_profiles`
- `subscriptions`
- `payment_history`
- `scoreboards`
- `scoreboard_entries` (for count)

## API Endpoints

### New Endpoints

1. **GET /api/admin/users/[userId]/details**
   - Auth: system_admin required
   - Query params: `paymentsPage` (default: 1), `scoreboardsPage` (default: 1)
   - Returns: Complete user details with paginated history

## Testing Requirements

### Unit Tests
- [ ] Details API endpoint (auth, pagination, data transformation)
- [ ] Modal component rendering with mock data

### Integration Tests
- [ ] API returns correct data for different users
- [ ] Pagination works correctly
- [ ] Admin-only access enforced

### E2E Tests
- [ ] Admin can open user details modal
- [ ] Modal displays correct user information
- [ ] Payment history pagination works
- [ ] Scoreboard links open correctly
- [ ] Modal closes properly

## Dependencies

None - uses existing packages and patterns.

## Migration Plan

No database changes required.

## Rollout Plan

1. **Phase 1**: Create API endpoint and test
2. **Phase 2**: Build modal component
3. **Phase 3**: Integrate modal into subscription page
4. **Phase 4**: Add pagination and polish UX

## Success Metrics

- Admins use "Details" button to investigate user issues
- Reduces need for direct database queries
- Improves admin efficiency for user support

## Open Questions

- [ ] Should we include user's audit log entries in the modal?
- [ ] Should we show user's invitation history (invitee/inviter)?
- [ ] Should we add export functionality (CSV) for payment history?
- [ ] Should we show user's locked scoreboards count?

## Related Issues

- Depends on: Phase 1e (Admin Management) - ✅ Complete
- Related to: Phase 3 (Supporter Recognition) - Profile info reuse
- Future: Could extend to show usage analytics per user
