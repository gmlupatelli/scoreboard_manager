const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

function loadTestEnv() {
  const projectRoot = path.resolve(__dirname, '..');
  const envLocalPath = path.join(projectRoot, '.env.local');
  const envTestPath = path.join(projectRoot, '.env.test');

  if (fs.existsSync(envLocalPath)) {
    dotenv.config({ path: envLocalPath });
  }

  if (fs.existsSync(envTestPath)) {
    dotenv.config({ path: envTestPath });
  }
}

module.exports = { loadTestEnv };
