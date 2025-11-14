import { Locator } from '@playwright/test';

/**
 *  Interaction log interface
 * @todo make type strongly typed
 */
export interface InteractionLog {
    //locator: Locator; // locator being interacted with
    type: string; // the type of interaction ('fill' | 'click' | 'hover')
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
 * @todo make type strongly typed
 */
export async function logInteraction(locator: Locator, type: string, pageObjectName: string) {
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
