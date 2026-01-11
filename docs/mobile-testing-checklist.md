# Mobile Optimization - Manual Testing Checklist (320px)

## Test Device: iPhone SE (320px width)

### Pre-Testing Setup
- [ ] Set browser viewport to 320x568
- [ ] Clear browser cache
- [ ] Disable browser extensions
- [ ] Test in both Chrome and Safari
- [ ] Test in both portrait and landscape

---

## 1. Layout & Visual Testing

### Landing Page (/)
- [ ] No horizontal scrollbar appears
- [ ] Logo and branding visible
- [ ] Navigation menu accessible (hamburger menu if applicable)
- [ ] All text is readable (no truncation without ellipsis)
- [ ] Images scale proportionally
- [ ] Footer content is accessible
- [ ] Call-to-action buttons are visible and tappable

### Dashboard (/dashboard)
- [ ] Stats cards stack vertically
- [ ] Scoreboard cards display correctly
- [ ] Metadata wraps without overflow
- [ ] Filter controls are usable
- [ ] Search bar fits within screen
- [ ] Create button is accessible
- [ ] No content extends beyond viewport

### Scoreboard View (/individual-scoreboard-view)
- [ ] Mobile header displays ("Player", "Score/Time")
- [ ] Entry cards render correctly
- [ ] Rank badges visible and sized appropriately
- [ ] Player names don't overflow
- [ ] Scores are readable
- [ ] No horizontal scrolling required
- [ ] Infinite scroll works smoothly

### Scoreboard Management (/scoreboard-management)
- [ ] Toolbar buttons are accessible
- [ ] Button text hidden on mobile (icon-only)
- [ ] Entry cards/rows display properly
- [ ] Edit/delete actions are tappable
- [ ] Forms fit within viewport
- [ ] CSV import accessible

### Invitations (/invitations)
- [ ] Invitation cards display correctly
- [ ] Email addresses wrap if needed
- [ ] Status badges visible
- [ ] Cancel buttons accessible
- [ ] Stats cards stack properly
- [ ] No overflow on dates

---

## 2. Touch Target Testing

### Minimum Size Check (44x44px)
- [ ] All buttons meet 44x44px minimum
- [ ] Icon buttons have proper padding
- [ ] Links are tappable
- [ ] Form inputs have adequate touch area
- [ ] Checkbox/radio buttons are easy to tap
- [ ] Menu items are properly sized

### Button Testing
- [ ] Primary action buttons (Create, Save, Submit)
- [ ] Secondary buttons (Cancel, Back)
- [ ] Icon-only buttons (Edit, Delete, Close)
- [ ] Navigation links in header/footer
- [ ] Pagination controls
- [ ] Filter dropdowns

---

## 3. Modal Testing

### CreateScoreboardModal
- [ ] Modal fits within 320px viewport
- [ ] Title input is accessible
- [ ] Radio buttons stack vertically
- [ ] All form fields are tappable
- [ ] Submit/Cancel buttons stack properly
- [ ] Scrolling works if content overflows
- [ ] Close button (X) is tappable
- [ ] No padding overflow

### InviteUserModal
- [ ] Email input is accessible
- [ ] Form fits within viewport
- [ ] Buttons stack on mobile
- [ ] Submit button is tappable
- [ ] Cancel button accessible

### DeleteConfirmationModal
- [ ] Warning message visible
- [ ] Buttons stack vertically
- [ ] Delete/Cancel clearly visible
- [ ] No layout issues

---

## 4. Form Testing

### Input Fields
- [ ] Text inputs are full width
- [ ] No overflow on long input
- [ ] Placeholder text visible
- [ ] Labels are readable
- [ ] Error messages display properly
- [ ] Validation feedback visible

### Dropdowns/Selects
- [ ] Options are readable
- [ ] Selection indicator visible
- [ ] Dropdown fits on screen
- [ ] No overflow issues

### Text Areas
- [ ] Resizes properly
- [ ] Content wraps correctly
- [ ] Scrolling works if needed

---

## 5. Landscape Mode Testing (568x320)

### Header
- [ ] Height reduces to 48px (landscape-mobile:h-12)
- [ ] Logo remains visible
- [ ] Navigation accessible

### Page Padding
- [ ] Vertical padding reduces (py-4 instead of py-8)
- [ ] Content starts closer to header
- [ ] No excessive white space

