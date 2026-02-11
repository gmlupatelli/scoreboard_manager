# Phase 1: CSV Export

**Priority:** 🟡 Medium  
**Status:** Not Started  
**Estimated Effort:** Small (2-3 days)

## Overview

Add CSV export functionality to individual scoreboards, allowing users to download their scoreboard data with all entries and metadata for backup, migration, or external analysis purposes.

## Goals

- **Data Portability**: Enable users to export their scoreboard data
- **Complete Export**: Include all entries, scores, and scoreboard metadata
- **User-Friendly**: Simple one-click export with automatic file naming
- **Format Consistency**: Use standard CSV format compatible with Excel and other tools

## Background

Currently, users can import CSV data to bulk-add entries (via CSV Import feature), but there's no way to export existing scoreboard data. This creates a data lock-in and makes it difficult to:
- Back up scoreboard data
- Migrate scoreboards between instances
- Analyze data in external tools (Excel, Google Sheets, etc.)
- Archive scoreboards before deletion

**Note:** CSV Import already exists. This phase only adds the export functionality.

## Implementation Tasks

### Issue 1.1: CSV Export API Endpoint

**Description**: Create API endpoint to generate CSV file for a scoreboard.

**File:** `src/app/api/scoreboards/[id]/export/route.ts`

**Endpoint:** `GET /api/scoreboards/[id]/export`

**Acceptance Criteria:**
- [ ] Returns CSV file as download (Content-Type: text/csv)
- [ ] Requires authentication (user must own scoreboard or scoreboard must be public)
- [ ] Returns 401 if not authenticated and scoreboard is private
- [ ] Returns 404 if scoreboard not found
- [ ] Returns 403 if user doesn't have access
- [ ] Filename format: `scoreboard-[title]-[date].csv`
- [ ] Sanitize title for filename (remove special characters, spaces → hyphens)

**CSV Structure:**
```csv
Scoreboard Title,[Scoreboard Title]
Description,[Description or empty]
Score Type,[number or time]
Time Format,[time format or empty]
Sort Order,[asc or desc]
Visibility,[public or private]
Created,[ISO date]
Total Entries,[count]
,
Name,Score,Details,Created At,Updated At
[entry.name],[entry.score],[entry.details],[entry.created_at],[entry.updated_at]
[entry.name],[entry.score],[entry.details],[entry.created_at],[entry.updated_at]
...
```

**Technical Notes:**
- Use `getAuthClient()` for authentication
- Check access via existing RLS policies or manual permission check
- Query includes scoreboard metadata + all entries
- Use streaming response for large scoreboards
- Encode special characters properly (quotes, commas)

**Example Response Headers:**
```typescript
return new Response(csvContent, {
  headers: {
    'Content-Type': 'text/csv; charset=utf-8',
    'Content-Disposition': `attachment; filename="${filename}"`,
  },
});
```

**CSV Generation Logic:**
```typescript
const escapeCSV = (value: string | null): string => {
  if (value === null) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

const lines = [
  `Scoreboard Title,${escapeCSV(scoreboard.title)}`,
  `Description,${escapeCSV(scoreboard.description)}`,
  `Score Type,${scoreboard.scoreType}`,
  `Time Format,${escapeCSV(scoreboard.timeFormat)}`,
  `Sort Order,${scoreboard.sortOrder}`,
  `Visibility,${scoreboard.visibility}`,
  `Created,${scoreboard.createdAt}`,
  `Total Entries,${entries.length}`,
  '', // Empty line separator
  'Name,Score,Details,Created At,Updated At', // Header row
  ...entries.map(entry => 
    `${escapeCSV(entry.name)},${entry.score},${escapeCSV(entry.details)},${entry.createdAt},${entry.updatedAt}`
  ),
];

const csvContent = lines.join('\n');
```

---

### Issue 1.2: Export Button UI

**Description**: Add export button to individual scoreboard view page.

**File:** `src/app/individual-scoreboard-view/page.tsx` or interactive component

**Acceptance Criteria:**
- [ ] "Export CSV" button appears in header actions (next to Edit, Kiosk, etc.)
- [ ] Button only visible to scoreboard owner or admin
- [ ] Click triggers CSV download
- [ ] Loading state while generating file
- [ ] Success toast: "Scoreboard exported successfully"
- [ ] Error toast if export fails
- [ ] Button disabled if scoreboard has no entries (optional - or export metadata only)
- [ ] Icon: DocumentArrowDownIcon

