import JSDOMEnvironment from 'jest-environment-jsdom';

// Custom jsdom environment that exposes Node.js 24 built-in fetch APIs
// jsdom does not include fetch/Request/Response by default
class CustomJSDOMEnvironment extends JSDOMEnvironment {
  async setup() {
    await super.setup();

    // Expose Node.js 24 built-in fetch globals into the jsdom window
    if (typeof this.global.fetch === 'undefined') {
      this.global.fetch = globalThis.fetch;
      this.global.Request = globalThis.Request;
      this.global.Response = globalThis.Response;
      this.global.Headers = globalThis.Headers;
    }

    // Polyfill URL.createObjectURL (not implemented in jsdom)
    if (!this.global.URL.createObjectURL) {
      this.global.URL.createObjectURL = () => 'blob:mock-url';
      this.global.URL.revokeObjectURL = () => {};
    }

    // Polyfill navigator.clipboard as an accessor property (required for jest.spyOn(navigator, 'clipboard', 'get'))
    if (!Object.getOwnPropertyDescriptor(this.global.navigator, 'clipboard')?.get) {
      const clipboardImpl = {
        writeText: () => Promise.resolve(),
        readText: () => Promise.resolve(''),
      };
      Object.defineProperty(this.global.navigator, 'clipboard', {
        get: () => clipboardImpl,
        configurable: true,
      });
    }
  }
}

export default CustomJSDOMEnvironment;
