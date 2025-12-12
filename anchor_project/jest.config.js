const path = require('path');

module.exports = {
  testEnvironment: 'node',
  rootDir: '.',
  testMatch: ['**/tests/**/*.test.ts'],
  transform: {
    '^.+\\.ts$': [
      path.resolve(__dirname, '../frontend/node_modules/ts-jest'),
      {
        tsconfig: {
          module: 'commonjs',
          target: 'es2020',
          lib: ['es2020'],
          types: ['jest', 'node'],
          skipLibCheck: true,
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
          moduleResolution: 'node',
          resolveJsonModule: true,
        },
        isolatedModules: true,
      },
    ],
  },
  moduleNameMapper: {
    '^@coral-xyz/anchor$': path.resolve(__dirname, '../frontend/node_modules/@coral-xyz/anchor'),
    '^@solana/web3.js$': path.resolve(__dirname, '../frontend/node_modules/@solana/web3.js'),
  },
  modulePaths: [path.resolve(__dirname, '../frontend/node_modules')],
};
