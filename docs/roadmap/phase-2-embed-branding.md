# Phase 2: Embed Branding

**Priority:** 🟡 Medium  
**Dependencies:** Phase 1c (Supporter/Free Limits)  
**Estimated Scope:** Small

## Overview

Implement the "Powered by" badge for embed views. This phase is intentionally small.

> **Note:** The theming system already exists in the codebase. See [Existing Theming Features](#existing-theming-features) below.

---

## Existing Theming Features

The following theming functionality is **already implemented** and should NOT be recreated:

### Style Presets (Already Exist)
Located in `src/utils/stylePresets.ts`:
- **Light** - Clean white background
- **Dark** - Dark mode with light text
- **Transparent** - No background (for overlays)
- **High Contrast** - Maximum readability
- **Minimal** - Subtle, understated design
- **Custom** - Full custom builder

### Custom Theme Builder (Already Exists)
Located in `src/app/scoreboard-management/components/StyleCustomizationSection.tsx`:
- 21+ customizable color properties
- Live preview
- RGBA support for transparent backgrounds
- Color picker with opacity control
- Background, text, header, row, and accent colors

### Database Storage (Already Exists)
The `scoreboards.custom_styles` JSONB column already stores:
- Background colors (header, row, alternating rows)
- Text colors (header, row, score, details)
- Border and shadow settings
- Medal colors and effects
- Size and spacing options

---

## Issues

### Issue 2.1: Add "Powered by" Badge to Embed View

**Title:** Add "Powered by Scoreboard Manager" badge to embed view

**Description:**
Add a badge to the embed view that:
- Shows for free tier users only
- Links to Scoreboard Manager website
- Is positioned unobtrusively (bottom corner)
- Cannot be easily removed/hidden
- Hidden for Supporters (badge-free embeds)

**Acceptance Criteria:**
- [ ] `PoweredByBadge` component created
- [ ] Shows on embed view for free users
- [ ] Hidden for users with active subscription
- [ ] Links to homepage with UTM parameters
- [ ] Styled to be visible but not intrusive
- [ ] Responsive (works on small embeds)
- [ ] Uses CSS that's hard to override externally

**Design:**
```
┌─────────────────────────────────────────┐
│                                         │
│          [Scoreboard Content]           │
│                                         │
│                                         │
│                                         │
├─────────────────────────────────────────┤
│                    Powered by           │
│               Scoreboard Manager ↗      │
└─────────────────────────────────────────┘
```

**Technical Implementation:**
```typescript
// src/components/common/PoweredByBadge.tsx
interface PoweredByBadgeProps {
  show: boolean;  // Based on owner's subscription status
}

export default function PoweredByBadge({ show }: PoweredByBadgeProps) {
  if (!show) return null;
  
  return (
    <a 
      href="https://scoreboardmanager.app/?utm_source=embed&utm_medium=badge"
      target="_blank"
      rel="noopener"
      className="powered-by-badge"
      style={{
        // Use !important to prevent external CSS override
        position: 'absolute !important',
        bottom: '8px !important',
        right: '8px !important',
        // ... etc
      }}
    >
      Powered by Scoreboard Manager
    </a>
  );
}
```

---

### Issue 2.2: Update Embed View to Show Badge

**Title:** Integrate "Powered by" badge into embed view

**Description:**
Update the embed view component to:
1. Check scoreboard owner's subscription status
2. Conditionally render the badge
3. Position it correctly within the embed container

**Acceptance Criteria:**
- [ ] Embed view fetches owner subscription status
- [ ] Badge rendered conditionally
- [ ] Badge positioned at bottom of embed
- [ ] Works with all theme presets
- [ ] Works with custom themes
- [ ] Badge visible on light and dark backgrounds

**Files to Update:**
- `src/app/embed/[id]/page.tsx`
- `src/app/embed/[id]/components/EmbedScoreboard.tsx`

---

### Issue 2.3: Add Badge Removal Messaging

**Title:** Add "Remove badge" upgrade prompt

**Description:**
When free users view their own embed preview, show a subtle message:
- "Want to remove the badge? Become a Supporter!"
- Link to pricing/subscription page

**Acceptance Criteria:**
- [ ] Message shown in embed preview mode (not actual embed)
- [ ] Only shown to scoreboard owner
- [ ] Links to subscription page
- [ ] Styled consistently with other upgrade prompts

---

## Testing Considerations

- [ ] Badge appears correctly for free users
- [ ] Badge hidden for Supporters
- [ ] Badge works with all 6 theme presets
- [ ] Badge visible on both light and dark themes
- [ ] Badge cannot be hidden via CSS from parent page
- [ ] Links work correctly with UTM tracking
