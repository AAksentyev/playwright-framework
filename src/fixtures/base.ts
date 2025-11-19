import { expect, Page, test as base, WorkerInfo } from '@playwright/test';
import { config } from '@config';
import { Logger } from '@utils/logger.ts';
import { doFreshLoginAndSave } from '@helpers/auth/sessionHelpers.ts';
import { getSessionManager } from '@helpers/auth/SessionManagerProvider.ts';
import { handleTestIfFailed } from '@helpers/tests/testHelpers.ts';
import { saveInteractionsToDisk } from '@utils/reporters/heatmap/interactionLogger.ts';
import {
    monitorTraffic,
    handleTrafficResults,
    saveWorkerTraffic,
} from '@utils/reporters/network-monitor/monitor.ts';

type BaseFixture = {
    testMonitor: Page; // handle any test-level monitoring and test teardown
    handleAuth: Page; // handle session and session restoration from sessionStorage as needed
    workerTeardown: any; // worker-scoped fixture to tear down and compile any worker data

    /** optionally configure tests to skip tracking network error
     * use as test.use({ ignoreNetworkErrors: true })
     * useful when you're testing negative page actions and you are EXPECTING >=400 response from the server
     * and don't necessarily want it included in test monitoring logs
     */
    ignoreNetworkErrors: boolean;
};

/**
 * Base fixture that registers global handlers for all tests
 */
export const test = base.extend<BaseFixture>({
    ignoreNetworkErrors: [false, { option: true }],

    /** worker-level teardown activities */
    // we're not injecting anything into the worker, so explicitly ignore the error
    // if we start injecting something into it, this lint ignore statement should be removed
    /* eslint-disable no-empty-pattern */
    workerTeardown: [
        async ({}, use: (value: void) => Promise<void>, workerInfo: WorkerInfo) => {
            // nothing to pass into tests
            await use(undefined);

            // once the worker completes its tasks, take our tracked data for reports and save it to disk
            // all worker data will then be aggregated using the globalTeardown script
            saveWorkerTraffic(workerInfo.workerIndex);
            saveInteractionsToDisk(workerInfo.workerIndex);
        },
        { auto: true, scope: 'worker' },
    ],
    /* eslint-enable no-empty-pattern */
    /**
     * monitor all network during page interaction and compile the test data
     * also handle any specific test-level activities (such as handling failed tests)
     */
    testMonitor: async ({ page, ignoreNetworkErrors, browserName }, use, testInfo) => {
        /** always monitor our test traffic unless user explicitly toggled it off */
        if (!ignoreNetworkErrors) monitorTraffic(page, testInfo);

        await use(page);

        /** Once the test concludes handle our results */
        /** if it failed, take a screenshot and attach it to the test */
        await handleTestIfFailed(page, testInfo, browserName);

        // handle our network traffic results if not ignored
        if (!ignoreNetworkErrors) handleTrafficResults(testInfo);
    },
    /**
     * handle session authentication and restoration for authenticated projects
     * this fixture will run for every test.
     *
     * We inject 'testMonitor' fixture here as the dependency to ensure every test
     * has the network traffic monitoring set up since this fixture will always run
     * automatically
     */

    handleAuth: [
        /* eslint-disable @typescript-eslint/no-unused-vars */
        async ({ testMonitor, context, page }, use, testInfo) => {
            /* eslint-enable @typescript-eslint/no-unused-vars */
            // Pull authenticated flag from project options
            const authenticated = testInfo.project.use.authenticated ?? false;

            // only run our authentication logic if we have the authenticated flag set for the project
            // this logic can be changed to use any other criteria you want to use if not using a project-based flag
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

                // if the saved session is not valid, re-log in and save the new session
                // all login steps are handled in the helper file
                if (!isValid) {
                    Logger.info('No valid stored session found. Performing login...');
                    await doFreshLoginAndSave(sessionManager, context, page, username, password);
                } else {
                    // We have a valid session. Attempt to restore
                    const restored = await sessionManager.restoreSession(context, username);

                    // if there was some issue with restoration, re-log in and get a new session
                    if (!restored) {
                        Logger.warn(
                            'Stored session was expected to be valid but restore failed. Logging in instead...'
                        );
                        await doFreshLoginAndSave(
                            sessionManager,
                            context,
                            page,
                            username,
                            password
                        );
                    }
                    // otherwise we have nothing left to do but proceed with our test.
                    // the helper restored sessionStorage to our current browser context
                    else {
                        Logger.info('Session restored from worker storage.');
                    }
                }
            }

            await use(page);
        },
        { auto: true },
    ],
});

export { expect };
