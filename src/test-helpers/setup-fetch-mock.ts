/**
 * Global fetch mock setup for Karma tests.
 * This prevents the HeyAPI generated client from making real HTTP requests.
 * 
 * Loaded via karma.conf.js before any test specs run.
 */

// Create a default mock that returns empty responses
const defaultFetchMock = (): Promise<Response> => {
  return Promise.resolve(
    new Response(JSON.stringify([]), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  );
};

// Override window.fetch with a spy that uses the default mock
beforeEach(() => {
  if (!jasmine.isSpy(window.fetch)) {
    spyOn(window, 'fetch').and.callFake(defaultFetchMock);
  }
});

// Clean up after each test
afterEach(() => {
  // Reset the spy if it exists
  if (jasmine.isSpy(window.fetch)) {
    (window.fetch as jasmine.Spy).calls.reset();
  }
});
