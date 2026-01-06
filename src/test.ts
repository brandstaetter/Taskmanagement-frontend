// This file is required for karma test setup
import 'zone.js/testing';

import { getTestBed } from '@angular/core/testing';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting
} from '@angular/platform-browser-dynamic/testing';

// Global fetch mock to prevent HeyAPI client from making real HTTP requests
// This fixes "Failed to fetch" errors in afterAll hooks on CI
// Apply the mock at zone.js level to intercept before zone patches fetch
if (typeof window !== 'undefined') {
  // Create aggressive fetch mock
  const fetchSpy = jasmine.createSpy('globalFetch').and.callFake((input: RequestInfo | URL, init?: RequestInit) => {
    console.log('Global fetch mock intercepted:', input, init);
    return Promise.resolve(new Response('{}', {
      status: 200,
      statusText: 'OK',
      headers: { 'Content-Type': 'application/json' }
    }));
  });
  
  // Replace fetch at multiple levels before zone.js can patch it
  window.fetch = fetchSpy;
  if (typeof globalThis !== 'undefined') {
    globalThis.fetch = fetchSpy;
  }
  
  // Mock zone.js's internal fetch mechanism
  const zoneWindow = window as { Zone?: { __load_patch: (name: string, fn: () => void) => void } };
  if (typeof zoneWindow.Zone !== 'undefined') {
    const Zone = zoneWindow.Zone;
    // Override zone's fetch patching
    Zone.__load_patch = function(name: string, fn: () => void) {
      if (name === 'fetch') {
        // Don't allow zone to patch fetch - use our mock instead
        return;
      }
      return Zone.__load_patch(name, fn);
    };
  }
  
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
