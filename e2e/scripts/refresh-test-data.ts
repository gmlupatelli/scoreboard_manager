/**
 * Refresh Test Data Script
 * 
 * Comprehensive test data reset:
 * 1. Deletes and recreates all 5 test users (admin, john, sarah, siteadmin, jane)
 * 2. Calls cleanup API to remove existing test data
 * 3. Seeds fresh data for john and sarah
 * 4. Leaves admin, siteadmin, and jane clean for testing
 * 
 * Usage: npm run refresh-test-data
 * 
 * Prerequisites:
 * - .env.test must be configured with SUPABASE credentials
 * - TEST_CLEANUP_API_KEY must be set
 * - Application should be running on localhost:5000 (optional - only for cleanup)
 */

import { createClient } from '@supabase/supabase-js';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';
import { randomUUID } from 'crypto';
import type { Database } from '../../src/types/database.types';

// ES module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load test environment variables from .env.test
const envPath = path.resolve(__dirname, '../../.env.test');
config({ path: envPath });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SECRET_KEY;
const cleanupApiKey = process.env.TEST_CLEANUP_API_KEY;
const baseUrl = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:5000';

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing required environment variables: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY');
  process.exit(1);
}

// Test users configuration
const TEST_USERS = [
  {
    email: 'admin@example.com',
    password: 'test123',
    role: 'system_admin',
    name: 'Test Admin',
    purpose: 'Automated test system admin',
  },
  {
    email: 'john@example.com',
    password: 'test123',
    role: 'user',
    name: 'John Doe',
    purpose: 'Automated test user',
  },
  {
    email: 'sarah@example.com',
    password: 'test123',
    role: 'user',
    name: 'Sarah Smith',
    purpose: 'Automated test user',
  },
  {
    email: 'siteadmin@example.com',
    password: 'test123',
    role: 'system_admin',
    name: 'Site Admin',
    purpose: 'Manual test admin',
  },
  {
    email: 'jane@example.com',
    password: 'test123',
    role: 'user',
    name: 'Jane Cooper',
    purpose: 'Manual test user',
  },
] as const;

// Test data for seeding
const JOHN_SCOREBOARDS = [
  {
    title: "John's Private Scoreboard",
    subtitle: 'Private test scoreboard for RBAC testing',
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
    subtitle: 'Public test scoreboard visible to all users',
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
    subtitle: 'Public time-based scoreboard',
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
    subtitle: 'Public number-based scoreboard',
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
    subtitle: 'System-wide performance tracking',
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
    subtitle: 'Weekly workout scores',
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
    subtitle: 'Monthly book ratings',
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
        'apikey': serviceRoleKey!,
      },
    },
  });
}

/**
 * Delete data (scoreboards, entries, invitations) for a user before deleting the user
 */
async function deleteUserData(
  supabase: ReturnType<typeof getServiceRoleClient>,
  userId: string,
  userEmail: string
) {
  try {
    console.log(`  🗑️  Cleaning up data for ${userEmail}...`);

    // Step 1: Get all scoreboards owned by this user
    const { data: scoreboards } = await (supabase as any)
      .from('scoreboards')
      .select('id')
      .eq('owner_id', userId);

    const scoreboardIds = scoreboards?.map((s: any) => s.id) || [];

    let deletedEntries = 0;
    let deletedScoreboards = 0;
    let deletedInvitations = 0;

    // Step 2: Delete scoreboard entries (must be before scoreboards)
    if (scoreboardIds.length > 0) {
      const { error: entriesError, count } = await (supabase as any)
        .from('scoreboard_entries')
        .delete()
        .in('scoreboard_id', scoreboardIds);

      if (!entriesError) {
        deletedEntries = count || 0;
      }
    }

    // Step 3: Delete scoreboards
    const { error: scoreboardsError, count: scoreboardsCount } = await (supabase as any)
      .from('scoreboards')
      .delete()
      .eq('owner_id', userId);

    if (!scoreboardsError) {
      deletedScoreboards = scoreboardsCount || 0;
    }

    // Step 4: Delete invitations sent BY this user
    const { error: inviterError, count: inviterCount } = await (supabase as any)
      .from('invitations')
      .delete()
      .eq('inviter_id', userId);

    if (!inviterError) {
      deletedInvitations = inviterCount || 0;
    }

    // Step 5: Delete invitations sent TO this user
    const { error: inviteeError, count: inviteeCount } = await (supabase as any)
      .from('invitations')
      .delete()
      .eq('invitee_email', userEmail);

    if (!inviteeError) {
      deletedInvitations += inviteeCount || 0;
    }

    console.log(`  ✓ Deleted ${deletedEntries} entries, ${deletedScoreboards} scoreboards, ${deletedInvitations} invitations`);

  } catch (error) {
    console.warn(`  ⚠️  Error cleaning up data for ${userEmail}:`, error);
  }
}

