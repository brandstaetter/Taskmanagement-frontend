// This file is required for karma test setup
import 'zone.js/testing';

import { getTestBed } from '@angular/core/testing';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting
} from '@angular/platform-browser-dynamic/testing';

// Global error handler to catch and ignore fetch errors in afterAll hooks
// This prevents "Failed to fetch" errors from failing the test suite in CI
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    // Ignore network-related errors that commonly occur in afterAll hooks
    if (event.reason && (
      event.reason.message?.includes('Failed to fetch') ||
      event.reason.message?.includes('NetworkError') ||
      event.reason.name === 'TypeError' && event.reason.message?.includes('fetch')
    )) {
      console.warn('Ignoring fetch error in afterAll hook:', event.reason);
      event.preventDefault();
    }
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
