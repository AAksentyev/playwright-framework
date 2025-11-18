import { config } from '@config';
import { test as teardown } from '@playwright/test';
import { generateHeatmaps } from '@utils/reporters/heatmap/generateHeatmaps.ts';
import { NetworkReportGenerator } from '@utils/reporters/network-monitor/generateNetworkReport.ts';
import { aggregateWorkerNetworkLogs } from '@utils/reporters/network-monitor/monitor.ts';

teardown('Running global teardown....', async ({ page }) => {
    /** Aggregate all of the passively tracked network traffic and generate report */
    aggregateWorkerNetworkLogs();
    new NetworkReportGenerator().generate();

    /** Generate the heatmap report if it was toggled on */
    if (config.RUN_HEATMAP_REPORT) await generateHeatmaps();
});
