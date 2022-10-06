import { InitialOptionsTsJest } from 'ts-jest/dist/types';

const config: InitialOptionsTsJest = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  verbose: true,
  forceExit: true,
  restoreMocks: true,
  testPathIgnorePatterns: ['dist/', 'config/'],
  coveragePathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/config/',
    '<rootDir>/dist/',
  ],
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },
  reporters: ['<rootDir>/jest-reporters/emit-only-failures.js'],
  globals: {
    'ts-jest': {
      // https://stackoverflow.com/questions/45087018/jest-simple-tests-are-slow
      isolatedModules: true,
    },
  },
};

export default config;
