// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from "eslint-plugin-storybook";

const globals = require('globals');
const eslint = require('@eslint/js');

module.exports = [
  // Global ignores
  {
    ignores: [
      'node_modules/',
      '**/node_modules/',
      'dist/',
      'build/',
      '.next/',
      'coverage/',
      'test-*.js',
    ],
  },
  eslint.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.es2022,
      },
    },
    rules: {
      'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
      'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' }],
      'prefer-const': 'error',
      'no-var': 'error',
    },
  },
  // Browser scripts in public directories
  {
    files: ['**/public/**/*.js'],
    ignores: ['**/public/**/sw.js'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.es2022,
      },
    },
  },
  // Service workers
  {
    files: ['**/sw.js', '**/service-worker.js'],
    languageOptions: {
      globals: {
        ...globals.serviceworker,
        ...globals.es2022,
      },
    },
  },
];