/**
 * Delete user from Supabase Auth and user_profiles
 */
async function deleteUser(supabase: ReturnType<typeof getServiceRoleClient>, email: string) {
  try {
    // Get user by email from Auth
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.warn(`  ⚠️  Failed to list users: ${listError.message}`);
      return false;
    }

    const user = users?.find(u => u.email === email);
    
    if (user) {
      // Delete ALL profiles with this email (catches orphaned profiles too)
      console.log(`  🗑️  Deleting all profiles for ${email}...`);
      
      const profileDeleteResult: any = await supabase
        .from('user_profiles')
        .delete()
        .eq('email', email);
      
      if (profileDeleteResult.error) {
        console.warn(`  ⚠️  Failed to delete profiles: ${profileDeleteResult.error.message}`);
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
        const profileDeleteResult: any = await supabase
          .from('user_profiles')
          .delete()
          .eq('email', email);
        
        if (profileDeleteResult.error) {
          console.warn(`  ⚠️  Failed to delete orphaned profile: ${profileDeleteResult.error.message}`);
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
  supabase: ReturnType<typeof getServiceRoleClient>,
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
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const profileUpdateResult = await (supabase as any)
      .from('user_profiles')
      .update({
        full_name: name,
        role: role as 'user' | 'system_admin',
      })
      .eq('id', authData.user.id);

    if (profileUpdateResult.error) {
      throw new Error(`Profile update failed: ${profileUpdateResult.error.message}`);
    }

    return authData.user.id;
  } catch (error) {
    throw error;
  }
}

/**
 * Call cleanup API to remove existing test data
 */
async function cleanupTestData() {
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
      console.warn(`⚠️  Cleanup API returned ${response.status}: ${error.error || 'Unknown error'}`);
      return false;
    }

    const result = await response.json();
    console.log(`✓ Cleaned up existing test data:`);
    console.log(`  - ${result.deletedScoreboards || 0} scoreboards`);
    console.log(`  - ${result.deletedEntries || 0} entries`);
    console.log(`  - ${result.deletedInvitations || 0} invitations`);
    return true;
  } catch (error) {
    console.log('⚠️  Could not connect to cleanup API (app may not be running)');
    return true; // Continue anyway
  }
}

/**
 * Seed scoreboard with entries for a user
 */
async function seedScoreboard(
  supabase: ReturnType<typeof getServiceRoleClient>,
  userId: string,
  scoreboard: typeof JOHN_SCOREBOARDS[0] | typeof SARAH_SCOREBOARDS[0] | typeof SITEADMIN_SCOREBOARDS[0] | typeof JANE_SCOREBOARDS[0]
) {
  // Insert scoreboard with generated UUID
  const scoreboardId = randomUUID();
  const { data: scoreboardData, error: scoreboardError } = await supabase
    .from('scoreboards')
    .insert({
      id: scoreboardId,
      owner_id: userId,
      title: scoreboard.title,
      subtitle: scoreboard.subtitle,
      score_type: scoreboard.score_type,
      sort_order: scoreboard.sort_order,
      visibility: scoreboard.visibility,
      time_format: 'time_format' in scoreboard ? scoreboard.time_format : null,
    } as any)
    .select()
    .single();

  if (scoreboardError) {
    throw new Error(`Failed to create scoreboard: ${scoreboardError.message}`);
  }

  // Insert entries with generated UUIDs
  const entries = scoreboard.entries.map(entry => ({
    id: randomUUID(),
    scoreboard_id: (scoreboardData as any).id,
    name: entry.name,
    score: entry.score,
  }));

  const { error: entriesError } = await supabase
    .from('scoreboard_entries')
    .insert(entries as any);

  if (entriesError) {
    throw new Error(`Failed to create entries: ${entriesError.message}`);
  }

  return {
    scoreboardId: (scoreboardData as any).id,
    entriesCount: entries.length,
  };
}

/**
 * Clean up orphaned data (scoreboards without valid owners, entries without valid scoreboards)
 */
