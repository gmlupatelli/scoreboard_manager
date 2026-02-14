import js from '@eslint/js';
import nextConfig from 'eslint-config-next/core-web-vitals';
import prettierConfig from 'eslint-config-prettier';
import globals from 'globals';
import typescriptPlugin from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import prettierPlugin from 'eslint-plugin-prettier';

// --- Shared constants ---

const jsxFiles = ['**/*.{js,jsx,mjs,ts,tsx}'];

const baseGlobals = {
  ...globals.browser,
  ...globals.node,
  ...globals.es2021,
};

const jestGlobals = {
  ...globals.jest,
};

const a11yOverrides = {
  'jsx-a11y/click-events-have-key-events': 'off',
  'jsx-a11y/no-static-element-interactions': 'off',
  'jsx-a11y/no-noninteractive-element-interactions': 'off',
  'jsx-a11y/label-has-associated-control': 'off',
  'jsx-a11y/no-autofocus': 'off',
};

const reactHooksOverrides = {
  'react-hooks/set-state-in-effect': 'off',
  'react-hooks/preserve-manual-memoization': 'off',
};

const tsUnusedVarsRule = {
  '@typescript-eslint/no-unused-vars': [
    'warn',
    {
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_',
      caughtErrorsIgnorePattern: '^_',
    },
  ],
};

const tsCustomRules = {
  ...tsUnusedVarsRule,
  '@typescript-eslint/no-explicit-any': 'warn',
};

// --- Config ---

const config = [
  // Ignore patterns
  {
    ignores: [
      'node_modules/',
      '.next/',
      'out/',
      'public/',
      'playwright-report/',
      'test-results/',
      'coverage/',
      'next-env.d.ts',
    ],
  },

  // Global language options
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: baseGlobals,
    },
  },

  // Base JS recommended rules
  js.configs.recommended,

  // Next.js core-web-vitals (includes react, react-hooks, jsx-a11y, @next/next, @typescript-eslint)
  ...nextConfig,

  // Global a11y + react-hooks overrides
  {
    files: jsxFiles,
    rules: {
      ...a11yOverrides,
      ...reactHooksOverrides,
    },
  },

  // TypeScript and custom rules (main app)
  {
    files: ['**/*.ts', '**/*.tsx'],
    ignores: ['e2e/**'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        project: './tsconfig.json',
      },
      globals: baseGlobals,
    },
    plugins: {
      '@typescript-eslint': typescriptPlugin,
      prettier: prettierPlugin,
    },
    rules: {
      'react/no-unescaped-entities': 'off',
      'no-undef': 'off',
      'no-unused-vars': 'off',
      ...tsCustomRules,
      'prettier/prettier': 'error',
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-misused-promises': [
        'error',
        { checksVoidReturn: { attributes: false } },
      ],
      '@typescript-eslint/await-thenable': 'warn',
      '@typescript-eslint/require-await': 'warn',
      'no-console': [
        'warn',
        {
          allow: ['warn', 'error', 'info'],
        },
      ],
    },
  },

  // E2E test files (Playwright's 'use' is not a React hook)
  {
    files: ['e2e/**/*.ts'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        project: './tsconfig.e2e.json',
      },
      globals: baseGlobals,
    },
    plugins: {
      '@typescript-eslint': typescriptPlugin,
      prettier: prettierPlugin,
    },
    rules: {
      'react-hooks/rules-of-hooks': 'off',
      'no-undef': 'off',
      'no-unused-vars': 'off',
      // Playwright destructuring patterns like ({}, use) and wrapped try/catch
      'no-empty-pattern': 'off',
      'no-useless-catch': 'off',
      ...tsCustomRules,
      'prettier/prettier': 'error',
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-misused-promises': [
        'error',
        { checksVoidReturn: { attributes: false } },
      ],
      'no-console': 'off',
    },
  },

  // Jest/unit test files
  {
    files: ['**/__tests__/**/*.{ts,tsx,js,jsx}', '**/*.test.{ts,tsx,js,jsx}', 'src/test-setup.ts'],
    languageOptions: {
      globals: {
        ...baseGlobals,
        ...jestGlobals,
      },
    },
    rules: {
      'no-undef': 'off',
    },
  },

  // JavaScript files
  {
    files: ['**/*.js', '**/*.mjs'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: baseGlobals,
    },
    plugins: {
      prettier: prettierPlugin,
    },
    rules: {
      'prettier/prettier': 'error',
      'no-console': [
        'warn',
        {
          allow: ['warn', 'error', 'info'],
        },
      ],
    },
  },

  // eslint-config-prettier must be last to disable conflicting rules
  prettierConfig,
];

export default config;
