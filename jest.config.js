/** @type {import('jest').Config} */
const config = {
  displayName: 'scoreboard-manager',
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts', '**/__tests__/**/*.test.tsx'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/src/test-setup.ts'],
  collectCoverageFrom: [
    'src/utils/**/*.{ts,tsx}',
    'src/services/**/*.{ts,tsx}',
    'src/hooks/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/test-setup.ts',
    '!src/**/__tests__/**',
  ],
  // Temporary: Disable babel-plugin-istanbul coverage instrumentation due to compatibility issue
  // Will be re-enabled for CI/production use; tests run via npm run test:unit still execute
  collectCoverage: false,
  coveragePathIgnorePatterns: ['/node_modules/', '/.next/'],
  coverageThreshold: {
    global: {
      lines: 50,
      functions: 50,
      branches: 40,
      statements: 50,
    },
    './src/utils/': {
      lines: 90,
      functions: 90,
      branches: 85,
      statements: 90,
    },
  },
  transformIgnorePatterns: ['node_modules/(?!(@supabase|@heroicons)/)'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  testPathIgnorePatterns: ['/node_modules/', '/.next/'],
};

module.exports = config;
