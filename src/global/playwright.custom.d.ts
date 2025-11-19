/* eslint-disable @typescript-eslint/no-unused-vars */
import { PlaywrightTestOptions } from '@playwright/test';

/**
 *  Extensions for the default test options so the project
 * configuration is able to define these variables
 *
 * Add any variables here that you may want to inject into the entire project
 * in playwright.config.ts
 *
 * @example
 * ```
 *      projects: [
 *       //global setup + teardown projects to be used as dependencies
 *       {
 *           name: 'setUp',
 *           testMatch: /global\.setup\.ts/,
 *           teardown: 'tearDown',
 *       },
 *       {
 *           name: 'tearDown',
 *           testMatch: /global\.teardown\.ts/,
 *       },
 *        {
 *            name: 'unauthenticatedChromium',
 *            use: { ...devices['Desktop Chrome'] },
 *            dependencies: ['setUp'],
 *        }
 *        {
 *            name: 'authenticatedChromium',
 *            use: {
 *                ...devices['Desktop Chrome'],
 *                authenticated: true //<--- this is now available for every test in this project
 *            },
 *            testMatch: ['tests/authenticated-example/**\/*.spec.ts'],
 *            dependencies: ['setUp'],
 *        },
 * ```
 *
 */
declare module '@playwright/test' {
    interface PlaywrightTestOptions {
        // toggle on session setup/restoration steps
        authenticated?: boolean;
    }
}

/* eslint-enable @typescript-eslint/no-unused-vars */