async function cleanupOrphanedData(supabase: ReturnType<typeof getServiceRoleClient>) {
  console.log('🧹 Cleaning up orphaned data...\n');

  try {
    // Step 1: Get all valid user IDs from user_profiles
    const { data: profiles } = await (supabase as any)
      .from('user_profiles')
      .select('id');
    
    const validUserIds = profiles?.map((p: any) => p.id) || [];
    
    // Step 2: Delete scoreboards with invalid owner_id
    const { data: allScoreboards } = await (supabase as any)
      .from('scoreboards')
      .select('id, owner_id');
    
    const orphanedScoreboards = allScoreboards?.filter((s: any) => !validUserIds.includes(s.owner_id)) || [];
    
    if (orphanedScoreboards.length > 0) {
      console.log(`  Found ${orphanedScoreboards.length} orphaned scoreboard(s)`);
      
      // Delete entries for these orphaned scoreboards first
      const orphanedScoreboardIds = orphanedScoreboards.map((s: any) => s.id);
      const { count: entriesCount } = await (supabase as any)
        .from('scoreboard_entries')
        .delete()
        .in('scoreboard_id', orphanedScoreboardIds);
      
      console.log(`  ✓ Deleted ${entriesCount || 0} entries from orphaned scoreboards`);
      
      // Delete the orphaned scoreboards
      const { count: scoreboardsCount } = await (supabase as any)
        .from('scoreboards')
        .delete()
        .in('id', orphanedScoreboardIds);
      
      console.log(`  ✓ Deleted ${scoreboardsCount || 0} orphaned scoreboards`);
    } else {
      console.log('  No orphaned scoreboards found');
    }
    
    // Step 3: Get all valid scoreboard IDs
    const { data: validScoreboards } = await (supabase as any)
      .from('scoreboards')
      .select('id');
    
    const validScoreboardIds = validScoreboards?.map((s: any) => s.id) || [];
    
    // Step 4: Delete entries with invalid scoreboard_id
    const { data: allEntries } = await (supabase as any)
      .from('scoreboard_entries')
      .select('id, scoreboard_id');
    
    const orphanedEntries = allEntries?.filter((e: any) => !validScoreboardIds.includes(e.scoreboard_id)) || [];
    
    if (orphanedEntries.length > 0) {
      const orphanedEntryIds = orphanedEntries.map((e: any) => e.id);
      const { count: entriesCount } = await (supabase as any)
        .from('scoreboard_entries')
        .delete()
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
  console.log('🔄 Starting test data refresh...\n');

  const supabase = getServiceRoleClient();

  try {
    // Step 1: Clean up orphaned data first
    await cleanupOrphanedData(supabase);

    // Step 2: Complete cleanup - delete ALL users not in TEST_USERS
    console.log('🗑️  Removing non-test users...\n');
    
    const { data: allAuthUsers } = await supabase.auth.admin.listUsers();
    const testUserEmails: string[] = TEST_USERS.map(u => u.email);
    const usersToDelete = allAuthUsers.users.filter(u => !testUserEmails.includes(u.email || ''));
    
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

    // Step 4: Seed John's scoreboards
    console.log("📝 Seeding John's scoreboards...");
    const johnUserId = createdUsers['john@example.com'];
    
    for (const scoreboard of JOHN_SCOREBOARDS) {
      const result = await seedScoreboard(supabase, johnUserId, scoreboard);
      console.log(`  ✓ Created "${scoreboard.title}" with ${result.entriesCount} entries`);
    }

    // Step 5: Seed Sarah's scoreboards
    console.log("\n📝 Seeding Sarah's scoreboards...");
    const sarahUserId = createdUsers['sarah@example.com'];
    
    for (const scoreboard of SARAH_SCOREBOARDS) {
      const result = await seedScoreboard(supabase, sarahUserId, scoreboard);
      console.log(`  ✓ Created "${scoreboard.title}" with ${result.entriesCount} entries`);
    }

    // Step 6: Seed Site Admin's scoreboards
    console.log("\n📝 Seeding Site Admin's scoreboards...");
    const siteadminUserId = createdUsers['siteadmin@example.com'];
    
    for (const scoreboard of SITEADMIN_SCOREBOARDS) {
      const result = await seedScoreboard(supabase, siteadminUserId, scoreboard);
      console.log(`  ✓ Created "${scoreboard.title}" with ${result.entriesCount} entries`);
    }

    // Step 7: Seed Jane's scoreboards
    console.log("\n📝 Seeding Jane's scoreboards...");
    const janeUserId = createdUsers['jane@example.com'];
    
    for (const scoreboard of JANE_SCOREBOARDS) {
      const result = await seedScoreboard(supabase, janeUserId, scoreboard);
      console.log(`  ✓ Created "${scoreboard.title}" with ${result.entriesCount} entries`);
    }

    // Success summary
    console.log('\n✅ Test data refresh completed successfully!\n');
    console.log('📊 Summary:');
    console.log('  Users created:');
    console.log('    - admin@example.com (system_admin) - Clean for testing');
    console.log('    - john@example.com (user) - 2 scoreboards with entries');
    console.log('    - sarah@example.com (user) - 2 scoreboards with entries');
    console.log('    - siteadmin@example.com (system_admin) - 1 scoreboard with entries');
    console.log('    - jane@example.com (user) - 2 scoreboards with entries');
    console.log('\n  All passwords: test123\n');

  } catch (error) {
    console.error('\n❌ Refresh failed:', error);
    process.exit(1);
  }
}

main();
