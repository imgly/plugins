module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'react'],
  env: {
    browser: true,
    jest: true
  },
  extends: [
    'airbnb',
    'airbnb-typescript',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    'plugin:import/recommended',
    'plugin:import/typescript',
    'plugin:react-hooks/recommended',
    'prettier'
  ],
  ignorePatterns: [
    'node_modules/',
    '.eslintrc.js',
    '**/dist/**/*',
    'examples',
    '**/esbuild/**/*',
    '**/scripts/**/*',
    '**/lib/**/*',
  ],
  globals: {
    globalThis: 'readonly'
  },
  parserOptions: {
    ecmaFeatures: {
      jsx: true
    },
    project: true
  },
  settings: {
    react: {
      version: '^18.0.0'
    }
  },
  rules: {
    'import/extensions': [
      1,
      { tsx: 0, ts: 0, json: 1, scss: 1, svg: 1, lazy: 1 }
    ],
    'react/jsx-props-no-spreading': 0,
    'import/no-extraneous-dependencies': 0,
    'import/no-unresolved': 0,
    'import/prefer-default-export': 0,
    'import/no-named-as-default': 0,
    'import/no-cycle': 0,
    'import/order': 0,
    'import/no-relative-packages': 2,
    '@typescript-eslint/explicit-function-return-type': 0,
    '@typescript-eslint/explicit-module-boundary-types': 0,
    '@typescript-eslint/no-use-before-define': 0,
    '@typescript-eslint/naming-convention': 0,
    '@typescript-eslint/no-unused-vars': 1,
    'react/prop-types': 0,
    'react/no-unused-prop-types': 0,
    'react/require-default-props': 0, // This rule is unaware of default values in destructuring
    'react-hooks/exhaustive-deps': ['warn'],
    'react/jsx-no-bind': 0,
    'react/no-unstable-nested-components': [2, { allowAsProps: true }],
    'react/jsx-no-useless-fragment': [2, { allowExpressions: true }],
    'arrow-body-style': 0,
    'prefer-arrow-callback': [2, { allowNamedFunctions: true }],
    'max-classes-per-file': 0,
    'consistent-return': 0,
    'no-else-return': 0,
    'class-methods-use-this': 0,
    'no-continue': 0,
    'no-inner-declarations': 0,
    'no-restricted-syntax': 0,
    'no-plusplus': 0,
    'no-param-reassign': 0,
    'global-require': 0,
    'no-underscore-dangle': 0,
    'prefer-destructuring': 0,
    'no-nested-ternary': 0,
    'no-restricted-exports': 0,
    'no-lonely-if': 0,
    'prefer-regex-literals': 0,
    'prefer-exponentiation-operator': 0,
    'valid-typeof': 2,
    'vars-on-top': 0
  },
  overrides: [
    {
      files: ['esbuild/*', './types/*'],
      extends: ['plugin:@typescript-eslint/disable-type-checked']
    },
    {
      files: ['**/test/**/*.ts', '**/test/**/*.tsx'],
      extends: ['plugin:@typescript-eslint/disable-type-checked']
    }
  ]
};
