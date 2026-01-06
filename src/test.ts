// This file is required for karma test setup
import 'zone.js/testing';

import { getTestBed } from '@angular/core/testing';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting
} from '@angular/platform-browser-dynamic/testing';

// Global fetch mock to prevent HeyAPI client from making real HTTP requests
// This fixes "Failed to fetch" errors in afterAll hooks on CI
// Apply the mock immediately and aggressively
if (typeof window !== 'undefined') {
  // Create aggressive fetch mock
  const fetchSpy = jasmine.createSpy('globalFetch').and.callFake((input, init) => {
    console.log('Global fetch mock intercepted:', input, init);
    return Promise.resolve(new Response('{}', {
      status: 200,
      statusText: 'OK',
      headers: { 'Content-Type': 'application/json' }
    }));
  });
  
  // Replace fetch immediately
  window.fetch = fetchSpy;
  
  // Ensure it can't be overridden easily
  Object.defineProperty(window, 'fetch', {
    value: fetchSpy,
    writable: false,
    configurable: false
  });
}

declare const require: {
  context(path: string, deep?: boolean, filter?: RegExp): {
    keys(): string[];
    <T>(id: string): T;
  };
};

// First, initialize the Angular testing environment.
getTestBed().initTestEnvironment(
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting(),
);

// Then we find all the tests.
const context = require.context('./', true, /\.spec\.ts$/);
// And load the modules.
context.keys().forEach(context);
