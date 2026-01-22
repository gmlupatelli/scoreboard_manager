/**
 * Playwright Global Teardown
 * Runs once after all tests complete
 * Calls cleanup API to delete john/sarah test data
 */

import { loadTestEnv } from './loadTestEnv.js';

loadTestEnv();

async function globalTeardown() {
  console.log('\n🧹 Running global teardown - cleaning test data...\n');

  const baseUrl = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:5000';
  const apiKey = process.env.TEST_CLEANUP_API_KEY;

  if (!apiKey) {
    console.warn('⚠️  TEST_CLEANUP_API_KEY not set - skipping cleanup');
    return;
  }

  try {
    const response = await fetch(`${baseUrl}/api/test/cleanup`, {
      method: 'POST',
      headers: {
        'x-cleanup-api-key': apiKey,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Cleanup failed: ${response.status} ${response.statusText}`);
      console.error(`   Response: ${errorText}`);
      return;
    }

    const result = await response.json();

    console.log('✅ Test data cleaned successfully');
    console.log(`   Users cleaned: ${result.cleanedUsers?.join(', ') || 'none'}`);
    console.log(`   Entries deleted: ${result.deletedEntries || 0}`);
    console.log(`   Scoreboards deleted: ${result.deletedScoreboards || 0}`);
    console.log(`   Invitations deleted: ${result.deletedInvitations || 0}`);
    console.log(`   Timestamp: ${result.timestamp || 'N/A'}\n`);
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    // Don't fail the entire test run if cleanup fails
  }
}

export default globalTeardown;
