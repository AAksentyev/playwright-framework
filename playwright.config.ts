import os from 'node:os';
import * as dotenv from 'dotenv';
import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';
import os from 'node:os';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */

dotenv.config({ debug: true, path: `.env` }); //.${process.env.ENV || 'qa'}

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
    testDir: './tests',
    //globalTeardown: require.resolve('./src/global/globalTeardown.ts'),
    /* Run tests in files in parallel */
    fullyParallel: true,
    /* Fail the build on CI if you accidentally left test.only in the source code. */
    forbidOnly: !!process.env.CI,
    /* Retry on CI only */
    retries: process.env.CI ? 2 : 0,
    /* Opt out of parallel tests on CI. */
    workers: process.env.CI ? 1 : 1,
    /* Reporter to use. See https://playwright.dev/docs/test-reporters */
    reporter: [
        ['line'],
        ['junit', { outputFile: `results-${process.env.PW_TAG || 'all'}.xml` }], // for TeamCity
        /*[
            'html',
            {
                outputFolder: `playwright-reports/playwright-report-${process.env.PW_TAG || 'all'}`,
                open: 'never',
            },
        ],*/ // optional artifact
        [
            'allure-playwright',
            {
                environmentInfo: {
                    os_platform: os.platform(),
                    os_release: os.release(),
                    os_version: os.version(),
                    node_version: process.version,
                },
            },
        ],
    ],
    /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
    use: {
        /* Base URL to use in actions like `await page.goto('')`. */
        baseURL: process.env.BASE_URL,

        /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
        trace: 'on-first-retry',
    },

    /* Configure projects for major browsers */
    projects: [
        /** global setup + teardown projects to be used as dependencies */
        {
            name: 'setUp',
            testMatch: /global\.setup\.ts/,
            teardown: 'tearDown',
        },
        {
            name: 'tearDown',
            testMatch: /global\.teardown\.ts/,
        },

        /**
         * Since we're not defining 'authenticated' here
         * unlike in 'authenticatedChromium', the base fixture will not
         * bother restoring or setting up the session
         */
        {
            name: 'unauthenticatedChromium',
            use: { ...devices['Desktop Chrome'] },
            dependencies: ['setUp'],
        },

        /** A project to run any authenticated tests that require a session
         * the authenticated: true flag will trigger the base fixture
         * to either set up a new session if a valid one does not exist
         * or restore the existing session
         */
        {
            name: 'authenticatedChromium',
            use: {
                ...devices['Desktop Chrome'],
                // we have this custom option defined in src/global/playwright.custom.d.ts
                // it is now accessible in every test to see if we're running an authenticated project
                authenticated: true,
            },
            testMatch: ['tests/authenticated-example/**/*.spec.ts'],
            dependencies: ['setUp'],
        },

        /*{
            name: 'firefox',
            use: { ...devices['Desktop Firefox'] },
        },

        {
            name: 'webkit',
            use: { ...devices['Desktop Safari'] },
        },*/

        /* Test against mobile viewports. */
        // {
        //   name: 'Mobile Chrome',
        //   use: { ...devices['Pixel 5'] },
        // },
        // {
        //   name: 'Mobile Safari',
        //   use: { ...devices['iPhone 12'] },
        // },

        /* Test against branded browsers. */
        // {
        //   name: 'Microsoft Edge',
        //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
        // },
        // {
        //   name: 'Google Chrome',
        //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
        // },
    ],

    /* Run your local dev server before starting the tests */
    // webServer: {
    //   command: 'npm run start',
    //   url: 'http://localhost:3000',
    //   reuseExistingServer: !process.env.CI,
    // },
});
