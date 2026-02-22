/** @type {import('jest').Config} */
const jestExpoPreset = require('jest-expo/jest-preset')

module.exports = {
  ...jestExpoPreset,
  testEnvironment: 'node',
  // Override setupFiles to exclude react-native's ESM setup.js
  setupFiles: ['<rootDir>/jest.setup.js'],
  transformIgnorePatterns: [
    '/node_modules/(?!(.pnpm/)?(@?react-native|react-native|@react-native|@react-native-community|jest-react-native|expo|@expo|@expo-google-fonts|react-navigation|@react-navigation|@sentry|native-base|react-native-svg|@machi|axios))',
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  testMatch: ['**/__tests__/**/*.test.{ts,tsx}'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.test.{ts,tsx}',
    '!src/**/__tests__/**',
    '!src/**/*.d.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  clearMocks: true,
  moduleNameMapper: {
    ...jestExpoPreset.moduleNameMapper,
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@machi/shared$': '<rootDir>/../shared/dist/index.js',
  },
}
