/**
 * Refresh Test Data Script (FULL NUKE)
 *
 * Complete test data reset - clears ALL test users including manual testing users.
 * Use this when manual user data is impacting automated tests.
 *
 * What it does:
 * 1. Deletes and recreates ALL test users (both automated and manual)
 * 2. Removes all existing test data (scoreboards, entries, invitations)
 * 3. Seeds fresh data for users
 * 4. Seeds invitations for invitation testing
 *
 * Usage: npm run refresh-test-data:full
 *
 * Credentials load from .env.local (Supabase) with .env.test overrides using the numbered naming convention:
 *   AUTOMATED_TEST_ADMIN_<N>_EMAIL / AUTOMATED_TEST_ADMIN_<N>_PASSWORD
 *   AUTOMATED_TEST_USER_<N>_EMAIL / AUTOMATED_TEST_USER_<N>_PASSWORD
 *   MANUAL_TEST_ADMIN_<N>_EMAIL / MANUAL_TEST_ADMIN_<N>_PASSWORD
 *   MANUAL_TEST_USER_<N>_EMAIL / MANUAL_TEST_USER_<N>_PASSWORD
 *
 * Prerequisites:
 * - .env.local must be configured with SUPABASE credentials
 * - .env.test holds test user credentials and optional overrides
 * - TEST_CLEANUP_API_KEY must be set
 * - Application should be running on localhost:5000 (optional - only for cleanup)
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as _path from 'path';
import { randomUUID } from 'crypto';
import { loadTestEnv } from '../loadTestEnv.js';
import type { Database } from '../../src/types/database.types';

// Type aliases for database operations
type SupabaseServiceClient = SupabaseClient<Database>;
type ScoreboardRow = Database['public']['Tables']['scoreboards']['Row'];
type ScoreboardEntryRow = Database['public']['Tables']['scoreboard_entries']['Row'];
type UserProfileRow = Database['public']['Tables']['user_profiles']['Row'];

// Load .env.local first, then .env.test overrides for scripts
loadTestEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SECRET_KEY;
const cleanupApiKey = process.env.TEST_CLEANUP_API_KEY;
const baseUrl = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:5000';

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    '❌ Missing required environment variables: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY'
  );
  process.exit(1);
}

/**
 * Parse test user credentials from environment variables
 * Supports the numbered naming convention: AUTOMATED_TEST_ADMIN_<N>_EMAIL/PASSWORD
 */
interface TestUserConfig {
  email: string;
  password: string;
  role: 'system_admin' | 'user';
  name: string;
  purpose: string;
}

function getAllTestUsers(): TestUserConfig[] {
  const users: TestUserConfig[] = [];

  // Parse AUTOMATED_TEST_ADMIN_<N>
  for (let i = 1; i <= 10; i++) {
    const email = process.env[`AUTOMATED_TEST_ADMIN_${i}_EMAIL`];
    const password = process.env[`AUTOMATED_TEST_ADMIN_${i}_PASSWORD`];
    if (email && password) {
      users.push({
        email,
        password,
        role: 'system_admin',
        name: `Test Admin ${i}`,
        purpose: 'Automated test system admin',
      });
    }
  }

  // Parse AUTOMATED_TEST_USER_<N>
  for (let i = 1; i <= 10; i++) {
    const email = process.env[`AUTOMATED_TEST_USER_${i}_EMAIL`];
    const password = process.env[`AUTOMATED_TEST_USER_${i}_PASSWORD`];
    if (email && password) {
      users.push({
        email,
        password,
        role: 'user',
        name: `Test User ${i}`,
        purpose: 'Automated test user',
      });
    }
  }

  // Parse MANUAL_TEST_ADMIN_<N>
  for (let i = 1; i <= 10; i++) {
    const email = process.env[`MANUAL_TEST_ADMIN_${i}_EMAIL`];
    const password = process.env[`MANUAL_TEST_ADMIN_${i}_PASSWORD`];
    if (email && password) {
      users.push({
        email,
        password,
        role: 'system_admin',
        name: `Manual Admin ${i}`,
        purpose: 'Manual test system admin',
      });
    }
  }

  // Parse MANUAL_TEST_USER_<N>
  for (let i = 1; i <= 10; i++) {
    const email = process.env[`MANUAL_TEST_USER_${i}_EMAIL`];
    const password = process.env[`MANUAL_TEST_USER_${i}_PASSWORD`];
    if (email && password) {
      users.push({
        email,
        password,
        role: 'user',
        name: `Manual User ${i}`,
        purpose: 'Manual test user',
      });
    }
  }

  return users;
}