**UI Placement:**
- In header actions row, alongside "Edit Settings", "Kiosk Mode", etc.
- Desktop: Full button with icon + text
- Mobile: Icon-only button with tooltip

**Button Design:**
```tsx
<button
  onClick={handleExport}
  disabled={isExporting}
  className="px-4 py-2 text-primary rounded-md font-medium text-sm hover:bg-red-600/10 transition-colors duration-150 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
  title="Export scoreboard to CSV"
>
  <Icon name="DocumentArrowDownIcon" size={16} />
  <span className="hidden sm:inline">{isExporting ? 'Exporting...' : 'Export CSV'}</span>
</button>
```

**Technical Notes:**
- Use fetch to call export endpoint
- Trigger browser download using blob URL or direct link
- Get auth token from context
- Handle errors with toast notification

**Export Logic:**
```typescript
const handleExport = async () => {
  setIsExporting(true);
  try {
    const token = await getAuthToken();
    const response = await fetch(`/api/scoreboards/${scoreboardId}/export`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Export failed');
    }

    // Get filename from Content-Disposition header or use default
    const disposition = response.headers.get('Content-Disposition');
    const filenameMatch = disposition?.match(/filename="(.+)"/);
    const filename = filenameMatch?.[1] || `scoreboard-export-${Date.now()}.csv`;

    // Download file
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast('Scoreboard exported successfully', 'success');
  } catch (error) {
    showToast('Failed to export scoreboard', 'error');
  } finally {
    setIsExporting(false);
  }
};
```

---

### Issue 1.3: Export from Scoreboard Management

**Description**: Add export option to scoreboard management page (dashboard).

**File:** `src/app/dashboard/components/ScoreboardCard.tsx`

**Acceptance Criteria:**
- [ ] "Export" option added to kebab menu (•••)
- [ ] Positioned after "Edit" and before "Delete"
- [ ] Icon: DocumentArrowDownIcon
- [ ] Triggers same export logic as individual view
- [ ] Works without navigating to scoreboard page
- [ ] Loading state during export

**Menu Item:**
```tsx
<button
  onClick={(e) => {
    e.stopPropagation();
    handleExport(scoreboard.id);
  }}
  className="w-full text-left px-4 py-2 text-sm text-text-primary hover:bg-muted flex items-center gap-2"
>
  <Icon name="DocumentArrowDownIcon" size={16} />
  Export CSV
</button>
```

**Technical Notes:**
- Reuse export logic in a shared utility function
- Don't navigate away - download happens in background
- Show toast notification on success/error

---

### Issue 1.4: Access Control

**Description**: Ensure proper access control for CSV exports.

**Acceptance Criteria:**
- [ ] Scoreboard owner can always export (private or public)
- [ ] System admins can export any scoreboard
- [ ] Non-owners can export public scoreboards
- [ ] Non-owners cannot export private scoreboards (403 error)
- [ ] Unauthenticated users can export public scoreboards

**Technical Notes:**
- Use existing `can_view_scoreboard()` RLS function logic
- Check scoreboard visibility + ownership in API route
- Log export actions to admin_audit_log for admin exports

**Access Logic:**
```typescript
// Get scoreboard with owner info
const { data: scoreboard, error } = await authClient
  .from('scoreboards')
  .select('id, owner_id, visibility, title')
  .eq('id', scoreboardId)
  .single();

// Check access
const isOwner = user && scoreboard.owner_id === user.id;
const isAdmin = user && userProfile.role === 'system_admin';
const isPublic = scoreboard.visibility === 'public';

if (!isPublic && !isOwner && !isAdmin) {
  return NextResponse.json({ error: 'Access denied' }, { status: 403 });
}
```

---

### Issue 1.5: Filename Sanitization

**Description**: Ensure exported filenames are safe and descriptive.

**Acceptance Criteria:**
- [ ] Format: `scoreboard-[title]-[date].csv`
- [ ] Title converted to lowercase kebab-case
- [ ] Special characters removed or replaced
- [ ] Max length: 100 characters (truncate if needed)
- [ ] Date format: YYYY-MM-DD
- [ ] Always ends with `.csv` extension

