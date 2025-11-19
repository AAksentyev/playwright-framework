import { TRAFFIC_CONFIG } from '@configs/reports/reporters.config.ts';
import { Page, TestInfo } from '@playwright/test';
import fs from 'fs';
import path from 'path';

type RequestStats = {
    success: number;
    fail: number;
    failures: {
        testName: string;
        responseCode: number;
    }[];
};

type RequestMap = Map<string, RequestStats>;

// track requests per test with a simple array
const testStats: RequestMap = new Map<string, RequestStats>();

// tracker for each URL per worker
// key = url, value = cumulative stats for that url
const requestTracker: RequestMap = new Map<string, RequestStats>();

export function monitorTraffic(page: Page, testInfo: TestInfo) {
    page.on('response', (response) => {
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

        let stats = testStats.get(url);

        if (!stats) {
            stats = { success: 0, fail: 0, failures: [] };
            testStats.set(url, stats);
        }

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
 *
 * @param testInfo
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
    // create the directory if it doesn't exiset
    if (!fs.existsSync(TRAFFIC_CONFIG.REPORT_OUTPUT_PATH))
        fs.mkdirSync(TRAFFIC_CONFIG.REPORT_OUTPUT_PATH, { recursive: true });

    // serialize the map so it can be saved as json
    const serialized = Object.fromEntries(requestTracker.entries());

    // save the file
    fs.writeFileSync(
        path.join(TRAFFIC_CONFIG.REPORT_OUTPUT_PATH, `worker-${workerIndex}.json`),
        JSON.stringify(serialized, null, 2)
    );
}

/**
 *  Merge the test data into the cumulative worker tracker
 */
function mergeTestIntoWorker() {
    for (const [url, tStats] of testStats) {
        let wStats = requestTracker.get(url);

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
    console.log('...Aggregating network traffic logs...');
    // collect the list of files we'll be working with
    const files = fs
        .readdirSync(TRAFFIC_CONFIG.REPORT_OUTPUT_PATH)
        .filter((f) => f.startsWith('worker-') && f.endsWith('.json'));

    // read every worker file we have and convert the contents of the file to a map
    const allMaps: RequestMap[] = files.map((file) => {
        const raw = fs.readFileSync(path.join(TRAFFIC_CONFIG.REPORT_OUTPUT_PATH, file), 'utf-8');
        const obj = JSON.parse(raw) as Record<string, RequestStats>;
        // delete the file after reading it. Since we're aggregating them all, we don't need it
        fs.unlinkSync(path.join(TRAFFIC_CONFIG.REPORT_OUTPUT_PATH, file));
        return new Map(Object.entries(obj)); // convert to Map and return
    });

    // merge our maps into a single aggregated map
    const mergedMap = mergeRequestMaps(allMaps);
    // write the merged file to disk after serializing the Map back to an Object
    fs.writeFileSync(
        path.join(TRAFFIC_CONFIG.REPORT_OUTPUT_PATH, TRAFFIC_CONFIG.JSON_OUTPUT_NAME),
        JSON.stringify(Object.fromEntries(mergedMap.entries()), null, 2)
    );
}
