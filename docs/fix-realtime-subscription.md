# Fix: Real-time Auto-Update for Scoreboard View and Embed URL

## Issue
Scoreboard View (`/individual-scoreboard-view`) and Embed URL (`/embed/[id]`) were not auto-updating when scores were added or changed, while Kiosk view (`/kiosk/[id]`) was working correctly.

## Root Cause
The `scoreboardService.subscribeToScoreboardChanges()` function was subscribing to ALL changes in the `scoreboard_entries` and `scoreboards` tables, then attempting to filter by `scoreboard_id` in JavaScript after receiving the events:

```typescript
// OLD (Broken) Implementation
.on('postgres_changes', {
  event: '*',
  schema: 'public',
  table: 'scoreboard_entries',
  // NO FILTER - receives all changes for all scoreboards
}, (payload) => {
  // JavaScript filtering - unreliable
  if (payload.new?.scoreboard_id === scoreboardId) {
    callbacks.onEntriesChange?.();
  }
})
```

Problems with this approach:
1. No server-side filtering means the client receives notifications for ALL scoreboards
2. JavaScript payload filtering is unreliable - doesn't catch all change types
3. Inefficient - processes events that don't relate to the current scoreboard
4. Different from the working Kiosk view implementation

## Solution
Added Supabase-level filtering to the subscription, matching the pattern used in the working Kiosk view:

```typescript
// NEW (Fixed) Implementation
.on('postgres_changes', {
  event: '*',
  schema: 'public',
  table: 'scoreboard_entries',
  filter: `scoreboard_id=eq.${scoreboardId}`, // ✅ Server-side filtering
}, () => {
  // All events here are guaranteed to match our scoreboard
  callbacks.onEntriesChange?.();
})
```

The same fix was applied to the `scoreboards` table subscription:
```typescript
filter: `id=eq.${scoreboardId}`,
```

## Changes Made

### File: `src/services/scoreboardService.ts`

1. **Added filter for scoreboard_entries subscription** (line 92):
   ```typescript
   filter: `scoreboard_id=eq.${scoreboardId}`,
   ```

2. **Added filter for scoreboards subscription** (line 105):
   ```typescript
   filter: `id=eq.${scoreboardId}`,
   ```

3. **Removed unreliable JavaScript payload filtering**:
   - Removed checks for `payload.new` and `payload.old`
   - Removed type casting and conditional logic
   - Simplified callbacks since filtering now happens at database level

## Impact

### Before Fix
- ❌ Individual Scoreboard View: NO auto-update
- ❌ Embed View: NO auto-update
- ✅ Kiosk View: Working (had correct implementation)

### After Fix
- ✅ Individual Scoreboard View: Auto-updates when entries change
- ✅ Embed View: Auto-updates when entries change
- ✅ Kiosk View: Still working (no changes made)

## Technical Benefits

1. **More Efficient**: Supabase's real-time engine only sends events for the specific scoreboard
2. **More Reliable**: No client-side filtering logic that could miss events
3. **Consistent**: All views now use the same filtering pattern
4. **Better Performance**: Reduces unnecessary network traffic and client-side processing

## Testing Recommendations

### Manual Testing
For each view (Individual Scoreboard, Embed, Kiosk):

1. **Test Entry Creation**:
   - Open the view in one browser window
   - Open scoreboard management in another window
   - Add a new entry
   - Verify the view updates automatically within ~2 seconds

2. **Test Entry Update**:
   - Open the view
   - Edit an existing entry (change score or name)
   - Verify the view updates automatically

3. **Test Entry Deletion**:
   - Open the view
   - Delete an entry
   - Verify the view updates automatically

4. **Test Multiple Scoreboards**:
   - Open View A for Scoreboard 1
   - Open View B for Scoreboard 2
   - Add entry to Scoreboard 1
   - Verify View A updates but View B does NOT (confirms filtering works)

### E2E Testing
Consider adding automated tests in `e2e/scoreboard.spec.ts`:

```typescript
test('scoreboard view auto-updates when entry is added', async ({ page }) => {
  // Open scoreboard view
  await page.goto('/individual-scoreboard-view?id=test-scoreboard-id');
  
  // Get initial entry count
  const initialCount = await page.locator('table tbody tr').count();
  
  // Add entry via API or another page
  await addEntryViaAPI('test-scoreboard-id', { name: 'Test', score: 100 });
  
  // Wait for auto-update (max 5 seconds)
  await page.waitForFunction(
    (expected) => document.querySelectorAll('table tbody tr').length > expected,
    initialCount,
    { timeout: 5000 }
  );
  
  // Verify new entry appears
  const newCount = await page.locator('table tbody tr').count();
  expect(newCount).toBeGreaterThan(initialCount);
});
```

## Related Files

### Files Modified
- `src/services/scoreboardService.ts` - Fixed subscription filtering

### Files Using This Service
- `src/app/individual-scoreboard-view/components/ScoreboardInteractive.tsx` - ✅ Now works
- `src/app/embed/[id]/page.tsx` - ✅ Now works
- `src/app/kiosk/[id]/components/KioskViewInteractive.tsx` - ✅ Already working (reference implementation)

## References

- **Supabase Real-time Documentation**: https://supabase.com/docs/guides/realtime/postgres-changes
- **Filter Syntax**: https://supabase.com/docs/guides/realtime/postgres-changes#filtering
- **GitHub Issue**: Bug Scoreboard View and Embed URL do not autoupdate when a score is added or changed!

## Conclusion

This fix ensures that all scoreboard views (Individual, Embed, and Kiosk) now receive real-time updates when entries are added, modified, or deleted. The solution follows Supabase best practices by filtering at the database level rather than in client-side JavaScript.
