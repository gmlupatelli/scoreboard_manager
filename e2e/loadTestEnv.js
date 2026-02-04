const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

function loadTestEnv() {
  const projectRoot = path.resolve(__dirname, '..');
  const envLocalPath = path.join(projectRoot, '.env.local');
  const envTestPath = path.join(projectRoot, '.env.test');

  // Suppress dotenv tips/warnings
  const options = { quiet: true };

  if (fs.existsSync(envLocalPath)) {
    dotenv.config({ path: envLocalPath, ...options });
  }

  if (fs.existsSync(envTestPath)) {
    dotenv.config({ path: envTestPath, ...options });
  }
}

module.exports = { loadTestEnv };
