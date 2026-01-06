module.exports = function (config) {
  // Add Chrome flags for CI environments (Linux)
  if (process.env.CI || process.env.GITHUB_ACTIONS) {
    config.set({
      customLaunchers: {
        ChromeHeadlessCI: {
          base: 'ChromeHeadless',
          flags: [
            '--no-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu'
          ]
        }
      },
      browsers: ['ChromeHeadlessCI']
    });
  }

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
