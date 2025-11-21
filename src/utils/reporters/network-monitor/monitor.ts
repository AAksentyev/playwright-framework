import path from 'path';
import { Page, TestInfo } from '@playwright/test';
import { Logger } from '@utils/logger.ts';
import { TRAFFIC_CONFIG } from '@configs/reports/reporters.config.ts';
import { RequestMap, RequestStats } from './monitor.t.ts';
import { FSHelpers } from '@utils/fs/fsHelpers.ts';

// track requests per test with a simple array
const testStats: RequestMap = new Map<string, RequestStats>();

// tracker for each URL per worker
// key = url, value = cumulative stats for that url
const requestTracker: RequestMap = new Map<string, RequestStats>();

/**
 * Monitor network traffic for a single test
 * Registers a listener on the page to track all responses
 */
export function monitorTraffic(page: Page, testInfo: TestInfo) {
    page.on('response', async (response) => {
        const url = response.url();
        const responseCode = response.status();

        // initialize the baseline object for the given path
        if (!testStats.has(url)) {
            testStats.set(url, {
                success: 0,
                fail: 0,
                failures: [],
            });
        }

        // get any existing status from our map
        let stats: RequestStats | undefined = testStats.get(url);

        // set our stats for the url
        if (!stats) {
            stats = { success: 0, fail: 0, failures: [] };
            testStats.set(url, stats);
        }

        // if the response code is 400+, consider this a failure and increment accordingly
        if (responseCode >= 400) {
            stats.fail++;
            stats.failures.push({ testName: testInfo.title, responseCode });
        } else {
            stats.success++;
        }
    });
}

/**
 * Handle our network monitoring test result after an individual test completes
 * The function attaches a JSON with failures (if there were any) as an attachment
 * to the test.
 *
 * It then merges all the traffic data into the worker tracker for later aggregation
 */
export async function handleTrafficResults(testInfo: TestInfo) {
    // check if we have any failures during the test and attach the report to the test
    const failedStatsObj = Object.fromEntries(
        [...testStats.entries()].filter(([_, stats]) => stats.fail > 0)
    );

    // if we had failures, attach them to the test
    if (Object.keys(failedStatsObj).length > 0) {
        await testInfo.attach('failed-network-requests.json', {
            body: JSON.stringify(failedStatsObj),
            contentType: 'application/json',
        });
    }

    // merge test data into the worker tracker
    mergeTestIntoWorker();
}

/**
 * Save the combined worker traffic data to disk
 * @param workerIndex
 */
export function saveWorkerTraffic(workerIndex: number) {
    // create the directory if it doesn't exist
    FSHelpers.createPathSafe(TRAFFIC_CONFIG.REPORT_OUTPUT_PATH);

    // serialize the map so it can be saved as JSON
    const serialized = Object.fromEntries(requestTracker.entries());

    // save the file
    FSHelpers.writeTextFileSafe(
        path.join(TRAFFIC_CONFIG.REPORT_OUTPUT_PATH, `worker-${workerIndex}.json`),
        serialized,
        'json'
    );
}

/**
 *  Merge the test data into the cumulative worker tracker
 */
function mergeTestIntoWorker() {
    for (const [url, tStats] of testStats) {
        let wStats = requestTracker.get(url);

        // set the stats for the URL if it doesn't exist, increment accordingly
        if (!wStats) {
            // clone the object so we don't share references
            wStats = {
                success: tStats.success,
                fail: tStats.fail,
                failures: [...tStats.failures],
            };
            requestTracker.set(url, wStats);
        } else {
            wStats.success += tStats.success;
            wStats.fail += tStats.fail;
            wStats.failures.push(...tStats.failures);
        }
    }

    // clear our map for the test so the next test the worker picks up
    // tracks its own data
    testStats.clear();
}

/**
 * Merges all worker maps that are passed to it and returns a combined map
 * @param maps
 * @returns
 */
function mergeRequestMaps(maps: RequestMap[]): RequestMap {
    const merged: RequestMap = new Map();

    for (const map of maps) {
        for (const [url, stats] of map.entries()) {
            if (!merged.has(url)) {
                merged.set(url, {
                    success: stats.success,
                    fail: stats.fail,
                    failures: [...stats.failures],
                });
            } else {
                const existing = merged.get(url)!;
                existing.success += stats.success;
                existing.fail += stats.fail;
                existing.failures.push(...stats.failures);
            }
        }
    }

    return merged;
}

/**
 * Combine all of worker logs into a single report file
 */
export function aggregateWorkerNetworkLogs() {
    Logger.info('... Aggregating network traffic logs ...');

    // collect the list of files we'll be working with
    const files = FSHelpers.readDirSafe(TRAFFIC_CONFIG.REPORT_OUTPUT_PATH).filter(
        (f) => f.startsWith('worker-') && f.endsWith('.json')
    );

    // read every worker file we have and convert the contents of the file to a map
    const allMaps: RequestMap[] = files.map((file) => {
        const obj = JSON.parse(
            FSHelpers.readFileSafe(path.join(TRAFFIC_CONFIG.REPORT_OUTPUT_PATH, file))
        ) as Record<string, RequestStats>;
        // delete the file after reading it. Since we're aggregating them all, we don't need it
        FSHelpers.deleteFileSafe(path.join(TRAFFIC_CONFIG.REPORT_OUTPUT_PATH, file));
        return new Map(Object.entries(obj)); // convert to Map and return
    });

    // merge our maps into a single aggregated map
    const mergedMap = mergeRequestMaps(allMaps);

    // write the merged file to disk after serializing the Map back to an Object
    FSHelpers.writeTextFileSafe(
        path.join(TRAFFIC_CONFIG.REPORT_OUTPUT_PATH, TRAFFIC_CONFIG.JSON_OUTPUT_NAME),
        Object.fromEntries(mergedMap.entries()),
        'json'
    );

    Logger.success('... Network logs aggregated ...');
}
