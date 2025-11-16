import { expect, Page, test as base, WorkerInfo } from '@playwright/test';
import { saveInteractionsToDisk } from '@utils/reporters/heatmap/interactionLogger.ts';
import {
    monitorTestTraffic,
    handleTestResults,
    saveWorkerTraffic,
} from '@utils/reporters/network-monitor/monitor.ts';

type BaseFixture = {
    networkMonitoring: Page; // monitor all network traffic during page interaction
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
        async ({}, use: (value: void) => Promise<void>, workerInfo: WorkerInfo) => {
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
    networkMonitoring: [
        async ({ page, networkWorkerTeardown, ignoreNetworkErrors }, use, testInfo) => {
            if (!ignoreNetworkErrors) monitorTestTraffic(page, testInfo);

            await use(page);

            if (!ignoreNetworkErrors) handleTestResults(testInfo);
        },
        { auto: true },
    ],
});

export { expect };
