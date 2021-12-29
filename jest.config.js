/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  testRegex: '(/test/.*|(\\.|/)(test|spec))\\.ts?$',
  setupFiles: [ "fake-indexeddb/auto" ]
};