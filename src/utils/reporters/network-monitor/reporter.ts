import path from 'path';
import type {
    Reporter,
    FullConfig,
    FullResult,
    Suite,
    TestCase,
    TestResult,
} from '@playwright/test/reporter';
import { TRAFFIC_CONFIG } from '@configs/reports/reporters.config.ts';
import { Logger } from '@utils/logger.ts';
import { RequestMap, RequestStats } from './monitor.t.ts';
import { NetworkReportGenerator } from './generator.ts';
import { FSHelpers } from '@utils/fs/fsHelpers.ts';

interface NetworkReporterOptions {
    enabled?: boolean;
}

/**
 * A custom reporter for passively tracking network calls
 * during suite execution and generating a report based on any failures that occur
 *
 * The reporter is toggled on/off using `process.env.RUN_NETWORK_REPORT`
 */
export default class NetworkTrafficReporter implements Reporter {
    private readonly REPORT_GENERATOR: NetworkReportGenerator;
    private enabled: boolean;

    constructor(options?: NetworkReporterOptions) {
        this.REPORT_GENERATOR = new NetworkReportGenerator();
        this.enabled = options?.enabled ?? false;

        if (this.enabled) {
            FSHelpers.createPathSafe(TRAFFIC_CONFIG.REPORT_OUTPUT_PATH);
        } else {
            /* eslint-disable prettier/prettier */
            Logger.debug('------------------------------------------------------------------------------------');
            Logger.debug('-------- Network Monitoring Report Toggled off. No Report will be generated --------');
            Logger.debug('--- To enabled the network monitoring report, set process.env.RUN_NETWORK_REPORT ---');
            Logger.debug('------------------------------------------------------------------------------------');
            Logger.debug(' ');
            /* eslint-enable prettier/prettier */
        }
    }

    /**
     * Called once before the suite starts
     */
    /*onBegin(config: FullConfig, suite: Suite) {
        if (!this.enabled) return;
        //Logger.info(`[Reporter] Starting network reporter for ${suite.allTests().length} tests`);
    }*/

    /**
     * Called after each individual test
     */
    onTestEnd(test: TestCase, result: TestResult) {
        if (!this.enabled) return;
        // Optionally: read per-test attachment
        const attachment = result.attachments.find(
            (a) => a.name === 'failed-network-requests.json'
        );
        if (attachment && attachment.body) {
            const failedRequests = JSON.parse(attachment.body.toString());
            Logger.info(
                `[Reporter] ${test.title} failed requests: ${Object.keys(failedRequests).length}`
            );
            Logger.info('...'); // console log flush to ensure the last line is printed
        }
    }

    /**
     * Called once after the suite ends
     */
    onEnd(result: FullResult) {
        if (!this.enabled) return;
        this.aggregateAllTraffic();

        Logger.info('[Reporter] Generating HTML report...');
        try {
            this.REPORT_GENERATOR.generate();
        } catch (e) {
            Logger.error('[Reporter] Report generation failed.');
            throw e;
        }

        Logger.info(' '); // flush trick to ensure the final log is pushed to console
    }

    /**
     * Merge multiple worker maps into a single map
     */
    private mergeRequestMaps(maps: RequestMap[]): RequestMap {
        Logger.info('[Reporter] Merging request maps...');
        const merged: RequestMap = new Map();

        for (const map of maps) {
            for (const [url, stats] of map.entries()) {
                const existing = merged.get(url);
                if (!existing) {
                    merged.set(url, {
                        success: stats.success,
                        fail: stats.fail,
                        failures: [...stats.failures],
                    });
                } else {
                    existing.success += stats.success;
                    existing.fail += stats.fail;
                    existing.failures.push(...stats.failures);
                }
            }
        }

        Logger.success('[Reporter] Request maps merged.');

        return merged;
    }

    /**
     * Aggregate all worker traffic into a single json report
     */
    private aggregateAllTraffic() {
        Logger.info('[Reporter] Aggregating worker network logs...');

        try {
            // read all files in our report directory. Filter in only the worker files
            const files = FSHelpers.readDirSafe(TRAFFIC_CONFIG.REPORT_OUTPUT_PATH).filter(
                (f) => f.startsWith('worker-') && f.endsWith('.json')
            );

            // parse each file and convert it to a typed request map and push it to an array
            const allMaps: RequestMap[] = files.map((file) => {
                const obj = JSON.parse(
                    FSHelpers.readFileSafe(path.join(TRAFFIC_CONFIG.REPORT_OUTPUT_PATH, file))
                ) as Record<string, RequestStats>;

                // once we parse the file, we don't need it anymore. delete it.
                FSHelpers.deleteFileSafe(path.join(TRAFFIC_CONFIG.REPORT_OUTPUT_PATH, file));
                return new Map(Object.entries(obj));
            });

            // merge these maps into a single map
            const mergedMap = this.mergeRequestMaps(allMaps);

            // write aggregated output from our merged map
            FSHelpers.writeTextFileSafe(
                path.join(TRAFFIC_CONFIG.REPORT_OUTPUT_PATH, TRAFFIC_CONFIG.JSON_OUTPUT_NAME),
                Object.fromEntries(mergedMap.entries()),
                'json'
            );
        } catch (e: any) {
            Logger.error('Worker network log aggregation failed. Cannot generate report.');
            throw e;
        }

        Logger.success('[Reporter] Network logs aggregated successfully.');
    }
}
