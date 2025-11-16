import { config } from '@config';
import { Logger } from '@utils/logger.ts';
import { generateHeatmaps } from '@utils/reporters/heatmap/generateHeatmaps.ts';
import { aggregateWorkerNetworkLogs } from '@utils/reporters/network-monitor/monitor.ts';

/**
 * Global teardown function
 * aggregate and generate all of our reports
 */
export default async function teardown() {
    /** Aggregate all of the passively tracked network traffic and generate report */
    Logger.info('...Aggregating network traffic logs...');
    aggregateWorkerNetworkLogs();

    /** Generate the heatmap report if it was toggled on */
    if (!config.RUN_HEATMAP_REPORT) return;
    {
        Logger.info('...Generating heatmaps...');
        await generateHeatmaps();
    }
}