// Load all test users from environment (both automated and manual)
const TEST_USERS = getAllTestUsers();

if (TEST_USERS.length === 0) {
  console.error('❌ No test users found in environment variables');
  console.error('   Please configure test users in .env.test');
  process.exit(1);
}

// Invitations for invitation testing (sent by john)
const JOHN_INVITATIONS = [
  { invitee_email: 'testinvite1@fake.test' },
  { invitee_email: 'testinvite2@fake.test' },
];

// Test data for seeding
const JOHN_SCOREBOARDS = [
  {
    title: "John's Private Scoreboard",
    description: 'Private test scoreboard for RBAC testing',
    score_type: 'number' as const,
    sort_order: 'desc' as const,
    visibility: 'private' as const,
    entries: [
      { name: 'Alice Johnson', score: 950 },
      { name: 'Bob Williams', score: 850 },
      { name: 'Charlie Brown', score: 780 },
      { name: 'Diana Prince', score: 720 },
      { name: 'Eve Adams', score: 680 },
    ],
  },
  {
    title: "John's Public Leaderboard",
    description: 'Public test scoreboard visible to all users',
    score_type: 'number' as const,
    sort_order: 'desc' as const,
    visibility: 'public' as const,
    entries: [
      { name: 'Frank Castle', score: 1200 },
      { name: 'Grace Hopper', score: 1100 },
      { name: 'Henry Ford', score: 1050 },
      { name: 'Iris West', score: 990 },
      { name: 'Jack Ryan', score: 920 },
      { name: 'Kelly Olsen', score: 880 },
      { name: 'Leo Fitz', score: 850 },
    ],
  },
];

const SARAH_SCOREBOARDS = [
  {
    title: "Sarah's Race Times",
    description: 'Public time-based scoreboard',
    score_type: 'time' as const,
    sort_order: 'asc' as const,
    visibility: 'public' as const,
    time_format: 'mm:ss.ss' as const,
    entries: [
      { name: 'Runner A', score: 125.45 },
      { name: 'Runner B', score: 132.78 },
      { name: 'Runner C', score: 145.23 },
      { name: 'Runner D', score: 156.89 },
    ],
  },
  {
    title: "Sarah's Game Scores",
    description: 'Public number-based scoreboard',
    score_type: 'number' as const,
    sort_order: 'desc' as const,
    visibility: 'public' as const,
    entries: [
      { name: 'Player 1', score: 5600 },
      { name: 'Player 2', score: 5200 },
      { name: 'Player 3', score: 4800 },
      { name: 'Player 4', score: 4500 },
      { name: 'Player 5', score: 4200 },
    ],
  },
];

const SITEADMIN_SCOREBOARDS = [
  {
    title: 'Admin Dashboard Metrics',
    description: 'System-wide performance tracking',
    score_type: 'number' as const,
    sort_order: 'desc' as const,
    visibility: 'private' as const,
    entries: [
      { name: 'Total Users', score: 1542 },
      { name: 'Active Sessions', score: 387 },
      { name: 'API Calls Today', score: 9821 },
    ],
  },
];

const JANE_SCOREBOARDS = [
  {
    title: "Jane's Fitness Tracker",
    description: 'Weekly workout scores',
    score_type: 'number' as const,
    sort_order: 'desc' as const,
    visibility: 'private' as const,
    entries: [
      { name: 'Monday', score: 450 },
      { name: 'Tuesday', score: 520 },
      { name: 'Wednesday', score: 380 },
      { name: 'Thursday', score: 610 },
      { name: 'Friday', score: 490 },
    ],
  },
  {
    title: "Jane's Book Club Ratings",
    description: 'Monthly book ratings',
    score_type: 'number' as const,
    sort_order: 'desc' as const,
    visibility: 'public' as const,
    entries: [
      { name: 'The Great Gatsby', score: 95 },
      { name: '1984', score: 92 },
      { name: 'To Kill a Mockingbird', score: 88 },
    ],
  },
];

function getServiceRoleClient() {
  return createClient<Database>(supabaseUrl!, serviceRoleKey!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
    db: {
      schema: 'public',
    },
    global: {
      headers: {
        apikey: serviceRoleKey!,
      },
    },
  });
}

