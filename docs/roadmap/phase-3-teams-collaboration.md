# Phase 3: Teams & Collaboration

**Priority:** 🟡 Medium  
**Dependencies:** Phase 1c (Pro/Free Limits)  
**Estimated Scope:** Large

## Overview

Implement team functionality allowing Pro users to:
- Create teams
- Invite team members
- Share scoreboards with teams (dual ownership)
- Collaborative editing with audit logs

---

## Issues

### Issue 3.1: Design Teams Database Schema

**Title:** Create database schema for teams

**Description:**
Design and implement the database schema for teams:
- Teams table
- Team memberships with roles
- Dual ownership for scoreboards

**Acceptance Criteria:**
- [ ] Migration file created
- [ ] Schema supports all team features
- [ ] RLS policies configured
- [ ] Indexes for performance

**Proposed Schema:**

```sql
-- Team member role enum
CREATE TYPE team_role AS ENUM ('admin', 'member');

-- Teams table
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT chk_teams_name_length CHECK (length(name) BETWEEN 1 AND 100)
);

-- Team members table
CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  role team_role NOT NULL DEFAULT 'member',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT uq_team_members UNIQUE (team_id, user_id)
);

-- Add team ownership to scoreboards (dual ownership)
ALTER TABLE scoreboards ADD COLUMN team_id UUID REFERENCES teams(id) ON DELETE SET NULL;

-- Indexes
CREATE INDEX idx_team_members_team_id ON team_members(team_id);
CREATE INDEX idx_team_members_user_id ON team_members(user_id);
CREATE INDEX idx_scoreboards_team_id ON scoreboards(team_id);

-- RLS policies
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- Team members can view their teams
CREATE POLICY "Team members can view team"
  ON teams FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = teams.id
      AND team_members.user_id = auth.uid()
    )
  );

-- Team admins can update team
CREATE POLICY "Team admins can update team"
  ON teams FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = teams.id
      AND team_members.user_id = auth.uid()
      AND team_members.role = 'admin'
    )
  );
```

---

### Issue 3.2: Create Audit Log Schema and Service

**Title:** Implement audit logging for team scoreboard changes

**Description:**
Create an audit log system to track:
- Who made changes
- What was changed
- When it was changed
- Previous and new values

**Acceptance Criteria:**
- [ ] Audit log table created
- [ ] Audit service for logging changes
- [ ] Logs scoreboard edits
- [ ] Logs entry additions/removals
- [ ] Logs entry score changes
- [ ] Queryable by team admins

**Proposed Schema:**

```sql
CREATE TYPE audit_action AS ENUM (
  'scoreboard_created',
  'scoreboard_updated',
  'scoreboard_deleted',
  'entry_created',
  'entry_updated',
  'entry_deleted'
);

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  scoreboard_id UUID REFERENCES scoreboards(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES user_profiles(id),
  action audit_action NOT NULL,
  entity_type TEXT NOT NULL, -- 'scoreboard' or 'entry'
  entity_id UUID NOT NULL,
  changes JSONB, -- { field: { old: x, new: y } }
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_team_id ON audit_logs(team_id);
CREATE INDEX idx_audit_logs_scoreboard_id ON audit_logs(scoreboard_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
```

---

### Issue 3.3: Create Team Management UI

**Title:** Create team management pages

**Description:**
Create UI for managing teams:
- Create team
- View team details
- Manage members (admin only)
- View team scoreboards
- Team settings

**Acceptance Criteria:**
- [ ] `/teams` - list user's teams
- [ ] `/teams/new` - create team form
- [ ] `/teams/:id` - team dashboard
- [ ] `/teams/:id/members` - member management
- [ ] `/teams/:id/settings` - team settings
- [ ] Only accessible to Pro users

---

### Issue 3.4: Implement Team Invitations

**Title:** Implement team invitation system

**Description:**
Allow team admins to invite users to teams:
- Generate team invite code/ID
- User enters code to join
- Admin approves or auto-join

**Acceptance Criteria:**
- [ ] Team has shareable ID/code
- [ ] "Join Team" page with code input
- [ ] User must have Pro subscription to join
- [ ] New member gets 'member' role by default
- [ ] Admin can see pending/accepted invites
- [ ] Admin can remove members

---

### Issue 3.5: Implement Scoreboard Team Transfer

**Title:** Allow transferring scoreboards to/from teams

**Description:**
Allow users to:
- Add a team as secondary owner of their scoreboard
- Remove team ownership
- Transfer requires knowing team ID

**Acceptance Criteria:**
- [ ] "Add to Team" option in scoreboard settings
- [ ] Input for team ID
- [ ] Validation that user is member of that team
- [ ] "Remove from Team" option
- [ ] Scoreboard visible in team's scoreboard list
- [ ] All team members can edit

**UI Flow:**
1. User goes to scoreboard settings
2. Clicks "Add to Team"
3. Enters Team ID or selects from their teams
4. Confirms transfer
5. Scoreboard now shows in team view

---

### Issue 3.6: Update Scoreboard Permissions for Teams

**Title:** Update scoreboard RLS policies for team access

**Description:**
Update scoreboard access rules:
- Owner can always access
- Team members can access if scoreboard has team_id
- Team members can edit team scoreboards
- Only owner can delete or remove from team

**Acceptance Criteria:**
- [ ] RLS policies updated
- [ ] Team members can view team scoreboards
- [ ] Team members can edit team scoreboards
- [ ] Only owner can delete
- [ ] Only owner can remove from team
- [ ] API endpoints respect these rules

---

### Issue 3.7: Create Audit Log Viewer

**Title:** Create audit log viewer for team admins

**Description:**
Create a UI for team admins to view the audit log:
- Filter by scoreboard
- Filter by user
- Filter by date range
- Show change details

**Acceptance Criteria:**
- [ ] Audit log page at `/teams/:id/audit-log`
- [ ] Table with recent changes
- [ ] Filters for scoreboard, user, date
- [ ] Expandable rows showing change details
- [ ] Pagination for large logs
- [ ] Only visible to team admins
