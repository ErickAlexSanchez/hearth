import reactHooks from 'eslint-plugin-react-hooks'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'coverage/**',
      'playwright-report/**',
      'test-results/**',
      'blob-report/**',
      'dist/**',
      'next-env.d.ts',
    ],
  },
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      'react-hooks': reactHooks,
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/ban-ts-comment': [
        'error',
        {
          'ts-check': true,
          'ts-expect-error': true,
          'ts-ignore': true,
          'ts-nocheck': true,
        },
      ],
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      'no-empty': ['error', { allowEmptyCatch: false }],
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'error',
    },
  },
  {
    files: ['src/domain/**/*.ts', 'src/application/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                'react',
                'react-dom',
                'next',
                'next/**',
                'pg',
                '@reduxjs/toolkit',
                'react-redux',
                '@/adapters/**',
                '@/app/**',
                '@/ui/**',
                '@/composition/**',
              ],
              message: 'Domain and application stay free of React and the Postgres driver.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/domain/feed/**/*.ts', 'src/application/feed/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                'react',
                'react-dom',
                'next',
                'next/**',
                'pg',
                '@reduxjs/toolkit',
                'react-redux',
                '@/adapters/**',
                '@/app/**',
                '@/ui/**',
                '@/composition/**',
              ],
              message: 'Domain and application stay free of React and the Postgres driver.',
            },
            {
              group: ['**/coach/**', '**/coach-*', '**/ports/coach-repository', '**/domain/coach/**'],
              message: 'Feed must not import the coach module.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/domain/coach/**/*.ts', 'src/application/coach/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                'react',
                'react-dom',
                'next',
                'next/**',
                'pg',
                '@reduxjs/toolkit',
                'react-redux',
                '@/adapters/**',
                '@/app/**',
                '@/ui/**',
                '@/composition/**',
              ],
              message: 'Domain and application stay free of React and the Postgres driver.',
            },
            {
              group: ['**/feed/**', '**/feed-*', '**/ports/feed-repository', '**/domain/feed/**'],
              message: 'Coach must not import the feed module.',
            },
          ],
        },
      ],
    },
  },
  {
    files: [
      'src/adapters/postgres/feed-repository.ts',
      'src/ports/feed-repository.ts',
      'src/app/api/feed/**/*.ts',
      'src/app/api/feed/*.ts',
    ],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/coach/**', '**/coach-*', '**/ports/coach-repository', '**/domain/coach/**'],
              message: 'Feed must not import the coach module.',
            },
          ],
        },
      ],
    },
  },
  {
    files: [
      'src/adapters/postgres/coach-repository.ts',
      'src/ports/coach-repository.ts',
      'src/app/api/coach/**/*.ts',
      'src/app/api/coach/*.ts',
    ],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/feed/**', '**/feed-*', '**/ports/feed-repository', '**/domain/feed/**'],
              message: 'Coach must not import the feed module.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/ui/**/*.ts', 'src/ui/**/*.tsx'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['pg', '@/adapters/postgres/**', '@/composition/**', '@/application/**'],
              message: 'UI must not import server adapters.',
            },
          ],
        },
      ],
    },
  },
)
