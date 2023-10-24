module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.json',
    tsconfigRootDir: __dirname,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint/eslint-plugin', 'import', 'unused-imports'],
  extends: ['plugin:@typescript-eslint/recommended', 'plugin:prettier/recommended'],
  root: true,
  env: {
    node: true,
    jest: true,
  },
  ignorePatterns: ['.eslintrc.js'],
  rules: {
    // Prettier
    'prettier/prettier': ['error', { printWidth: 100 }],

    // typescript-eslint
    'require-await': 'off',
    '@typescript-eslint/require-await': 'warn',
    '@typescript-eslint/no-floating-promises': 'error',
    '@typescript-eslint/no-empty-function': 'off',
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'off',

    // unused-imports
    '@typescript-eslint/no-unused-vars': 'off',
    'unused-imports/no-unused-imports': 'warn',
    'unused-imports/no-unused-vars': 'warn',

    // Import
    'import/no-duplicates': 'error',
    'import/order': [
      'error',
      {
        pathGroups: [
          {
            pattern: '@nestjs/**',
            group: 'builtin',
          },
        ],

        groups: ['builtin', 'external', ['internal', 'parent', 'sibling']],
        pathGroupsExcludedImportTypes: [],
        'newlines-between': 'always',
        alphabetize: { order: 'asc', caseInsensitive: true },
      },
    ],
  },
};
