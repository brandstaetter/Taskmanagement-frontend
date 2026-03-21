import type { Config } from 'jest';

const config: Config = {
  preset: 'jest-preset-angular',
  setupFilesAfterEnv: ['<rootDir>/setup-jest.ts'],
  testEnvironment: '<rootDir>/jest.environment.ts',
  testMatch: ['**/src/**/*.spec.ts'],
  restoreMocks: true,
  clearMocks: true,
  coverageDirectory: 'coverage/frontend',
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.spec.ts',
    '!src/main.ts',
    '!src/environments/**',
    '!src/app/generated/**',
  ],
  coverageThreshold: {
    global: {
      statements: 65,
      branches: 65,
      functions: 65,
      lines: 65,
    },
  },
};

export default config;
