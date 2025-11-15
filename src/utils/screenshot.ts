import { Locator, Page } from '@playwright/test';
import fs from 'fs';
import path from 'path';

interface ScreenshotTracker {
    screenshotPath: string;
    boundingBox: {
        x: number;
        y: number;
    };
}
export const screenshotTracker: Record<string, ScreenshotTracker> = {};

/**
 * Take the screenshot for the heatmap report and track it in screenshotTracker
 * it also tracks the element's bounding box for offsetting the headmap points in the report
 *
 * Does nothing if the screenshot of this component is already taken
 *
 * @param element - page object or the component's root locator being tracked that will be captured
 * @param pageObjectName - the name of the caller class (ex: 'TopMenuNavBarComponent')
 */
export async function takeHeatmapScreenshot(
    element: Page | Locator,
    pageObjectName: string
): Promise<void> {
    if (!(pageObjectName in screenshotTracker)) {
        const screenshotPath: string = await takeScreenshot(
            element,
            `reports/heatmap/${pageObjectName}`,
            'screenshot.png'
        );

        let boundingBox = { x: 0, y: 0 };
        if (!('context' in element)) {
            const box = await element.boundingBox();
            if (box) {
                boundingBox = { x: box.x, y: box.y };
            }
        }
        screenshotTracker[pageObjectName] = { screenshotPath, boundingBox };
    }
}

/**
 * Utility function to take the screenshot of a locator or the full page
 * creates the folder if it doesn't already exist
 * @param target screenshot target - either page object or a specific locator to capture
 * @param dir - directory to save the screenshot to
 * @param filename screenshot file name
 * @param fullPage capture full page or just the viewport. fullPage is `true` by default
 * @returns the full path to the screenshot
 */
export async function takeScreenshot(
    target: Page | Locator,
    dir: string,
    filename: string,
    fullPage: boolean = true
): Promise<string> {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const screenshotPath = path.join(dir, filename);

    await target.screenshot({
        path: screenshotPath,
        fullPage,
    });

    return screenshotPath;
}
