import path from 'path';
import { Locator } from '@playwright/test';
import { config } from '@config';
import { getTrackedScreenshots } from '@utils/screenshot.ts';
import { HEATMAP_CONFIG } from '@configs/reports/reporters.config.ts';
import { BoundingBox, InteractionLog, InteractionType } from './heatmap.t.ts';
import { FSHelpers } from '@utils/fs/fsHelpers.ts';

/**
 * array for tracking every interaction
 * used by generateHeatmaps.ts to plot points on the heatmap
 */
export const interactionLogs: InteractionLog[] = [];

/**
 * Logs the interaction with the component to the interactionLog array
 * returns and skips logging if the locator does not have a bounding box (it is likely hidden)
 * @param locator Locator being interacted with
 * @param type type of interaction (fill, click, etc)
 * @param pageObjectName the name of the page/component class where the action took place
 * @returns
 */
export async function logInteraction(
    locator: Locator,
    boundingBox: BoundingBox | null,
    type: InteractionType,
    pageObjectName: string
) {
    if (!boundingBox) return;

    interactionLogs.push({
        locator,
        type,
        pageObjectName,
        timestamp: new Date().getTime(),
        boundingBox,
    });
}

/**
 * Save the interaction data to disk for the worker
 * Saves the screenshot tracker and interaction data to a worker-specific file
 *
 * if the heat map report is not toggled on, returns
 * @param workerIndex
 * @returns
 */
export function saveInteractionsToDisk(workerIndex: number) {
    if (!config.RUN_HEATMAP_REPORT) return;
    // create folder if it doesn't exist
    FSHelpers.createPathSafe(HEATMAP_CONFIG.REPORT_OUTPUT_PATH);

    // get all the screenshots currently tracked
    const screenshotTracker = getTrackedScreenshots();

    // write both the tracked screenshots and the interaction log to disk
    FSHelpers.writeTextFileSafe(
        path.join(HEATMAP_CONFIG.REPORT_OUTPUT_PATH, `worker-${workerIndex}-screenshots.json`),
        screenshotTracker,
        'json'
    );

    FSHelpers.writeTextFileSafe(
        path.join(HEATMAP_CONFIG.REPORT_OUTPUT_PATH, `worker-${workerIndex}-interactions.json`),
        interactionLogs,
        'json'
    );
}
