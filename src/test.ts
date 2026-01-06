// This file is required for karma test setup
import 'zone.js/testing';

import { getTestBed } from '@angular/core/testing';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting
} from '@angular/platform-browser-dynamic/testing';

// Global fetch mock to prevent HeyAPI client from making real HTTP requests
// This fixes "Failed to fetch" errors in afterAll hooks on CI
if (typeof window !== 'undefined' && window.fetch && !jasmine.isSpy(window.fetch)) {
  const fetchSpy = jasmine.createSpy('globalFetch').and.callFake(() => {
    return Promise.resolve(new Response('{}', {
      status: 200,
      statusText: 'OK',
      headers: { 'Content-Type': 'application/json' }
    }));
  });
  window.fetch = fetchSpy;
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
