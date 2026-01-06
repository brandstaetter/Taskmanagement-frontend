/**
 * Global test setup for Karma/Jasmine tests
 * 
 * This file is loaded ONCE before all test files run.
 * It sets up global mocks to prevent real HTTP calls from HeyAPI generated client.
 * 
 * Based on HeyAPI testing guidance: https://openapi-ts.dev/openapi-fetch/testing
 */

// Create default fetch mock response
const createMockResponse = (): Response => {
  return new Response(JSON.stringify({}), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

// Mock window.fetch globally before any tests run
// This prevents HeyAPI client from making real HTTP requests
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).fetch = jasmine.createSpy('fetch').and.callFake(() => {
  return Promise.resolve(createMockResponse());
});

console.log('[TEST-SETUP] Global fetch mock initialized');
