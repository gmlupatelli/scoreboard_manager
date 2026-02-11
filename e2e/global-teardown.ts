/**
 * Playwright Global Teardown
 * Runs once after all tests complete.
 *
 * Previously this called /api/test/cleanup to delete test data (scoreboards,
 * entries, invitations) after every run. This caused persistent flakiness
 * because the next run's global-setup only *verifies* data — it doesn't
 * re-seed it. So if the previous teardown cleaned data and no manual
 * `npm run refresh-test-data` was run before the next test suite,
 * tests would find empty dashboards and fail.
 *
 * The teardown now only logs a summary. Test data is managed exclusively by
 * `npm run refresh-test-data` which handles both cleanup and re-seeding
 * in a single atomic operation.
 */

async function globalTeardown() {
  console.log('\n🏁 Global teardown complete.\n');
  console.log('   Test data has been preserved for the next run.');
  console.log('   To reset: npm run refresh-test-data\n');
}

export default globalTeardown;
