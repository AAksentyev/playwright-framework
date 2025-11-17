import { config } from '@config';
import { HEATMAP_CONFIG } from '@configs/reports/reporters.config.ts';
import { InteractionType } from '@decorators/interaction.t.ts';
import { Locator } from '@playwright/test';
import { ScreenshotTracker, screenshotTracker } from '@utils/screenshot.ts';
import fs from 'fs';
import path from 'path';


/**
 *  Interaction log interface
 */
export interface InteractionLog {
    //locator: Locator; // locator being interacted with
    type: InteractionType; // the type of interaction ('fill' | 'click' | 'hover')
    pageObjectName: string;
    timestamp: number;
    boundingBox: { x: number; y: number; width: number; height: number };
}

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
export async function logInteraction(locator: Locator, type: InteractionType, pageObjectName: string) {
    const box = await locator.boundingBox();
    if (!box) return;

    interactionLogs.push({
        //locator,
        type,
        pageObjectName,
        timestamp: new Date().getTime(),
        boundingBox: {
            x: box.x,
            y: box.y,
            width: box.width,
            height: box.height,
        },
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

    if (!fs.existsSync(HEATMAP_CONFIG.REPORT_OUTPUT_PATH)) 
        fs.mkdirSync(HEATMAP_CONFIG.REPORT_OUTPUT_PATH, { recursive: true });

    fs.writeFileSync(
        path.join(HEATMAP_CONFIG.REPORT_OUTPUT_PATH, `worker-${workerIndex}-screenshots.json`),
        JSON.stringify(screenshotTracker, null, 2)
    );

    fs.writeFileSync(
        path.join(HEATMAP_CONFIG.REPORT_OUTPUT_PATH, `worker-${workerIndex}-interactions.json`),
        JSON.stringify(interactionLogs, null, 2)
    );
}

/**
 * Aggregate all of our worker data for the interactions
 * into a single file
 * @returns
 */
export function aggregateInteractions() {
    if (!fs.existsSync(HEATMAP_CONFIG.REPORT_OUTPUT_PATH)) return;

    // collect worker files
    const interactionFiles = fs
        .readdirSync(HEATMAP_CONFIG.REPORT_OUTPUT_PATH)
        .filter((f) => f.startsWith('worker-') && f.endsWith('-interactions.json'));

    // no files? return
    if (!interactionFiles.length) return;

    const aggregatedInteractions: InteractionLog[] = [];

    // read and parse each file and push to a combined list
    for (const file of interactionFiles) {
        const raw = fs.readFileSync(path.join(HEATMAP_CONFIG.REPORT_OUTPUT_PATH, file), 'utf-8');
        const entries = JSON.parse(raw) as InteractionLog[];

        // append to aggregated list
        aggregatedInteractions.push(...entries);

        // delete worker file after processing. We only want the final combined file
        fs.unlinkSync(path.join(HEATMAP_CONFIG.REPORT_OUTPUT_PATH, file));
    }

    // write the merged result
    fs.writeFileSync(
        path.join(HEATMAP_CONFIG.REPORT_OUTPUT_PATH, HEATMAP_CONFIG.INTERACTIONS_FILENAME),
        JSON.stringify(aggregatedInteractions, null, 2)
    );
}

/**
 * Merge screenshots tracker into a single file
 * This keeps all the unique values since some workers may have touched
 * components that were untouched by others
 * @returns
 */
export function aggregateScreenshots() {
    if (!fs.existsSync(HEATMAP_CONFIG.REPORT_OUTPUT_PATH)) return;

    // collect worker files
    const screenshotFiles = fs
        .readdirSync(HEATMAP_CONFIG.REPORT_OUTPUT_PATH)
        .filter((f) => f.startsWith('worker-') && f.endsWith('-screenshots.json'));

    // no files? return
    if (!screenshotFiles.length) return;

    const aggregatedScreenshots: Record<string, ScreenshotTracker> = {};
    for (const file of screenshotFiles) {
        const raw = fs.readFileSync(path.join(HEATMAP_CONFIG.REPORT_OUTPUT_PATH, file), 'utf-8');
        const entries = JSON.parse(raw) as any;

        // append to aggregated list
        for (const k in entries) {
            if (aggregatedScreenshots[k]) continue;

            aggregatedScreenshots[k] = entries[k];
        }

        // delete worker file after processing
        fs.unlinkSync(path.join(HEATMAP_CONFIG.REPORT_OUTPUT_PATH, file));
    }

    // write the merged result
    fs.writeFileSync(
        path.join(HEATMAP_CONFIG.REPORT_OUTPUT_PATH, HEATMAP_CONFIG.SCREENSHOTS_FILENAME),
        JSON.stringify(aggregatedScreenshots, null, 2)
    );
}
