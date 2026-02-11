# Phase 1c: Supporter/Free Limits & Enforcement

**Priority:** 🔴 High  
**Status:** ✅ Done  
**Dependencies:** Phase 1b (LemonSqueezy Integration)  
**Estimated Scope:** Medium

## Overview

Implement and enforce the limitations for free tier users:

- 2 public scoreboards maximum
- No private scoreboards
- 50 entries per scoreboard maximum
- 10 history snapshots per scoreboard maximum

---

## Issues

### Issue 1c.1: Add Limit Checking Service

**Title:** Create limit checking service for free tier restrictions

**Description:**
Create a service that checks user limits based on subscription status:

1. Count current public scoreboards
2. Check if user can create more
3. Check entry limits
4. Check history snapshot limits
5. Check if feature is available

**Acceptance Criteria:**

- [ ] `limitsService` created in `src/services/limitsService.ts`
- [ ] `canCreatePublicScoreboard(userId)` function
- [ ] `canCreatePrivateScoreboard(userId)` function
- [ ] `canAddEntry(scoreboardId)` function
- [ ] `getMaxSnapshots(userId)` function
- [ ] `getRemainingPublicScoreboards(userId)` function
- [ ] `getRemainingEntries(scoreboardId)` function

**Technical Notes:**

```typescript
interface UserLimits {
  maxPublicScoreboards: number; // 2 for free, Infinity for supporter
  maxPrivateScoreboards: number; // 0 for free, Infinity for supporter
  maxEntriesPerScoreboard: number; // 50 for free, Infinity for supporter
  maxSnapshotsPerScoreboard: number; // 10 for free, 100 for supporter
}

function getLimitsForUser(isSupporter: boolean): UserLimits {
  if (isSupporter) {
    return {
      maxPublicScoreboards: Infinity,
      maxPrivateScoreboards: Infinity,
      maxEntriesPerScoreboard: Infinity,
      maxSnapshotsPerScoreboard: 100,
    };
  }
  return {
    maxPublicScoreboards: 2,
    maxPrivateScoreboards: 0,
    maxEntriesPerScoreboard: 50,
    maxSnapshotsPerScoreboard: 10,
  };
}
```

---

### Issue 1c.2: Enforce Limits on Scoreboard Creation

**Title:** Enforce scoreboard limits in creation flow

**Description:**
Update scoreboard creation to:

1. Check user's subscription status
2. Count existing scoreboards
3. Block creation if limit reached
4. Show upgrade prompt for free users at limit

**Acceptance Criteria:**

- [ ] API validates limits before creating scoreboard
- [ ] UI shows remaining scoreboard count for free users
- [ ] UI disables/hides private option for free users
- [ ] Upgrade prompt shown when limit reached
- [ ] Clear error messages

**UI Changes:**

- Create Scoreboard Modal:
  - Show "2 of 2 public scoreboards used" for free users
  - Disable "Private" visibility option for free users
  - Show lock icon with "Supporter feature" tooltip on private option
  - When at limit, show "Become a Supporter for unlimited scoreboards"

---

### Issue 1c.3: Enforce Limits on Entry Creation

**Title:** Enforce entry limits per scoreboard

**Description:**
Update entry creation to:

1. Check scoreboard owner's subscription status
2. Count existing entries
3. Block creation if limit reached
4. Show upgrade prompt

**Acceptance Criteria:**

- [ ] API validates entry count before adding
- [ ] UI shows "X of 50 entries" for free users
- [ ] Warning shown when approaching limit (e.g., 45+)
- [ ] Clear error when limit reached
- [ ] Upgrade prompt displayed

**Technical Notes:**

- Check the scoreboard owner's subscription, not the current user
- Cached count may be needed for performance

---

### Issue 1c.4: Handle Downgrade Scenarios

**Title:** Handle subscription downgrade/cancellation gracefully

**Description:**
When a user's subscription expires or is cancelled:

1. Existing scoreboards become read-only if over limit
2. User can delete but not edit over-limit scoreboards
3. Private scoreboards become inaccessible (but not deleted)
4. Clear messaging about what happened

**Acceptance Criteria:**

- [ ] Over-limit scoreboards marked as read-only
- [ ] Read-only scoreboards show clear indicator
- [ ] Edit buttons disabled with explanation
- [ ] Delete still allowed for over-limit scoreboards
- [ ] Private scoreboards show "Upgrade to access" message
- [ ] Dashboard shows upgrade prompt

**Technical Notes:**

- Don't delete user data on downgrade
- Add `is_over_limit` computed property or flag
- Consider background job to mark scoreboards on subscription expiry

**UI States:**

```
Over-limit public scoreboard:
┌─────────────────────────────────────┐
│ 🔒 Read-Only                        │
│ My Third Scoreboard                 │
│                                     │
│ Your free plan allows 2 public      │
│ scoreboards. Become a Supporter     │
│ to edit this scoreboard.            │
│                                     │
│ [Become a Supporter]  [Delete]      │
└─────────────────────────────────────┘

Private scoreboard (no longer accessible):
┌─────────────────────────────────────┐
│ 🔒 Supporter Feature                 │
│ My Private Scoreboard               │
│                                     │
│ Private scoreboards require a       │
│ Supporter subscription.             │
│                                     │
│ [Become a Supporter]  [Delete]      │
└─────────────────────────────────────┘
```

---

### Issue 1c.5: Update API with Subscription Checks

**Title:** Add subscription validation to all relevant API endpoints

**Description:**
Update API endpoints to validate subscription status:

1. POST /scoreboards - check limits
2. PATCH /scoreboards/:id - check if not read-only
3. POST /scoreboards/:id/entries - check entry limits
4. GET /scoreboards/:id - check private access

**Acceptance Criteria:**

- [ ] All scoreboard mutation endpoints check subscription
- [ ] All entry mutation endpoints check limits
- [ ] Appropriate HTTP status codes (403 for limit reached)
- [ ] Descriptive error messages
- [ ] Rate limiting considerations

**Error Response Format:**

```json
{
  "error": "limit_reached",
  "message": "You've reached the maximum of 2 public scoreboards on the free plan.",
  "upgrade_url": "/pricing"
}
```

---

### Issue 1c.6: Add Upgrade Prompts Throughout UI

**Title:** Add contextual upgrade prompts throughout the application

**Description:**
Add tasteful, non-intrusive upgrade prompts at key moments:

1. When approaching limits
2. When limits are reached
3. When viewing Supporter-only features
4. On dashboard for free users

**Acceptance Criteria:**

- [ ] Upgrade prompt component created
- [ ] Shown when 80%+ of limits used
- [ ] Shown when limit reached
- [ ] Shown on Supporter feature hover/click
- [ ] Links to pricing page
- [ ] Can be dismissed (with cookie/localStorage)
- [ ] Not annoying or aggressive

**Design Guidelines:**

- Subtle, helpful tone
- Highlight benefits, not restrictions
- "Become a Supporter" language (not "Upgrade to Pro")
- Easy to dismiss
- Don't block core functionality