/**
 * Delete data (scoreboards, entries, invitations) for a user before deleting the user
 */
async function deleteUserData(supabase: SupabaseServiceClient, userId: string, userEmail: string) {
  try {
    console.log(`  🗑️  Cleaning up data for ${userEmail}...`);

    // Step 1: Get all scoreboards owned by this user
    const { data: scoreboards } = (await supabase
      .from('scoreboards')
      .select('id')
      .eq('owner_id', userId)) as { data: Pick<ScoreboardRow, 'id'>[] | null };

    const scoreboardIds = scoreboards?.map((s) => s.id) || [];

    let deletedEntries = 0;
    let deletedScoreboards = 0;
    let deletedInvitations = 0;

    // Step 2: Delete scoreboard entries (must be before scoreboards)
    if (scoreboardIds.length > 0) {
      const { error: entriesError, count } = await supabase
        .from('scoreboard_entries')
        .delete({ count: 'exact' })
        .in('scoreboard_id', scoreboardIds);

      if (!entriesError) {
        deletedEntries = count || 0;
      }
    }

    // Step 3: Delete scoreboards
    const { error: scoreboardsError, count: scoreboardsCount } = await supabase
      .from('scoreboards')
      .delete({ count: 'exact' })
      .eq('owner_id', userId);

    if (!scoreboardsError) {
      deletedScoreboards = scoreboardsCount || 0;
    }

    // Step 4: Delete invitations sent BY this user
    const { error: inviterError, count: inviterCount } = await supabase
      .from('invitations')
      .delete({ count: 'exact' })
      .eq('inviter_id', userId);

    if (!inviterError) {
      deletedInvitations = inviterCount || 0;
    }

    // Step 5: Delete invitations sent TO this user
    const { error: inviteeError, count: inviteeCount } = await supabase
      .from('invitations')
      .delete({ count: 'exact' })
      .eq('invitee_email', userEmail);

    if (!inviteeError) {
      deletedInvitations += inviteeCount || 0;
    }

    console.log(
      `  ✓ Deleted ${deletedEntries} entries, ${deletedScoreboards} scoreboards, ${deletedInvitations} invitations`
    );
  } catch (error) {
    console.warn(`  ⚠️  Error cleaning up data for ${userEmail}:`, error);
  }
}

/**
 * Delete user from Supabase Auth and user_profiles
 */
async function deleteUser(supabase: SupabaseServiceClient, email: string) {
  try {
    // Get user by email from Auth
    const {
      data: { users },
      error: listError,
    } = await supabase.auth.admin.listUsers();

    if (listError) {
      console.warn(`  ⚠️  Failed to list users: ${listError.message}`);
      return false;
    }

    const user = users?.find((u) => u.email === email);

    if (user) {
      // Delete ALL profiles with this email (catches orphaned profiles too)
      console.log(`  🗑️  Deleting all profiles for ${email}...`);

      const { error: profileError } = await supabase
        .from('user_profiles')
        .delete()
        .eq('email', email);

      if (profileError) {
        console.warn(`  ⚠️  Failed to delete profiles: ${profileError.message}`);
      } else {
        console.log(`  ✓ All profiles deleted`);
      }

      // Delete user from Auth
      console.log(`  🗑️  Deleting auth user ${email}...`);
      const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);

      if (deleteError) {
        console.warn(`  ⚠️  Failed to delete from auth: ${deleteError.message}`);
        return false;
      }

      console.log(`  ✓ Auth user deleted`);
    } else {
      // Check if orphaned profile exists
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('email', email);

      if (profiles && profiles.length > 0) {
        console.log(`  🗑️  Deleting orphaned profile for ${email}...`);

        // Delete orphaned profile
        const { error: orphanedProfileError } = await supabase
          .from('user_profiles')
          .delete()
          .eq('email', email);

        if (orphanedProfileError) {
          console.warn(`  ⚠️  Failed to delete orphaned profile: ${orphanedProfileError.message}`);
        } else {
          console.log(`  ✓ Orphaned profile deleted`);
        }
      } else {
        console.log(`  ℹ️  User ${email} does not exist`);
      }
    }

    return true;
  } catch (error) {
    console.warn(`  ⚠️  Error deleting ${email}:`, error);
    return false;
  }
}

/**
 * Create user in Supabase Auth and user_profiles
 */
