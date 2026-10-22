/** @type {import('jest').Config} */
module.exports = {
  testTimeout: 20000,
  projects: [
    {
      displayName: 'unit',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/tests/unit/**/*.test.ts'],
      transform: {
        '^.+\\.tsx?$': [
          'ts-jest',
          {
            tsconfig: '<rootDir>/tsconfig.jest.json',
            diagnostics: false,
          },
        ],
      },
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
      },
    },
    {
      displayName: 'ui',
      testEnvironment: 'jsdom',
      testMatch: ['<rootDir>/tests/ui/**/*.test.tsx'],
      setupFiles: ['<rootDir>/tests/setup/ui-polyfill.ts'],
      setupFilesAfterEnv: ['<rootDir>/tests/setup/ui.ts'],
      transform: {
        '^.+\\.tsx?$': [
          'ts-jest',
          {
            tsconfig: '<rootDir>/tsconfig.jest.json',
            diagnostics: false,
          },
        ],
      },
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
      },
    },
    {
      displayName: 'integration',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/tests/integration/**/*.test.ts'],
      setupFiles: ['<rootDir>/tests/setup/load-env.ts'],
      setupFilesAfterEnv: ['<rootDir>/tests/setup/integration.ts'],
      transform: {
        '^.+\\.tsx?$': [
          'ts-jest',
          {
            tsconfig: '<rootDir>/tsconfig.jest.json',
            diagnostics: false,
          },
        ],
      },
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
      },
    },
  ],
}
