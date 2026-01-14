# Phase 1d: Supporter Tiers & Recognition

**Priority:** 🔴 High  
**Dependencies:** Phase 1b (LemonSqueezy Integration)  
**Estimated Scope:** Medium

## Overview

Implement the appreciation tier system and supporter recognition features:
- Tier badges based on payment amount
- "Created by" attribution on scoreboards
- Public supporters page
- Profile settings for visibility

---

## Issues

### Issue 1d.1: Add Tier Calculation Logic

**Title:** Implement appreciation tier calculation

**Description:**
Create logic to determine user's appreciation tier based on their subscription amount:

| Monthly Amount | Tier | Badge |
|----------------|------|-------|
| $5 - $9 | Supporter | 🙌 |
| $10 - $24 | Champion | 🏆 |
| $25 - $49 | Legend | 🌟 |
| $50+ | Hall of Famer | 👑 |

For yearly subscriptions, divide by 12 to get monthly equivalent.

**Acceptance Criteria:**
- [ ] `getTier(amountCents, interval)` function created
- [ ] Correctly handles monthly amounts
- [ ] Correctly handles yearly amounts (divide by 12)
- [ ] Returns tier name, badge emoji, and display info
- [ ] Tier stored/cached on subscription record

**Technical Notes:**

```typescript
type TierName = 'supporter' | 'champion' | 'legend' | 'hall_of_famer';

interface Tier {
  name: TierName;
  displayName: string;
  badge: string;
  minMonthlyAmount: number;
}

const TIERS: Tier[] = [
  { name: 'hall_of_famer', displayName: 'Hall of Famer', badge: '👑', minMonthlyAmount: 5000 },
  { name: 'legend', displayName: 'Legend', badge: '🌟', minMonthlyAmount: 2500 },
  { name: 'champion', displayName: 'Champion', badge: '🏆', minMonthlyAmount: 1000 },
  { name: 'supporter', displayName: 'Supporter', badge: '🙌', minMonthlyAmount: 500 },
];

function getTier(amountCents: number, interval: 'monthly' | 'yearly'): Tier {
  const monthlyAmount = interval === 'yearly' ? amountCents / 12 : amountCents;
  return TIERS.find(tier => monthlyAmount >= tier.minMonthlyAmount) || TIERS[TIERS.length - 1];
}
```

---

### Issue 1d.2: Create Tier Badge Component

**Title:** Create reusable tier badge component

**Description:**
Create a badge component that displays the user's appreciation tier:
- Shows emoji badge
- Shows tier name on hover
- Different sizes for different contexts
- Animated/highlighted variant for emphasis

**Acceptance Criteria:**
- [ ] `TierBadge` component created
- [ ] Props: `tier`, `size`, `showLabel`
- [ ] Tooltip with tier name
- [ ] Sizes: 'sm', 'md', 'lg'
- [ ] Accessible (aria-label)

**Usage Examples:**
```tsx
<TierBadge tier="champion" />
<TierBadge tier="legend" size="lg" showLabel />
```

---

### Issue 1d.3: Add "Created by" Attribution to Scoreboards

**Title:** Add "Created by" attribution with tier badge

**Description:**
Show creator attribution on public and embed scoreboard views:
- "Created by [Name]" text
- Tier badge shown for Pro users
- Toggleable in user settings

**Acceptance Criteria:**
- [ ] Attribution shown on public scoreboard view
- [ ] Attribution shown on embed view
- [ ] Format: "Created by [Name] 🏆" (with tier badge)
- [ ] Badge only shown for Pro users
- [ ] Respects user's visibility toggle
- [ ] Graceful when user opts out (no name shown)

**Display Logic:**
```
If user.show_created_by === true:
  If user has active subscription:
    Show "Created by {displayName} {tierBadge}"
  Else:
    Show "Created by {displayName}"
Else:
  Show nothing
```

---

### Issue 1d.4: Add Supporter Settings to Profile

**Title:** Add supporter visibility settings to user profile

**Description:**
Add settings to user profile for controlling supporter visibility:
1. Toggle "Show Created by" on scoreboards
2. Toggle "Show on Supporters page"
3. Custom display name for supporters page
4. Preview of how they'll appear

**Acceptance Criteria:**
- [ ] Settings section in profile page
- [ ] Toggle: "Show my name on scoreboards I create"
- [ ] Toggle: "Show me on the Supporters page"
- [ ] Input: "Display name" (defaults to profile name)
- [ ] Preview component showing current appearance
- [ ] Settings saved to database

**Database Changes:**
```sql
ALTER TABLE user_profiles ADD COLUMN show_created_by BOOLEAN DEFAULT true;
ALTER TABLE user_profiles ADD COLUMN show_on_supporters_page BOOLEAN DEFAULT true;
ALTER TABLE user_profiles ADD COLUMN supporter_display_name TEXT;
```

---

### Issue 1d.5: Create Supporters Page

**Title:** Create public supporters page

**Description:**
Create a public page showcasing supporters grouped by tier:
- Hall of Famers section (largest, most prominent)
- Legends section
- Champions section
- Supporters section
- Total supporter count
- Call-to-action to join

**Acceptance Criteria:**
- [ ] Route `/supporters` created
- [ ] Grouped by tier (highest first)
- [ ] Shows display name and badge
- [ ] Shows "Supporter since" date
- [ ] Only shows users who opted in
- [ ] Responsive grid layout
- [ ] CTA to become a supporter

**Design:**
```
┌────────────────────────────────────────────────┐
│                  Our Supporters                │
│     Thank you to everyone who supports         │
│         Scoreboard Manager! 🙏                 │
├────────────────────────────────────────────────┤
│                                                │
│  👑 Hall of Famers                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │  Name 1  │ │  Name 2  │ │  Name 3  │       │
│  │ Since Jan│ │ Since Feb│ │ Since Mar│       │
│  └──────────┘ └──────────┘ └──────────┘       │
│                                                │
│  🌟 Legends                                    │
│  Name 4 • Name 5 • Name 6 • Name 7            │
│                                                │
│  🏆 Champions                                  │
│  Name 8 • Name 9 • Name 10 • ...              │
│                                                │
│  🙌 Supporters                                 │
│  Name 11 • Name 12 • Name 13 • ...            │
│                                                │
├────────────────────────────────────────────────┤
│         [Become a Supporter]                   │
└────────────────────────────────────────────────┘
```

---

### Issue 1d.6: Show Tier Badge in User Profile

**Title:** Display tier badge on user's own profile

**Description:**
Show the user's current tier badge on their profile page:
- Badge displayed prominently
- Current tier name
- Amount they're paying
- Option to upgrade tier

**Acceptance Criteria:**
- [ ] Tier badge shown on profile page
- [ ] Current tier name displayed
- [ ] "Upgrade your tier" link to change amount
- [ ] Non-Pro users see prompt to subscribe
