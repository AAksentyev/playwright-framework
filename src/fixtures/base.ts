import { config } from '@config';
import { SCREENSHOT_NAME, SCREENSHOT_PATH } from '@configs/reports/reporters.config.ts';
import { doFreshLoginAndSave } from '@helpers/auth/sessionHelpers.ts';
import { getSessionManager } from '@helpers/auth/SessionManagerProvider.ts';
import { expect, Page, test as base, WorkerInfo } from '@playwright/test';
import { Logger } from '@utils/logger.ts';
import { saveInteractionsToDisk } from '@utils/reporters/heatmap/interactionLogger.ts';
import {
    monitorTestTraffic,
    handleTestResults,
    saveWorkerTraffic,
} from '@utils/reporters/network-monitor/monitor.ts';
import path from 'path';
import { sprintf } from 'sprintf-js';

type BaseFixture = {
    testMonitor: Page; // monitor all network traffic during page interaction
    handleAuth: Page; // monitor all network traffic during page interaction
    networkWorkerTeardown: any; // worker-scoped fixture
    ignoreNetworkErrors: boolean; // optionally configure tests to skip tracking network error
};

/**
 * Base fixture that registers global handlers for all tests
 */
export const test = base.extend<BaseFixture>({
    ignoreNetworkErrors: [false, { option: true }],
    // handle worker teardown
    networkWorkerTeardown: [
        async ({ }, use: (value: void) => Promise<void>, workerInfo: WorkerInfo) => {
            const username = config.SITE_USERNAME;

            // nothing to pass into tests
            await use(undefined);

            // once the worker completes its tasks, take our tracked data for reports and save it to disk
            // all worker data will then be aggregated using the globalTeardown script
            saveWorkerTraffic(workerInfo.workerIndex);
            saveInteractionsToDisk(workerInfo.workerIndex);
        },
        { scope: 'worker' },
    ],
    // monitor all network during page interaction and compile the test data
    testMonitor: async ({ page, networkWorkerTeardown, ignoreNetworkErrors }, use, testInfo) => {
        if (!ignoreNetworkErrors) monitorTestTraffic(page, testInfo);

        await use(page);

        // if the test failed or timed out, take a screenshot if we have a page instance
        const normalizedTest = testInfo.title.replace(/\s+/g, '_');
        Logger.info(`${testInfo.title} ----> ${testInfo.status}`);
        if (testInfo.status === 'failed' || testInfo.status === 'timedOut') {
            if ( ! page ){
                Logger.info('No Page instance found. Skipping screenshot')
                return;
            }  

            // join our path a interpolated screenshot name
            const screenshotPath = path.join(SCREENSHOT_PATH, sprintf(SCREENSHOT_NAME, testInfo.retry, normalizedTest ))
            const ss = await page.screenshot({
                path: screenshotPath,
                fullPage: true,
            });

            await testInfo.attach('screenshot', { body: ss, contentType: 'image/png' });
        }

        if (!ignoreNetworkErrors) handleTestResults(testInfo);
        
    },
    // handle session authentication and restoration for   
    // authenticated projects
    handleAuth: [
        async ({ testMonitor, context, page }, use, testInfo) => {
            
            // Pull authenticated flag from project options
            const authenticated = testInfo.project.use.authenticated ?? false;

            if (authenticated) {

                // get our session manager instance for the worker from the provider
                const sessionManager = getSessionManager(testInfo.workerIndex);
                
                /** credentials we're using for authentication. 
                 * Either from config or use injected creds for role-based login as needed 
                 * */ 
                const username = config.SITE_USERNAME;
                const password = config.SITE_PASSWORD;

                // Check if we even have a valid stored session
                const isValid = await sessionManager.validateSession(username);

                if (!isValid) {
                    Logger.info("No valid stored session found. Performing login...");
                    await doFreshLoginAndSave(sessionManager, context, page, username, password);
                } else {
                    // We have a valid session → attempt restore
                    const restored = await sessionManager.restoreSession(context, username);

                    if (!restored) {
                        Logger.warn("Stored session was expected to be valid but restore failed. Logging in instead...");
                        await doFreshLoginAndSave(sessionManager, context, page, username, password);
                    } else {
                        Logger.info("Session restored from worker storage.");
                    }
                }
            }

            await use(page);
        },
        { auto: true }
    ],
});

export { expect };
