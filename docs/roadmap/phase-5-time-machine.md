# Phase 5: Time Machine (History)

**Priority:** 🟢 Lower  
**Dependencies:** Phase 1c (Pro/Free Limits)  
**Estimated Scope:** Medium

## Overview

Implement a "Time Machine" feature for viewing scoreboard history:
- Automatic snapshots on every change
- Keep last 100 snapshots per scoreboard
- macOS Time Machine-style UI for browsing
- View-only (no restore functionality)

---

## Issues

### Issue 5.1: Design History Snapshot Schema

**Title:** Create database schema for scoreboard history snapshots

**Description:**
Design schema to store point-in-time snapshots of scoreboard state.

**Proposed Schema:**

```sql
CREATE TABLE scoreboard_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scoreboard_id UUID NOT NULL REFERENCES scoreboards(id) ON DELETE CASCADE,
  snapshot_data JSONB NOT NULL, -- Full scoreboard + entries state
  changed_by UUID REFERENCES user_profiles(id),
  change_description TEXT, -- e.g., "Entry added: John - 100"
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for efficient querying
CREATE INDEX idx_snapshots_scoreboard_created 
  ON scoreboard_snapshots(scoreboard_id, created_at DESC);

-- Limit to 100 snapshots per scoreboard (via trigger or app logic)
```

**Snapshot Data Structure:**
```json
{
  "scoreboard": {
    "title": "My Scoreboard",
    "description": "...",
    "settings": { ... }
  },
  "entries": [
    { "id": "...", "name": "Player 1", "score": 100 },
    { "id": "...", "name": "Player 2", "score": 95 }
  ],
  "metadata": {
    "entry_count": 2,
    "snapshot_version": 1
  }
}
```

---

### Issue 5.2: Implement Automatic Snapshot Creation

**Title:** Create automatic snapshot on scoreboard changes

**Description:**
Implement triggers/hooks to create snapshots when:
- Entry is added
- Entry is updated
- Entry is deleted
- Scoreboard settings change

**Acceptance Criteria:**
- [ ] Snapshot created on entry add
- [ ] Snapshot created on entry update
- [ ] Snapshot created on entry delete
- [ ] Snapshot created on scoreboard update
- [ ] Change description auto-generated
- [ ] Changed_by user tracked
- [ ] Respects 100 snapshot limit

**Technical Notes:**
- Can use Postgres triggers or application-level hooks
- Consider debouncing rapid changes
- Change descriptions examples:
  - "Added entry: John - 100"
  - "Updated score: John 100 → 150"
  - "Removed entry: John"
  - "Updated scoreboard title"

---

### Issue 5.3: Implement Snapshot Cleanup

**Title:** Create cleanup mechanism for old snapshots

**Description:**
Keep only the last 100 snapshots per scoreboard:
- Delete oldest when limit exceeded
- Can be trigger or scheduled job

**Acceptance Criteria:**
- [ ] Maximum 100 snapshots per scoreboard
- [ ] Oldest deleted when new one created
- [ ] Cleanup runs automatically
- [ ] No orphaned snapshots

**Implementation Options:**
1. **Postgres Trigger** - Delete oldest after insert
2. **Application Logic** - Check count and delete in transaction
3. **Scheduled Job** - Periodic cleanup

---

### Issue 5.4: Create Time Machine UI

**Title:** Create Time Machine browsing interface

**Description:**
Create a macOS Time Machine-inspired UI:
- Timeline scrubber
- Visual preview of past states
- Date/time display
- Smooth transitions between snapshots

**Acceptance Criteria:**
- [ ] Timeline component showing snapshot dates
- [ ] Click to view any snapshot
- [ ] Current state clearly marked
- [ ] Scoreboard preview for selected snapshot
- [ ] Change description shown
- [ ] Keyboard navigation (arrows)
- [ ] Accessible to scoreboard owner only

**UI Mockup:**
```
┌─────────────────────────────────────────────────────────┐
│ Time Machine - My Scoreboard                      [X]   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│   ┌─────────────────────────────────────────────────┐   │
│   │                                                 │   │
│   │         [Scoreboard Preview at this point]     │   │
│   │                                                 │   │
│   │         Player 1 ............ 100              │   │
│   │         Player 2 ............ 95               │   │
│   │                                                 │   │
│   └─────────────────────────────────────────────────┘   │
│                                                         │
│   January 13, 2026 at 3:45 PM                          │
│   "Updated score: Player 1 95 → 100"                    │
│                                                         │
│   ──●────────────────────────────────────────●──────   │
│   Jan 10        Jan 11        Jan 12        Jan 13     │
│                                                         │
│   ← Previous                              Next →        │
└─────────────────────────────────────────────────────────┘
```

---

### Issue 5.5: Create Snapshot API Endpoints

**Title:** Create API endpoints for fetching snapshots

**Description:**
Create API endpoints for:
- List snapshots for a scoreboard
- Get single snapshot details

**Acceptance Criteria:**
- [ ] `GET /api/scoreboards/:id/snapshots` - list snapshots
- [ ] `GET /api/scoreboards/:id/snapshots/:snapshotId` - get snapshot
- [ ] Pagination for list endpoint
- [ ] Only scoreboard owner can access
- [ ] Returns snapshot data and metadata

**Response Format:**
```json
{
  "snapshots": [
    {
      "id": "uuid",
      "created_at": "2026-01-13T15:45:00Z",
      "changed_by": { "id": "...", "name": "John" },
      "change_description": "Updated score: Player 1 95 → 100"
    }
  ],
  "pagination": {
    "total": 47,
    "page": 1,
    "per_page": 20
  }
}
```

---

### Issue 5.6: Add Time Machine Access Point

**Title:** Add Time Machine button to scoreboard management

**Description:**
Add entry point to Time Machine from scoreboard management view.

**Acceptance Criteria:**
- [ ] "View History" or clock icon button
- [ ] Opens Time Machine modal/page
- [ ] Only shown to scoreboard owner
- [ ] Only shown for Pro users (or limit history for free?)
- [ ] Disabled with tooltip if no snapshots exist
