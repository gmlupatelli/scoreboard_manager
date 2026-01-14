# Phase 2: Embed & Theming

**Priority:** 🔴 High  
**Dependencies:** Phase 1c (Pro/Free Limits)  
**Estimated Scope:** Medium

## Overview

Implement the "Powered by" badge for embed views and theme customization system.

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

**Acceptance Criteria:**
- [ ] Badge component created
- [ ] Shows on embed view for free users
- [ ] Hidden for Pro users
- [ ] Links to homepage or pricing page
- [ ] Styled to be visible but not intrusive
- [ ] Responsive (works on small embeds)

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

**Technical Notes:**
- Check scoreboard owner's subscription status
- Use CSS that's hard to override externally
- Consider adding subtle branding in other places too

---

### Issue 2.2: Create Standard Theme Options

**Title:** Create standard theme options for free users

**Description:**
Create a set of pre-built themes that free users can choose from:
- Light theme (default)
- Dark theme
- High contrast
- Sport themes (optional)

**Acceptance Criteria:**
- [ ] At least 4 standard themes created
- [ ] Theme definitions stored in code
- [ ] Theme selector in scoreboard settings
- [ ] Preview before applying
- [ ] Theme applied to public/embed views

**Proposed Themes:**
1. **Light** - White background, dark text
2. **Dark** - Dark background, light text
3. **Sport Blue** - Blue accent colors
4. **Sport Green** - Green accent colors

---

### Issue 2.3: Create Custom Theme Builder for Pro

**Title:** Create custom theme builder for Pro users

**Description:**
Allow Pro users to create custom themes with:
- Primary color picker
- Background color
- Text color
- Accent colors
- Live preview

**Acceptance Criteria:**
- [ ] Theme builder UI created
- [ ] Color pickers for each property
- [ ] Live preview of changes
- [ ] Save custom theme to scoreboard
- [ ] Only available to Pro users
- [ ] Validation (contrast, accessibility)

**Database Changes:**
```sql
ALTER TABLE scoreboards ADD COLUMN custom_theme JSONB;

-- Example custom_theme value:
{
  "primaryColor": "#f77174",
  "backgroundColor": "#ffffff",
  "textColor": "#333333",
  "accentColor": "#eba977"
}
```

---

### Issue 2.4: Create Theme Selector UI

**Title:** Create theme selector component for scoreboard settings

**Description:**
Create a theme selector that:
- Shows available standard themes
- Shows custom theme option for Pro users
- Allows quick preview
- Saves selection

**Acceptance Criteria:**
- [ ] Theme selector component created
- [ ] Grid of theme previews
- [ ] "Custom" option with lock icon for free users
- [ ] Click to preview
- [ ] Confirm to apply
- [ ] Integrated into scoreboard settings

---

### Issue 2.5: Apply Themes to Public and Embed Views

**Title:** Apply selected theme to public and embed scoreboard views

**Description:**
Ensure the selected theme is properly applied to:
- Public scoreboard view
- Embed view
- Kiosk mode (when implemented)

**Acceptance Criteria:**
- [ ] Theme loaded from scoreboard settings
- [ ] CSS variables or inline styles applied
- [ ] Fallback to default theme if none selected
- [ ] No flash of unstyled content
- [ ] Works with all scoreboard layouts