### Modals
- [ ] Max height adjusted (max-h-[95vh])
- [ ] Padding reduces (p-3)
- [ ] Form spacing tighter (space-y-2)
- [ ] Content is accessible
- [ ] Scrolling works if needed

### Lists/Tables
- [ ] Entries visible without excessive scroll
- [ ] Actions remain accessible
- [ ] No layout breaks

---

## 6. Interaction Testing

### Scrolling
- [ ] Smooth vertical scrolling
- [ ] No horizontal scroll anywhere
- [ ] Infinite scroll triggers correctly
- [ ] Pull-to-refresh (if implemented)
- [ ] Scroll position maintained on navigation

### Swipe Gestures
- [ ] Swipe-to-delete works on invitation cards
- [ ] Visual feedback appears progressively
- [ ] Swipe threshold feels natural (120px)
- [ ] Direction locking works (35° angle)
- [ ] Canceled swipes reset properly

### Tap Interactions
- [ ] Single tap activates elements
- [ ] No double-tap zoom on buttons
- [ ] Touch feedback visible (ripple/color)
- [ ] No accidental taps

---

## 7. Typography Testing

### Font Sizes
- [ ] Body text minimum 14px
- [ ] Headings are proportional
- [ ] Button text readable
- [ ] Labels are clear
- [ ] Small text (dates, metadata) minimum 12px

### Line Heights
- [ ] Text not cramped
- [ ] Adequate spacing between lines
- [ ] Multi-line text readable

### Font Weights
- [ ] Headings are bold enough
- [ ] Body text has proper weight
- [ ] Important info stands out

---

## 8. Performance Testing

### Load Times
- [ ] Initial page load < 3 seconds
- [ ] Navigation transitions smooth
- [ ] Images load progressively
- [ ] No blocking resources

### Animation Performance
- [ ] Smooth animations (60fps target)
- [ ] No janky scrolling
- [ ] Transitions feel natural
- [ ] Reduced motion respected if set

### Memory Usage
- [ ] No memory leaks on navigation
- [ ] Long lists perform well
- [ ] Images don't cause crashes

---

## 9. Edge Cases

### Content Overflow
- [ ] Very long usernames truncate with ellipsis
- [ ] Long email addresses wrap or truncate
- [ ] Large numbers format properly
- [ ] Long scoreboard titles wrap

### Empty States
- [ ] Empty dashboard displays properly
- [ ] No scoreboards message visible
- [ ] Empty invitations page accessible
- [ ] Call-to-action buttons clear

### Error States
- [ ] Error messages display correctly
- [ ] Retry options accessible
- [ ] Error doesn't break layout

### Loading States
- [ ] Skeletons fit within viewport
- [ ] Loading spinners centered
- [ ] Progress indicators visible

---

## 10. Accessibility Testing

### Keyboard Navigation
- [ ] Can navigate with Tab key
- [ ] Focus indicators visible
- [ ] Skip links work
- [ ] Modal focus trap works
- [ ] Escape closes modals

### Screen Reader
- [ ] ARIA labels present
- [ ] Landmarks identified
- [ ] Form labels associated
- [ ] Error announcements
- [ ] Dynamic content announced

### Color Contrast
- [ ] Text readable on backgrounds
- [ ] Buttons have sufficient contrast
- [ ] Focus states visible
- [ ] Disabled states clear

---

## 11. Browser Compatibility

### Safari Mobile
- [ ] All features work
- [ ] Styles render correctly
- [ ] Touch events work
- [ ] No iOS-specific issues

### Chrome Mobile
- [ ] All features work
- [ ] Styles consistent
- [ ] Touch events work
- [ ] No Android-specific issues

---

## 12. Network Testing

### Slow 3G
- [ ] Page still usable
- [ ] Loading states appropriate
- [ ] No timeout errors
- [ ] Retry mechanisms work

### Offline
- [ ] Graceful degradation
- [ ] Offline message clear
- [ ] Cached content accessible

---

## Issues Found

### Critical (Blocks Usage)
- 

### High Priority (Major UX Issue)
- 

### Medium Priority (Minor UX Issue)
- 

### Low Priority (Polish/Enhancement)
- 

---

## Sign-Off

**Tester:** _______________________  
**Date:** _______________________  
**Browser/Device:** _______________________  
**Result:** ☐ Pass  ☐ Pass with Minor Issues  ☐ Fail  

**Notes:**