**Examples:**
- "My Scoreboard" → `scoreboard-my-scoreboard-2026-02-11.csv`
- "John's High Scores!" → `scoreboard-johns-high-scores-2026-02-11.csv`
- "Team Rankings (2026)" → `scoreboard-team-rankings-2026-2026-02-11.csv`

**Sanitization Function:**
```typescript
function sanitizeFilename(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special chars except spaces and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Collapse multiple hyphens
    .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
    .slice(0, 80); // Limit length
}

function generateFilename(title: string): string {
  const sanitized = sanitizeFilename(title);
  const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  return `scoreboard-${sanitized}-${date}.csv`;
}
```

---

### Issue 1.6: Empty Scoreboard Handling

**Description**: Handle edge case where scoreboard has no entries.

**Acceptance Criteria:**
- [ ] Export still works for scoreboards with 0 entries
- [ ] CSV includes metadata section
- [ ] Entry section shows header row but no data rows
- [ ] Total Entries shows "0"
- [ ] Optional: Button shows different text "Export Metadata" when no entries

**CSV Output (No Entries):**
```csv
Scoreboard Title,My Empty Scoreboard
Description,Newly created scoreboard
Score Type,number
Time Format,
Sort Order,desc
Visibility,private
Created,2026-02-11T10:30:00.000Z
Total Entries,0

Name,Score,Details,Created At,Updated At
```

---

## Database Schema

No new tables or migrations required. Uses existing:
- `scoreboards` table
- `scoreboard_entries` table

## API Endpoints

### New Endpoints

1. **GET /api/scoreboards/[id]/export**
   - Auth: Optional (public scoreboards) / Required (private scoreboards)
   - Returns: CSV file download
   - Response: text/csv with Content-Disposition attachment

## Testing Requirements

### Unit Tests
- [ ] CSV escaping function (quotes, commas, newlines)
- [ ] Filename sanitization function
- [ ] CSV generation with various scoreboard types (number, time)

### Integration Tests
- [ ] Export API endpoint returns valid CSV
- [ ] Access control enforced (public vs private)
- [ ] Filename generation correct
- [ ] Empty scoreboard exports successfully

### E2E Tests
- [ ] User can export owned scoreboard from individual view
- [ ] User can export scoreboard from dashboard
- [ ] Downloaded CSV file contains correct data
- [ ] Public scoreboard exportable by non-owner
- [ ] Private scoreboard blocked for non-owner
- [ ] Admin can export any scoreboard

## Dependencies

None - uses built-in Node.js and browser APIs.

## Migration Plan

No database changes required.

## Rollout Plan

1. **Phase 1**: Deploy API endpoint
2. **Phase 2**: Add export button to individual scoreboard view
3. **Phase 3**: Add export option to dashboard management
4. **Phase 4**: Monitor usage and performance

## Success Metrics

- User adoption rate (% of users who use export)
- Export success rate (target: >99%)
- Average export file size
- User feedback on export functionality

## Open Questions

- [ ] Should we include custom styles in the export? (probably not, keep CSV simple)
- [ ] Should we add JSON export as well? (future enhancement)
- [ ] Should we limit export to certain file sizes? (e.g., max 10,000 entries)
- [ ] Should we add rate limiting for public scoreboard exports?

## Related Issues

- Complements: CSV Import (already exists)
- Related to: Phase 1 (Teams) - team members should be able to export shared scoreboards
- Future: Could extend to export multiple scoreboards at once (bulk export)

## Security Considerations

- Access control enforced for private scoreboards
- Filenames sanitized to prevent directory traversal attacks
- CSV properly escaped to prevent formula injection
- Rate limiting recommended for public exports to prevent abuse

## Performance Considerations

- Streaming response for large scoreboards (>1000 entries)
- Consider pagination or chunking for very large exports
- Cache-Control headers to prevent unnecessary re-exports
- Lightweight query (only fetch needed fields)

## User Experience

- Clear export button with icon
- Loading state during export
- Success/error feedback
- Automatic download (no additional clicks)
- Descriptive filename
- Works on mobile devices
