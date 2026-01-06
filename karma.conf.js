module.exports = function (config) {
  config.set({
    basePath: '',
    frameworks: ['jasmine', '@angular-devkit/build-angular'],
    plugins: [
      require('karma-jasmine'),
      require('karma-chrome-launcher'),
      require('karma-jasmine-html-reporter'),
      require('karma-coverage'),
      require('@angular-devkit/build-angular/plugins/karma')
    ],
    files: [
      // Load global test setup before any tests run
      { pattern: 'src/test-setup.ts', watched: false, type: 'js' }
    ],
    client: {
      jasmine: {
        random: true,
        failFast: false,
        timeoutInterval: 10000
      },
      clearContext: false
    },
    coverageReporter: {
      dir: require('path').join(__dirname, './coverage/frontend'),
      subdir: '.',
      reporters: [
        { type: 'html' },
        { type: 'text-summary' },
        { type: 'lcov' }
      ],
      check: {
        global: {
          statements: 65,
          branches: 65,
          functions: 65,
          lines: 65
        }
      },
      exclude: [
        'src/app/generated/**',
        '**/*.spec.ts',
        '**/test.ts',
        '**/polyfills.ts',
        '**/main.ts',
        '**/environments/environment.prod.ts'
      ]
    },
    reporters: ['progress', 'kjhtml'],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: true,
    browsers: ['ChromeHeadless'],
    singleRun: true,
    restartOnFileChange: true,
    browserDisconnectTimeout: 10000,
    browserDisconnectTolerance: 3,
    browserNoActivityTimeout: 60000,
    captureTimeout: 60000,
    processKillTimeout: 2000
  });
};