async function createUser(
  supabase: SupabaseServiceClient,
  email: string,
  password: string,
  role: string,
  name: string
) {
  try {
    // Create user in Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: name,
      },
    });

    if (authError) {
      throw new Error(`Auth creation failed: ${authError.message}`);
    }

    if (!authData.user) {
      throw new Error('User creation returned no user data');
    }

    // Update user profile (trigger already created it)
    // Wait a bit for trigger to complete
    await new Promise((resolve) => setTimeout(resolve, 500));

    const { error: profileUpdateError } = await supabase
      .from('user_profiles')
      .update({
        full_name: name,
        role: role as 'user' | 'system_admin',
      } as never)
      .eq('id', authData.user.id);

    if (profileUpdateError) {
      throw new Error(`Profile update failed: ${profileUpdateError.message}`);
    }

    return authData.user.id;
  } catch (error) {
    throw error;
  }
}

/**
 * Call cleanup API to remove existing test data
 */
async function _cleanupTestData() {
  if (!cleanupApiKey) {
    console.log('⚠️  No TEST_CLEANUP_API_KEY found, skipping cleanup API call');
    return true;
  }

  try {
    const response = await fetch(`${baseUrl}/api/test/cleanup`, {
      method: 'POST',
      headers: {
        'x-cleanup-api-key': cleanupApiKey,
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.log('⚠️  Cleanup API not available (app may not be running)');
        return true;
      }
      const error = await response.json();
      console.warn(
        `⚠️  Cleanup API returned ${response.status}: ${error.error || 'Unknown error'}`
      );
      return false;
    }

    const result = await response.json();
    console.log(`✓ Cleaned up existing test data:`);
    console.log(`  - ${result.deletedScoreboards || 0} scoreboards`);
    console.log(`  - ${result.deletedEntries || 0} entries`);
    console.log(`  - ${result.deletedInvitations || 0} invitations`);
    return true;
  } catch (_error) {
    console.log('⚠️  Could not connect to cleanup API (app may not be running)');
    return true; // Continue anyway
  }
}

/**
 * Seed scoreboard with entries for a user
 */
async function seedScoreboard(
  supabase: SupabaseServiceClient,
  userId: string,
  scoreboard:
    | (typeof JOHN_SCOREBOARDS)[0]
    | (typeof SARAH_SCOREBOARDS)[0]
    | (typeof SITEADMIN_SCOREBOARDS)[0]
    | (typeof JANE_SCOREBOARDS)[0]
) {
  // Insert scoreboard with generated UUID
  const scoreboardId = randomUUID();
  const { data: scoreboardData, error: scoreboardError } = (await supabase
    .from('scoreboards')
    .insert({
      id: scoreboardId,
      owner_id: userId,
      title: scoreboard.title,
      description: scoreboard.description,
      score_type: scoreboard.score_type,
      sort_order: scoreboard.sort_order,
      visibility: scoreboard.visibility,
      time_format: 'time_format' in scoreboard ? scoreboard.time_format : null,
    } as never)
    .select()
    .single()) as { data: ScoreboardRow | null; error: Error | null };

  if (scoreboardError) {
    throw new Error(`Failed to create scoreboard: ${scoreboardError.message}`);
  }

  // Insert entries with generated UUIDs
  const entries = scoreboard.entries.map((entry) => ({
    id: randomUUID(),
    scoreboard_id: scoreboardData?.id || scoreboardId,
    name: entry.name,
    score: entry.score,
  }));

  const { error: entriesError } = await supabase
    .from('scoreboard_entries')
    .insert(entries as never);

  if (entriesError) {
    throw new Error(`Failed to create entries: ${entriesError.message}`);
  }

  return {
    scoreboardId: scoreboardData?.id || scoreboardId,
    entriesCount: entries.length,
  };
}

/**
 * Seed invitations for a user (for invitation testing)
 */
async function seedInvitations(
  supabase: SupabaseServiceClient,
  userId: string,
  invitations: typeof JOHN_INVITATIONS
) {
  const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  for (const invitation of invitations) {
    const { error } = await supabase.from('invitations').insert({
      id: randomUUID(),
      inviter_id: userId,
      invitee_email: invitation.invitee_email,
      status: 'pending',
      expires_at: sevenDaysFromNow,
    } as never);

    if (error) {
      throw new Error(`Failed to create invitation: ${error.message}`);
    }
  }

  return invitations.length;
}

/**
 * Clean up orphaned data (scoreboards without valid owners, entries without valid scoreboards)
 */
async function cleanupOrphanedData(supabase: SupabaseServiceClient) {
  console.log('🧹 Cleaning up orphaned data...\n');

  try {
    // Step 1: Get all valid user IDs from user_profiles
    const { data: profiles } = (await supabase.from('user_profiles').select('id')) as {
      data: Pick<UserProfileRow, 'id'>[] | null;
    };

    const validUserIds = (profiles || []).map((p) => p.id);

    // Step 2: Delete scoreboards with invalid owner_id
    const { data: allScoreboards } = (await supabase
      .from('scoreboards')
      .select('id, owner_id')) as { data: Pick<ScoreboardRow, 'id' | 'owner_id'>[] | null };

    const orphanedScoreboards = (allScoreboards || []).filter(
      (s) => !validUserIds.includes(s.owner_id)
    );

    if (orphanedScoreboards.length > 0) {
      console.log(`  Found ${orphanedScoreboards.length} orphaned scoreboard(s)`);

      // Delete entries for these orphaned scoreboards first
      const orphanedScoreboardIds = orphanedScoreboards.map((s) => s.id);
      const { count: entriesCount } = await supabase
        .from('scoreboard_entries')
        .delete({ count: 'exact' })
        .in('scoreboard_id', orphanedScoreboardIds);

      console.log(`  ✓ Deleted ${entriesCount || 0} entries from orphaned scoreboards`);

      // Delete the orphaned scoreboards
      const { count: scoreboardsCount } = await supabase
        .from('scoreboards')
        .delete({ count: 'exact' })
        .in('id', orphanedScoreboardIds);

      console.log(`  ✓ Deleted ${scoreboardsCount || 0} orphaned scoreboards`);
    } else {
      console.log('  No orphaned scoreboards found');
    }

    // Step 3: Get all valid scoreboard IDs
    const { data: validScoreboards } = (await supabase.from('scoreboards').select('id')) as {
      data: Pick<ScoreboardRow, 'id'>[] | null;
    };

    const validScoreboardIds = (validScoreboards || []).map((s) => s.id);

    // Step 4: Delete entries with invalid scoreboard_id
    const { data: allEntries } = (await supabase
      .from('scoreboard_entries')
      .select('id, scoreboard_id')) as {
      data: Pick<ScoreboardEntryRow, 'id' | 'scoreboard_id'>[] | null;
    };

    const orphanedEntries = (allEntries || []).filter(
      (e) => !validScoreboardIds.includes(e.scoreboard_id)
    );

    if (orphanedEntries.length > 0) {
      const orphanedEntryIds = orphanedEntries.map((e) => e.id);
      const { count: entriesCount } = await supabase
        .from('scoreboard_entries')
        .delete({ count: 'exact' })
        .in('id', orphanedEntryIds);

      console.log(`  ✓ Deleted ${entriesCount || 0} orphaned entries`);
    } else {
      console.log('  No orphaned entries found');
    }

    console.log('');
  } catch (error) {
    console.warn('  ⚠️  Error cleaning up orphaned data:', error);
  }
}

/**
 * Main refresh function
 */
async function main() {
  console.log('🔄 Starting FULL test data refresh (all users)...\n');
  console.log(
    `⚠️  This will reset ALL ${TEST_USERS.length} test users including manual testing users!\n`
  );

  const supabase = getServiceRoleClient();

  try {
    // Step 1: Clean up orphaned data first
    await cleanupOrphanedData(supabase);

    // Step 2: Complete cleanup - delete ALL users not in TEST_USERS
    console.log('🗑️  Removing non-test users...\n');

    const { data: allAuthUsers } = await supabase.auth.admin.listUsers();
    const testUserEmails: string[] = TEST_USERS.map((u) => u.email);
    const usersToDelete = allAuthUsers.users.filter((u) => !testUserEmails.includes(u.email || ''));

    if (usersToDelete.length > 0) {
      console.log(`Found ${usersToDelete.length} non-test user(s) to delete:\n`);
      for (const user of usersToDelete) {
        console.log(`  Deleting ${user.email}...`);
        if (user.id && user.email) {
          await deleteUserData(supabase, user.id, user.email);
          await deleteUser(supabase, user.email);
          console.log(`  ✓ Deleted ${user.email}`);
        }
      }
      console.log('');
    } else {
      console.log('No non-test users found to delete.\n');
    }

    // Step 3: Delete and recreate all test users
    console.log('👥 Managing test users...');
    const createdUsers: { [key: string]: string } = {};

    for (const user of TEST_USERS) {
      console.log(`\n  Processing ${user.email} (${user.purpose})...`);

      // First, get the user ID if they exist (for data cleanup)
      const { data: authUser } = await supabase.auth.admin.listUsers();
      const existingUser = authUser.users.find((u) => u.email === user.email);

      // Delete user's data before deleting the user
      if (existingUser) {
        await deleteUserData(supabase, existingUser.id, user.email);
      }

      // Delete existing user
      await deleteUser(supabase, user.email);

      // Create new user
      const userId = await createUser(supabase, user.email, user.password, user.role, user.name);
      createdUsers[user.email] = userId;

      console.log(`  ✓ Created ${user.email} with role: ${user.role}`);
    }

    console.log('\n✅ All users created successfully\n');

    // Step 4: Seed data for regular users
    const regularUsers = TEST_USERS.filter((u) => u.role === 'user');

    // Seed first regular user (if exists) with JOHN_SCOREBOARDS and invitations
    if (regularUsers[0] && createdUsers[regularUsers[0].email]) {
      const user1Email = regularUsers[0].email;
      const user1Id = createdUsers[user1Email];

      console.log(`📝 Seeding ${user1Email}'s scoreboards...`);
      for (const scoreboard of JOHN_SCOREBOARDS) {
        const result = await seedScoreboard(supabase, user1Id, scoreboard);
        console.log(`  ✓ Created "${scoreboard.title}" with ${result.entriesCount} entries`);
      }

      console.log(`\n📧 Seeding ${user1Email}'s invitations...`);
      const invitationsCount = await seedInvitations(supabase, user1Id, JOHN_INVITATIONS);
      console.log(`  ✓ Created ${invitationsCount} invitations for invitation testing`);
    }

    // Seed second regular user (if exists) with SARAH_SCOREBOARDS
    if (regularUsers[1] && createdUsers[regularUsers[1].email]) {
      const user2Email = regularUsers[1].email;
      const user2Id = createdUsers[user2Email];

      console.log(`\n📝 Seeding ${user2Email}'s scoreboards...`);
      for (const scoreboard of SARAH_SCOREBOARDS) {
        const result = await seedScoreboard(supabase, user2Id, scoreboard);
        console.log(`  ✓ Created "${scoreboard.title}" with ${result.entriesCount} entries`);
      }
    }

    // Seed third regular user (if exists) with JANE_SCOREBOARDS
    if (regularUsers[2] && createdUsers[regularUsers[2].email]) {
      const user3Email = regularUsers[2].email;
      const user3Id = createdUsers[user3Email];

      console.log(`\n📝 Seeding ${user3Email}'s scoreboards...`);
      for (const scoreboard of JANE_SCOREBOARDS) {
        const result = await seedScoreboard(supabase, user3Id, scoreboard);
        console.log(`  ✓ Created "${scoreboard.title}" with ${result.entriesCount} entries`);
      }
    }

    // Seed admin users with SITEADMIN_SCOREBOARDS (first admin gets it)
    const adminUsers = TEST_USERS.filter((u) => u.role === 'system_admin');
    if (adminUsers[0] && createdUsers[adminUsers[0].email]) {
      const adminEmail = adminUsers[0].email;
      const adminId = createdUsers[adminEmail];

      console.log(`\n📝 Seeding ${adminEmail}'s scoreboards...`);
      for (const scoreboard of SITEADMIN_SCOREBOARDS) {
        const result = await seedScoreboard(supabase, adminId, scoreboard);
        console.log(`  ✓ Created "${scoreboard.title}" with ${result.entriesCount} entries`);
      }
    }

    // Success summary
    console.log('\n✅ FULL test data refresh completed successfully!\n');
    console.log('📊 Summary:');
    console.log('  Users created:');
    for (const user of TEST_USERS) {
      console.log(`    - ${user.email} (${user.role}) - ${user.purpose}`);
    }
    console.log('\n  Passwords: As configured in .env.test\n');
  } catch (error) {
    console.error('\n❌ Refresh failed:', error);
    process.exit(1);
  }
}

main();
