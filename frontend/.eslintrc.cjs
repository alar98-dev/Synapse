/** ESLint configuration aligned to React + TypeScript and project ruleset. */
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2024,
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
    project: './tsconfig.json',
  },
  plugins: ['@typescript-eslint', 'react', 'react-hooks', 'import'],
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
    'plugin:import/errors',
    'plugin:import/warnings',
    'plugin:import/typescript',
    'prettier',
  ],
  settings: {
    react: { version: 'detect' },
    'import/resolver': {
      node: { extensions: ['.js', '.jsx', '.ts', '.tsx', '.css'] },
    },
  },
  env: { browser: true, es2021: true, node: true },
  rules: {
    // Blocking errors
    '@typescript-eslint/no-explicit-any': 'error',
    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'no-console': ['error', { allow: ['warn', 'error'] }],
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'error',
    '@typescript-eslint/no-floating-promises': 'error',
    '@typescript-eslint/consistent-type-imports': 'error',
    'import/no-default-export': 'error',

    // Warnings & stylistic
    complexity: ['warn', 10],
    'max-lines-per-function': ['warn', { max: 50, skipComments: true, skipBlankLines: true }],
  },
  overrides: [
    // Allow default export for views and App
    {
      files: ['src/views/**', 'src/App.tsx'],
      rules: { 'import/no-default-export': 'off' },
    },
    {
      files: ['src/components/**'],
      rules: { 'import/no-default-export': 'off' },
    },
    {
      files: ['src/api/**', 'src/islands/**'],
      rules: { 'import/no-default-export': 'off' },
    },
    // JS legacy files: allow less strict rules but mark as legacy
    {
      files: ['**/*.js'],
      rules: { '@typescript-eslint/no-var-requires': 'off' },
    },
  ],
}
